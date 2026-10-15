# ESP32 to DHT10 Connection Guide

This directory contains implementations for **Arduino (C++)**, **MicroPython**, and **ESP-IDF (C)** to read temperature and relative humidity from a **DHT10** (AHT10) sensor using an **ESP32**.

---

## 1. Pin Wiring

The DHT10 communicates via the **I2C protocol** (default I2C address: `0x38`).

| DHT10 Pin | ESP32 Pin | Description |
| :--- | :--- | :--- |
| **VCC / VDD** | **3.3V** | Power supply (3.3V recommended) |
| **GND** | **GND** | Ground |
| **SCL** | **GPIO 22** | Default I2C Clock |
| **SDA** | **GPIO 21** | Default I2C Data |

---

## 2. Included Implementations

### A. ESP-IDF (C)
- **[`dht10_idf.c`](file:///Users/thenationalflagcompany/Documents/Projects/DHT10%20Code/dht10_idf.c)** (Standalone C file)
- **[`esp_idf/`](file:///Users/thenationalflagcompany/Documents/Projects/DHT10%20Code/esp_idf)** (Full ESP-IDF CMake Project)
  - Uses native FreeRTOS tasks and `driver/i2c.h`.
  - Non-blocking delays via `vTaskDelay()`.
  - Logging via `esp_log.h`.

### B. MicroPython
- **[`main.py`](file:///Users/thenationalflagcompany/Documents/Projects/DHT10%20Code/main.py)**:
  - Object-oriented MicroPython implementation with a dedicated `DHT10` class.
  - Automatically scans the I2C bus on pins `GPIO 21` (SDA) and `GPIO 22` (SCL).
  - Can be uploaded directly to the ESP32 via Thonny, mpremote, or ampy.

### C. Arduino (C++)
- **[`DHT10_ESP32.ino`](file:///Users/thenationalflagcompany/Documents/Projects/DHT10%20Code/DHT10_ESP32.ino) (Recommended)**:
  - Completely standalone using the built-in `<Wire.h>` library.
  - Requires **no external library installation**.
  - Directly handles calibration, measurement triggers, and data conversion.

- **[`DHT10_Adafruit.ino`](file:///Users/thenationalflagcompany/Documents/Projects/DHT10%20Code/DHT10_Adafruit.ino)**:
  - Uses the official `Adafruit AHTX0` library.
  - Requires installing the **Adafruit AHTX0** library via the Arduino IDE Library Manager.

---

## 3. How to Run

### ESP-IDF:
1. Open a terminal with your ESP-IDF environment activated (`. $HOME/esp/esp-idf/export.sh`).
2. Navigate to the project directory:
   ```bash
   cd "DHT10 Code/esp_idf"
   ```
3. Set the target chip and build:
   ```bash
   idf.py set-target esp32
   idf.py build
   ```
4. Flash and monitor:
   ```bash
   idf.py -p /dev/ttyUSB0 flash monitor
   ```

### MicroPython (Thonny IDE):
1. Open **Thonny IDE** and set the interpreter to **MicroPython (ESP32)**.
2. Open [`main.py`](file:///Users/thenationalflagcompany/Documents/Projects/DHT10%20Code/main.py).
3. Click **Run current script** (F5) or save it directly onto the ESP32 root filesystem.

### Arduino IDE:
1. Open [`DHT10_ESP32.ino`](file:///Users/thenationalflagcompany/Documents/Projects/DHT10%20Code/DHT10_ESP32.ino).
2. Select your ESP32 board under **Tools** → **Board** (e.g., `ESP32 Dev Module`).
3. Connect your ESP32 via USB and select the serial port under **Tools** → **Port**.
4. Click **Upload** and open the **Serial Monitor** at **`115200` baud**.
