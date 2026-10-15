# Motors & Drivers Reference Guide

This document contains comprehensive details, connection schematics, logic level requirements, and sample code for common motors and their driver ICs used with Arduino and ESP32 microcontrollers.

---

<a name="servo"></a>
## Hobby Servos (SG90 / MG996R)

Hobby servos are geared motors with a built-in feedback potentiometer and control board that allow precise angular position control (typically 0–180 degrees) using pulse-width modulation (PWM) at 50Hz.
* **SG90:** Lightweight plastic-gear micro servo. Great for small joints, locks, and pan-tilt mounts.
* **MG996R:** High-torque metal-gear standard servo. Excellent for robotics arms, steering gears, and heavier mechanical loads.

### Technical Specifications
* **Operating Voltage:** 4.8V – 6.0V (MG996R draws high current, up to 2.5A at stall!)
* **Control Signal:** PWM (50Hz frequency, pulse duration between 500µs and 2400µs defines angle)
* **Torque:** 
  * **SG90:** ~1.8 kg·cm
  * **MG996R:** ~10.0 kg·cm

> [!CAUTION]
> **Servo Power Spike Danger**: Under load or stall, servos draw more current than a microcontroller can supply. Attempting to power an MG996R (or even multiple SG90s) directly from the ESP32 or Arduino 5V pin will trigger brownouts, microchip resets, or permanently damage the board. **Always power servos from an external 5V–6V source and connect its GND to the microcontroller GND.**

### Typical Pinout (Standard Hobby Servo Connector)

| Wire Color | Pin Name | Description | Connection |
| :--- | :--- | :--- | :--- |
| **Brown (or Black)** | **GND** | Power & Signal Ground | Connect to External GND & MCU GND |
| **Red** | **VCC** | Motor Power Supply | Connect to External 5V–6V Power |
| **Orange (or Yellow)**| **Signal** | PWM Control Signal | Any MCU GPIO pin (e.g., GPIO 13 / Pin 9) |

### Recommended Libraries
* **Servo** (Built-in standard library for Arduino)
* **ESP32Servo** (Specifically optimized for ESP32; supports multi-channel hardware timers)

### Arduino / ESP32 Sample Code
```cpp
#if defined(ESP32)
#include <ESP32Servo.h>
#else
#include <Servo.h>
#endif

Servo myServo;
const int servoPin = 13; // Signal Pin

void setup() {
  Serial.begin(115200);
  
  // Allocate timers for ESP32Servo library compatibility
  #if defined(ESP32)
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  myServo.setPeriodHertz(50); // Standard 50hz servo frequency
  #endif
  
  // Attach the servo pin (Pulse width: SG90/MG996R usually 500us to 2400us)
  myServo.attach(servoPin, 500, 2400); 
}

void loop() {
  // Sweep from 0 to 180 degrees
  for (int pos = 0; pos <= 180; pos += 1) {
    myServo.write(pos);
    delay(15); // Wait for servo to reach position
  }
  
  // Sweep back from 180 to 0 degrees
  for (int pos = 180; pos >= 0; pos -= 1) {
    myServo.write(pos);
    delay(15);
  }
}
```

---

<a name="dc_brushed"></a>
## DC Brushed Motors (TT Gear Motor / 130 Toy Motor)

Standard DC motors spin continuously when a voltage is applied. Reversing polarity reverses rotation direction. Speed is regulated by scaling the average voltage using PWM. 
* **130 Toy Motor:** High speed, very low torque. Great for propellers or fans.
* **Yellow TT Gear Motor:** Geared down to provide higher torque and slower speed (typically 1:48 or 1:120 ratio). Ideal for wheeled mobile robots.

### Why H-Bridge Drivers Are Required
Microcontroller GPIO pins cannot supply the voltage (3V–12V) or current (hundreds of mA to Amps) required to run DC motors. They also cannot reverse polarity. An **H-Bridge driver** uses four internal switches (MOSFETs or Transistors) to control speed and direction.

