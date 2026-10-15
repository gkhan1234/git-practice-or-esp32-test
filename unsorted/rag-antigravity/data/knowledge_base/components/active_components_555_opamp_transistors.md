# Active Components: 555 Timer, Op-Amps, BJTs, & MOSFETs

## 1. The 555 Timer Integrated Circuit (IC)

The NE555 timer is one of the most famous and versatile chips in electronics history. It contains comparators, a flip-flop, a discharge transistor, and an output stage.

### 555 Pinout (Standard 8-pin DIP)
```
         +---v---+
  GND -- | 1   8 | -- VCC (4.5V to 15V)
 TRIG -- | 2   7 | -- DISCH (Discharge)
  OUT -- | 3   6 | -- THRESH (Threshold)
RESET -- | 4   5 | -- CTRL (Control Voltage, put 10nF cap to GND)
         +-------+
```

### Pin Descriptions:
1. **GND (Pin 1):** Ground reference (0V).
2. **TRIG (Pin 2):** Trigger. When voltage drops below $\frac{1}{3} V_{CC}$, output goes HIGH.
3. **OUT (Pin 3):** Output pin. Can source or sink up to 200mA!
4. **RESET (Pin 4):** Active LOW. Connect to $V_{CC}$ if not used.
5. **CTRL (Pin 5):** Access to internal $\frac{2}{3} V_{CC}$ divider. Usually bypassed with a 10nF (0.01µF) capacitor to GND for noise immunity.
6. **THRESH (Pin 6):** Threshold. When voltage rises above $\frac{2}{3} V_{CC}$, output goes LOW.
7. **DISCH (Pin 7):** Discharge. Connected to internal transistor; discharges timing capacitor to GND.
8. **VCC (Pin 8):** Positive power supply (+5V to +15V).

---

### Operating Modes of the 555 Timer

#### Mode A: Astable Multivibrator (Free-Running Oscillator / Blinker)
Output continuously switches between HIGH and LOW without any external trigger.
- **Connections:**
  - Connect Pin 2 (TRIG) to Pin 6 (THRESH).
  - Resistor $R_1$ between $V_{CC}$ and Pin 7 (DISCH).
  - Resistor $R_2$ between Pin 7 (DISCH) and Pin 6 (THRESH).
  - Capacitor $C$ between Pin 6 (THRESH) and GND.
  - Pin 4 to $V_{CC}$, Pin 5 to 10nF cap to GND.
- **Timing Formulas:**
  - Time High ($T_H$): $0.693 \times (R_1 + R_2) \times C$
  - Time Low ($T_L$): $0.693 \times R_2 \times C$
  - Frequency:
    $$f = \frac{1.44}{(R_1 + 2R_2) \times C}$$

#### Mode B: Monostable Multivibrator (One-Shot Pulse Timer)
Remains LOW until a momentary LOW pulse arrives at Pin 2 (TRIG). Then OUT goes HIGH for a set time, then drops back to LOW.
- **Timing Formula:**
  $$T = 1.1 \times R \times C$$
- Excellent for debouncing pushbuttons or generating timed activation signals.

---

## 2. Operational Amplifiers (Op-Amps, e.g., LM358)

An op-amp is a high-gain differential amplifier with two inputs and one output:
- **Non-inverting Input ($V_+$ or IN+):** If $V_+ > V_-$, output swings towards positive rail.
- **Inverting Input ($V_-$ or IN-):** If $V_- > V_+$, output swings towards negative rail / GND.

### LM358 Pinout (Dual Op-Amp)
- Pin 8: $V_{CC}$ (Single supply 3V to 32V)
- Pin 4: GND
- Op-Amp 1: Pin 1 (OUT), Pin 2 (IN-), Pin 3 (IN+)
- Op-Amp 2: Pin 7 (OUT), Pin 6 (IN-), Pin 5 (IN+)

### Common Circuit Configurations:
1. **Voltage Comparator (Open Loop):**
   - Connect a reference voltage (e.g. from a potentiometer voltage divider) to IN-.
   - Connect an analog sensor (e.g. LDR light sensor or thermistor) to IN+.
   - When sensor voltage exceeds the reference, the output snaps instantly HIGH ($V_{CC} - 1.5\text{V}$), turning on a transistor or signaling an ESP32.
2. **Voltage Follower (Buffer):**
   - Tie OUT directly back to IN- (negative feedback).
   - Input voltage to IN+.
   - Output voltage exactly mirrors the input voltage ($V_{out} = V_{in}$), but with near-infinite input impedance and low output impedance, preventing sensors from being loaded down.

---

## 3. Bipolar Junction Transistors (BJT: 2N2222, 2N3904)

BJTs are **current-controlled** switches. A small current flowing into the Base controls a much larger current flowing from Collector to Emitter.

