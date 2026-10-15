#!/usr/bin/env python3
"""
Hot Folder Monitor for PDF Prepress Inspection
Compatible with macOS Apple Silicon (M1/M2/M3/M4)

Monitors the /input directory for incoming PDF files using Watchdog,
inspects MediaBox/TrimBox dimensions, font embedding, and color spaces using PyMuPDF (fitz),
writes a comprehensive JSON report to /reports, and routes files to /passed or /failed.
"""

import os
import sys
import time
import json
import re
import shutil
import logging
import threading
from pathlib import Path
from typing import Dict, Any, List, Set, Tuple

# Modern PyMuPDF import with fallback to avoid deprecation warning
try:
    import pymupdf as fitz
except ImportError:
    import fitz

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileCreatedEvent, FileMovedEvent

# ==============================================================================
# CONFIGURATION
# ==============================================================================
BASE_DIR = Path("/Users/thenationalflagcompany/Documents/ghostscript").resolve()
INPUT_DIR = BASE_DIR / "input"
PASSED_DIR = BASE_DIR / "passed"
FAILED_DIR = BASE_DIR / "failed"
REPORTS_DIR = BASE_DIR / "reports"

# Dimension Validation Toggle
# Set to False to completely disable strict MediaBox dimension validation (accepts any size PDF).
# Set to True to enforce TARGET_WIDTH_INCHES x TARGET_HEIGHT_INCHES.
CHECK_DIMENSIONS = False

# Target MediaBox Dimensions in Inches (used only if CHECK_DIMENSIONS = True)
TARGET_WIDTH_INCHES = 38.00
TARGET_HEIGHT_INCHES = 62.00

# Set to True if orientation can be swapped (62.00 wide x 38.00 high).
# Set to False to strictly enforce 38.00 wide x 62.00 high.
ALLOW_ORIENTATION_SWAP = True

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("HotFolderMonitor")


# ==============================================================================
# DIRECTORY SETUP
# ==============================================================================
def ensure_directories():
    """Ensure all required hot folder subdirectories exist."""
    for folder in [INPUT_DIR, PASSED_DIR, FAILED_DIR, REPORTS_DIR]:
        folder.mkdir(parents=True, exist_ok=True)
    logger.info("Hot folder directories verified under %s", BASE_DIR)


# ==============================================================================
# FILE READINESS HELPER
# ==============================================================================
def wait_for_file_ready(filepath: Path, timeout: float = 30.0, poll_interval: float = 0.5) -> bool:
    """
    Wait until a newly created or copied file has finished writing and is accessible.
    Prevents errors caused by inspecting partially written or locked PDFs.
    """
    start_time = time.time()
    last_size = -1

    while time.time() - start_time < timeout:
        if not filepath.exists():
            return False

        try:
            current_size = filepath.stat().st_size
            # File must have bytes and size must remain stable across consecutive checks
            if current_size > 0 and current_size == last_size:
                # Test opening with PyMuPDF to confirm complete file write and lock release
                test_doc = fitz.open(str(filepath))
                test_doc.close()
                return True
            last_size = current_size
        except Exception:
            # File is still open for writing or locked by Finder/OS
            pass

        time.sleep(poll_interval)

    # Final attempt after timeout
    try:
        if filepath.exists() and filepath.stat().st_size > 0:
            test_doc = fitz.open(str(filepath))
            test_doc.close()
            return True
    except Exception:
        pass

    return False


