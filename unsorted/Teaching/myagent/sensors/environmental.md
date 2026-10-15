# Environmental Sensors Reference Guide

This document contains comprehensive details, connection schematics, logic level requirements, and sample code for popular environmental sensors used with Arduino and ESP32 microcontrollers.

---

<a name="dht22"></a>
## DHT11 / DHT22: Digital Temperature & Humidity

These are capacitive humidity and thermistor temperature sensors that communicate via a proprietary single-wire digital interface. DHT22 is higher accuracy and covers a wider measurement range than DHT11.

### Technical Specifications
* **Operating Voltage:** 3.3V – 5.5V (3.3V recommended for ESP32)
* **Logic Level:** Matches VCC. Use 3.3V power to output 3.3V digital logic.
* **Temperature Range (DHT22):** -40°C to 80°C (±0.5°C accuracy)
* **Humidity Range (DHT22):** 0% to 100% (±2-5% accuracy)
* **Interface:** Single-Wire Digital (bidirectional handshaking)

### Typical Pinout

| Pin Name | Pin Number | Description | Connection (Arduino / ESP32) |
| :--- | :--- | :--- | :--- |
| **VCC** | 1 | Power supply | 3.3V (ESP32) or 5V (Arduino) |
| **DATA** | 2 | Bidirectional data line | Any digital GPIO (e.g., GPIO 4 / Pin 2) |
| **NC** | 3 | Not connected | Leave unconnected |
| **GND** | 4 | Ground | GND |

> [!IMPORTANT]
> **Pull-Up Resistor**: A **4.7kΩ to 10kΩ pull-up resistor** is required between the **DATA** and **VCC** pins. Many pre-soldered module boards have this built-in, but bare 4-pin packages do not.

### Recommended Libraries
* **Adafruit DHT Sensor Library** (Install via Arduino Library Manager; requires **Adafruit Unified Sensor**)
* **DHTesp** (Highly recommended for ESP32/ESP8266; optimized to prevent read timeouts)

### Arduino / ESP32 Sample Code
```cpp
#include "DHT.h"

#define DHTPIN 4     // Digital pin connected to the DHT sensor
#define DHTTYPE DHT22   // DHT 22 (AM2302)

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
}

void loop() {
  delay(2000); // Wait 2 seconds between measurements

  float h = dht.readHumidity();
  float t = dht.readTemperature(); // Celsius

  if (isnan(h) || isnan(t)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  Serial.print("Humidity: ");
  Serial.print(h);
  Serial.print("%  |  Temperature: ");
  Serial.print(t);
  Serial.println("°C");
}
```

---

<a name="bme280"></a>
## BME280 / BMP280: Temperature, Humidity & Barometric Pressure

The BME280 measures temperature, relative humidity, and barometric pressure. The BMP280 is identical but lacks the humidity sensor. Both communicate via I2C or SPI.

### Technical Specifications
* **Operating Voltage (Chip):** 1.7V – 3.6V (Breakout boards usually include a 3.3V regulator and can be powered by 3.3V or 5V)
* **Logic Level:** 3.3V (Ensure breakout board has onboard level shifters if using a 5V Arduino Uno)
* **Default I2C Address:** `0x76` or `0x77` (often selectable via SDO pin: SDO to GND = `0x76`, SDO to VCC = `0x77`)
* **Interface:** I2C (up to 3.4MHz) or SPI (3-wire or 4-wire, up to 10MHz)

### Typical Pinout (6-Pin Breakout Board)

| Breakout Pin | Chip Pin Name | Description | Connection (ESP32) | Connection (Arduino Uno) |
| :--- | :--- | :--- | :--- | :--- |
| **VCC** | VDD / VDDIO | Power supply | 3.3V | 5V / 3.3V |
| **GND** | GND | Ground | GND | GND |
| **SCL** | SCK / SCL | I2C Clock / SPI Clock | GPIO 22 | Pin A5 |
| **SDA** | SDI / SDA | I2C Data / SPI MOSI | GPIO 21 | Pin A4 |
| **CSB** | CS | Chip Select (SPI mode) | Pull high for I2C | Pull high for I2C |
| **SDO** | SDO | SPI MISO / I2C Address Select | GND = 0x76, VCC = 0x77 | GND = 0x76, VCC = 0x77 |

### Recommended Libraries
* **Adafruit BME280 Library** (requires **Adafruit Unified Sensor**)

### Arduino / ESP32 Sample Code (I2C)
```cpp
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>

#define SEALEVELPRESSURE_HPA (1013.25)

Adafruit_BME280 bme; // I2C

void setup() {
  Serial.begin(115200);
  
  // Initialize BME280. Pass I2C Address if it differs from default (e.g., 0x76)
  if (!bme.begin(0x76)) {
    Serial.println("Could not find a valid BME280 sensor, check wiring!");
    while (1);
  }
}

void loop() {
  Serial.print("Temperature = ");
  Serial.print(bme.readTemperature());
  Serial.println(" *C");

  Serial.print("Pressure = ");
  Serial.print(bme.readPressure() / 100.0F);
  Serial.println(" hPa");

  Serial.print("Approx. Altitude = ");
  Serial.print(bme.readAltitude(SEALEVELPRESSURE_HPA));
  Serial.println(" m");

  Serial.print("Humidity = ");
  Serial.print(bme.readHumidity());
  Serial.println(" %");

  Serial.println();
  delay(2000);
}
```

