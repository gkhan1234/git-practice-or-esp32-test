# Motor Controllers & Drivers Reference Guide

This document contains comprehensive details, connection schematics, logic level requirements, and sample code for common motor controller chips and breakout boards (without motors) used with Arduino and ESP32 microcontrollers.

---

<a name="tb6612fng"></a>
## TB6612FNG: Dual H-Bridge MOSFET Driver

The TB6612FNG is a highly efficient, MOSFET-based dual H-bridge motor driver. It is superior to BJT drivers like the L298N because it exhibits very little voltage drop and generates negligible heat, making it perfect for battery-powered applications.

### Technical Specifications
* **Logic Voltage (VCC):** 2.7V – 5.5V (3.3V native compatible with ESP32)
* **Motor Voltage (VM):** 2.5V – 13.5V (Max 15V)
* **Output Current:** 1.2A continuous per channel (3.2A peak pulse)
* **Control Protocol:** PWM (for speed) and Digital Pins (for direction)

### Typical Pinout

| Pin Name | Pin Type | Description | Connection (ESP32) |
| :--- | :--- | :--- | :--- |
| **VM** | Power Input | Motor Power Supply | External Battery (+) |
| **VCC** | Power Input | Logic Power Supply | 3.3V |
| **GND** | Power Input | Common Ground | MCU GND & Battery (-) |
| **PWMA / PWMB**| Control Input | Channel A / B Speed (PWM) | GPIO 25 / GPIO 14 |
| **AIN1 / AIN2**| Control Input | Channel A Direction | GPIO 26 / GPIO 27 |
| **BIN1 / BIN2**| Control Input | Channel B Direction | GPIO 12 / GPIO 13 |
| **STBY** | Control Input | Standby Pin (Active High) | Connect to 3.3V or GPIO |
| **AO1 / AO2** | Output | Motor A Outputs | Connect to Motor A terminals |
| **BO1 / BO2** | Output | Motor B Outputs | Connect to Motor B terminals |

### ESP32 Speed Control Code
```cpp
const int pwma = 25;
const int ain1 = 26;
const int ain2 = 27;

void setup() {
  pinMode(pwma, OUTPUT);
  pinMode(ain1, OUTPUT);
  pinMode(ain2, OUTPUT);
}

void loop() {
  // Drive Forward at 50% Speed
  digitalWrite(ain1, HIGH);
  digitalWrite(ain2, LOW);
  analogWrite(pwma, 128); // 0 to 255 PWM
  delay(2000);

  // Stop (Brake)
  digitalWrite(ain1, HIGH);
  digitalWrite(ain2, HIGH);
  analogWrite(pwma, 0);
  delay(1000);
}
```

---

<a name="l298n"></a>
## L298N Board: Dual H-Bridge BJT Driver

The L298N is a classic BJT-based dual H-bridge motor driver. It is highly robust and features large heatsinks. However, its bipolar transistor junctions cause a significant internal voltage drop (~1.4V to 2V), which is converted to heat.

### Technical Specifications
* **Logic Voltage (VCC):** 5V (Board typically includes an onboard 5V regulator. If the 5V-Enable jumper is connected, the board generates its own 5V logic power from the motor power input)
* **Motor Voltage (VM):** 5V – 35V
* **Output Current:** 2.0A continuous per channel (3A peak pulse)
* **Control Pins:** Enable pins (ENA/ENB for PWM speed) and Input pins (IN1/IN2/IN3/IN4 for direction)

### Logic Level note for ESP32
Although the driver logic runs at 5V, its BJT inputs typically recognize a 3.3V HIGH signal from the ESP32. However, **never** wire the onboard regulator's 5V output directly to the ESP32's 3.3V supply pin.

### Typical Pinout

| Terminal / Pin | Pin Type | Description | Connection (Arduino / ESP32) |
| :--- | :--- | :--- | :--- |
| **12V Terminal** | Power Input | Motor Power Positive | External Battery (+) |
| **GND Terminal** | Power Input | Power and Signal Ground | Battery (-) & MCU GND |
| **5V Terminal** | Power Input/Output| Logic power (Out if jumper on) | If jumper on, leave open or power MCU |
| **OUT1 / OUT2** | Power Output | Motor A Outputs | Motor A Terminals |
| **OUT3 / OUT4** | Power Output | Motor B Outputs | Motor B Terminals |
| **ENA / ENB** | Control Input | Enable Channel A / B (PWM) | Keep Jumper on (Full Speed) or MCU PWM |
| **IN1 / IN2** | Control Input | Channel A Direction Input | MCU Digital GPIOs |
| **IN3 / IN4** | Control Input | Channel B Direction Input | MCU Digital GPIOs |