### Pins:
- **Base (B):** Control terminal.
- **Collector (C):** Connects to load / higher voltage side.
- **Emitter (E):** Connects to GND (in NPN configuration).

### Using NPN BJT as a Switch:
- ESP32 GPIO pin connects through a **Base Resistor** (typically $1\text{k}\Omega$ to $2.2\text{k}\Omega$) to Base.
- *Why is the base resistor mandatory?* The Base-Emitter junction acts like a forward-biased diode ($\sim 0.7\text{V}$). Without a resistor, your ESP32 GPIO pin would short-circuit to GND, drawing excessive current!
- Base current formula:
  $$I_B = \frac{V_{GPIO} - 0.7\text{V}}{R_B} = \frac{3.3\text{V} - 0.7\text{V}}{1000\Omega} = 2.6\text{mA}$$

---

## 4. MOSFETs (Metal-Oxide-Semiconductor Field-Effect Transistors)

MOSFETs are **voltage-controlled** switches. Unlike BJTs, almost zero current flows into the Gate once charged, making them extremely efficient for high-current loads (motors, high-power LED strips, heating elements).

### Logic-Level N-Channel MOSFETs (e.g., IRLZ44N, AO3400)
> [!IMPORTANT]
> Standard MOSFETs (like IRF540N or IRFZ44N) require 10V at the gate to turn fully on!
> Since the ESP32 outputs only **3.3V**, you **MUST** use a **Logic-Level MOSFET** (designated by an "L" like **IRLZ44N**), which has a gate threshold voltage $V_{GS(th)} \le 2.0\text{V}$.

### Pins:
- **Gate (G):** Control pin (voltage opens the channel).
- **Drain (D):** Connects to the negative terminal of the load.
- **Source (S):** Connects to circuit GND.

### Essential Wiring Rules for MOSFETs:
1. **Gate Series Resistor (100$\Omega$ to 220$\Omega$):** The gate behaves like a tiny capacitor. When the ESP32 pin switches HIGH, an inrush current spike occurs. A $100\Omega$ resistor protects the ESP32 GPIO pin.
2. **Gate Pull-Down Resistor (10k$\Omega$):** Connect between Gate and GND. When the ESP32 boots or is in reset, its pins are high-impedance. The pull-down resistor ensures the MOSFET stays firmly OFF until commanded ON.
3. **Common Ground:** Motor power supply negative must be tied to ESP32 GND.

---

## 5. Comparison: 555 Timer vs. ESP32 for Timing

A classic question in electronics: *"When should I build a timing circuit with a 555 timer IC versus writing MicroPython code on an ESP32?"*

### Comparison Table

| Feature | 555 Timer IC | ESP32 Microcontroller |
| :--- | :--- | :--- |
| **Nature** | Pure analog/hardware (no code, no firmware) | Digital programmable computer |
| **How Timing is Set** | Physical resistors ($R$) & capacitors ($C$) | Software code (`time.sleep_ms()`, `machine.Timer`) |
| **Accuracy & Drift** | $\pm 1\%$ to $\pm 5\%$ (drifts with temperature & capacitor aging) | Crystal-accurate (parts per million via 40MHz quartz crystal) |
| **Operating Voltage** | Wide: 4.5V to 15V | Strictly 3.3V logic (5V will destroy GPIOs!) |
| **Output Drive Current**| High: up to 200mA (can drive small relays & buzzers directly) | Low: max ~12mA per GPIO (requires transistor/MOSFET) |
| **Bootup Time** | Instant (0 milliseconds) | Microcontroller boot time (~100ms - 1s) |
| **Flexibility** | Rigid: must physically change resistors/caps to alter timing | Unlimited: dynamic timing via sensors, buttons, or Wi-Fi |
| **Complexity** | Simple chip, no compiler or USB flashing needed | Requires code, MicroPython firmware, and USB cable |

### When to Use a 555 Timer:
1. **Simple, dedicated circuits:** Steady blinkers, buzzer siren generators, or a PWM motor speed knob where adding a microcontroller is overkill.
2. **Direct high-current switching:** Driving a 12V 150mA relay or 100mA buzzer without needing extra driver transistors.
3. **Instant-on operation:** Safety or watchdog circuits that must be active the microsecond power is switched on.
4. **Learning electronics fundamentals:** Hands-on experience with RC charging curves ($\tau = R \times C$), comparator switching, and transistor discharge.

### When to Use an ESP32:
1. **High precision & complex schedules:** Microsecond-level accuracy, delays based on sensor readings, or timers that change based on conditions.
2. **Multiple simultaneous events:** Managing multiple independent timers, sensor reading loops, and displays concurrently.
3. **Networked & real-time clocks:** Synchronizing time over Wi-Fi via NTP, scheduling daily events, or remote controls.

