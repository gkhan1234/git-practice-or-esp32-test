# Arduino & ESP32 Sensor Library

Welcome to your offline Arduino and ESP32 Sensor Library! This repository acts as a detailed, ongoing reference for connecting, programming, and using various sensors in physical computing projects.

## Logic Levels & Electrical Safety Guidelines

Before connecting any sensor, please keep these critical hardware guidelines in mind:

### 1. ESP32 is 3.3V Logic Only
Unlike traditional 5V Arduino boards (like the Uno, Nano, and Mega), the **ESP32 runs on 3.3V logic and is NOT 5V tolerant on its GPIO pins**. 
* **3.3V Sensors:** Safe to connect directly.
* **5V Sensors with Analog Output:** Can be read by ESP32 ADC, but the input must not exceed 3.3V. Use a voltage divider (e.g., 10kΩ and 20kΩ resistors) to scale the 0–5V analog signal down to 0–3.3V.
* **5V Sensors with Digital/I2C/SPI Output:** You **must** use a bi-directional logic level shifter (like the BSS138 chip breakouts) to step up/down the digital signals, or risk damaging your ESP32.

### 2. Decoupling Capacitors
High-current events (like ESP32 Wi-Fi transmission or sensor heating elements) can cause voltage dips that lead to sensor resets or noisy readings.
* **Tip:** Connect a 10µF to 100µF electrolytic capacitor across the VCC and GND lines close to the sensor.

### 3. Medical / Biometric Sensor Safety
> [!CAUTION]
> **ELECTRICAL ISOLATION WARNING**: When using biometric sensors with direct contact (such as the AD8232 ECG), **never** power your microcontroller from mains electricity (e.g., a wall adapter or a USB cable plugged into a computer that is charging from the wall). Always power the system from a battery pack (like a USB power bank or LiPo cell) or run your laptop entirely on battery power while electrodes are attached to a person.

---

## Sensor Index Master Table