### Arduino Sample Code (Direct Control)
```cpp
const int enA = 9;  // PWM pin
const int in1 = 8;
const int in2 = 7;

void setup() {
  pinMode(enA, OUTPUT);
  pinMode(in1, OUTPUT);
  pinMode(in2, OUTPUT);
}

void loop() {
  // Spin Motor Forward at 70% Speed
  digitalWrite(in1, HIGH);
  digitalWrite(in2, LOW);
  analogWrite(enA, 180);
  delay(3000);
  
  // Coast to Stop
  digitalWrite(in1, LOW);
  digitalWrite(in2, LOW);
  delay(1000);
}
```

---

<a name="l9110s"></a>
## L9110S: Dual H-Bridge Mini Driver

The L9110S (or HG7881) is a miniature dual-channel H-bridge driver chip designed for small DC motors or a unipolar/bipolar stepper motor. Its miniature DIP/SOP-8 breakout board is commonly used in miniature chassis and robot toys.

### Technical Specifications
* **Supply Voltage (Motor & Logic):** 2.5V – 12V (Both the motor and logic share this power rail)
* **Output Current:** 800mA continuous per channel (1.5A peak pulse)
* **Control Interface:** 2 pins per channel (IA & IB). Speed is controlled by sending a PWM signal to one pin and setting the other pin LOW.

### Control Truth Table (Channel A)

| A-IA Pin | A-IB Pin | Motor Action |
| :--- | :--- | :--- |
| **LOW** | **LOW** | Motor Stopped |
| **HIGH** | **LOW** | Motor Spins Forward (Full Speed) |
| **PWM** | **LOW** | Motor Spins Forward (Variable Speed) |
| **LOW** | **HIGH** | Motor Spins Reverse (Full Speed) |
| **LOW** | **PWM** | Motor Spins Reverse (Variable Speed) |
| **HIGH** | **HIGH** | Motor Stopped (Active Braking) |

### Typical Pinout

| Pin Name | Pin Type | Description | Connection |
| :--- | :--- | :--- | :--- |
| **B-IA / B-IB** | Control Input | Channel B Control Pins | MCU Digital GPIOs |
| **A-IA / A-IB** | Control Input | Channel A Control Pins | MCU Digital GPIOs |
| **VCC** | Power Input | Shared Motor & Logic Supply | External Battery (+) |
| **GND** | Power Input | Common Ground | MCU GND & Battery (-) |
| **MOTOR A** | Output | Channel A Outputs | Motor A Terminals |
| **MOTOR B** | Output | Channel B Outputs | Motor B Terminals |

### Arduino / ESP32 Sample Code
```cpp
const int iaPin = 5;  // PWM capable pin
const int ibPin = 18; // PWM capable pin

void setup() {
  pinMode(iaPin, OUTPUT);
  pinMode(ibPin, OUTPUT);
}

void loop() {
  // Forward Speed Ramp
  digitalWrite(ibPin, LOW);
  for (int speed = 0; speed <= 255; speed++) {
    analogWrite(iaPin, speed);
    delay(10);
  }
  delay(1000);
  
  // Brake
  digitalWrite(iaPin, HIGH);
  digitalWrite(ibPin, HIGH);
  delay(1000);
}
```

---

<a name="bts7960"></a>
## BTS7960: High-Current (43A) Single H-Bridge Driver

The BTS7960 is an integrated high-power half-bridge driver board utilizing two separate chips to form a full H-bridge. It includes thermal protection, overcurrent protection, and is designed to drive large high-torque DC motors (like wheelchair motors or heavy-duty actuators).

### Technical Specifications
* **Logic Voltage (VCC):** 5.0V (Logic outputs of BTS7960 are 5V, but inputs accept 3.3V logic signals)
* **Motor Voltage (VM):** 5.5V – 27V
* **Output Current:** up to 43A peak (Requires passive heat-sinking; continuous up to 15A–20A)
* **Control Pins:** Left & Right PWM (LPWM/RPWM) and Left & Right Enable (LEN/REN).