### Driver Comparison: TB6612FNG vs. L298N
* **L298N:** Older BJT-transistor driver. Highly rugged, but has a large voltage drop (~1.4V to 2V lost as heat). If powering with 6V, the motor only gets ~4V. Has a bulky heatsink.
* **TB6612FNG:** Modern MOSFET-based driver. Extremely efficient (negligible voltage drop), runs cool, and has a small footprint. Highly recommended for 3.3V ESP32 projects.

### Typical Pinout: TB6612FNG Driver Board

| Pin Name | Description | Connection (ESP32) | Connection (Arduino Uno) |
| :--- | :--- | :--- | :--- |
| **VM** | Motor Power Supply | External Battery Positive (3V–13.5V) | External Battery Positive |
| **VCC** | Driver Logic Power | 3.3V | 5V |
| **GND** | Logic and Motor Ground | MCU GND & Battery Negative | MCU GND & Battery Negative |
| **AO1 / AO2** | Output Channel A (to Motor A) | Connect to Motor A terminals | Connect to Motor A terminals |
| **BO1 / BO2** | Output Channel B (to Motor B) | Connect to Motor B terminals | Connect to Motor B terminals |
| **PWMA** | Speed Control Motor A | PWM GPIO (e.g., GPIO 25) | PWM Pin (e.g., Pin 3) |
| **AIN1 / AIN2**| Direction Control Motor A | Digital GPIO (e.g., GPIO 26, 27) | Digital Pin (e.g., Pin 4, 5) |
| **PWMB** | Speed Control Motor B | PWM GPIO (e.g., GPIO 14) | PWM Pin (e.g., Pin 6) |
| **BIN1 / BIN2**| Direction Control Motor B | Digital GPIO (e.g., GPIO 12, 13) | Digital Pin (e.g., Pin 7, 8) |
| **STBY** | Standby control (Active High) | Pull to 3.3V or any GPIO (set HIGH)| Pull to 5V or any GPIO (set HIGH) |

### TB6612FNG Logic Control Table (Motor A)

| AIN1 | AIN2 | PWMA | Output (AO1, AO2) | Motor Action |
| :--- | :--- | :--- | :--- | :--- |
| **L** | **L** | *Any* | **L, L** | Short Brake (Hard Stop) |
| **H** | **L** | **H** | **H, L** | Forward (Full Speed) |
| **H** | **L** | **PWM** | **H, L** (Scaled) | Forward (Variable Speed)|
| **L** | **H** | **H** | **L, H** | Reverse (Full Speed) |
| **L** | **H** | **PWM** | **L, H** (Scaled) | Reverse (Variable Speed)|
| **H** | **H** | *Any* | **H, H** | Short Brake (Hard Stop) |

### Arduino / ESP32 Sample Code (Direct Control)
```cpp
// Motor A Control Pins
const int pwmaPin = 25; // PWM Speed Pin
const int ain1Pin = 26; // Direction Pin 1
const int ain2Pin = 27; // Direction Pin 2
const int stbyPin = 32; // Standby Pin (Must be HIGH to run)

void setup() {
  pinMode(pwmaPin, OUTPUT);
  pinMode(ain1Pin, OUTPUT);
  pinMode(ain2Pin, OUTPUT);
  pinMode(stbyPin, OUTPUT);

  digitalWrite(stbyPin, HIGH); // Enable H-Bridge
}

void loop() {
  // 1. Move Motor A Forward at 60% speed
  digitalWrite(ain1Pin, HIGH);
  digitalWrite(ain2Pin, LOW);
  analogWrite(pwmaPin, 150); // Range 0-255 (or 0-4095 on ESP32 depending on setup)
  delay(2000);

  // 2. Hard Brake Motor A
  digitalWrite(ain1Pin, HIGH);
  digitalWrite(ain2Pin, HIGH);
  analogWrite(pwmaPin, 0);
  delay(1000);

  // 3. Move Motor A Reverse at 80% speed
  digitalWrite(ain1Pin, LOW);
  digitalWrite(ain2Pin, HIGH);
  analogWrite(pwmaPin, 200);
  delay(2000);

  // 4. Hard Brake Motor A
  digitalWrite(ain1Pin, HIGH);
  digitalWrite(ain2Pin, HIGH);
  analogWrite(pwmaPin, 0);
  delay(1000);
}
```

