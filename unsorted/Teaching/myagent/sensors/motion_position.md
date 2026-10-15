# Motion, Position & Distance Sensors Reference Guide

This document contains comprehensive details, connection schematics, logic level requirements, and sample code for popular motion, position, and distance sensors used with Arduino and ESP32 microcontrollers.

---

<a name="mpu6050"></a>
## MPU6050: 6-Axis Gyroscope & Accelerometer

The MPU6050 combines a 3-axis gyroscope, 3-axis accelerometer, and an onboard Digital Motion Processor (DMP) into a single I2C chip. It is widely used in drone stabilizers, gesture controllers, and self-balancing robots.

### Technical Specifications
* **Operating Voltage:** 3.3V – 5.0V (Breakouts typically have a 3.3V regulator; power via 5V or 3.3V)
* **Logic Level:** 3.3V (Safely connects directly to ESP32)
* **Default I2C Address:** `0x68` (Pin AD0 to GND) or `0x69` (Pin AD0 to VCC)
* **Range:** Accelerometer up to ±16g; Gyroscope up to ±2000 °/s

### Typical Pinout

| Pin Name | Description | Connection (ESP32) | Connection (Arduino Uno) |
| :--- | :--- | :--- | :--- |
| **VCC** | Power Supply | 3.3V / 5V | 5V / 3.3V |
| **GND** | Ground | GND | GND |
| **SCL** | I2C Clock | GPIO 22 | Pin A5 |
| **SDA** | I2C Data | GPIO 21 | Pin A4 |
| **XDA** | Auxiliary I2C Data (to connect external magnetometer) | Leave unconnected | Leave unconnected |
| **XCL** | Auxiliary I2C Clock | Leave unconnected | Leave unconnected |
| **AD0** | I2C Address Select Pin | GND = 0x68, VCC = 0x69 | GND = 0x68, VCC = 0x69 |
| **INT** | Interrupt Output pin | Any digital GPIO (optional) | Any digital GPIO (optional) |

### Recommended Libraries
* **Adafruit_MPU6050** (Simplifies readings; requires **Adafruit BusIO** and **Adafruit Unified Sensor**)
* **MPU6050** by Jeff Rowberg (Direct access to registers, supports onboard DMP processing)

### Arduino / ESP32 Sample Code
```cpp
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>

Adafruit_MPU6050 mpu;

void setup() {
  Serial.begin(115200);

  if (!mpu.begin()) {
    Serial.println("Failed to find MPU6050 chip!");
    while (1) { delay(10); }
  }
  Serial.println("MPU6050 Found!");

  // Configure Accelerometer Range
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  // Configure Gyroscope Range
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  // Configure Bandwidth filter
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
}

void loop() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  /* Print values */
  Serial.print("Accel X: "); Serial.print(a.acceleration.x);
  Serial.print(", Y: "); Serial.print(a.acceleration.y);
  Serial.print(", Z: "); Serial.print(a.acceleration.z);
  Serial.println(" m/s^2");

  Serial.print("Gyro X: "); Serial.print(g.gyro.x);
  Serial.print(", Y: "); Serial.print(g.gyro.y);
  Serial.print(", Z: "); Serial.print(g.gyro.z);
  Serial.println(" rad/s");

  delay(500);
}
```

---

<a name="hc_sr04"></a>
## HC-SR04 / HC-SR04P: Ultrasonic Distance

The HC-SR04 emits ultrasonic sound pulses at 40 kHz and measures the time (echo duration) it takes for the pulse to bounce off an object and return to the sensor, converting this time interval to a distance.

### Technical Specifications
* **Operating Voltage:** 
  * **HC-SR04 (Standard):** 5.0V only.
  * **HC-SR04P (or RCWL-1601):** 3.3V – 5.0V compatible.
* **Measurement Range:** 2cm to 400cm (Accuracy ±3mm)
* **Trigger Pulse Input:** 10µs TTL pulse
* **Echo Pulse Output:** TTL pulse width proportional to range

> [!WARNING]
> **ESP32 5V Echo Hazard**: The standard HC-SR04 outputs a **5V signal** on the **ECHO** pin. Connecting this directly to an ESP32 GPIO pin will damage it. You **must** scale the ECHO signal down to 3.3V using a voltage divider (e.g., 10kΩ resistor from ECHO to ESP32 pin, and 20kΩ resistor from ESP32 pin to Ground). Alternatively, use the **HC-SR04P** or **RCWL-1601** module, which runs natively at 3.3V.

