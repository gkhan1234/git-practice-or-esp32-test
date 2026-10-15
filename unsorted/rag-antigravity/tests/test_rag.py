import pytest
from pathlib import Path
from src.ingestion import chunk_text, load_documents_from_dir
from src.config import KNOWLEDGE_BASE_DIR
from src.rag_engine import RAGEngine
from src.prompts import SYSTEM_PROMPT, RAG_USER_PROMPT_TEMPLATE


def test_chunk_text():
    sample_text = (
        "The ESP32 is a low-cost microcontroller. " * 30
    )
    chunks = chunk_text(sample_text, chunk_size=200, overlap=50)
    assert len(chunks) > 1
    assert all(len(c) <= 250 for c in chunks)


def test_load_documents():
    docs = load_documents_from_dir(KNOWLEDGE_BASE_DIR)
    assert len(docs) >= 4
    filenames = [d["filename"] for d in docs]
    assert "esp32_pinout_and_basics.md" in filenames
    assert "passive_components.md" in filenames
    assert "active_components_555_opamp_transistors.md" in filenames
    assert "safety_and_troubleshooting.md" in filenames


def test_retrieval_555_timer():
    engine = RAGEngine()
    chunks = engine.retrieve_context("How do I wire a 555 timer as an astable oscillator?", top_k=3)
    assert len(chunks) > 0
    sources = [c["source"] for c in chunks]
    assert any("555" in s or "active_components" in s for s in sources)


def test_retrieval_soldering_safety():
    engine = RAGEngine()
    chunks = engine.retrieve_context("What safety precautions should I take when using a soldering iron?", top_k=3)
    assert len(chunks) > 0
    sources = [c["source"] for c in chunks]
    assert any("safety" in s for s in sources)


def test_retrieval_mosfet_motor():
    engine = RAGEngine()
    chunks = engine.retrieve_context("How do I drive a DC motor with a MOSFET and ESP32?", top_k=3)
    assert len(chunks) > 0
    content_blob = " ".join([c["content"] for c in chunks]).lower()
    assert "mosfet" in content_blob or "motor" in content_blob


def test_prompt_formatting():
    assert "Soldering irons reach" in SYSTEM_PROMPT
    assert "ESP32 is a 3.3-Volt chip" in SYSTEM_PROMPT
    user_prompt = RAG_USER_PROMPT_TEMPLATE.format(context="Sample context", query="Sample query")
    assert "Sample context" in user_prompt
    assert "Sample query" in user_prompt