---

<a name="unipolar_stepper"></a>
## Unipolar Stepper Motors (28BYJ-48 + ULN2003)

The 28BYJ-48 is a small, geared unipolar stepper motor. Unlike DC motors, it moves in discrete fractional rotational steps by energizing its internal electromagnetic coils in sequence. It features five wires: one common power line and four control phase lines.

### Technical Specifications
* **Operating Voltage:** 5V (Typically powered via 5V external supply)
* **Gear Ratio:** 1:64 (Internal gear reduction)
* **Step Angle:** 5.625° / 64 (Stated). Output shaft requires **2048 steps** in half-step mode or **4096 steps** in full-step mode for a complete 360° rotation.
* **Driver:** ULN2003 Darlington Transistor Array (Amplifies digital GPIO signals to handle coil current)

### Typical Pinout

| ULN2003 Driver Board Pin | Wire Color | Connection (Arduino / ESP32) |
| :--- | :--- | :--- |
| **IN1** | Blue (Coil A) | Digital GPIO (e.g., GPIO 19) |
| **IN2** | Pink (Coil B) | Digital GPIO (e.g., GPIO 18) |
| **IN3** | Yellow (Coil C)| Digital GPIO (e.g., GPIO 5) |
| **IN4** | Orange (Coil D)| Digital GPIO (e.g., GPIO 17) |
| **GND** | *N/A* | Connect to External GND & MCU GND |
| **VCC (or 5-12V)** | Red (Common VCC)| Connect to External 5V Power Source |

### Recommended Libraries
* **Stepper** (Built-in standard library; blocking operation)
* **AccelStepper** (Highly recommended; handles non-blocking acceleration and deceleration)

### Arduino / ESP32 Sample Code (Using AccelStepper)
```cpp
#include <AccelStepper.h>

// Motor Pin definitions (IN1, IN2, IN3, IN4 mapped to pins)
#define motorPin1 19
#define motorPin2 18
#define motorPin3 5
#define motorPin4 17

// AccelStepper expects pins in IN1-IN3-IN2-IN4 order for unipolar motors (4-wire mode)
AccelStepper stepper(AccelStepper::HALF4WIRE, motorPin1, motorPin3, motorPin2, motorPin4);

void setup() {
  stepper.setMaxSpeed(1000.0); // Maximum speed in steps per second
  stepper.setAcceleration(200.0); // Acceleration in steps/second^2
  stepper.moveTo(2048); // Move 180 degrees (half revolution in 4096 steps scale)
}

void loop() {
  // If the motor has reached its target position, reverse direction
  if (stepper.distanceToGo() == 0) {
    stepper.moveTo(-stepper.currentPosition());
  }
  
  // Non-blocking step executor. Must be called in loop() as fast as possible
  stepper.run(); 
}
```

---

<a name="bipolar_stepper"></a>
## Bipolar Stepper Motors (NEMA 17 + A4988 / DRV8825)

NEMA 17 refers to the physical frame dimensions of a bipolar stepper motor. These motors have two internal coils (4 wires) and are commonly used in 3D printers, CNC machines, and precision camera sliders.

### Technical Specifications
* **Steps per Revolution:** 200 (1.8° step angle)
* **Driver Interface:** **STEP / DIR** (Uses only two pins: pulse high on `STEP` to move one step, toggle `DIR` HIGH/LOW to set rotation direction)
* **Microstepping Resolution:**
  * **A4988:** Full, 1/2, 1/4, 1/8, 1/16 step (Configured via MS1, MS2, MS3 pins)
  * **DRV8825:** Full, 1/2, 1/4, 1/8, 1/16, 1/32 step