---

<a name="ds18b20"></a>
## DS18B20: One-Wire Waterproof Temperature

The DS18B20 is a popular digital thermometer probe that communicates using the proprietary Maxim Dallas One-Wire protocol. Because it is waterproof, it is ideal for liquid and soil monitoring.

### Technical Specifications
* **Operating Voltage:** 3.0V – 5.5V
* **Logic Level:** 3.3V or 5V (Matches VCC)
* **Measurement Range:** -55°C to +125°C (±0.5°C accuracy from -10°C to +85°C)
* **Resolution:** User-selectable from 9 to 12 bits
* **Interface:** One-Wire Bus (allows multiple sensors to share a single GPIO pin)

### Typical Pinout (Waterproof Probe vs TO-92 Package)

| Probe Wire Color | TO-92 Pin | Pin Name | Description | Connection (ESP32) |
| :--- | :--- | :--- | :--- | :--- |
| **Red** | 3 | **VDD** | Power supply | 3.3V |
| **Yellow (or Blue)** | 2 | **DQ** | One-Wire Data line | Any digital GPIO (e.g., GPIO 4) |
| **Black** | 1 | **GND** | Ground | GND |

> [!IMPORTANT]
> **Pull-Up Resistor**: A **4.7kΩ resistor** is required between the **DQ (Data)** wire and the **VDD (Power)** wire. Without this resistor, the bus cannot pull high, and the sensor will read `85` (default reset value) or `-127` (failed communication value).

### Recommended Libraries
* **OneWire** (Low-level bus communication)
* **DallasTemperature** (Translates raw One-Wire bits into temperature values)

### Arduino / ESP32 Sample Code
```cpp
#include <OneWire.h>
#include <DallasTemperature.h>

#define ONE_WIRE_BUS 4 // Data wire connected to GPIO 4

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

void setup() {
  Serial.begin(115200);
  sensors.begin();
}

void loop() {
  sensors.requestTemperatures(); // Send command to get readings
  
  // We use index 0 because we only have one sensor on the bus
  float tempC = sensors.getTempCByIndex(0);
  
  if (tempC == DEVICE_DISCONNECTED_C) {
    Serial.println("Error: Could not read temperature data");
  } else {
    Serial.print("Temperature: ");
    Serial.print(tempC);
    Serial.println(" °C");
  }
  
  delay(1000);
}
```

---

<a name="mq_series"></a>
## MQ Series Gas Sensors: MQ-2 / MQ-135

The MQ series sensors use a heating element (heater) and an electrochemical sensor to detect various gas concentrations. The MQ-2 is sensitive to smoke, LPG, and Propane, while the MQ-135 is designed for Air Quality (detecting CO2, Alcohol, Benzene, Ammonia, and Smoke).

### Technical Specifications
* **Operating Voltage:** 5.0V (Crucial for the internal heater to reach operating temperature)
* **Heater Power Consumption:** ~800mW (requires up to 150-180mA; do **not** power directly from the 3.3V or 5V pin of a bus-powered ESP32/Arduino without checking current capacity)
* **Outputs:**
  * **Analog Output (A0):** Output voltage scales relative to gas concentration (0–5V range).
  * **Digital Output (D0):** Built-in comparator allows setting a trigger threshold using an onboard potentiometer. Output is High/Low.

> [!WARNING]
> **ESP32 5V Analog Hazard**: The MQ series outputs up to 5.0V on the **A0** analog pin. Connecting this directly to an ESP32 analog pin will damage the GPIO port. You **must** scale this voltage down to 3.3V using a voltage divider (e.g., a 10kΩ resistor from A0 to the ESP32 pin, and a 18kΩ or 20kΩ resistor from the ESP32 pin to Ground).
>
> **Burn-In Period**: These sensors require a **24 to 48-hour burn-in period** (running powered on) before they stabilize for accurate calibration.

### Typical Pinout

| Pin Name | Description | Connection (Arduino Uno) | Connection (ESP32) |
| :--- | :--- | :--- | :--- |
| **VCC** | Power Supply (5V) | 5V | External 5V (Must share Ground) |
| **GND** | Ground | GND | GND |
| **D0** | Digital threshold output | Any digital pin | Any digital GPIO (Requires logic shift or open-drain) |
| **A0** | Analog concentration output | Any analog pin (e.g., A0) | ESP32 ADC pin (e.g., GPIO 34) **via voltage divider** |

### Recommended Libraries
* **MQUnifiedsensor** by Miguel A. Califa (Includes models and math curves for all MQ sensors)

