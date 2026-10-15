# Workshop Safety, Hardware Rules & Troubleshooting Guide

## 1. Physical Workshop Safety Rules

Working with electronics and building hardware is exciting and rewarding, but safety in the lab or classroom always comes first!

### Soldering Iron Safety (CRITICAL)
> [!CAUTION]
> **Soldering irons operate between 300°C and 400°C (572°F to 752°F)!**
> A split-second touch to bare skin causes immediate second- or third-degree burns.
>
> 1. **Never touch the metal barrel or tip** of the soldering iron. Hold it only by the insulated plastic/rubber handle.
> 2. **Always place the iron in its protective stand** when not actively making a joint. Never set it down on a table, paper, or plastic mat.
> 3. **Proper Ventilation:** Rosin core flux creates smoke and fumes when heated. Always turn on a fume extractor fan or solder in a well-ventilated room. Avoid breathing in the smoke directly.
> 4. **Eye Protection:** Always wear safety goggles! Molten solder or snipped component lead wires can fly into eyes.
> 5. **Lead Safety:** If using 60/40 leaded solder, wash your hands thoroughly with soap and water before eating or drinking.
> 6. **Unplug When Finished:** If you step away from your workbench for even 2 minutes, verify the soldering iron is turned off and unplugged.

---

### Breadboard & Electrical Power Safety
1. **Always disconnect power (USB or battery) before rewiring anything on a breadboard.** If you move wires while power is connected, an accidental brush against another pin can short out the 3.3V rail and kill your microcontroller.
2. **Double check Electrolytic Capacitor Polarity:** The stripe on the cylinder indicates the **negative (-)** pin. Plugging it backwards into power can cause it to swell, overheat, and pop loudly!
3. **Double check Battery/Supply Polarity:** Reverse polarity (connecting + to GND and - to VCC) instantly destroys ICs and development boards.

---

## 2. Hardware Protection Rules for ESP32

### Rule 1: The 3.3V Limit
The ESP32 is a 3.3V logic device. Applying 5V directly to any GPIO pin can permanently burn out that pin or the entire SoC.
- Always check sensor datasheets to verify their output voltage.
- If a sensor outputs 5V (e.g. 5V Ultrasonic HC-SR04 Echo pin), use a 1kΩ / 2kΩ voltage divider or bidirectional logic level shifter.

### Rule 2: Never Drive Motors Directly from GPIO Pins
- Maximum safe GPIO current: ~12mA.
- Small motors: 100mA to 1000mA+.
- Always use a transistor switch (logic-level MOSFET or BJT) or motor driver (TB6612 / L298N) with an external power supply.

### Rule 3: Always Install a Flyback Diode for Inductive Loads
- Coils in motors, relays, and solenoids generate high-voltage back-EMF spikes when turned off.
- Connect a diode (1N4001 or 1N4148) in reverse parallel across the motor terminals (cathode to positive, anode to negative).

### Rule 4: Common Ground (GND) is Mandatory
- When using an external battery or power supply for motors/servos and USB power for the ESP32, **you MUST connect all GNDs together**.
- Voltage is a relative potential. Without a common reference, signals cannot be read correctly and motors will behave erratically.

---

## 3. Student Troubleshooting Guide ("What Went Wrong?")

### Symptom A: The ESP32 reboots in an endless loop or gives "Brownout detector was triggered"
- **Cause:** When motors or servos kick on, they draw a large surge of current. This causes the power supply voltage to dip below 2.8V, triggering the ESP32's automatic safety reset.
- **Fix:**
  1. Do not power motors from the ESP32's 3.3V or VIN pin. Use an external battery or power pack.
  2. Add a large electrolytic decoupling capacitor (e.g., 100µF to 470µF) across the motor power rails to cushion the current surge.
  3. Ensure common ground between external supply and ESP32.

### Symptom B: The LED doesn't light up
- **Fix Checklist:**
  1. Is the LED in backwards? Remember the longer leg is positive (Anode); shorter leg/flat side is negative (Cathode).
  2. Did you use a current-limiting resistor (e.g., 220Ω)?
  3. Is the GPIO pin configured as `Pin.OUT` in your MicroPython code?
  4. Did you call `led.value(1)`?
  5. Test on the onboard LED (usually GPIO 2) to confirm your board is executing code.

### Symptom C: The Pushbutton triggers erratically or triggers when your hand gets close
- **Cause:** The input pin is "floating" without a pull-up or pull-down resistor.
- **Fix:** In MicroPython, declare the pin with `Pin.PULL_UP` (e.g. `Pin(4, Pin.IN, Pin.PULL_UP)`). Connect the switch between the pin and GND.

### Symptom D: Analog readings on ESP32 are stuck at 4095 or 0
- **Fix Checklist:**
  1. Did you configure attenuation? Without `pot.atten(ADC.ATTN_11DB)`, any voltage over ~1.0V will read as maximum (4095).
  2. Are you using an ADC2 pin while Wi-Fi is active? Switch to an ADC1 pin (GPIO 32, 33, 34, 35, 36, 39).
  3. Are you using GPIO 34-39 for an output? Remember these pins are input-only!