### Typical Pinout

| Pin Name | Description | Connection (Arduino Uno) | Connection (ESP32 - Divider needed!) |
| :--- | :--- | :--- | :--- |
| **VCC** | Power Supply | 5V | 5V (Standard) / 3.3V (SR04P) |
| **TRIG** | Trigger input (sends pulse) | Digital Pin (e.g., Pin 9) | Digital GPIO (e.g., GPIO 5) |
| **ECHO** | Echo output (reads response) | Digital Pin (e.g., Pin 10) | Digital GPIO (e.g., GPIO 18) **via divider** |
| **GND** | Ground | GND | GND |

### Recommended Libraries
* **NewPing** by Tim Eckel (Efficiently manages trigger/echo timing and reduces lag/interrupt freezes)

### Arduino / ESP32 Sample Code (Without Library)
```cpp
const int trigPin = 5;
const int echoPin = 18;

void setup() {
  Serial.begin(115200);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
}

void loop() {
  // Clear the trigger pin
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  
  // Set the trigger pin HIGH for 10 microseconds
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  // Read the echo pin (returns duration of pulse in microseconds)
  long duration = pulseIn(echoPin, HIGH);
  
  // Calculate the distance (Speed of sound is ~343 m/s or 0.0343 cm/us)
  // Distance = (Time * Speed) / 2 (accounting for round trip)
  float distanceCm = duration * 0.0343 / 2;
  
  if (distanceCm >= 400 || distanceCm <= 2) {
    Serial.println("Out of range");
  } else {
    Serial.print("Distance: ");
    Serial.print(distanceCm);
    Serial.println(" cm");
  }
  
  delay(500);
}
```

---

<a name="vl53l0x"></a>
## VL53L0X / VL53L1X: Time-of-Flight (ToF) Laser Distance

The VL53L0X is a laser-ranging sensor using Time-of-Flight (ToF) measurement. It houses an invisible infrared VCSEL (Vertical-Cavity Surface-Emitting Laser) source and a SPAD (Single-Photon Avalanche Diode) detector array. Unlike ultrasonic or IR reflectance sensors, it measures absolute distance independent of target color and reflectance.

### Technical Specifications
* **Operating Voltage (Chip):** 2.8V (Breakouts have 3.3V/5V regulators; power via 3.3V or 5V)
* **Logic Level:** 3.3V
* **Default I2C Address:** `0x29`
* **Range:** 
  * **VL53L0X:** Up to 200cm (2 meters)
  * **VL53L1X:** Up to 400cm (4 meters)

### Typical Pinout

| Pin Name | Description | Connection (ESP32) |
| :--- | :--- | :--- |
| **VIN** | Power Supply | 3.3V |
| **GND** | Ground | GND |
| **SCL** | I2C Clock | GPIO 22 |
| **SDA** | I2C Data | GPIO 21 |
| **XSHUT** | Shutdown pin (Active Low) | Digital Pin (Optional, pull HIGH to enable, pull LOW to shut down. Useful for changing I2C addresses dynamically when using multiple sensors) |
| **GPIO1** | Interrupt Output | Leave unconnected (Optional) |

### Recommended Libraries
* **Adafruit_VL53L0X**
* **VL53L0X** by Pololu

### Arduino / ESP32 Sample Code
```cpp
#include "Adafruit_VL53L0X.h"

Adafruit_VL53L0X lox = Adafruit_VL53L0X();

void setup() {
  Serial.begin(115200);

  // Initialize ToF Sensor
  if (!lox.begin()) {
    Serial.println(F("Failed to boot VL53L0X"));
    while(1);
  }
  Serial.println(F("VL53L0X API Simple Ranging demo."));
}

void loop() {
  VL53L0X_RangingMeasurementData_t measure;
    
  lox.rangingTest(&measure, false); // Pass 'true' to get debug data printout

  if (measure.RangeStatus != 4) {  // phase failures have value 4
    Serial.print("Distance (mm): "); 
    Serial.println(measure.RangeMilliMeter);
  } else {
    Serial.println(" out of range ");
  }
    
  delay(100);
}
```

---

<a name="pir"></a>
## PIR Motion Sensors: HC-SR501 / AM312

