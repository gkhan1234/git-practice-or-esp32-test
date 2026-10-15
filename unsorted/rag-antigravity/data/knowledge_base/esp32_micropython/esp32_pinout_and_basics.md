# ESP32 & MicroPython Core Reference

## What is the ESP32?
The ESP32 is a low-cost, low-power system-on-a-chip (SoC) microcontroller with integrated Wi-Fi and dual-mode Bluetooth. It features a dual-core 32-bit Tensilica Xtensa LX6 microprocessor running at 160 or 240 MHz.

### Essential Specifications
- **Operating Voltage (Internal Logic):** 3.3V DC (WARNING: GPIO pins are 3.3V logic only! They are NOT 5V tolerant).
- **Power Input Pins:**
  - `VIN` or `5V`: Regulated down to 3.3V onboard via an LDO regulator. Can accept 5V from USB or external 5V supply.
  - `3V3`: Direct 3.3V output (or regulated input). Supplies up to ~500mA depending on the board regulator.
  - `GND`: Ground reference (0V). All components in a circuit must share a common GND.
- **Maximum Current per GPIO Pin:** ~12mA recommended (20mA absolute max). *Never power motors, solenoids, or high-power buzzers directly from a GPIO pin!*

---

## Critical ESP32 GPIO Pin Rules

Not all GPIO pins on the ESP32 are created equal. Knowing which pins to use and which to avoid will save hours of troubleshooting!

### 1. Input-Only Pins: GPIO 34, 35, 36, 39
- **Pins:** GPIO 34, GPIO 35, GPIO 36 (Sensor VP), GPIO 39 (Sensor VN).
- **Rule:** These pins CANNOT be used as outputs (they have no internal pull-up or pull-down resistors and no output driver).
- **Best Use:** Analog inputs from sensors (potentiometer, LDR, thermistor).

### 2. ADC2 Conflict with Wi-Fi
- The ESP32 has two Analog-to-Digital Converters: ADC1 (GPIO 32 - 39) and ADC2 (GPIO 0, 2, 4, 12, 13, 14, 15, 25, 26, 27).
- **Rule:** If your MicroPython code enables Wi-Fi, **ADC2 pins cannot be used for analog reads** because the Wi-Fi driver uses ADC2 internally.
- **Best Practice:** Always connect analog sensors to **ADC1 pins** (GPIO 32, 33, 34, 35, 36, 39).

### 3. Strapping / Boot Pins (Use with Caution!)
- **GPIO 0:** Must be HIGH for normal boot. If pulled LOW at startup, ESP32 enters flashing/bootloader mode.
- **GPIO 2:** Connected to the onboard blue LED on many dev boards. Must be LOW or floating during boot.
- **GPIO 12:** If pulled HIGH during boot, the chip may fail to boot (selects flash voltage).
- **GPIO 15:** Must be HIGH during boot.
- **Best Practice:** Keep these pins free or use them only after the board has finished booting.

### 4. Flash Memory Pins (DO NOT USE!)
- **GPIO 6, 7, 8, 9, 10, 11:** Connected internally to the SPI flash chip. Connecting anything to these will crash the ESP32 immediately.

### 5. Recommended Safe General-Purpose GPIO Pins
- **Outputs & Digital Inputs:** GPIO 4, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33.
- **Default I2C Pins:** GPIO 21 (SDA), GPIO 22 (SCL).
- **Default SPI Pins:** GPIO 18 (SCK), GPIO 19 (MISO), GPIO 23 (MOSI), GPIO 5 (CS).
- **DAC (Digital to Analog Output):** GPIO 25, GPIO 26 (can produce true analog voltage 0 to 3.3V).

---

## 3.3V Logic Warning & Interfacing with 5V Sensors
> [!CAUTION]
> The ESP32 operates at 3.3V logic. Connecting a 5V signal directly to an ESP32 GPIO pin will permanently damage the microcontroller pin!
>
> If using a 5V sensor (such as the HC-SR04 Echo pin), you MUST step down the 5V signal to ~3.3V using a **voltage divider** before connecting to the ESP32:
>
> $$V_{out} = V_{in} \times \frac{R_2}{R_1 + R_2} = 5V \times \frac{2000}{1000 + 2000} \approx 3.33V$$
> - $R_1 = 1\text{k}\Omega$ (between sensor output and ESP32 GPIO)
> - $R_2 = 2\text{k}\Omega$ (between ESP32 GPIO and GND)