# ==============================================================================
# PDF INSPECTION
# ==============================================================================
def extract_color_spaces(doc: fitz.Document) -> Tuple[List[str], Dict[str, Any]]:
    """
    Inspect the document for color spaces (RGB, CMYK, DeviceN/Spot, Grayscale).
    Checks page resources, embedded images, vector drawings, and PDF xref objects.
    """
    detected_spaces: Set[str] = set()
    spot_colors: Set[str] = set()
    details: Dict[str, Any] = {
        "images": [],
        "vector_spaces": set(),
        "spot_color_names": [],
    }

    # 1. Inspect Embedded Images
    for pno in range(len(doc)):
        page = doc[pno]
        for img in page.get_image_info(xrefs=True):
            cs_name = img.get("cs-name", "")
            if not cs_name:
                continue

            details["images"].append({
                "page": pno + 1,
                "xref": img.get("xref"),
                "colorspace": cs_name,
            })

            cs_upper = cs_name.upper()
            if "RGB" in cs_upper:
                detected_spaces.add("RGB")
            elif "CMYK" in cs_upper:
                detected_spaces.add("CMYK")
            elif "GRAY" in cs_upper:
                detected_spaces.add("Grayscale")
            elif "SEPARATION" in cs_upper or "DEVICEN" in cs_upper:
                detected_spaces.add("DeviceN/Spot")

    # 2. Inspect Vector Drawings / Paths
    for pno in range(len(doc)):
        page = doc[pno]
        for draw in page.get_drawings():
            for key in ("color", "fill"):
                val = draw.get(key)
                if val is not None and isinstance(val, (list, tuple)):
                    if len(val) == 4:
                        detected_spaces.add("CMYK")
                        details["vector_spaces"].add("CMYK")
                    elif len(val) == 3:
                        detected_spaces.add("RGB")
                        details["vector_spaces"].add("RGB")
                    elif len(val) == 1:
                        detected_spaces.add("Grayscale")
                        details["vector_spaces"].add("Grayscale")

    # 3. Inspect PDF XREFs and Resources for Spot Colors and Device Profiles
    try:
        for xref in range(1, doc.xref_length()):
            obj_str = doc.xref_object(xref)
            if not obj_str:
                continue

            # Ignore XMP metadata packets to prevent false RGB/CMYK positives
            if "/Type /Metadata" in obj_str or "/Subtype /XML" in obj_str:
                continue

            if "/Separation" in obj_str or "/DeviceN" in obj_str:
                detected_spaces.add("DeviceN/Spot")
                matches = re.findall(r"/Separation\s+/([A-Za-z0-9_\-#]+)", obj_str)
                for m in matches:
                    clean_name = m.replace("#20", " ").replace("#2F", "/")
                    if clean_name.lower() not in ("all", "none"):
                        spot_colors.add(clean_name)

            if "/ColorSpace" in obj_str:
                if "/DeviceCMYK" in obj_str:
                    detected_spaces.add("CMYK")
                if "/DeviceRGB" in obj_str:
                    detected_spaces.add("RGB")
                if "/DeviceGray" in obj_str:
                    detected_spaces.add("Grayscale")
    except Exception as e:
        logger.debug("Low-level xref color scan warning: %s", e)

    # Convert sets to sorted lists for JSON serialization
    details["vector_spaces"] = sorted(list(details["vector_spaces"]))
    details["spot_color_names"] = sorted(list(spot_colors))

    return sorted(list(detected_spaces)), details


def inspect_fonts(doc: fitz.Document) -> Tuple[List[Dict[str, Any]], bool]:
    """
    Inspect all fonts in the document.
    Returns:
        (fonts_list, all_embedded_flag)
    """
    seen_xrefs = set()
    fonts_report: List[Dict[str, Any]] = []
    all_embedded = True

    for pno in range(len(doc)):
        page = doc[pno]
        # get_fonts(full=True) returns:
        # (xref, ext, type, fontname, font_flags, encoding, referencer)
        for font in page.get_fonts(full=True):
            xref = font[0]
            if xref in seen_xrefs:
                continue
            seen_xrefs.add(xref)

            font_ext = font[1] if len(font) > 1 else "n/a"
            font_type = font[2] if len(font) > 2 else ""
            font_name = font[3] if len(font) > 3 else ""
            encoding = font[5] if len(font) > 5 else ""

            # Check if font is subsetted (standard prefix: 6 uppercase ASCII letters followed by '+')
            is_subset = bool(re.match(r"^[A-Z]{6}\+", font_name))

            # Embedding check in PyMuPDF:
            # 1. Non-embedded fonts have font_ext == 'n/a'
            # 2. Cross-verify with doc.extract_font
            # 3. Subsets are physically embedded in the PDF
            # 4. Type 3 fonts are embedded vector character procedures
            is_embedded_by_ext = (font_ext != "n/a" and bool(font_ext))

            is_embedded_by_extract = False
            try:
                extracted = doc.extract_font(xref, info_only=True)
                if extracted and len(extracted) > 1 and extracted[1] != "n/a":
                    is_embedded_by_extract = True
            except Exception:
                pass

            is_valid_embedding = (
                is_subset
                or is_embedded_by_ext
                or is_embedded_by_extract
                or (font_type == "Type3")
            )

            if not is_valid_embedding:
                all_embedded = False

            clean_name = font_name.split("+")[-1] if "+" in font_name else font_name
            fonts_report.append({
                "name": font_name,
                "clean_name": clean_name,
                "type": font_type,
                "format": font_ext,
                "encoding": encoding,
                "is_subset": is_subset,
                "is_embedded": is_valid_embedding,
            })

    # If the document has no fonts (e.g. all converted to outlines), all_embedded remains True
    return fonts_report, all_embedded