| Sensor Name | Category | Protocol | Voltage | ESP32 Logic Level | Details |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DHT11 / DHT22** | Environmental | Proprietary 1-Wire | 3.3V – 5.5V | 3.3V Safe (Power with 3.3V) | [View Profile](sensors/environmental.md#dht22) |
| **BME280 / BMP280** | Environmental | I2C / SPI | 1.7V – 3.6V (Chip) | 3.3V Safe | [View Profile](sensors/environmental.md#bme280) |
| **DS18B20** | Environmental | Dallas 1-Wire | 3.0V – 5.5V | 3.3V Safe (Power with 3.3V) | [View Profile](sensors/environmental.md#ds18b20) |
| **MQ-2 / MQ-135** | Environmental | Analog / Digital | 5V | **Warning: 5V Analog (Requires Voltage Divider)** | [View Profile](sensors/environmental.md#mq_series) |
| **SGP30** | Environmental | I2C | 1.8V / 3.3V | 3.3V Safe | [View Profile](sensors/environmental.md#sgp30) |
| **AHT20** | Environmental | I2C | 2.0V – 5.5V | 3.3V Safe | [View Profile](sensors/environmental.md#aht20) |
| **MPU6050** | Motion & Position | I2C | 3.3V – 5.0V | 3.3V Safe | [View Profile](sensors/motion_position.md#mpu6050) |
| **HC-SR04 / HC-SR04P**| Motion & Position | Digital Trigger/Echo | 5V (SR04) / 3.3V (SR04P) | **Warning: 5V Echo on SR04 (Requires Voltage Divider)** | [View Profile](sensors/motion_position.md#hc_sr04) |
| **VL53L0X / VL53L1X**| Motion & Position | I2C | 2.8V (Chip) / 3.3V–5V (Board) | 3.3V Safe | [View Profile](sensors/motion_position.md#vl53l0x) |
| **PIR HC-SR501 / AM312**| Motion & Position| Digital (High/Low) | 5V–20V (SR501) / 3V–5V (AM312)| 3.3V Safe (Output is always 3.3V) | [View Profile](sensors/motion_position.md#pir) |
| **Rotary Encoder (EC11)**| Motion & Position| Quadrature Digital | 3.3V / 5.0V | 3.3V Safe | [View Profile](sensors/motion_position.md#rotary_encoder) |
| **ADXL345** | Motion & Position | I2C / SPI | 2.0V – 3.6V | 3.3V Safe | [View Profile](sensors/motion_position.md#adxl345) |
| **HMC5883L / QMC5883L**| Motion & Position| I2C | 2.1V – 3.6V | 3.3V Safe | [View Profile](sensors/motion_position.md#qmc5883l) |
| **MAX30102 / MAX30100**| Biometric & Health| I2C | 1.8V (Chip) / 3.3V (Board) | 3.3V Safe | [View Profile](sensors/biometric_health.md#max30102) |
| **AD8232** | Biometric & Health| Analog | 3.3V | 3.3V Safe | [View Profile](sensors/biometric_health.md#ad8232) |
| **Pulse Sensor** | Biometric & Health| Analog | 3.0V – 5.5V | 3.3V Safe (Power with 3.3V) | [View Profile](sensors/biometric_health.md#pulse_sensor) |
| **LDR (Photoresistor)**| Optical & Light | Analog | 3.3V – 5.0V | 3.3V Safe (When wired to 3.3V divider) | [View Profile](sensors/optical_light.md#ldr) |
| **BH1750** | Optical & Light | I2C | 3.0V – 5.0V | 3.3V Safe | [View Profile](sensors/optical_light.md#bh1750) |
| **TCS3200** | Optical & Light | Digital (Frequency Out)| 2.7V – 5.5V | **Warning: 5V Logic (Requires Level Shifting)** | [View Profile](sensors/optical_light.md#tcs3200) |
| **APDS-9960** | Optical & Light | I2C | 2.4V – 3.6V | 3.3V Safe | [View Profile](sensors/optical_light.md#apds9960) |
| **KY-037 / KY-038** | Acoustic & Sound | Analog & Digital | 3.3V – 5.0V | 3.3V Safe | [View Profile](sensors/acoustic_sound.md#ky038) |
| **MAX4466 / MAX9814** | Acoustic & Sound | Analog | 2.7V – 5.5V | 3.3V Safe (Power with 3.3V) | [View Profile](sensors/acoustic_sound.md#max4466) |
| **INMP441** | Acoustic & Sound | I2S Digital | 1.8V – 3.3V | 3.3V Safe | [View Profile](sensors/acoustic_sound.md#inmp441) |

---

## Motor & Driver Index Master Table

| Motor Name | Category | Control Protocol | Power Voltage | ESP32 Logic Level | Details |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SG90 / MG996R** | Hobby Servo | PWM (50Hz) | 4.8V – 6.0V | 3.3V Signal Compatible (Requires External Power) | [View Profile](motors/motors.md#servo) |
| **DC TT / 130 Motors** | DC Brushed Motor | PWM (via H-Bridge) | 3.0V – 12.0V | **Warning: Requires Driver (TB6612FNG recommended)** | [View Profile](motors/motors.md#dc_brushed) |
| **28BYJ-48 Stepper** | Unipolar Stepper | 4-Phase Digital | 5.0V | 3.3V Logic Compatible (via ULN2003 driver) | [View Profile](motors/motors.md#unipolar_stepper) |
| **NEMA 17 Stepper** | Bipolar Stepper | STEP / DIR (via Driver)| 8.0V – 35.0V | 3.3V Logic Compatible (via A4988 / DRV8825) | [View Profile](motors/motors.md#bipolar_stepper) |
| **A2212 BLDC Motor** | Brushless DC (BLDC)| PWM (via ESC) | 7.4V – 11.1V | 3.3V Signal Compatible (via ESC) | [View Profile](motors/motors.md#bldc) |
| **Coin Vibration Motor**| Vibration Motor | Digital (via Transistor)| 3.0V | **Warning: Requires Transistor Circuit (No direct GPIO)** | [View Profile](motors/motors.md#vibration) |

---

## Motor Controller Index Master Table

| Controller Name | Controller Type | Control Protocol | Operating Limits | ESP32 Logic Level | Details |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TB6612FNG** | Dual H-Bridge MOSFET | PWM & Dir Pins | VM: 15V / 1.2A | 3.3V Native (VCC 2.7V–5.5V) | [View Profile](motors/controllers.md#tb6612fng) |
| **L298N Board** | Dual H-Bridge BJT | PWM & Dir Pins | VM: 5V–35V / 2A | 3.3V Signal Compatible (VCC 5V) | [View Profile](motors/controllers.md#l298n) |
| **L9110S** | Dual H-Bridge MOSFET | PWM & Dir Pins | VM: 2.5V–12V / 0.8A | 3.3V Signal Compatible (No separate VCC) | [View Profile](motors/controllers.md#l9110s) |
| **BTS7960** | High-Current H-Bridge | PWM & Enable Pins | VM: 5.5V–27V / 43A | 3.3V Signal Compatible (VCC 5V) | [View Profile](motors/controllers.md#bts7960) |
| **L293D** | Quad Half-H Driver IC | PWM & Dir Pins | VM: 4.5V–36V / 0.6A | 3.3V Signal Compatible (VCC 5V) | [View Profile](motors/controllers.md#l293d) |
| **A4988** | Bipolar Stepper Driver| STEP / DIR | VMOT: 8V–35V / 2A | 3.3V Native (VDD 3.0V–5.5V) | [View Profile](motors/controllers.md#a4988) |
| **DRV8825** | Bipolar Stepper Driver| STEP / DIR | VMOT: 8.2V–45V / 2.5A| 3.3V Native (VDD 3.0V–5.5V) | [View Profile](motors/controllers.md#drv8825) |
| **TMC2209** | Silent Stepper Driver | STEP/DIR & UART | VMOT: 4.75V–29V / 2.8A| 3.3V Native (VIO 3.0V–5.5V) | [View Profile](motors/controllers.md#tmc2209) |
| **ULN2003** | Darlington Array | 4-Phase Digital | VCC: 50V / 500mA | 3.3V Signal Compatible | [View Profile](motors/controllers.md#uln2003) |
| **PCA9685** | 16-Channel PWM Driver | I2C Protocol | V+: 6V max (Servos) | 3.3V Native (VCC 2.3V–5.5V) | [View Profile](motors/controllers.md#pca9685) |

---

## General Troubleshooting Checklist

1. **Check Common Grounds:** Ensure the ground (GND) of your sensor/driver and your ESP32/Arduino are connected. Without a common ground, communication protocols and control signals will fail.
2. **Verify I2C Addresses:** If an I2C device isn't communicating, run an I2C scanner sketch to verify if the microcontroller detects the device's address (commonly `0x76` or `0x77` for BME280, `0x68` for MPU6050).
3. **Pull-Up Resistors:** Protocols like I2C require pull-up resistors on the SDA and SCL lines (usually 4.7kΩ to 10kΩ to VCC). Many breakout boards have these built-in, but raw chips do not.
4. **ADC Non-Linearity (ESP32):** Keep in mind that the ESP32's ADC is notoriously non-linear, especially below 0.1V and above 3.1V. If you need highly accurate analog readings, calibrate your ADC values or use an external ADC chip like the ADS1115.
5. **Motor Power Dips:** Motors draw significant stall current. If your ESP32 resets when the motor starts, you need a separate power supply for the motor and/or a large capacitor (e.g., 220µF–1000µF) across the motor driver power input.

