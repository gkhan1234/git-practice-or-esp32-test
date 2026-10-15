# Biometric & Health Sensors Reference Guide

This document contains comprehensive details, connection schematics, logic level requirements, and sample code for popular biometric and health monitoring sensors used with Arduino and ESP32 microcontrollers.

---

<a name="max30102"></a>
## MAX30102 / MAX30100: Pulse Oximetry & Heart Rate

The MAX30102 is an integrated pulse oximetry and heart-rate monitor sensor module. It includes internal LEDs, photodetectors, optical elements, and low-noise electronics with ambient light rejection. It is designed to measure blood oxygen saturation ($Sp\text{O}_2$) and heart rate from a finger or wrist.

### Technical Specifications
* **Operating Voltage (Chip):** 1.8V (Vdd) and 3.3V (Vled). Breakout boards generally include 3.3V/5V regulators and on-board level shifters; power via 3.3V or 5V.
* **Logic Level:** 3.3V
* **Interface:** I2C (Address `0x57`)
* **Wavelengths:** Red (660nm) and Infrared (880nm) LEDs

### Typical Pinout

| Pin Name | Description | Connection (ESP32) | Connection (Arduino Uno) |
| :--- | :--- | :--- | :--- |
| **VIN** | Power Supply | 3.3V (Recommended) | 5V / 3.3V |
| **GND** | Ground | GND | GND |
| **SCL** | I2C Clock | GPIO 22 | Pin A5 |
| **SDA** | I2C Data | GPIO 21 | Pin A4 |
| **INT** | Interrupt Output (Active Low) | Any digital GPIO (Optional) | Any digital GPIO (Optional) |

### Recommended Libraries
* **SparkFun MAX3010x Pulse Oximeter** (High-level library; includes SpO2 and heart-rate tracking algorithms)

### Arduino / ESP32 Sample Code
```cpp
#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"

MAX30105 particleSensor;

const byte RATE_SIZE = 4; // Increase for more averaging
byte rates[RATE_SIZE]; // Array of heart rates
byte rateSpot = 0;
long lastBeat = 0; // Time at which the last beat occurred

float beatsPerMinute;
int beatAvg;

void setup() {
  Serial.begin(115200);

  // Initialize sensor
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 was not found. Please check wiring/power.");
    while (1);
  }

  particleSensor.setup(); // Configure sensor with default settings
  particleSensor.setLEDMode(2); // Red + IR active (needed for heart rate)
  particleSensor.setPulseAmplitudeRed(0x0A); // Turn Red LED low (indicates active)
  particleSensor.setPulseAmplitudeIR(0x0A); // Turn IR LED low
}

void loop() {
  long irValue = particleSensor.getIR();

  if (checkForBeat(irValue) == true) {
    // We sensed a beat!
    long delta = millis() - lastBeat;
    lastBeat = millis();

    beatsPerMinute = 60 / (delta / 1000.0);

    if (beatsPerMinute < 255 && beatsPerMinute > 20) {
      rates[rateSpot++] = (byte)beatsPerMinute; // Store this reading in the array
      rateSpot %= RATE_SIZE; // Wrap variable

      // Take average of readings
      beatAvg = 0;
      for (byte x = 0 ; x < RATE_SIZE ; x++)
        beatAvg += rates[x];
      beatAvg /= RATE_SIZE;
    }
  }

  Serial.print("IR: ");
  Serial.print(irValue);
  Serial.print(" | BPM: ");
  Serial.print(beatsPerMinute);
  Serial.print(" | Avg BPM: ");
  Serial.println(beatAvg);
}
```

---

<a name="ad8232"></a>
## AD8232: Single Lead Heart Rate ECG Monitor

The AD8232 is an integrated signal conditioning block for ECG and other biopotential measurement applications. It is designed to extract, amplify, and filter small biopotential signals in the presence of noisy conditions, such as those created by motion or remote electrode placement.

### Technical Specifications
* **Operating Voltage:** 3.0V – 3.6V (3.3V recommended to reduce electrical line noise)
* **Output:** Analog signal (representing filtered amplified cardiac waveform)
* **Leads-Off Detection:** Integrated comparator outputs (`LO+` and `LO-` pins) go HIGH if an electrode pad becomes detached from the body.

