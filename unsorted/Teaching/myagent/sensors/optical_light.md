# Optical & Light Sensors Reference Guide

This document contains comprehensive details, connection schematics, logic level requirements, and sample code for popular optical, light, and color sensors used with Arduino and ESP32 microcontrollers.

---

<a name="ldr"></a>
## LDR (Photoresistor): Light Dependent Resistor

An LDR (or photoresistor) is a passive component whose resistance decreases when exposed to light. By wiring it in series with a fixed resistor, you create a voltage divider that outputs an analog voltage proportional to light intensity.

### Technical Specifications
* **Operating Voltage:** 3.3V – 5.0V (Select VCC to match your microcontroller's ADC range)
* **Output:** Analog voltage
* **Working Resistance:** ~10kΩ in light; >1MΩ in complete darkness

### Wiring & Schematic (Voltage Divider)
To read the LDR value, you must wire a voltage divider.
```
  VCC (3.3V or 5V) ───[ LDR ]───┬───[ 10kΩ Resistor ]─── GND
                                │
                         Analog Input Pin (ADC)
```
If light increases, the resistance of the LDR decreases, pulling the Analog Input voltage closer to **VCC** (Higher ADC reading). In the dark, the LDR resistance is high, pulling the Analog Input voltage closer to **GND** (Lower ADC reading).

### Typical Pinout

* **Component Pins:** LDRs have two non-polar terminals.
* **Module Breakout (Optional):** Pre-assembled modules have 3 pins (VCC, GND, and OUT).

| Pin Name (Module) | Description | Connection (Arduino / ESP32) |
| :--- | :--- | :--- |
| **VCC** | Power Supply | 3.3V (ESP32) or 5V (Arduino) |
| **GND** | Ground | GND |
| **OUT / A0** | Analog Output | Any Analog Input (e.g., GPIO 34 / Pin A0) |

### Recommended Libraries
* **No Library Required**: Measured using standard `analogRead()` commands.

### Arduino / ESP32 Sample Code
```cpp
const int ldrPin = 34; // ESP32 ADC pin (GND-referenced divider)

void setup() {
  Serial.begin(115200);
}

void loop() {
  int ldrRaw = analogRead(ldrPin);
  
  // Calculate voltage representation
  float voltage = (ldrRaw / 4095.0) * 3.3; // ESP32 12-bit ADC, 3.3V max
  
  Serial.print("Raw Value: ");
  Serial.print(ldrRaw);
  Serial.print(" | Voltage: ");
  Serial.print(voltage);
  Serial.println(" V");
  
  delay(1000);
}
```

---

<a name="bh1750"></a>
## BH1750: Digital Ambient Light (Lux)

The BH1750 is a digital Ambient Light Sensor IC with an I2C bus interface. It measures light intensity in Lux ($lx$) directly and filters out light source variation (fluorescent, halogen, incandescent, solar, etc.) automatically.

### Technical Specifications
* **Operating Voltage:** 3.0V – 5.0V (Module breakout usually includes a regulator; safe to power via 3.3V or 5V)
* **Logic Level:** 3.3V
* **Interface:** I2C (Address `0x23` or `0x5C` depending on ADDR pin: ADDR to GND = `0x23`, ADDR to VCC = `0x5C`)
* **Measurement Range:** 1 to 65,535 lx

### Typical Pinout

| Pin Name | Description | Connection (ESP32) | Connection (Arduino Uno) |
| :--- | :--- | :--- | :--- |
| **VCC** | Power Supply | 3.3V | 5V / 3.3V |
| **GND** | Ground | GND | GND |
| **SCL** | I2C Clock | GPIO 22 | Pin A5 |
| **SDA** | I2C Data | GPIO 21 | Pin A4 |
| **ADD / ADDR**| I2C Address Select | GND = 0x23, VCC = 0x5C | GND = 0x23, VCC = 0x5C |

### Recommended Libraries
* **BH1750** by Christopher Laws

### Arduino / ESP32 Sample Code
```cpp
#include <Wire.h>
#include <BH1750.h>

BH1750 lightMeter;

void setup(){
  Serial.begin(115200);
  Wire.begin(); // Join I2C bus

  // Initialize the BH1750 object
  // Default mode is CONTINUOUS_HIGH_RES_MODE
  if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
    Serial.println(F("BH1750 initialized successfully"));
  } else {
    Serial.println(F("Error initializing BH1750"));
  }
}

void loop() {
  float lux = lightMeter.readLightLevel();
  
  Serial.print("Light: ");
  Serial.print(lux);
  Serial.println(" lx");
  
  delay(1000);
}
```

---

<a name="tcs3200"></a>
## TCS3200: Color Sensor

The TCS3200 uses an array of photodiodes with red, green, blue, and clear filters to detect color. It outputs a square wave with a frequency directly proportional to light intensity of the selected color channel.

### Technical Specifications
* **Operating Voltage:** 2.7V – 5.5V
* **Logic Level:** Matches VCC. If powered at 5V, output logic is 5V.
* **Output:** Square wave frequency (pulse duration read via `pulseIn()`)

> [!WARNING]
> **ESP32 5V Digital Hazard**: The TCS3200 outputs a 5V square wave if powered with 5V. Since ESP32 pins are not 5V tolerant, you **must** use a logic level shifter on the OUT pin if powering the sensor with 5V. Alternatively, check if the sensor works reliably when powered directly with 3.3V (some modules support this, though sensitivity may decrease).

### Sensor Pin Configurations (S0/S1 & S2/S3)
* **S0 / S1 (Frequency Scaling)**:
  * S0: L, S1: L (Power Down)
  * S0: L, S1: H (2% Scale)
  * S0: H, S1: L (20% Scale - Typical for Arduino/ESP32)
  * S0: H, S1: H (100% Scale)
* **S2 / S3 (Photodiode Color Select)**:
  * S2: L, S3: L (Red filter)
  * S2: L, S3: H (Blue filter)
  * S2: H, S3: L (Clear/No filter)
  * S2: H, S3: H (Green filter)

### Typical Pinout

| Pin Name | Description | Connection (Arduino / ESP32) |
| :--- | :--- | :--- |
| **VCC** | Power Supply | 3.3V (For ESP32 native) or 5V (Requires level shifters) |
| **GND** | Ground | GND |
| **OUT** | Output Frequency | Digital Input Pin (e.g., GPIO 18) |
| **S0** | Frequency scaling pin 0 | Digital Output Pin (e.g., GPIO 5) |
| **S1** | Frequency scaling pin 1 | Digital Output Pin (e.g., GPIO 17) |
| **S2** | Photodiode selection pin 2 | Digital Output Pin (e.g., GPIO 16) |
| **S3** | Photodiode selection pin 3 | Digital Output Pin (e.g., GPIO 4) |
| **LED** | Control onboard white illumination LEDs| Pull HIGH to turn on, LOW to turn off |

### Recommended Libraries
* **MD_TCS230** by MajicDesigns
* **No Library Required**: Raw implementation using digital writing to select filters and `pulseIn()` to read output frequencies.

### Arduino / ESP32 Sample Code (Direct implementation)
```cpp
// Define Pins
#define S0 5
#define S1 17
#define S2 16
#define S3 4
#define sensorOut 18

int redFrequency = 0;
int greenFrequency = 0;
int blueFrequency = 0;

void setup() {
  Serial.begin(115200);

  // Set pin modes
  pinMode(S0, OUTPUT);
  pinMode(S1, OUTPUT);
  pinMode(S2, OUTPUT);
  pinMode(S3, OUTPUT);
  pinMode(sensorOut, INPUT);
  
  // Set Frequency scaling to 20%
  digitalWrite(S0, HIGH);
  digitalWrite(S1, LOW);
}

void loop() {
  // 1. Read Red Filtered Photodiodes
  digitalWrite(S2, LOW);
  digitalWrite(S3, LOW);
  redFrequency = pulseIn(sensorOut, LOW); // Measure pulse width (low frequency = higher intensity)
  
  delay(10);

  // 2. Read Green Filtered Photodiodes
  digitalWrite(S2, HIGH);
  digitalWrite(S3, HIGH);
  greenFrequency = pulseIn(sensorOut, LOW);
  
  delay(10);

  // 3. Read Blue Filtered Photodiodes
  digitalWrite(S2, LOW);
  digitalWrite(S3, HIGH);
  blueFrequency = pulseIn(sensorOut, LOW);

  // Print raw pulse durations (lower value = stronger color detection)
  Serial.print("R = "); Serial.print(redFrequency);
  Serial.print(" | G = "); Serial.print(greenFrequency);
  Serial.print(" | B = "); Serial.println(blueFrequency);
  
  delay(1000);
}
```

---

<a name="apds9960"></a>
## APDS-9960: Gesture, RGB, Proximity Sensor

The APDS-9960 is an integrated digital sensor incorporating ambient light and RGB color sensing, proximity detection, and physical gesture recognition. It communicates via I2C and is commonly used in contactless user interfaces and smartphone wake screen sensors.

### Technical Specifications
* **Operating Voltage:** 2.4V – 3.6V (3.3V recommended)
* **Logic Level:** 3.3V
* **Interface:** I2C (Address `0x39`)
* **Detection Distance:** ~10cm to 20cm (4 to 8 inches) for proximity and gesture

### Typical Pinout

| Pin Name | Description | Connection (ESP32) |
| :--- | :--- | :--- |
| **VL** | Power Supply for internal IR LED (Optional; usually jumpered to VCC) | Connect to VCC |
| **VCC** | Power Supply | 3.3V |
| **GND** | Ground | GND |
| **SCL** | I2C Clock | GPIO 22 |
| **SDA** | I2C Data | GPIO 21 |
| **INT** | Interrupt Output (Active Low when gesture detected) | Any digital GPIO (e.g., GPIO 19) |

### Recommended Libraries
* **Adafruit APDS9960 Library**
* **SparkFun APDS9960 RGB and Gesture Sensor**

### Arduino / ESP32 Sample Code (Gesture Detection)
```cpp
#include "Adafruit_APDS9960.h"

Adafruit_APDS9960 apds;

void setup() {
  Serial.begin(115200);

  if(!apds.begin()){
    Serial.println("failed to initialize device! Please check your wiring.");
    while (1);
  }
  Serial.println("APDS-9960 initialized.");

  // Enable gesture engine
  apds.enableGesture(true);
}

void loop() {
  // Read gesture (returns APDS9960_DOWN, APDS9960_UP, APDS9960_LEFT, APDS9960_RIGHT)
  uint8_t gesture = apds.readGesture();
  
  if (gesture == APDS9960_DOWN) {
    Serial.println("v DOWN v");
  } else if (gesture == APDS9960_UP) {
    Serial.println("^ UP ^");
  } else if (gesture == APDS9960_LEFT) {
    Serial.println("< LEFT <");
  } else if (gesture == APDS9960_RIGHT) {
    Serial.println("> RIGHT >");
  }
}
```
