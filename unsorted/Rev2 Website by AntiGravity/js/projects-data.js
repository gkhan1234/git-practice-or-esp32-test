/**
 * The Micro Lab (themicrolab.org) - Interactive Data Store
 * Contains projects, sensor specifications, tutorials, and FAQs
 */

const PROJECTS_DATA = [
  {
    id: "led-control-and-blinking-patterns",
    title: "LED Control and Blinking Patterns",
    category: "beginner",
    categoryLabel: "Beginner",
    badge: "Most Popular",
    icon: "💡",
    difficulty: "Beginner",
    duration: "20 Mins",
    microcontroller: "ESP32",
    language: "MicroPython & C++",
    shortDescription: "Master digital GPIO outputs, pulse-width-modulation (PWM), timing loops, and multi-LED sequencing with an ESP32 microcontroller.",
    fullDescription: "In this foundational project, learners discover how to interface digital output pins with LEDs using an ESP32 microcontroller and MicroPython or C++. You will learn how to blink an onboard and external LED, manipulate blinking frequencies, implement smooth LED fading using PWM, and program running chaser light sequences.",
    hardware: [
      { name: "ESP32 Development Board", qty: "1x", note: "30 or 38-pin DevKit" },
      { name: "5mm LEDs (Red, Green, Blue)", qty: "3x", note: "Standard diffused" },
      { name: "220Ω Resistors", qty: "3x", note: "Current limiting" },
      { name: "Breadboard & Jumper Wires", qty: "1x", note: "Solderless" }
    ],
    pinConnections: [
      { component: "Red LED Anode (+)", esp32Pin: "GPIO 18", resistor: "via 220Ω to pin" },
      { component: "Green LED Anode (+)", esp32Pin: "GPIO 19", resistor: "via 220Ω to pin" },
      { component: "Blue LED Anode (+)", esp32Pin: "GPIO 21", resistor: "via 220Ω to pin" },
      { component: "All LED Cathodes (-)", esp32Pin: "GND", resistor: "Direct connection" }
    ],
    micropythonCode: `from machine import Pin, PWM
import time

# Initialize LED pins as outputs
led_red = Pin(18, Pin.OUT)
led_green = Pin(19, Pin.OUT)
led_blue = Pin(21, Pin.OUT)

leds = [led_red, led_green, led_blue]

print("Starting LED Sequence Pattern on ESP32...")

try:
    while True:
        # 1. Chaser sequence
        for led in leds:
            led.value(1)
            time.sleep(0.15)
            led.value(0)
            
        # 2. Synchronous pulse
        time.sleep(0.2)
        for led in leds:
            led.value(1)
        time.sleep(0.3)
        for led in leds:
            led.value(0)
        time.sleep(0.4)

except KeyboardInterrupt:
    for led in leds:
        led.value(0)
    print("Program stopped.")`,
    arduinoCode: `const int redPin = 18;
const int greenPin = 19;
const int bluePin = 21;

int leds[] = {redPin, greenPin, bluePin};

void setup() {
  Serial.begin(115200);
  Serial.println("Starting LED Chaser...");
  for (int i = 0; i < 3; i++) {
    pinMode(leds[i], OUTPUT);
  }
}

void loop() {
  // Chaser pattern
  for (int i = 0; i < 3; i++) {
    digitalWrite(leds[i], HIGH);
    delay(150);
    digitalWrite(leds[i], LOW);
  }
  delay(200);
  
  // Flash all
  for (int i = 0; i < 3; i++) digitalWrite(leds[i], HIGH);
  delay(300);
  for (int i = 0; i < 3; i++) digitalWrite(leds[i], LOW);
  delay(400);
}`
  },
  {
    id: "reading-analog-data-photoresistor",
    title: "Light Intensity Monitor & Dashboard",
    category: "sensors",
    categoryLabel: "Sensors & ADC",
    badge: "IoT Ready",
    icon: "☀️",
    difficulty: "Beginner",
    duration: "30 Mins",
    microcontroller: "ESP32",
    language: "MicroPython & C++",
    shortDescription: "Read real-time ambient lighting using a photoresistor (LDR) with the ESP32's 12-bit Analog-to-Digital Converter (ADC).",
    fullDescription: "Ambient light detection is crucial for smart street lights, automatic room illumination, and solar tracking systems. In this project, you construct a voltage divider with a Light Dependent Resistor (LDR) and read continuous voltage changes across the ESP32 ADC pin, translating raw readings into light percentages and triggering night mode automation.",
    hardware: [
      { name: "ESP32 Board", qty: "1x", note: "Any variant" },
      { name: "GL5528 Photoresistor (LDR)", qty: "1x", note: "Light sensor" },
      { name: "10kΩ Resistor", qty: "1x", note: "Pull-down divider" },
      { name: "Status Indicator LED", qty: "1x", note: "Night indicator" },
      { name: "Breadboard & Wires", qty: "1x", note: "Connecting wires" }
    ],
    pinConnections: [
      { component: "LDR Leg 1", esp32Pin: "3V3", resistor: "Direct power" },
      { component: "LDR Leg 2 / Divider junction", esp32Pin: "GPIO 34 (ADC1_CH6)", resistor: "10kΩ to GND" },
      { component: "Indicator LED (+)", esp32Pin: "GPIO 2", resistor: "via 220Ω" }
    ],
    micropythonCode: `from machine import Pin, ADC
import time

# Configure ADC on GPIO 34 (Input only, ADC1)
ldr = ADC(Pin(34))
ldr.atten(ADC.ATTN_11DB)       # Full 0-3.3V range
ldr.width(ADC.WIDTH_12BIT)     # 0 to 4095

night_light = Pin(2, Pin.OUT)  # Auto night light indicator

print("Ambient Light Monitor Active. Reading ADC...")

while True:
    raw_val = ldr.read()
    # Calculate percentage (0% = Pitch Black, 100% = Bright Light)
    percent = round((raw_val / 4095.0) * 100, 1)
    
    print(f"LDR Raw: {raw_val:4d} | Intensity: {percent:5.1f}%")
    
    # Auto turn on night light when ambient light drops below 25%
    if percent < 25.0:
        night_light.value(1)
    else:
        night_light.value(0)
        
    time.sleep(0.5)`,
    arduinoCode: `const int ldrPin = 34; // ADC1 channel 6
const int ledPin = 2;

void setup() {
  Serial.begin(115200);
  pinMode(ledPin, OUTPUT);
}

void loop() {
  int rawValue = analogRead(ldrPin); // 0 - 4095
  float percent = (rawValue / 4095.0) * 100.0;

  Serial.print("Raw: ");
  Serial.print(rawValue);
  Serial.print(" | Light Level: ");
  Serial.print(percent);
  Serial.println("%");

  if (percent < 25.0) {
    digitalWrite(ledPin, HIGH); // Night light ON
  } else {
    digitalWrite(ledPin, LOW);  // Night light OFF
  }
  delay(500);
}`
  },
  {
    id: "measuring-distance-ultrasonic-sensor",
    title: "Ultrasonic Distance Radar & Display",
    category: "sensors",
    categoryLabel: "Sensors & Motion",
    badge: "Interactive",
    icon: "📡",
    difficulty: "Intermediate",
    duration: "35 Mins",
    microcontroller: "ESP32",
    language: "MicroPython & C++",
    shortDescription: "Accurately measure distance and detect obstacles using the HC-SR04 ultrasonic echo transceiver with MicroPython.",
    fullDescription: "Ultrasonic ranging is the foundation for autonomous collision avoidance, smart parking assists, and liquid level measurement. This guide covers how sound propagation speed is used by the HC-SR04 to time ultrasonic pulses with microsecond precision, calculate metric distances in centimeters, and visualize spatial readings.",
    hardware: [
      { name: "ESP32 Development Board", qty: "1x", note: "3.3V logic" },
      { name: "HC-SR04 Ultrasonic Sensor", qty: "1x", note: "Or HC-SR04P (3.3V compatible)" },
      { name: "Resistor Divider (1kΩ + 2kΩ)", qty: "1x pair", note: "For 5V Echo pin protection" },
      { name: "Piezo Buzzer (Optional)", qty: "1x", note: "Proximity alert" }
    ],
    pinConnections: [
      { component: "HC-SR04 VCC", esp32Pin: "5V (VIN)", resistor: "Direct" },
      { component: "HC-SR04 Trig", esp32Pin: "GPIO 5", resistor: "Output trigger" },
      { component: "HC-SR04 Echo", esp32Pin: "GPIO 18", resistor: "Voltage divider to 3.3V" },
      { component: "HC-SR04 GND", esp32Pin: "GND", resistor: "Common ground" }
    ],
    micropythonCode: `from machine import Pin, time_pulse_us
import time

# Pin definition
trig = Pin(5, Pin.OUT)
echo = Pin(18, Pin.IN)

def get_distance():
    # Ensure trigger is low
    trig.value(0)
    time.sleep_us(5)
    
    # Send 10 microsecond pulse
    trig.value(1)
    time.sleep_us(10)
    trig.value(0)
    
    try:
        # Measure round-trip travel time of sound wave in microseconds
        duration = time_pulse_us(echo, 1, 30000) # 30ms timeout
        if duration < 0:
            return None
        # Speed of sound is ~343 m/s = 0.0343 cm/us
        # Distance = (time * speed) / 2
        distance_cm = (duration * 0.0343) / 2
        return round(distance_cm, 1)
    except OSError:
        return None

print("Ultrasonic Radar Active. Scanning...")

while True:
    dist = get_distance()
    if dist is not None:
        bar = "█" * min(int(dist // 2), 25)
        print(f"Distance: {dist:5.1f} cm | {bar}")
    else:
        print("Out of sensor range (>400 cm)")
    time.sleep(0.2)`,
    arduinoCode: `const int trigPin = 5;
const int echoPin = 18;

void setup() {
  Serial.begin(115200);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  Serial.println("HC-SR04 Distance Measurement Online");
}

void loop() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(5);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000);
  if (duration > 0) {
    float distanceCm = (duration * 0.0343) / 2.0;
    Serial.print("Distance: ");
    Serial.print(distanceCm);
    Serial.println(" cm");
  } else {
    Serial.println("Out of Range");
  }
  delay(200);
}`
  },
  {
    id: "pir-motion-sensor-smart-alarm",
    title: "PIR Motion Detection & Smart Alarm",
    category: "iot",
    categoryLabel: "ESP32 & IoT",
    badge: "Home Automation",
    icon: "🚨",
    difficulty: "Beginner",
    duration: "25 Mins",
    microcontroller: "ESP32",
    language: "MicroPython & C++",
    shortDescription: "Detect human movement via infrared radiation changes with an HC-SR501 PIR sensor and interrupt triggers.",
    fullDescription: "Passive Infrared (PIR) sensors detect heat signatures from humans and warm-blooded animals. By configuring hardware interrupts on the ESP32, your microcontroller can sleep in ultra-low-power mode and instantly wake up upon detecting motion to trigger alarms, turn on lighting, or send MQTT/HTTP alerts over Wi-Fi.",
    hardware: [
      { name: "ESP32 Board", qty: "1x", note: "3.3V / 5V powered" },
      { name: "HC-SR501 PIR Sensor", qty: "1x", note: "Adjustable delay & sensitivity" },
      { name: "Active 5V Buzzer", qty: "1x", note: "Audible alarm" },
      { name: "Red Warning LED", qty: "1x", note: "Visual indicator" }
    ],
    pinConnections: [
      { component: "PIR VCC", esp32Pin: "VIN (5V)", resistor: "Direct" },
      { component: "PIR Output", esp32Pin: "GPIO 13", resistor: "Configured as Pin.IN" },
      { component: "Buzzer (+)", esp32Pin: "GPIO 27", resistor: "via 220Ω" },
      { component: "Common GND", esp32Pin: "GND", resistor: "Common ground" }
    ],
    micropythonCode: `from machine import Pin
import time

pir = Pin(13, Pin.IN)
buzzer = Pin(27, Pin.OUT)
alarm_led = Pin(2, Pin.OUT)

motion_detected = False

def handle_motion(pin):
    global motion_detected
    motion_detected = True

# Attach hardware interrupt on rising edge (motion triggered)
pir.irq(trigger=Pin.IRQ_RISING, handler=handle_motion)

print("Smart Security Alarm Armed. Watching for intrusions...")

while True:
    if motion_detected:
        print("[ALERT] Motion detected by PIR Sensor!")
        alarm_led.value(1)
        buzzer.value(1)
        time.sleep(0.8)
        alarm_led.value(0)
        buzzer.value(0)
        motion_detected = False
    time.sleep(0.1)`,
    arduinoCode: `const int pirPin = 13;
const int buzzerPin = 27;
const int ledPin = 2;

volatile bool motionFlag = false;

void IRAM_ATTR motionISR() {
  motionFlag = true;
}

void setup() {
  Serial.begin(115200);
  pinMode(pirPin, INPUT);
  pinMode(buzzerPin, OUTPUT);
  pinMode(ledPin, OUTPUT);

  attachInterrupt(digitalPinToInterrupt(pirPin), motionISR, RISING);
  Serial.println("PIR Motion Alarm Armed");
}

void loop() {
  if (motionFlag) {
    Serial.println("[ALERT] Motion Detected!");
    digitalWrite(buzzerPin, HIGH);
    digitalWrite(ledPin, HIGH);
    delay(1000);
    digitalWrite(buzzerPin, LOW);
    digitalWrite(ledPin, LOW);
    motionFlag = false;
  }
  delay(50);
}`
  },
  {
    id: "mpu6050-accelerometer-gyroscope",
    title: "MPU-6050 6-Axis Motion & Gyro Tracker",
    category: "robotics",
    categoryLabel: "Robotics & Motion",
    badge: "Advanced STEM",
    icon: "🧭",
    difficulty: "Advanced",
    duration: "45 Mins",
    microcontroller: "ESP32",
    language: "MicroPython & C++",
    shortDescription: "Track roll, pitch, acceleration, and angular velocity in 3-dimensional space using I2C bus communications.",
    fullDescription: "Self-balancing two-wheeled robots, quadcopters, and gesture remotes all rely on IMU (Inertial Measurement Unit) sensors. In this hands-on project, you communicate with the MPU-6050 over the I2C protocol, reading 3-axis accelerometer and 3-axis gyroscope registers, converting raw values to G-forces and deg/sec, and calculating pitch/roll angles.",
    hardware: [
      { name: "ESP32 Board", qty: "1x", note: "Standard pinout" },
      { name: "MPU-6050 6-DOF IMU Module", qty: "1x", note: "GY-521 board" },
      { name: "Jumper Wires", qty: "4x", note: "Female-to-male" }
    ],
    pinConnections: [
      { component: "MPU-6050 VCC", esp32Pin: "3V3", resistor: "Direct power" },
      { component: "MPU-6050 GND", esp32Pin: "GND", resistor: "Common ground" },
      { component: "MPU-6050 SCL", esp32Pin: "GPIO 22", resistor: "I2C Clock" },
      { component: "MPU-6050 SDA", esp32Pin: "GPIO 21", resistor: "I2C Data" }
    ],
    micropythonCode: `from machine import Pin, I2C
import time, math

# ESP32 Default I2C pins: SCL=22, SDA=21
i2c = I2C(0, scl=Pin(22), sda=Pin(21), freq=400000)
MPU_ADDR = 0x68

# Wake up MPU-6050 (default is sleep mode)
i2c.writeto_mem(MPU_ADDR, 0x6B, bytes([0]))

def read_raw_word(reg):
    high, low = i2c.readfrom_mem(MPU_ADDR, reg, 2)
    val = (high << 8) | low
    return val - 65536 if val > 32767 else val

print("MPU-6050 Initialized. Reading 3-axis IMU...")

while True:
    # Read Accelerometer (±2g sensitivity scale: 16384 LSB/g)
    ax = read_raw_word(0x3B) / 16384.0
    ay = read_raw_word(0x3D) / 16384.0
    az = read_raw_word(0x3F) / 16384.0
    
    # Calculate approximate Pitch & Roll in degrees
    pitch = math.atan2(ay, math.sqrt(ax*ax + az*az)) * 57.2958
    roll  = math.atan2(-ax, az) * 57.2958
    
    print(f"Accel: X={ax:+.2f}g Y={ay:+.2f}g Z={az:+.2f}g | Pitch={pitch:5.1f}° Roll={roll:5.1f}°")
    time.sleep(0.1)`,
    arduinoCode: `#include <Wire.h>

const int MPU_ADDR = 0x68;

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22); // SDA, SCL
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B); // Power Management 1 register
  Wire.write(0);    // Wake up
  Wire.endTransmission(true);
  Serial.println("MPU-6050 Ready");
}

void loop() {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 6, true);

  int16_t ax = Wire.read() << 8 | Wire.read();
  int16_t ay = Wire.read() << 8 | Wire.read();
  int16_t az = Wire.read() << 8 | Wire.read();

  float axG = ax / 16384.0;
  float ayG = ay / 16384.0;
  float azG = az / 16384.0;

  Serial.printf("X: %.2fg | Y: %.2fg | Z: %.2fg\\n", axG, ayG, azG);
  delay(100);
}`
  },
  {
    id: "servo-motor-robotic-angle-controller",
    title: "Servo Motor Robotic Angle Control",
    category: "robotics",
    categoryLabel: "Robotics & Motion",
    badge: "Hands-On",
    icon: "🦾",
    difficulty: "Intermediate",
    duration: "30 Mins",
    microcontroller: "ESP32",
    language: "MicroPython & C++",
    shortDescription: "Control precision angular positioning from 0° to 180° with PWM duty-cycle modulation for robotic steering arms.",
    fullDescription: "Servo motors like the SG90 are the backbone of robotic grippers, camera pan-tilt platforms, and steering assemblies. In this project, you will understand the 50Hz PWM signal specification (1ms to 2ms pulse width), write an angle-to-duty-cycle conversion equation in MicroPython, and construct automated sweep routines.",
    hardware: [
      { name: "ESP32 Microcontroller", qty: "1x", note: "Supplies 50Hz PWM" },
      { name: "Micro Servo SG90 (9g)", qty: "1x", note: "180 degree rotation" },
      { name: "Capacitor 100uF (Optional)", qty: "1x", note: "Smooths voltage surges" },
      { name: "Jumper Wires", qty: "3x", note: "Male-to-female" }
    ],
    pinConnections: [
      { component: "Servo Brown (GND)", esp32Pin: "GND", resistor: "Common ground" },
      { component: "Servo Red (VCC)", esp32Pin: "5V (VIN)", resistor: "External power or VIN" },
      { component: "Servo Orange (Signal)", esp32Pin: "GPIO 14", resistor: "PWM control line" }
    ],
    micropythonCode: `from machine import Pin, PWM
import time

# Micro Servos use 50Hz frequency (20ms cycle period)
servo = PWM(Pin(14), freq=50)

def set_angle(angle):
    """
    0 degrees   ~ 0.5ms pulse (~25 on 16-bit duty: range ~1638 to 8192)
    180 degrees ~ 2.5ms pulse
    """
    duty = int(1638 + (angle / 180.0) * (8192 - 1638))
    servo.duty_u16(duty)

print("Starting Servo Motor Sweep from 0 to 180 degrees...")

try:
    while True:
        # Sweep forward
        for deg in range(0, 181, 10):
            set_angle(deg)
            time.sleep(0.04)
        time.sleep(0.5)
        
        # Sweep back
        for deg in range(180, -1, -10):
            set_angle(deg)
            time.sleep(0.04)
        time.sleep(0.5)

except KeyboardInterrupt:
    servo.deinit()
    print("Servo stopped.")`,
    arduinoCode: `#include <ESP32Servo.h>

Servo myServo;
const int servoPin = 14;

void setup() {
  Serial.begin(115200);
  myServo.setPeriodHertz(50); // Standard 50Hz
  myServo.attach(servoPin, 500, 2400); // 500us to 2400us
  Serial.println("Servo Controller Initialized");
}

void loop() {
  for (int angle = 0; angle <= 180; angle += 15) {
    myServo.write(angle);
    Serial.printf("Angle: %d deg\\n", angle);
    delay(100);
  }
  delay(500);
  for (int angle = 180; angle >= 0; angle -= 15) {
    myServo.write(angle);
    Serial.printf("Angle: %d deg\\n", angle);
    delay(100);
  }
  delay(500);
}`
  }
];