### Typical Pinout

| Pin Name | Pin Type | Description | Connection (ESP32) |
| :--- | :--- | :--- | :--- |
| **VCC** | Power Input | Logic Supply (5V) | 5V (From MCU or Ext Regulator) |
| **GND** | Power Input | Logic Ground | MCU GND |
| **R_EN / L_EN**| Control Input | Right & Left Enable (Active High) | Pull to VCC to enable, or connect to GPIO |
| **RPWM** | Control Input | Right PWM Direction / Speed | PWM GPIO (e.g., GPIO 25) |
| **LPWM** | Control Input | Left PWM Direction / Speed | PWM GPIO (e.g., GPIO 26) |
| **R_IS / L_IS**| Analog Output | Current Sensation (Diagnostic) | Leave open or connect to ADC (Optional) |
| **B+ / B-** | Power Input | High-Current Motor Power | Heavy gauge Battery (+) & (-) |
| **M+ / M-** | Power Output | High-Current Motor Output | Heavy gauge Motor Terminals |

### Arduino / ESP32 Sample Code
```cpp
const int rpwmPin = 25;
const int lpwmPin = 26;
const int enablePin = 27; // Joint R_EN and L_EN pin

void setup() {
  pinMode(rpwmPin, OUTPUT);
  pinMode(lpwmPin, OUTPUT);
  pinMode(enablePin, OUTPUT);
  
  digitalWrite(enablePin, HIGH); // Enable the driver
}

void loop() {
  // Spin Clockwise at 50% Power
  analogWrite(rpwmPin, 128);
  analogWrite(lpwmPin, 0);
  delay(3000);
  
  // Hard Brake
  analogWrite(rpwmPin, 0);
  analogWrite(lpwmPin, 0);
  delay(1000);
}
```

---

<a name="l293d"></a>
## L293D: Quad Half-H Driver IC

The L293D is a quadruple high-current half-H driver designed to provide bidirectional drive currents up to 600mA at voltages from 4.5V to 36V. It is commonly configured as a dual H-bridge to run two DC motors, or as a single stepper driver.

### Technical Specifications
* **Logic Supply (VCC1):** 4.5V – 7.0V (Typically 5V)
* **Motor Supply (VCC2):** 4.5V – 36.0V
* **Output Current:** 600mA continuous per channel (1.2A peak)
* **Diodes:** Onboard internal ESD/clamp diodes to handle inductive back-EMF spikes (unlike L293 which requires external diodes).

### Typical Pinout (16-Pin DIP IC)

```
            +---\/---+
  1,2EN  1  |        | 16  VCC1 (Logic 5V)
    1A   2  |        | 15  4A
    1Y   3  |        | 14  4Y (Motor Output 4)
   GND   4  |        | 13  GND
   GND   5  |        | 12  GND
    2Y   6  |        | 11  3Y (Motor Output 3)
    2A   7  |        | 10  3A
  VCC2   8  |        |  9  3,4EN
            +--------+
```

| Pin Pinout | Description | Connection (Arduino) |
| :--- | :--- | :--- |
| **VCC1 (16)** | Logic Power Supply | 5V |
| **VCC2 (8)** | Motor Power Supply | External Battery (+) |
| **GND (4,5,12,13)**| Heat-sink Ground | MCU GND & Battery (-) |
| **1A, 2A / 3A, 4A**| Inputs (Digital Logic) | MCU GPIO Pins |
| **1Y, 2Y / 3Y, 4Y**| Outputs (Motor Drives)| Motor Terminals |
| **1,2EN / 3,4EN**| Enable Pins (Active High) | Pull HIGH or MCU PWM Pin |

---

<a name="a4988"></a>
## A4988: Bipolar Stepper Driver (StepStick)

The A4988 is a complete microstepping motor driver with built-in translator for easy operation. It is designed to operate bipolar stepper motors in full-, half-, quarter-, eighth-, and sixteenth-step modes.

### Technical Specifications
* **Logic Voltage (VDD):** 3.0V – 5.5V (3.3V native compatible)
* **Motor Voltage (VMOT):** 8.0V – 35.0V
* **Output Current:** up to 2.0A (requires a heatsink and cooling fan; 1.0A without cooling)
* **Microstepping Jumper Settings (MS1, MS2, MS3):**