### ESP32 Voltage Divider Calculation
* $V_{out} = V_{in} \times \frac{R_2}{R_1 + R_2}$
* If $V_{in} = 5.0V$ (max sensor output), and we use $R_1 = 10\text{ k}\Omega$ (between A0 and ESP32 pin) and $R_2 = 18\text{ k}\Omega$ (between ESP32 pin and GND):
* $V_{out} = 5.0V \times \frac{18}{10 + 18} = 3.21V$ (Safe for ESP32!)

### Sample Arduino / ESP32 Sketch (Raw Reading)
```cpp
#define ANALOG_PIN 34 // ESP32 ADC pin (with voltage divider!)

void setup() {
  Serial.begin(115200);
}

void loop() {
  int rawValue = analogRead(ANALOG_PIN);
  
  // On ESP32 (12-bit ADC, 0-4095)
  float voltage = (rawValue / 4095.0) * 3.3; 
  
  // Calculate raw sensor resistance ratio or display voltage
  Serial.print("Raw ADC Value: ");
  Serial.print(rawValue);
  Serial.print(" | Scaled Voltage: ");
  Serial.print(voltage);
  Serial.println(" V");
  
  delay(1000);
}
```

---

<a name="sgp30"></a>
## SGP30: Multi-Pixel Gas & Air Quality

The SGP30 is a metal-oxide gas sensor that measures Total Volatile Organic Compounds (TVOC) and equivalent Carbon Dioxide ($e\text{CO}_2$) via I2C. Unlike MQ sensors, it requires very little power and offers digital output directly.

### Technical Specifications
* **Operating Voltage:** 1.8V (Chip) / 3.3V (Breakout Board)
* **Interface:** I2C (Address `0x58`)
* **Measurement Range:** 
  * TVOC: 0 to 60,000 ppb (parts per billion)
  * $e\text{CO}_2$: 400 to 60,000 ppm (parts per million)
* **Humidity Compensation:** Built-in calculation engine (takes humidity input from sensors like BME280/SHT31 to calibrate readings dynamically)

### Typical Pinout

| Pin Name | Description | Connection (ESP32) |
| :--- | :--- | :--- |
| **VIN** | Power supply (3.3V or 5V depending on board regulator) | 3.3V |
| **GND** | Ground | GND |
| **SCL** | I2C Clock | GPIO 22 |
| **SDA** | I2C Data | GPIO 21 |

### Recommended Libraries
* **Adafruit SGP30 Library**

### Arduino / ESP32 Sample Code
```cpp
#include <Wire.h>
#include "Adafruit_SGP30.h"

Adafruit_SGP30 sgp;

void setup() {
  Serial.begin(115200);
  
  if (! sgp.begin()){
    Serial.println("SGP30 sensor not found!");
    while (1);
  }
  
  Serial.print("Found SGP30 serial #");
  Serial.print(sgp.serialnumber[0], HEX);
  Serial.print(sgp.serialnumber[1], HEX);
  Serial.println(sgp.serialnumber[2], HEX);
}

void loop() {
  if (! sgp.IAQmeasure()) {
    Serial.println("Measurement failed");
    return;
  }
  
  Serial.print("TVOC: ");
  Serial.print(sgp.TVOC);
  Serial.print(" ppb\t");
  Serial.print("eCO2: ");
  Serial.print(sgp.eCO2);
  Serial.println(" ppm");
  
  delay(1000);
}
```

---

<a name="aht20"></a>
## AHT20: High Precision Temp & Humidity

The AHT20 is a next-generation high-precision relative humidity and temperature sensor. It features a fully calibrated digital output and communicates over I2C. It is much more stable than DHT sensors and has a very low power consumption profile.

### Technical Specifications
* **Operating Voltage:** 2.0V – 5.5V (3.3V recommended)
* **Interface:** I2C (Default address `0x38`)
* **Accuracy:** Temperature ±0.3°C, Humidity ±2% RH

### Typical Pinout

| Pin Name | Description | Connection (ESP32) |
| :--- | :--- | :--- |
| **VIN** | Power Supply | 3.3V |
| **GND** | Ground | GND |
| **SCL** | I2C Clock | GPIO 22 |
| **SDA** | I2C Data | GPIO 21 |

### Recommended Libraries
* **Adafruit AHTX0**

### Arduino / ESP32 Sample Code
```cpp
#include <Adafruit_AHTX0.h>

Adafruit_AHTX0 aht;

void setup() {
  Serial.begin(115200);
  
  if (!aht.begin()) {
    Serial.println("Could not find AHT20 sensor!");
    while (1);
  }
  Serial.println("AHT20 initialized.");
}

void loop() {
  sensors_event_t humidity, temp;
  aht.getEvent(&humidity, &temp); // Populate events with readings
  
  Serial.print("Temperature: ");
  Serial.print(temp.temperature);
  Serial.print(" degrees C\t");
  Serial.print("Humidity: ");
  Serial.print(humidity.relative_humidity);
  Serial.println("% rH");
  
  delay(2000);
}
```
