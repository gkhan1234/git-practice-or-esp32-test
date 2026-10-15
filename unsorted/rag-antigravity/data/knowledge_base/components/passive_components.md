# Passive Electronic Components: Resistors, Capacitors & Diodes

## 1. Resistors

### Fundamental Concept: Ohm's Law
$$V = I \times R \quad \Longleftrightarrow \quad I = \frac{V}{R} \quad \Longleftrightarrow \quad R = \frac{V}{I}$$
- $V$ = Voltage in Volts (V)
- $I$ = Current in Amperes (A)
- $R$ = Resistance in Ohms ($\Omega$)

### Current-Limiting Resistor for LEDs
An LED has virtually no resistance once it turns on. If connected directly to power without a resistor, it draws massive current, burns out, and could damage the microcontroller!

**Formula:**
$$R = \frac{V_{supply} - V_{forward}}{I_{LED}}$$
- Standard Red LED: $V_f \approx 2.0\text{V}$, desired current $I = 15\text{mA} = 0.015\text{A}$
- On ESP32 ($3.3\text{V}$ supply):
  $$R = \frac{3.3\text{V} - 2.0\text{V}}{0.015\text{A}} = \frac{1.3}{0.015} \approx 86.6\Omega \quad \longrightarrow \text{Use } 100\Omega \text{ or } 220\Omega$$
- Standard 5V supply:
  $$R = \frac{5.0\text{V} - 2.0\text{V}}{0.015\text{A}} = 200\Omega \quad \longrightarrow \text{Use } 220\Omega \text{ or } 330\Omega$$

### Resistor Color Code Mnemonic
**B**lack (0), **B**rown (1), **R**ed (2), **O**range (3), **Y**ellow (4), **G**reen (5), **B**lue (6), **V**iolet (7), **G**ray (8), **W**hite (9).
*(Mnemonic: "Bad Boys Race Our Young Girls But Violet Generally Wins")*
- Gold band: $\pm 5\%$ tolerance
- Silver band: $\pm 10\%$ tolerance

### Pull-up and Pull-down Resistors
Microcontroller pins have very high impedance. If an input pin is not connected to a definite voltage, it acts like an antenna picking up electromagnetic interference (known as a "floating" pin).
- **Pull-up (typically 10k$\Omega$):** Connects pin to $3.3\text{V}$. Reads `1` by default; pulling switch to GND reads `0`.
- **Pull-down (typically 10k$\Omega$):** Connects pin to GND. Reads `0` by default; pushing switch connected to $3.3\text{V}$ reads `1`.

### Voltage Divider Formula
Used to scale down high voltages (like 5V sensors down to 3.3V for the ESP32):
$$V_{out} = V_{in} \times \frac{R_2}{R_1 + R_2}$$
To convert 5V to ~3.33V:
- Choose $R_1 = 1\text{k}\Omega$, $R_2 = 2\text{k}\Omega$
- $V_{out} = 5\text{V} \times \frac{2000}{1000 + 2000} = 3.33\text{V}$

---

## 2. Capacitors

Capacitors store electrical energy electrostatically in an electric field between two conductive plates separated by a dielectric.

### Types of Capacitors
1. **Ceramic Capacitors (Picofarads to Microfarads, e.g., 100nF / 0.1µF marked '104'):**
   - **Non-polarized:** Can be inserted in either direction.
   - **Role:** Excellent for decoupling high-frequency noise near power pins of ICs (placed as close as possible to VCC and GND pins).
2. **Electrolytic Capacitors (Microfarads, e.g., 10µF to 1000µF):**
   - **POLARIZED:** Must be connected in the correct direction!
   - The longer lead is **Positive (+)**.
   - The shorter lead and the stripe on the canister with minus signs (`-`) is **Negative (-)**.
   > [!CAUTION]
   > Connecting an electrolytic capacitor backwards can cause it to heat up, burst, or vent pungent gas! Always check the stripe!
   - **Role:** Bulk power filtering and smoothing low-frequency voltage ripples (e.g. smoothing motor start dips).

### RC Time Constant
$$\tau = R \times C$$
- A capacitor charges to $63.2\%$ of supply voltage in $1\tau$, and reaches $>99\%$ in $5\tau$.
- Used for hardware debouncing, timing delays, and low-pass filtering.

---

## 3. Diodes & LEDs

A diode allows current to flow in only ONE direction (from Anode to Cathode) and blocks current in reverse.

### LED (Light Emitting Diode)
- **Anode (+):** Longer lead, connects toward positive voltage.
- **Cathode (-):** Shorter lead, flat spot on plastic rim, connects toward GND.

### Flyback (Freewheeling) Diode for Inductive Loads (Motors, Relays)
When current through a coil (motor, relay, solenoid) is abruptly cut off by a transistor, the collapsing magnetic field creates a huge reverse voltage spike (Lenz's Law, often hundreds of volts!).
This spike will instantly destroy your transistor, MOSFET, or ESP32!

> [!IMPORTANT]
> **Safety Rule:** Place a rectifier diode (e.g., 1N4001 or 1N4148) in **reverse parallel** across the motor terminals:
> - Diode Cathode (striped end) connects to Motor (+) / Power Supply.
> - Diode Anode connects to Motor (-) / Transistor Drain.
> During normal operation, the diode blocks current. When the motor turns off, the inductive spike safely recirculates through the diode instead of frying your circuit.