| MS1 | MS2 | MS3 | Microstep Resolution |
| :--- | :--- | :--- | :--- |
| **LOW** | **LOW** | **LOW** | Full Step (200 steps/rev) |
| **HIGH** | **LOW** | **LOW** | Half Step (400 steps/rev) |
| **LOW** | **HIGH** | **LOW** | Quarter Step (800 steps/rev)|
| **HIGH** | **HIGH** | **LOW** | Eighth Step (1600 steps/rev)|
| **HIGH** | **HIGH** | **HIGH**| Sixteenth Step (3200 steps/rev)|

---

<a name="drv8825"></a>
## DRV8825: Bipolar Stepper Driver

The DRV8825 is an alternative StepStick-compatible stepper motor driver. It features 1/32 microstepping and supports slightly higher currents and voltages than the A4988.

### Technical Specifications
* **Logic Voltage (VDD):** No separate logic power input! The DRV8825 regulates logic internally, but requires the STEP/DIR pins to match your MCU logic level (3.3V safe).
* **Motor Voltage (VMOT):** 8.2V – 45.0V
* **Output Current:** up to 2.5A (with adequate heatsink and cooling)
* **Microstepping Jumper Settings (MODE0, MODE1, MODE2):**

| MODE0 | MODE1 | MODE2 | Microstep Resolution |
| :--- | :--- | :--- | :--- |
| **LOW** | **LOW** | **LOW** | Full Step |
| **HIGH** | **LOW** | **LOW** | Half Step |
| **LOW** | **HIGH** | **LOW** | 1/4 Step |
| **HIGH** | **HIGH** | **LOW** | 1/8 Step |
| **LOW** | **LOW** | **HIGH** | 1/16 Step |
| **HIGH** | **LOW** | **HIGH** | 1/32 Step |

---

<a name="tmc2209"></a>
## TMC2208 / TMC2209: Silent Stepper Driver (UART)

Trinamic TMC2209 drivers feature advanced noise-reduction algorithms (StealthChop2) and resonance dampening (SpreadCycle). They also support **StallGuard4** (sensorless homing, which detects when the motor hits a physical barrier by measuring back-EMF) and **CoolStep** (dynamic current scaling).

### Technical Specifications
* **Logic Voltage (VIO):** 3.0V – 5.5V (3.3V native compatible)
* **Motor Voltage (VM):** 4.75V – 29.0V
* **Current:** up to 2.8A peak / 2.0A continuous
* **UART Serial Configuration:** Digital UART serial bus allows configuring current limits, microsteps, chopper modes, and diagnostics directly in code, bypassing physical jumpers or Vref potentiometers.

### Typical Pinout (UART Mode)

| Pin Name | Pin Type | Description | Connection (ESP32 UART Example) |
| :--- | :--- | :--- | :--- |
| **VIO** | Power Input | Logic Supply (3.3V) | 3.3V |
| **GND** | Power Input | Common Ground | MCU GND & Power Supply Ground |
| **VM** | Power Input | Motor Power Supply | External Power Positive (e.g. 12V/24V)|
| **STEP / DIR** | Control Input | Step/Direction control | GPIO 14 / GPIO 12 |
| **PDN_UART** | Digital Serial | UART Serial interface | Hardware Serial TX/RX (via 1kΩ resistor) |
| **DIAG** | Output | StallGuard / Interrupt trigger | Any digital GPIO (Optional) |

### Recommended Libraries
* **TMCStepper** by teemuatlut (Simplifies configuring Trinamic driver registers over UART)