def inspect_pdf(filepath: Path) -> Dict[str, Any]:
    """
    Inspects a PDF file and returns a complete evaluation report dictionary.
    """
    doc = fitz.open(str(filepath))
    page_count = len(doc)
    page_details = []

    mediabox_pass = True
    mismatched_pages = []

    for pno in range(page_count):
        page = doc[pno]

        # Points to inches conversion (72 points = 1 inch), rounded to 2 decimal places
        mbox_w_in = round(page.mediabox.width / 72.0, 2)
        mbox_h_in = round(page.mediabox.height / 72.0, 2)

        tbox_w_in = round(page.trimbox.width / 72.0, 2)
        tbox_h_in = round(page.trimbox.height / 72.0, 2)

        # Dimension validation check (only if dimension checking is enabled)
        if CHECK_DIMENSIONS:
            matches_portrait = (mbox_w_in == TARGET_WIDTH_INCHES and mbox_h_in == TARGET_HEIGHT_INCHES)
            matches_landscape = (ALLOW_ORIENTATION_SWAP and mbox_w_in == TARGET_HEIGHT_INCHES and mbox_h_in == TARGET_WIDTH_INCHES)

            if not (matches_portrait or matches_landscape):
                mediabox_pass = False
                mismatched_pages.append({
                    "page": pno + 1,
                    "width_inches": mbox_w_in,
                    "height_inches": mbox_h_in,
                })

        p_info = {
            "page_number": pno + 1,
            "mediabox": {
                "inches": {
                    "width": mbox_w_in,
                    "height": mbox_h_in,
                },
                "points": {
                    "width": round(page.mediabox.width, 2),
                    "height": round(page.mediabox.height, 2),
                    "rect": [round(c, 2) for c in list(page.mediabox)],
                }
            },
            "trimbox": {
                "inches": {
                    "width": tbox_w_in,
                    "height": tbox_h_in,
                },
                "points": {
                    "width": round(page.trimbox.width, 2),
                    "height": round(page.trimbox.height, 2),
                    "rect": [round(c, 2) for c in list(page.trimbox)],
                }
            }
        }
        page_details.append(p_info)

    # Font inspection
    fonts_list, fonts_all_embedded = inspect_fonts(doc)

    # Color space inspection
    color_spaces, color_details = extract_color_spaces(doc)

    doc.close()

    # Validation criteria:
    # Fail if MediaBox dimensions are invalid (when enabled) OR any font is not embedded
    validation_pass = (mediabox_pass if CHECK_DIMENSIONS else True) and fonts_all_embedded

    failure_reasons = []
    if CHECK_DIMENSIONS and not mediabox_pass:
        expected_str = f"{TARGET_WIDTH_INCHES:.2f} x {TARGET_HEIGHT_INCHES:.2f} inches"
        if ALLOW_ORIENTATION_SWAP:
            expected_str += f" (or {TARGET_HEIGHT_INCHES:.2f} x {TARGET_WIDTH_INCHES:.2f} inches)"
        for err in mismatched_pages:
            failure_reasons.append(
                f"Page {err['page']} MediaBox {err['width_inches']:.2f} x {err['height_inches']:.2f} in does not match target {expected_str}"
            )

    if not fonts_all_embedded:
        unembedded = [f["name"] for f in fonts_list if not f["is_embedded"]]
        failure_reasons.append(f"Unembedded fonts detected: {', '.join(unembedded)}")

    # Primary dimensions from page 1 for quick reference
    first_page_mbox = page_details[0]["mediabox"] if page_details else {}
    first_page_tbox = page_details[0]["trimbox"] if page_details else {}

    report = {
        "filename": filepath.name,
        "filepath": str(filepath),
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "status": "PASSED" if validation_pass else "FAILED",
        "validation": {
            "passed": validation_pass,
            "dimensions_checked": CHECK_DIMENSIONS,
            "mediabox_valid": mediabox_pass if CHECK_DIMENSIONS else "SKIPPED",
            "fonts_all_embedded": fonts_all_embedded,
            "failure_reasons": failure_reasons,
        },
        "target_dimensions": {
            "dimensions_checked": CHECK_DIMENSIONS,
            "width_inches": TARGET_WIDTH_INCHES if CHECK_DIMENSIONS else None,
            "height_inches": TARGET_HEIGHT_INCHES if CHECK_DIMENSIONS else None,
            "orientation_swap_allowed": ALLOW_ORIENTATION_SWAP if CHECK_DIMENSIONS else None,
        },
        "mediabox": {
            "width_inches": first_page_mbox.get("inches", {}).get("width", 0.0),
            "height_inches": first_page_mbox.get("inches", {}).get("height", 0.0),
            "width_points": first_page_mbox.get("points", {}).get("width", 0.0),
            "height_points": first_page_mbox.get("points", {}).get("height", 0.0),
        },
        "trimbox": {
            "width_inches": first_page_tbox.get("inches", {}).get("width", 0.0),
            "height_inches": first_page_tbox.get("inches", {}).get("height", 0.0),
            "width_points": first_page_tbox.get("points", {}).get("width", 0.0),
            "height_points": first_page_tbox.get("points", {}).get("height", 0.0),
        },
        "color_spaces": color_spaces,
        "color_details": color_details,
        "fonts": fonts_list,
        "all_fonts_embedded_or_subset": fonts_all_embedded,
        "page_count": page_count,
        "pages": page_details,
    }

    return report