### Electrical Isolation Safety Warning
> [!CAUTION]
> **CRITICAL ELECTRICAL ISOLATION SAFETY WARNING**
>
> When using the AD8232 with direct skin contact electrodes:
> 1. **NEVER power your microcontroller from mains electricity** (e.g. wall adapter, USB cable connected to a charging computer).
> 2. **ALWAYS isolate the system** by powering the microcontroller from a battery bank, single battery cells (LiPo, AA), or by unplugging your laptop charger and running the computer entirely on battery power.
> 3. Failure to follow this warning could expose the user to electric shock in the event of a power supply failure.

### Typical Pinout

| Pin Name | Description | Connection (Arduino / ESP32) |
| :--- | :--- | :--- |
| **3.3V** | Power Supply | 3.3V (Do **not** use 5V to avoid damage and minimize 60Hz noise) |
| **GND** | Ground | GND |
| **OUTPUT** | Amplified Analog Output | Analog Input pin (e.g., ESP32 GPIO 36 / Pin A0) |
| **LO+** | Leads-Off Detector Plus | Digital GPIO (e.g., GPIO 26) |
| **LO-** | Leads-Off Detector Minus | Digital GPIO (e.g., GPIO 25) |
| **SDN** | Shutdown Pin (Active Low) | Pull HIGH or leave disconnected for normal operation |

### Recommended Libraries
* **No Library Required**: Raw analog readings are plotted using the **Arduino Serial Plotter** to display the ECG waveform.

### Electrode Pad Placement Guide
* **RA (Right Arm / Red)**: Position near the right shoulder/clavicle.
* **LA (Left Arm / Yellow)**: Position near the left shoulder/clavicle.
* **RL (Right Leg / Green)**: Position on the right lower abdomen (reference ground).

### Arduino / ESP32 Sample Code
```cpp
const int loPlusPin = 26;
const int loMinusPin = 25;
const int ecgAnalogPin = 36; // ADC1 channel (GPIO 36 / VP)

void setup() {
  Serial.begin(115200);
  pinMode(loPlusPin, INPUT); // Setup leads-off detection
  pinMode(loMinusPin, INPUT);
}

void loop() {
  // If leads are disconnected, plot a flat line (0)
  if ((digitalRead(loPlusPin) == 1) || (digitalRead(loMinusPin) == 1)) {
    Serial.println(0);
  } else {
    // Read the analog ECG value
    int ecgVal = analogRead(ecgAnalogPin);
    
    // Output to Serial (use Serial Plotter to view ECG wave)
    Serial.println(ecgVal);
  }
  
  // High sample rate (approx. 200-250Hz) for smooth ECG plotting
  delay(4); 
}
```

---

<a name="pulse_sensor"></a>
## Optical Pulse Sensor

This is a plug-and-play heart-rate sensor designed for Arduino and ESP32. It uses an infrared LED and a phototransistor to measure blood volume changes in a finger or earlobe (photoplethysmography).

### Technical Specifications
* **Operating Voltage:** 3.0V – 5.5V (3.3V for ESP32, 5V for Arduino)
* **Output:** Analog (voltage varies with blood pulses)

### Typical Pinout

| Wire Color | Pin Name | Description | Connection (ESP32) | Connection (Arduino Uno) |
| :--- | :--- | :--- | :--- | :--- |
| **Red** | **+** | Power Supply | 3.3V | 5V |
| **Black** | **-** | Ground | GND | GND |
| **Purple** | **S** | Analog Signal | ADC Pin (e.g., GPIO 35) | Pin A0 |

### Recommended Libraries
* **PulseSensor Playground** (Handles noise filtering, heartbeat detection algorithms, and interrupts)

### Arduino / ESP32 Sample Code
```cpp
#define USE_ARDUINO_INTERRUPTS false
#include <PulseSensorPlayground.h>

const int PulseWire = 35; // Pulse Sensor PURPLE wire connected to GPIO 35
const int Threshold = 550; // Determine which Signal to "count as a beat" and which to ignore

PulseSensorPlayground pulseSensor;

void setup() {
  Serial.begin(115200);

  // Configure the PulseSensor object
  pulseSensor.analogInput(PulseWire);
  pulseSensor.setThreshold(Threshold);

  if (pulseSensor.begin()) {
    Serial.println("PulseSensor initialized successfully!");
  }
}

void loop() {
  int myBPM = pulseSensor.getBeatsPerMinute();

  if (pulseSensor.sawStartOfBeat()) { // If a heartbeat was detected
    Serial.print("♥  Heart Beat Detected! BPM: ");
    Serial.println(myBPM);
  }

  delay(20); // Short delay to prevent CPU flooding
}
```