> [!IMPORTANT]
> **Vref Potentiometer Tuning**: Bipolar stepper drivers act as constant-current limiters. If you connect a NEMA 17 directly without calibrating the current limit, the driver or motor will burn out.
> * **Formula (A4988):** $I_{limit} = \frac{V_{ref}}{8 \times R_{sense}}$ (Typically $R_{sense} = 0.1\Omega$, so $V_{ref} = 0.8 \times I_{limit}$)
> * Measure the voltage between the metal casing of the potentiometer and Ground using a multimeter, and turn the screw carefully to set $V_{ref}$ to match your motor's rated phase current.

### Typical Pinout (A4988 Driver Module)

| A4988 Pin Name | Description | Connection (Arduino / ESP32) |
| :--- | :--- | :--- |
| **VDD** | Logic Power Supply | 3.3V (ESP32) or 5V (Arduino) |
| **GND** | Logic / Signal Ground | MCU GND |
| **VMOT** | Motor High Voltage Power | External Power Supply positive (8V–35V) |
| **GND (Motor)** | Motor Power Ground | External Supply Ground Negative |
| **1A / 1B** | Stepper Coil 1 (or Coil A) | Stepper Motor wire pair A |
| **2A / 2B** | Stepper Coil 2 (or Coil B) | Stepper Motor wire pair B |
| **STEP** | Input step trigger pulse | Any digital GPIO (e.g., GPIO 14) |
| **DIR** | Input direction select | Any digital GPIO (e.g., GPIO 12) |
| **RST / SLP** | Reset & Sleep pins | Connect together to enable driver |
| **EN / ENABLE** | Enable Pin (Active Low) | Pull LOW or leave disconnected to enable driver |

### Recommended Libraries
* **AccelStepper** (Industry standard for STEP/DIR drivers)

### Arduino / ESP32 Sample Code (A4988 Example)
```cpp
#include <AccelStepper.h>

const int stepPin = 14;
const int dirPin = 12;

// Initialize in "Driver" mode (2 pins: STEP, DIR)
AccelStepper stepper(AccelStepper::DRIVER, stepPin, dirPin);

void setup() {
  stepper.setMaxSpeed(800.0); // max steps per second
  stepper.setAcceleration(400.0); // acceleration steps/sec^2
  stepper.moveTo(400); // Rotate 2 full revolutions (400 steps)
}

void loop() {
  // Alternate rotating back and forth
  if (stepper.distanceToGo() == 0) {
    stepper.moveTo(-stepper.currentPosition());
  }
  
  stepper.run(); // Non-blocking step generator
}
```

---

<a name="bldc"></a>
## Brushless DC Motors (BLDC Motor + ESC)

Brushless DC (BLDC) motors offer high speed, efficiency, and reliability because they lack mechanical brushes. They are commonly used in RC planes, quadcopters, and electric vehicles. To spin, they require a 3-phase AC voltage sequence generated by an external **Electronic Speed Controller (ESC)**.

### Technical Specifications
* **ESC Interface:** Standard hobby servo PWM (50Hz frequency, 1000µs–2000µs pulse width defines speed/throttle).
* **Arming Sequence:** For safety, ESCs will not spin the motor until they receive a minimum "zero throttle" signal (typically 1000µs) for a few seconds upon boot-up.
* **Operating Voltage:** Typically 7.4V – 22.2V (2S to 6S Lithium Polymer batteries connected directly to ESC power inputs).

### Typical Pinout

| Connection | Terminal / Pin Name | Cable Color / Type | Connection Point |
| :--- | :--- | :--- | :--- |
| **Battery Power** | **V+ (Positive)** | Heavy gauge Red wire | Battery Positive |
| **Battery Power** | **V- (Negative)** | Heavy gauge Black wire | Battery Negative |
| **Motor Drive** | **Phases A, B, C**| 3 heavy gauge wires | Connect to BLDC motor's 3 wires (swap any 2 to reverse direction) |
| **Signal Cable** | **GND** | Black or Brown wire | MCU GND (Common Ground) |
| **Signal Cable** | **BEC 5V (Output)**| Red wire (usually outputs 5V to power MCU) | **Warning: Disconnect if MCU is powered via USB!** |
| **Signal Cable** | **Signal** | White or Orange wire | MCU Digital Output (e.g., GPIO 13) |

