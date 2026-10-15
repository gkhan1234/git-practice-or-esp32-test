import os
import chainlit as cl
from typing import List

from src.rag_engine import RAGEngine
from src.config import GEMINI_API_KEY, GEMINI_MODEL


@cl.set_starters
async def set_starters():
    return [
        cl.Starter(
            label="⚡ Motor & MOSFET Control",
            message="How do I connect and control a DC motor with an ESP32 using a MOSFET? What pins and resistors do I need?",
            icon="/public/bolt.svg" if os.path.exists("public/bolt.svg") else None,
        ),
        cl.Starter(
            label="⏱️ 555 Timer Blinker",
            message="How do I wire a 555 timer as an astable multivibrator to blink an LED? How do I calculate the frequency?",
            icon="/public/clock.svg" if os.path.exists("public/clock.svg") else None,
        ),
        cl.Starter(
            label="🔥 Soldering Safety",
            message="What are the essential safety rules I must follow before and while using a soldering iron in the lab?",
            icon="/public/fire.svg" if os.path.exists("public/fire.svg") else None,
        ),
        cl.Starter(
            label="🔌 5V Sensor on ESP32",
            message="Can I connect the Echo pin of a 5V HC-SR04 ultrasonic sensor directly to an ESP32 GPIO pin? Why or why not?",
            icon="/public/alert.svg" if os.path.exists("public/alert.svg") else None,
        ),
        cl.Starter(
            label="🛠️ Brownout Troubleshooting",
            message="My ESP32 keeps restarting and printing 'Brownout detector was triggered' whenever my motor turns on. How do I fix it?",
            icon="/public/tool.svg" if os.path.exists("public/tool.svg") else None,
        ),
        cl.Starter(
            label="💡 Resistor for LED",
            message="I have a red LED and want to connect it to an ESP32 3.3V pin. How do I calculate the correct resistor value with Ohm's Law?",
            icon="/public/bulb.svg" if os.path.exists("public/bulb.svg") else None,
        ),
    ]


ENABLE_AUTH = os.getenv("ENABLE_AUTH", "false").lower() in ("true", "1", "yes")
CLASSROOM_PASSWORD = os.getenv("CLASSROOM_PASSWORD", "sparky-stem-2026")

if ENABLE_AUTH:
    @cl.password_auth_callback
    def auth_callback(username: str, password: str):
        """Classroom authentication protecting the lab guide and API quota."""
        if password.strip() == CLASSROOM_PASSWORD.strip():
            return cl.User(identifier=username.strip() or "Student", metadata={"role": "student"})
        return None


@cl.on_chat_start
async def on_chat_start():
    # Initialize RAG Engine for this session
    api_key = os.getenv("GEMINI_API_KEY", GEMINI_API_KEY)
    engine = RAGEngine(api_key=api_key)
    cl.user_session.set("engine", engine)

    user = cl.user_session.get("user")
    greeting_name = f", **{user.identifier}**" if user and user.identifier else ""

    welcome_message = (
        f"### ⚡ Welcome to the STEM Electronics & MicroPython Lab{greeting_name}!\n\n"
        "I'm **Sparky**, your hands-on lab tutor and guide for:\n"
        "- 🧠 **ESP32 & MicroPython** (GPIOs, ADC, PWM, I2C, Timers)\n"
        "- 🔬 **Core Components** (555 Timers, Op-Amps, MOSFETs, BJTs, Resistors, Capacitors, Diodes)\n"
        "- 🚗 **Actuators & Sensors** (DC motors, Servos, Ultrasonic, LDRs, DHT sensors)\n"
        "- 🥽 **Workshop Safety & Circuit Debugging**\n\n"
        "> ⚠️ **Lab Safety First:** Always remember hardware safety! Check capacitor polarity, disconnect power before rewiring, mind the 3.3V pin limit, and remember **soldering irons operate at 300°C - 400°C (extremely hot!)**.\n\n"
        "Ask me about any circuit, component, or MicroPython code, or click one of the starter questions below to begin!"
    )
    await cl.Message(content=welcome_message).send()


@cl.on_message
async def on_message(message: cl.Message):
    engine: RAGEngine = cl.user_session.get("engine")
    if not engine:
        engine = RAGEngine()
        cl.user_session.set("engine", engine)

    query = message.content.strip()

    # Handle attached documents (e.g. if student or teacher uploads a PDF or text file)
    uploaded_context = ""
    if message.elements:
        for element in message.elements:
            if hasattr(element, "path") and element.path:
                file_path = element.path
                if file_path.endswith(".pdf"):
                    try:
                        import pypdf
                        reader = pypdf.PdfReader(file_path)
                        pages = [p.extract_text() for p in reader.pages if p.extract_text()]
                        uploaded_context += f"\n\n[Uploaded PDF {element.name}]:\n" + "\n".join(pages[:5])
                    except Exception as e:
                        uploaded_context += f"\n[Could not read attached PDF: {e}]"
                elif file_path.endswith((".txt", ".md")):
                    try:
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                            uploaded_context += f"\n\n[Uploaded Document {element.name}]:\n" + f.read()
                    except Exception as e:
                        pass

    if uploaded_context:
        query = f"{query}\n\nAdditional student-provided lab material:{uploaded_context}"

    # Step indicator showing retrieval progress
    async with cl.Step(name="Searching lab guides & datasheets...") as step:
        chunks = engine.retrieve_context(query)
        step.output = f"Retrieved {len(chunks)} relevant reference sections."

    # Prepare Chainlit response message with streaming
    response_msg = cl.Message(content="")
    await response_msg.send()

    # Stream tokens from the RAG engine asynchronously
    full_text = ""
    async for token in engine.async_stream_query(query, chunks=chunks):
        full_text += token
        await response_msg.stream_token(token)

    # Attach clickable source citations as side drawer elements
    source_elements = []
    if chunks:
        for idx, chunk in enumerate(chunks, 1):
            source_name = f"Doc {idx}: {chunk.get('source', 'Unknown')}"
            topic = chunk.get('category', 'Topic')
            snippet = f"**Category:** {topic}\n\n" + chunk.get("content", "")
            source_elements.append(
                cl.Text(
                    name=source_name,
                    content=snippet,
                    display="side"
                )
            )

    response_msg.elements = source_elements
    await response_msg.update()
