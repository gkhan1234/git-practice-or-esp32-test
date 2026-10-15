# Raw Documents Directory

Teachers and mentors can drop classroom PDFs, lab handouts, datasheets, or markdown files into this folder (`data/raw/`).

When you run the ingestion script:
```bash
python -m src.ingestion
```
Any PDF (`.pdf`), Markdown (`.md`), or Text (`.txt`) files located here will be automatically indexed into the ChromaDB vector database alongside the built-in curriculum.