Passive Infrared (PIR) sensors detect heat signatures. When a warm body (human or animal) moves in front of the sensor, it detects the change in infrared radiation and sets its digital output pin HIGH.

### Technical Specifications
* **Operating Voltage:**
  * **HC-SR501:** 5.0V – 20.0V (Requires 5V to VCC, but outputs a 3.3V digital signal)
  * **AM312 (Mini PIR):** 3.0V – 5.0V (3.3V native compatible)
* **Output Signal:** Digital (3.3V Active High, 0V Low)
* **HC-SR501 Potentiometers:** 
  * **Sx (Sensitivity):** Adjusts detection range (3m to 7m).
  * **Tx (Delay):** Adjusts output latching time (3 seconds to 5 minutes).
* **Latching Trigger Modes (HC-SR501 Jumper):**
  * **Single Trigger (L):** Output goes HIGH once motion is detected and stays HIGH for the delay time, then goes LOW, even if motion continues.
  * **Repeatable Trigger (H - Default):** Output stays HIGH as long as motion continues.

### Typical Pinout

| Pin Name (HC-SR501) | Description | Connection (Arduino / ESP32) |
| :--- | :--- | :--- |
| **VCC** | Power Input | 5V (HC-SR501) / 3.3V (AM312) |
| **OUT** | Digital Output (3.3V logic) | Any digital pin (e.g., GPIO 27) |
| **GND** | Ground | GND |

### Recommended Libraries
* **No Library Required**: Read using standard digital GPIO inputs. Interrupts are recommended for lower power consumption.

### Arduino / ESP32 Sample Code (Interrupt Driven)
```cpp
const int pirPin = 27; // Pin connected to PIR sensor output
volatile bool motionDetected = false;

// ISR (Interrupt Service Routine) must be in IRAM for ESP32
void IRAM_ATTR detectMotion() {
  motionDetected = true;
}

void setup() {
  Serial.begin(115200);
  pinMode(pirPin, INPUT_PULLDOWN); // Pin pulled low until PIR goes high
  attachInterrupt(digitalPinToInterrupt(pirPin), detectMotion, RISING);
}

void loop() {
  if (motionDetected) {
    Serial.println("--- MOTION DETECTED! ---");
    motionDetected = false;
    // Wait a brief delay before accepting more triggers
    delay(2000); 
  }
}
```

---

<a name="rotary_encoder"></a>
## EC11 Rotary Encoder

The EC11 is a mechanical rotary encoder that provides a digital quadrature output representing rotation direction and step count. It also typically includes an integrated momentary push-button switch.

### Technical Specifications
* **Operating Voltage:** 3.3V – 5.0V
* **Interface:** Quadrature gray code (A and B signals shift phase by 90° depending on direction)

### Typical Pinout

| Pin Name | Description | Connection (ESP32) |
| :--- | :--- | :--- |
| **CLK (A)** | Encoder Phase A | Any digital GPIO (e.g., GPIO 14) |
| **DT (B)** | Encoder Phase B | Any digital GPIO (e.g., GPIO 12) |
| **SW** | Integrated push button switch | Any digital GPIO (e.g., GPIO 13) |
| **VCC** | Power Supply | 3.3V / 5V |
| **GND** | Ground | GND |

### Recommended Libraries
* **Encoder** by Paul Stoffregen (Highly optimized, uses pin interrupts)
* **RotaryEncoder** by Matthias Hertel

### Arduino / ESP32 Sample Code
```cpp
#include <Encoder.h>

// Connect CLK and DT to pins with interrupt capability
// On ESP32, all GPIO pins support interrupts.
Encoder myEnc(14, 12);
const int buttonPin = 13;
long oldPosition  = -999;

void setup() {
  Serial.begin(115200);
  pinMode(buttonPin, INPUT_PULLUP);
}

void loop() {
  long newPosition = myEnc.read();
  if (newPosition != oldPosition) {
    oldPosition = newPosition;
    Serial.print("Encoder Position: ");
    Serial.println(newPosition);
  }
  
  if (digitalRead(buttonPin) == LOW) {
    Serial.println("Encoder Switch Pressed!");
    delay(250); // Debounce delay
  }
}
```

---

<a name="adxl345"></a>
## ADXL345: 3-Axis Accelerometer