# ==============================================================================
# FILE ROUTING & PROCESSING
# ==============================================================================
def safe_move(src: Path, dest: Path) -> bool:
    """Move file handling existing destination collisions gracefully."""
    try:
        if dest.exists():
            dest.unlink()
        shutil.move(str(src), str(dest))
        return True
    except Exception as e:
        logger.error("Error moving file from '%s' to '%s': %s", src, dest, e)
        return False


def process_pdf(filepath: Path):
    """
    Process an incoming PDF:
    1. Wait for file write/download to complete.
    2. Inspect PDF dimensions, fonts, and color spaces.
    3. Save JSON report to /reports folder.
    4. Move PDF to /passed or /failed folder.
    """
    logger.info("--> Processing file: %s", filepath.name)

    # 1. Wait for file writing to finish
    if not wait_for_file_ready(filepath):
        logger.error("File '%s' not accessible or still incomplete after timeout. Skipping.", filepath.name)
        return

    # 2. Inspect PDF
    try:
        report = inspect_pdf(filepath)
    except Exception as e:
        logger.exception("Error inspecting PDF '%s': %s", filepath.name, e)
        dest_failed = FAILED_DIR / filepath.name
        safe_move(filepath, dest_failed)
        return

    # 3. Save JSON Report to /reports
    report_filename = f"{filepath.stem}_report.json"
    report_path = REPORTS_DIR / report_filename
    try:
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        logger.info("Report saved: %s", report_path)
    except Exception as e:
        logger.error("Failed to write report file '%s': %s", report_path, e)

    # 4. Route PDF to /passed or /failed
    is_passed = report["validation"]["passed"]
    dest_dir = PASSED_DIR if is_passed else FAILED_DIR
    dest_path = dest_dir / filepath.name

    if safe_move(filepath, dest_path):
        if is_passed:
            logger.info("✓ PASSED: '%s' moved to /passed (MediaBox: %.2f x %.2f in, Fonts: OK, Colors: %s)",
                        filepath.name,
                        report["mediabox"]["width_inches"],
                        report["mediabox"]["height_inches"],
                        report["color_spaces"])
        else:
            reasons = "; ".join(report["validation"]["failure_reasons"])
            logger.warning("✗ FAILED: '%s' moved to /failed. Reason: %s", filepath.name, reasons)


