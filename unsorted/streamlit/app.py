import time

import serial
import serial.tools.list_ports
import streamlit as st

BAUD_RATE = 115200
DEFAULT_PIN = 2  # onboard LED on most ESP32 dev boards


def list_ports():
    return [p.device for p in serial.tools.list_ports.comports()]


def guess_default_port(ports):
    for p in ports:
        lower = p.lower()
        if "usbserial" in lower or "usbmodem" in lower or "ttyusb" in lower or "wchusbserial" in lower:
            return p
    return ports[0] if ports else None


def connect(port: str) -> serial.Serial:
    ser = serial.Serial(port, BAUD_RATE, timeout=2)
    time.sleep(1.5)  # opening the port auto-resets the ESP32; let it reboot
    ser.reset_input_buffer()
    ser.write(b"PING\n")
    reply = ser.readline().decode(errors="replace").strip()
    if reply != "PONG":
        reply = ser.readline().decode(errors="replace").strip()
    if reply != "PONG":
        ser.close()
        raise RuntimeError(
            "Connected to the serial port but got no PONG from the board "
            f"(last line: {reply!r}). Is esp32/main.py running as main.py on the device?"
        )
    return ser


def send_command(ser: serial.Serial, line: str) -> str:
    ser.write((line + "\n").encode())
    return ser.readline().decode(errors="replace").strip()


st.set_page_config(page_title="ESP32 PWM Control", page_icon="🎛️")
st.title("ESP32 PWM Control")

if "ser" not in st.session_state:
    st.session_state.ser = None
if "last_sent" not in st.session_state:
    st.session_state.last_sent = None
if "log" not in st.session_state:
    st.session_state.log = []

ports = list_ports()

with st.sidebar:
    st.subheader("Connection")
    port = None
    if ports:
        default_port = guess_default_port(ports)
        port = st.selectbox(
            "Serial port", ports, index=ports.index(default_port) if default_port in ports else 0
        )
    else:
        st.warning("No serial ports found. Plug in the ESP32.")

    connected = st.session_state.ser is not None

    col1, col2 = st.columns(2)
    with col1:
        if st.button("Connect", disabled=connected or not port, use_container_width=True):
            try:
                st.session_state.ser = connect(port)
                st.session_state.last_sent = None
                st.session_state.log.insert(0, f"Connected to {port}")
            except Exception as e:
                st.session_state.ser = None
                st.error(str(e))
    with col2:
        if st.button("Disconnect", disabled=not connected, use_container_width=True):
            try:
                st.session_state.ser.close()
            except Exception:
                pass
            st.session_state.ser = None
            st.session_state.last_sent = None
            st.session_state.log.insert(0, "Disconnected")

    if port:
        st.caption(("\U0001f7e2 connected to " if connected else "⚪ not connected to ") + port)

st.divider()

ser = st.session_state.ser

pin = st.number_input(
    "GPIO pin",
    min_value=0,
    max_value=48,
    value=DEFAULT_PIN,
    step=1,
    help=(
        "Any output-capable pin. On the original ESP32, GPIOs 34-39 are input-only "
        "(no PWM) and 0/2/12/15 are strapping pins -- usable, but be cautious changing "
        "them right at boot. GPIO 2 drives the onboard LED on most dev boards."
    ),
)
freq = st.slider("Frequency (Hz)", min_value=1, max_value=20000, value=1000, step=1)
duty_pct = st.slider("Duty cycle (%)", min_value=0.0, max_value=100.0, value=0.0, step=0.5)

duty_u16 = int(round(duty_pct / 100 * 65535))
current = (int(pin), int(freq), duty_u16)

if ser is not None:
    if current != st.session_state.last_sent:
        try:
            reply = send_command(ser, f"SET,{current[0]},{current[1]},{current[2]}")
            st.session_state.last_sent = current
            st.session_state.log.insert(
                0, f"SET pin={current[0]} freq={current[1]}Hz duty={duty_pct:.1f}% -> {reply}"
            )
        except serial.SerialException as e:
            st.session_state.ser = None
            st.error(f"Lost connection to board: {e}")

    if st.button("Turn pin off"):
        try:
            reply = send_command(ser, f"OFF,{int(pin)}")
            st.session_state.last_sent = None
            st.session_state.log.insert(0, f"OFF pin={int(pin)} -> {reply}")
        except serial.SerialException as e:
            st.session_state.ser = None
            st.error(f"Lost connection to board: {e}")
else:
    st.info("Connect to the ESP32 from the sidebar to start sending PWM commands.")

st.subheader("Log")
st.code("\n".join(st.session_state.log[:12]) or "(nothing sent yet)")