The ADXL345 is a small, thin, ultralow power, 3-axis accelerometer with high resolution (13-bit) measurement up to ±16g. Digital output data is formatted as 16-bit twos complement and is accessible through either a SPI or I2C digital interface.

### Technical Specifications
* **Operating Voltage:** 2.0V – 3.6V
* **Logic Level:** 3.3V
* **Interfaces:** I2C (Address `0x53` or `0x1D`) and SPI (3-wire or 4-wire)

### Typical Pinout (I2C breakout)

| Pin Name | Description | Connection (ESP32) |
| :--- | :--- | :--- |
| **VCC** | Power Supply | 3.3V |
| **GND** | Ground | GND |
| **SCL** | I2C Clock | GPIO 22 |
| **SDA** | I2C Data | GPIO 21 |
| **CS** | Chip Select | Connect to VCC to select I2C mode |
| **SDO** | I2C Address Select | GND = 0x53, VCC = 0x1D |

### Recommended Libraries
* **Adafruit ADXL345** (requires **Adafruit Unified Sensor**)

### Arduino / ESP32 Sample Code
```cpp
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_ADXL345_U.h>

Adafruit_ADXL345_Unified accel = Adafruit_ADXL345_Unified(12345);

void setup(void) {
  Serial.begin(115200);
  if(!accel.begin()) {
    Serial.println("Ooops, no ADXL345 detected ... Check your wiring!");
    while(1);
  }
  accel.setRange(ADXL345_RANGE_16_G);
}

void loop(void) {
  sensors_event_t event; 
  accel.getEvent(&event);
 
  Serial.print("X: "); Serial.print(event.acceleration.x); Serial.print("  ");
  Serial.print("Y: "); Serial.print(event.acceleration.y); Serial.print("  ");
  Serial.print("Z: "); Serial.print(event.acceleration.z); Serial.print("  ");
  Serial.println("m/s^2 ");
  delay(500);
}
```

---

<a name="qmc5883l"></a>
## HMC5883L / QMC5883L: 3-Axis Compass & Magnetometer

These are 3-axis digital magnetometers designed for low-field magnetic sensing. They are typically used to calculate compass headings.

### Technical Specifications
* **Operating Voltage:** 2.1V – 3.6V (Breakouts have 3.3V regulators)
* **Interface:** I2C 
* **Important Note:** The **HMC5883L** (Honeywell) and the **QMC5883L** (licensed/clone Chinese chip) are **NOT software compatible**. They use different I2C registers and different default I2C addresses:
  * **HMC5883L address:** `0x1E`
  * **QMC5883L address:** `0x0D`

### Typical Pinout

| Pin Name | Description | Connection (ESP32) |
| :--- | :--- | :--- |
| **VCC** | Power Supply | 3.3V |
| **GND** | Ground | GND |
| **SCL** | I2C Clock | GPIO 22 |
| **SDA** | I2C Data | GPIO 21 |

### Recommended Libraries
* **DFRobot_QMC5883** (for the QMC variant)
* **Adafruit HMC5883 Unified** (for the original HMC variant)

### Sample Code (QMC5883L Example)
```cpp
#include <Wire.h>

// Simple register configuration to read QMC5883L raw values without library
#define QMC5883L_ADDR 0x0D

void setup() {
  Serial.begin(115200);
  Wire.begin();
  
  // Set Control Register 1: continuous mode, 200Hz, 8G range, 512 oversampling
  Wire.beginTransmission(QMC5883L_ADDR);
  Wire.write(0x09);
  Wire.write(0x1D);
  Wire.endTransmission();
}

void loop() {
  int x, y, z;
  
  Wire.beginTransmission(QMC5883L_ADDR);
  Wire.write(0x00); // Start reading from register 0
  Wire.endTransmission();
  
  Wire.requestFrom(QMC5883L_ADDR, 6);
  if (Wire.available() >= 6) {
    x = Wire.read() | (Wire.read() << 8);
    y = Wire.read() | (Wire.read() << 8);
    z = Wire.read() | (Wire.read() << 8);
  }
  
  // Calculate raw heading in radians
  float heading = atan2(y, x);
  if(heading < 0) heading += 2*PI;
  float headingDegrees = heading * 180/M_PI;
  
  Serial.print("Heading: ");
  Serial.print(headingDegrees);
  Serial.println(" degrees");
  
  delay(500);
}
```