# ==============================================================================
# WATCHDOG EVENT HANDLER
# ==============================================================================
class HotFolderHandler(FileSystemEventHandler):
    def __init__(self):
        super().__init__()
        self._processing: Set[str] = set()
        self._lock = threading.Lock()

    def _should_handle(self, path_str: str) -> bool:
        p = Path(path_str)
        # Process only .pdf files, ignoring hidden and temporary files
        if p.name.startswith(".") or p.suffix.lower() != ".pdf":
            return False
        return True

    def _handle_event(self, src_path: str):
        if not self._should_handle(src_path):
            return

        resolved_path = str(Path(src_path).resolve())
        with self._lock:
            if resolved_path in self._processing:
                return
            self._processing.add(resolved_path)

        try:
            process_pdf(Path(src_path))
        finally:
            with self._lock:
                self._processing.discard(resolved_path)

    def on_created(self, event: FileCreatedEvent):
        if not event.is_directory:
            self._handle_event(event.src_path)

    def on_moved(self, event: FileMovedEvent):
        # Triggered when moving or dropping files into folder via macOS Finder
        if not event.is_directory:
            self._handle_event(event.dest_path)


# ==============================================================================
# MAIN ENTRYPOINT
# ==============================================================================
def main():
    print("=" * 70)
    print("      PDF HOT FOLDER MONITOR - PREPRESS INSPECTION")
    print("=" * 70)
    print(f"Base Directory:   {BASE_DIR}")
    print(f"Input Directory:  {INPUT_DIR}")
    print(f"Passed Directory: {PASSED_DIR}")
    print(f"Failed Directory: {FAILED_DIR}")
    print(f"Reports Directory:{REPORTS_DIR}")
    if CHECK_DIMENSIONS:
        print(f"Target MediaBox:  {TARGET_WIDTH_INCHES:.2f} x {TARGET_HEIGHT_INCHES:.2f} inches")
        print(f"Orientation Swap: {'Allowed (38x62 or 62x38)' if ALLOW_ORIENTATION_SWAP else 'Strict (38.00 x 62.00 only)'}")
    else:
        print("Dimension Check:  DISABLED (all PDF dimensions accepted)")
    print("=" * 70)

    # 1. Create hot folder subdirectories if not present
    ensure_directories()

    # 2. Process any pre-existing PDF files in /input
    existing_pdfs = [f for f in INPUT_DIR.glob("*.[pP][dD][fF]") if not f.name.startswith(".")]
    if existing_pdfs:
        logger.info("Found %d pre-existing PDF(s) in /input. Processing now...", len(existing_pdfs))
        for pdf_path in existing_pdfs:
            process_pdf(pdf_path)

    # 3. Initialize Watchdog Observer
    event_handler = HotFolderHandler()
    observer = Observer()
    observer.schedule(event_handler, str(INPUT_DIR), recursive=False)
    observer.start()

    logger.info("Hot folder monitor running. Drop PDF files into /input...")
    logger.info("Press Ctrl+C to terminate.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Stopping monitor...")
        observer.stop()
    observer.join()
    logger.info("Monitor stopped cleanly.")


if __name__ == "__main__":
    main()