const SENSORS_DATA = [
  {
    id: "esp32-wroom-32",
    name: "ESP32-WROOM-32",
    type: "Microcontroller Board",
    voltage: "3.0V – 3.6V (5V via USB)",
    protocol: "Wi-Fi, Bluetooth, SPI, I2C, UART",
    description: "Dual-core Xtensa 32-bit LX6 MCU clocked at 240 MHz. Integrated 802.11 b/g/n Wi-Fi and Bluetooth v4.2 BR/EDR and BLE.",
    pinCount: "30 / 38 Pins",
    features: ["4MB Flash memory", "520 KB SRAM", "18 ADC channels", "2 DAC channels", "Capacitive touch pins"]
  },
  {
    id: "hc-sr04",
    name: "HC-SR04 Ultrasonic",
    type: "Distance Sensor",
    voltage: "5V DC (HC-SR04P is 3.3V-5V)",
    protocol: "Digital Timing Pulse (Trig/Echo)",
    description: "Non-contact distance measurement module capable of detecting objects from 2 cm to 400 cm with 3mm precision.",
    pinCount: "4 Pins (VCC, Trig, Echo, GND)",
    features: ["40 kHz ultrasound emission", "15° measuring angle", "Low idle power (<2mA)", "Immune to color & ambient light"]
  },
  {
    id: "dht22",
    name: "DHT22 (AM2302)",
    type: "Temperature & Humidity",
    voltage: "3.3V – 5.5V DC",
    protocol: "Single-bus digital signal",
    description: "High-precision calibrated digital sensor providing accurate relative humidity and temperature measurements.",
    pinCount: "3 or 4 Pins",
    features: ["Humidity: 0-100% RH (±2%)", "Temp: -40°C to +80°C (±0.5°C)", "2-second sampling interval", "Long signal transmission"]
  },
  {
    id: "mpu-6050",
    name: "MPU-6050 6-DOF IMU",
    type: "Motion Tracking Unit",
    voltage: "3.3V – 5V (Onboard LDO)",
    protocol: "I2C (Address 0x68 or 0x69)",
    description: "Combines a 3-axis MEMS accelerometer, a 3-axis MEMS gyroscope, and an onboard Digital Motion Processor (DMP).",
    pinCount: "8 Pins (VCC, GND, SCL, SDA, XDA, XCL, AD0, INT)",
    features: ["Selectable ±2g, ±4g, ±8g, ±16g", "Gyro ±250, ±500, ±1000, ±2000°/s", "Embedded 1024-byte FIFO buffer", "Integrated temperature sensor"]
  },
  {
    id: "sg90-servo",
    name: "SG90 Micro Servo 9g",
    type: "Actuator & Motor",
    voltage: "4.8V – 6.0V DC",
    protocol: "PWM (50 Hz / 20ms period)",
    description: "Lightweight, reliable miniature positional actuator capable of precise 0° to 180° motion feedback for robot joints.",
    pinCount: "3 Pins (GND, Power, Signal)",
    features: ["1.8 kg/cm torque at 4.8V", "0.10 sec/60° operating speed", "Nylon gear train", "Includes mounting horns"]
  },
  {
    id: "relay-5v",
    name: "5V Optocoupler Relay",
    type: "Power Switching Module",
    voltage: "5V Coil (3.3V logic friendly)",
    protocol: "Active LOW/HIGH digital trigger",
    description: "Electromechanical relay module providing complete galvanic optical isolation to safely switch high-voltage AC/DC appliances.",
    pinCount: "3 Pins input, 3 screw terminals output",
    features: ["Controls up to 250VAC 10A or 30VDC 10A", "Optoisolator prevents back-EMF", "Normally Open (NO) & Closed (NC)", "Onboard status LED"]
  }
];

