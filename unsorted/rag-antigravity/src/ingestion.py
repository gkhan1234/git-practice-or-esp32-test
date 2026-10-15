import os
from pathlib import Path
from typing import List, Dict, Any
import pypdf
import chromadb
from chromadb.utils import embedding_functions

from src.config import (
    CHROMA_DIR,
    KNOWLEDGE_BASE_DIR,
    RAW_DATA_DIR,
    CHUNK_SIZE,
    CHUNK_OVERLAP,
    GEMINI_API_KEY,
)


def extract_text_from_pdf(pdf_path: Path) -> str:
    """Extract text from a PDF file using pypdf."""
    reader = pypdf.PdfReader(str(pdf_path))
    pages_text = []
    for idx, page in enumerate(reader.pages):
        text = page.extract_text()
        if text:
            pages_text.append(f"--- Page {idx + 1} ---\n{text}")
    return "\n\n".join(pages_text)


def load_documents_from_dir(directory: Path) -> List[Dict[str, Any]]:
    """Load text, markdown, and PDF files from a directory recursively."""
    documents = []
    if not directory.exists():
        return documents

    for file_path in directory.rglob("*"):
        if file_path.is_file():
            suffix = file_path.suffix.lower()
            try:
                if suffix in [".md", ".txt"]:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                    if content.strip():
                        category = file_path.parent.name
                        documents.append({
                            "content": content,
                            "source": str(file_path.relative_to(directory.parent)),
                            "filename": file_path.name,
                            "category": category,
                        })
                elif suffix == ".pdf":
                    content = extract_text_from_pdf(file_path)
                    if content.strip():
                        documents.append({
                            "content": content,
                            "source": str(file_path.relative_to(directory.parent)),
                            "filename": file_path.name,
                            "category": "pdf_datasheet",
                        })
            except Exception as e:
                print(f"[Warning] Failed to load {file_path}: {e}")

    return documents


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """Split text into overlapping character chunks cleanly."""
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        
        # Try to break on newline or period near the end
        if end < len(text):
            break_point = text.rfind("\n", start, end)
            if break_point == -1 or break_point <= start + (chunk_size // 2):
                break_point = text.rfind(". ", start, end)
            if break_point != -1 and break_point > start + (chunk_size // 2):
                end = break_point + 1
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        
        start = end - overlap
        if start >= len(text) or end >= len(text):
            break

    return chunks


def get_embedding_function():
    """Returns the Chroma embedding function."""
    # We default to Chroma's high-speed local ONNX MiniLM model
    # which requires 0 network requests, runs offline in school labs,
    # and keeps vector operations completely free and instant.
    return embedding_functions.DefaultEmbeddingFunction()


def build_or_update_vector_db(force_reindex: bool = False) -> chromadb.Collection:
    """Scan knowledge bases, chunk text, and populate ChromaDB."""
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    
    collection_name = "esp32_stem_kb"
    emb_fn = get_embedding_function()

    if force_reindex:
        try:
            client.delete_collection(name=collection_name)
            print(f"Deleted existing collection '{collection_name}' for reindexing.")
        except Exception:
            pass

    collection = client.get_or_create_collection(
        name=collection_name,
        embedding_function=emb_fn,
        metadata={"hnsw:space": "cosine"}
    )

    # Gather all docs from knowledge_base and raw
    docs = load_documents_from_dir(KNOWLEDGE_BASE_DIR)
    docs.extend(load_documents_from_dir(RAW_DATA_DIR))

    print(f"Found {len(docs)} document files to index.")

    chunk_ids = []
    chunk_texts = []
    chunk_metadatas = []

    for doc in docs:
        chunks = chunk_text(doc["content"])
        for idx, chunk in enumerate(chunks):
            chunk_id = f"{doc['filename']}#chunk{idx}"
            chunk_ids.append(chunk_id)
            chunk_texts.append(chunk)
            chunk_metadatas.append({
                "source": doc["source"],
                "filename": doc["filename"],
                "category": doc["category"],
                "chunk_index": idx,
            })

    if chunk_texts:
        # Upsert in batches of 100
        batch_size = 100
        for i in range(0, len(chunk_texts), batch_size):
            collection.upsert(
                ids=chunk_ids[i:i + batch_size],
                documents=chunk_texts[i:i + batch_size],
                metadatas=chunk_metadatas[i:i + batch_size]
            )
        print(f"Successfully indexed {len(chunk_texts)} chunks into collection '{collection_name}'.")
    else:
        print("No document chunks to index.")

    return collection


if __name__ == "__main__":
    print("Starting document ingestion...")
    build_or_update_vector_db(force_reindex=True)
    print("Ingestion complete!")
