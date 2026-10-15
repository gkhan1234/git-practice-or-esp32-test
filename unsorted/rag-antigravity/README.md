# ⚡ Sparky - ESP32 & STEM Electronics RAG Lab Guide

An interactive, student-friendly AI Lab Assistant built with **Chainlit**, **ChromaDB**, and **Google Gemini 2.5 Flash** for middle and high school students learning:
- **ESP32 Microcontroller & MicroPython** (GPIO pin rules, 3.3V logic limits, ADC attenuation, PWM, I2C, Timers)
- **Active & Passive Electronic Components** (555 Timer, Op-Amps, BJTs, Logic-Level MOSFETs, Resistors, Capacitors, Diodes)
- **Motors & Actuators** (DC Motors, H-bridges, Servos, Flyback diodes, Brownout prevention)
- **Sensors** (Ultrasonic HC-SR04 with voltage divider, LDRs, PIR, DHT sensors)
- **Lab & Physical Hardware Safety** (Soldering iron safety, capacitor polarity, power isolation)

---

## 🎯 Pedagogical Design
Sparky is explicitly designed to **act as a lab guide**:
1. **Socratic & Guided:** Breaks problems into bite-sized steps, gives intuitive analogies, and walks through debugging checklists rather than just dumping code.
2. **Prominent Safety Warnings:** Emphasizes critical physical safety rules like **soldering irons operating at 300°C - 400°C**, 3.3V vs 5V pin limits, and capacitor polarity.
3. **Traceable Knowledge:** Every answer links back to the curated curriculum documents and datasheets with side-panel citations.

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.11+
- A Google Gemini API Key (get one from [Google AI Studio](https://aistudio.google.com/))

### 2. Configure Your API Key
Edit the `.env` file in the project root:
```bash
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Launch the Chainlit Web App
Activate the virtual environment and start the app:
```bash
source .venv/bin/activate
chainlit run app.py -w
```
Open your browser at `http://localhost:8000`.

---

## 📚 Adding Custom Lab Sheets & Curriculum (For Teachers)

You can easily expand Sparky's knowledge base with your own classroom materials:

1. Drop your PDF datasheets, lab manuals, or notes into `data/raw/` (or create new Markdown files in `data/knowledge_base/`).
2. Run the ingestion script to re-index ChromaDB:
   ```bash
   python -m src.ingestion
   ```
3. Restart Chainlit or continue chatting—Sparky will immediately reference the newly indexed materials!

---

## 🧪 Running Automated Tests

Run the test suite to verify document loading, chunking, retrieval accuracy, and prompt safety:
```bash
.venv/bin/pytest -v tests/
```

---

## 📁 Project Architecture

```
rag-antigravity/
├── app.py                      # Chainlit frontend application with starters & streaming
├── pytest.ini                  # Pytest configuration
├── README.md                   # Project documentation
├── .env.example                # Example environment variables
├── .env                        # Local environment settings (API keys)
├── .chainlit/                  # Chainlit theme and settings (LaTeX enabled)
├── src/
│   ├── config.py               # Environment configuration and paths
│   ├── ingestion.py            # PDF/Markdown parser, chunker & ChromaDB indexer
│   ├── rag_engine.py           # Context retrieval and Gemini 2.5 Flash streaming
│   └── prompts.py              # Socratic guide system prompt and safety rules
├── data/
│   ├── chroma_db/              # Persisted ChromaDB vector embeddings
│   ├── raw/                    # Drop folder for teacher PDFs and lab handouts
│   └── knowledge_base/         # Pre-seeded curriculum:
│       ├── esp32_micropython/  # Pinout reference, GPIO rules, MicroPython recipes
│       ├── components/         # 555 timer, Op-Amps, BJTs, MOSFETs, Resistors, Capacitors
│       ├── sensors_motors/     # Motor drivers, Servos, Ultrasonic, LDRs
│       └── safety_debugging/   # Soldering rules, hardware protection, troubleshooting checklists
└── tests/
    └── test_rag.py             # Test suite for vector retrieval and safety prompt formatting
```