const TUTORIALS_DATA = [
  {
    id: "hc-sr501-guide",
    title: "The Complete Beginner's Guide to the HC-SR501 PIR Motion Sensor",
    tag: "Sensors & Security",
    author: "Gary M.",
    readTime: "7 min read",
    date: "July 2025",
    summary: "Everything you need to know about Fresnel lenses, sensitivity potentiometers, time delay tuning, and trigger jumpers (H vs L mode).",
    url: "#"
  },
  {
    id: "servo-motors-guide",
    title: "Servo Motors: Precision Angle & PWM Control Made Simple",
    tag: "Robotics & Hardware",
    author: "Gary M.",
    readTime: "6 min read",
    date: "June 2025",
    summary: "Discover how a 50 Hz pulse-width modulated signal determines servo horn position with zero jitter and clean power rails.",
    url: "#"
  },
  {
    id: "mpu-6050-guide",
    title: "MPU-6050 Accelerometer & Gyroscope: Practical I2C Guide",
    tag: "Data & IMU",
    author: "Gary M.",
    readTime: "9 min read",
    date: "May 2025",
    summary: "Demystifying 6 degrees of freedom, calculating pitch and roll with trigonometry, and filtering noise on the ESP32.",
    url: "#"
  }
];

const FAQS_DATA = [
  {
    q: "What types of projects can I find on themicrolab.org?",
    a: "You can explore a curated, ever-growing catalog of hands-on electronics, robotics, and IoT projects. Each project is built around real-world applications (like automated home security, environmental telemetry, robotics steering, and weather stations) and includes complete schematics, Bill of Materials (BOM), step-by-step assembly guides, and production-tested MicroPython & Arduino C++ code."
  },
  {
    q: "Why MicroPython instead of traditional C++?",
    a: "MicroPython is a lean and efficient implementation of Python 3 optimized to run on microcontrollers like the ESP32 and RP2040. It allows rapid prototyping through a live Interactive REPL (Read-Eval-Print Loop), eliminates painful compilation times, and makes embedded systems programming accessible to students and seasoned developers alike. However, all our major projects provide both MicroPython and Arduino C++ versions!"
  },
  {
    q: "How do I download project files and source code?",
    a: "Every project card features a 'View Full Project' modal where you can directly inspect, copy with one click, or download the full code files. You can also view our open-source GitHub repositories linked on each project page."
  },
  {
    q: "Can educators and schools use this curriculum in STEM classrooms?",
    a: "Yes, absolutely! The Micro Lab projects are specifically structured for STEM classrooms, after-school robotics clubs, makerspaces, and university lab courses. The step-by-step schematics, breadboard layouts, and clean code make it ideal for classroom lessons."
  },
  {
    q: "Do I need special hardware to test projects?",
    a: "Not necessarily! You can test our interactive ESP32 Simulator right here on the homepage to see how sensors, distance calculations, and LEDs respond to code in real-time. When you're ready to build with physical hardware, standard low-cost components (ESP32, HC-SR04, breadboard, resistors) are easily available."
  },
  {
    q: "How do I flash MicroPython onto my ESP32 board?",
    a: "Flashing MicroPython takes less than 2 minutes using tools like the official Thonny IDE or WebREPL. Simply plug your ESP32 into USB, download the latest MicroPython ESP32 firmware binary (.bin), and flash it using Thonny's built-in 'Install MicroPython' menu."
  }
];