### Recommended Libraries
* **Servo** (Arduino)
* **ESP32Servo** (ESP32)

### Arduino / ESP32 Sample Code (ESC Calibration & Arming)
```cpp
#if defined(ESP32)
#include <ESP32Servo.h>
#else
#include <Servo.h>
#endif

Servo esc;
const int escPin = 13;

void setup() {
  Serial.begin(115200);
  
  #if defined(ESP32)
  ESP32PWM::allocateTimer(0);
  #endif
  
  esc.attach(escPin, 1000, 2000); // Standard ESC pulse bounds: 1000us (min) to 2000us (max)
  
  // ESC Arming Sequence
  Serial.println("Arming ESC... Sending Min Throttle (1000us).");
  esc.writeMicroseconds(1000); 
  delay(5000); // Wait 5 seconds for ESC to play confirmation chime
  Serial.println("ESC Armed! Ready to run.");
}

void loop() {
  // Accelerate slowly
  Serial.println("Accelerating...");
  for (int throttle = 1000; throttle <= 1300; throttle += 10) {
    esc.writeMicroseconds(throttle);
    delay(100);
  }
  delay(2000); // Run at 30% throttle for 2 seconds

  // Decelerate and Stop
  Serial.println("Decelerating...");
  for (int throttle = 1300; throttle >= 1000; throttle -= 10) {
    esc.writeMicroseconds(throttle);
    delay(100);
  }
  delay(5000); // Wait 5 seconds before repeating
}
```

---

<a name="vibration"></a>
## Coin Vibration Motors

Coin vibration motors are small, pancake-style DC motors containing an eccentric rotating mass (ERM). They are designed for haptic feedback and vibrations (e.g., smartphone notifications, controllers).

### Technical Specifications
* **Operating Voltage:** 2.5V – 3.3V
* **Current Draw:** ~60mA to 90mA (Draws too much current for a direct microcontroller GPIO pin which is typically rated for only 20mA–40mA maximum)

> [!WARNING]
> **GPIO Current Limit Warning**: Driving a vibration motor directly from an ESP32 or Arduino GPIO pin will draw excessive current and can burn out the silicon output driver. You **must** use an N-channel MOSFET or NPN bipolar junction transistor (BJT) to act as a switch. Also, a flyback diode must be included in parallel with the motor to catch inductive voltage spikes when turning off.

### Driver Circuit Schematic (NPN Transistor Switch)
```
            VCC (3.3V) ──────┬──────────────────────┐
                             │                      │
                       [Vibe Motor]             [1N4001 Diode] (Anode to collector,
                             │                      │           cathode to VCC)
                             ├──────────────────────┘
                             │ (Collector)
                 (Base)    ┌─┴─┐ (NPN Transistor like 2N2222)
  MCU GPIO Pin ───[1kΩ]───┤   │
                           └───┬───┘
                               │ (Emitter)
                              GND
```

### Typical Pinout (Coin Module Breakout)
If using a pre-built breakout module, the transistor, base resistor, and flyback diode are usually built-in.

| Breakout Pin | Description | Connection (Arduino / ESP32) |
| :--- | :--- | :--- |
| **VCC** | Power Supply | 3.3V (ESP32) or 5V (Arduino) |
| **GND** | Ground | GND |
| **IN** | Driver trigger signal | Any digital GPIO (e.g., GPIO 2) |

### Recommended Libraries
* **No Library Required**: Controlled via simple `digitalWrite()` or `analogWrite()` (to vary vibration intensity).

### Arduino / ESP32 Sample Code (Haptic Click Effect)
```cpp
const int vibePin = 2; // Pin connected to IN of vibe module or base resistor

void setup() {
  pinMode(vibePin, OUTPUT);
}

void loop() {
  // Generate a double-vibration click effect
  digitalWrite(vibePin, HIGH);
  delay(80); // Vibrate for 80 milliseconds
  digitalWrite(vibePin, LOW);
  delay(100); // Pause
  
  digitalWrite(vibePin, HIGH);
  delay(80);
  digitalWrite(vibePin, LOW);
  
  delay(4000); // Wait 4 seconds
}
```