### ESP32 UART Configuration Code
```cpp
#include <TMCStepper.h>

#define EN_PIN           25 // Enable pin
#define DIR_PIN          12 // Direction pin
#define STEP_PIN         14 // Step pin
#define SERIAL_PORT      Serial2 // ESP32 Hardware Serial 2 (GPIO 16 RX, GPIO 17 TX)
#define DRIVER_ADDRESS   0b00    // TMC2209 Driver Address

TMC2209Stepper driver(&SERIAL_PORT, 0.11f, DRIVER_ADDRESS); // 0.11 ohm sense resistor

void setup() {
  Serial.begin(115200);
  SERIAL_PORT.begin(115200); // Initialize UART port connected to driver
  
  pinMode(EN_PIN, OUTPUT);
  pinMode(STEP_PIN, OUTPUT);
  pinMode(DIR_PIN, OUTPUT);
  
  digitalWrite(EN_PIN, LOW); // Enable driver (Active Low)
  
  driver.begin();
  driver.toff(5);                 // Enable driver coils
  driver.rms_current(600);        // Set motor current to 600mA
  driver.microsteps(16);          // Set microstepping to 1/16
  driver.pwm_autoscale(true);     // Enable StealthChop auto-tuning
  driver.en_spreadCycle(false);   // False = StealthChop (Silent mode)
}

void loop() {
  // Step code or AccelStepper execution here
}
```

---

<a name="uln2003"></a>
## ULN2003: Darlington Transistor Array

The ULN2003 contains seven Darlington transistor pairs with common emitters and open-collector outputs. It acts as a digital high-voltage, high-current switch module, typically used to drive unipolar stepper motors (like the 28BYJ-48), relays, solenoid valves, and high-power LEDs.

### Technical Specifications
* **Output Collector Voltage:** up to 50.0V
* **Logic Pin Threshold:** 3.3V and 5.0V compatible (TTL/CMOS inputs connect directly to MCU GPIO)
* **Continuous Output Current:** 500mA per channel
* **Clamp Diodes:** Built-in transient suppression diodes for driving inductive loads.

### Schematic Representation (Single Channel)
```
  Digital Input (e.g., GPIO 19) ───[ 2.7kΩ Resistor ]───[ Darlington Transistor Base ]
                                                              │
                                                        Output Pin (Open Collector) ───[ Load (Relay Coil) ]─── VCC (5V-12V)
```

---

<a name="pca9685"></a>
## PCA9685: 16-Channel 12-Bit PWM I2C Driver

The PCA9685 is an I2C-controlled 16-channel LED/PWM controller. It has a built-in clock that allows it to generate PWM outputs completely independently of the microcontroller's CPU. It is the industry-standard breakout board for controlling up to 16 hobby servos or LED dimmers from just 2 microcontroller pins.

### Technical Specifications
* **Logic Voltage (VCC):** 2.3V – 5.5V (3.3V native compatible)
* **Servo Voltage (V+):** up to 6.0V (External high-current power rail for servos)
* **Interface:** I2C (Default address `0x40`. Address is configurable up to `0x7F` using solder bridge pads A0–A5, allowing up to 62 boards to be chained to control 992 PWM channels).

### Typical Pinout

| Pin Name | Pin Type | Description | Connection (ESP32) |
| :--- | :--- | :--- | :--- |
| **VCC** | Power Input | Logic power supply | 3.3V |
| **GND** | Power Input | Common Ground | MCU GND & Power Supply Ground |
| **SDA** | I2C Data | Serial Data | GPIO 21 |
| **SCL** | I2C Clock | Serial Clock | GPIO 22 |
| **OE** | Input | Output Enable (Active Low) | Pull LOW to enable, HIGH to disable outputs |
| **V+** | Power Input | Power supply for servos | External 5V–6V battery positive |

### Recommended Libraries
* **Adafruit PWM Servo Driver Library**

### Arduino / ESP32 Sample Code (Driving PCA9685 Servos)
```cpp
#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

// Initialize driver at default address 0x40
Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver();

// Servo pulse bounds (calibrated at 50Hz)
#define SERVOMIN  150 // Minimum pulse length count (out of 4096)
#define SERVOMAX  600 // Maximum pulse length count

void setup() {
  Serial.begin(115200);
  pwm.begin();
  pwm.setOscillatorFrequency(27000000); // Set oscillator frequency
  pwm.setPWMFreq(50); // Set standard hobby servo frequency (50Hz)
  delay(10);
}

void loop() {
  // Sweep servo on channel 0
  Serial.println("Sweeping channel 0...");
  for (uint16_t pulselen = SERVOMIN; pulselen < SERVOMAX; pulselen++) {
    pwm.setPWM(0, 0, pulselen);
    delay(2);
  }
  delay(500);
  
  for (uint16_t pulselen = SERVOMAX; pulselen > SERVOMIN; pulselen--) {
    pwm.setPWM(0, 0, pulselen);
    delay(2);
  }
  delay(500);
}
```
