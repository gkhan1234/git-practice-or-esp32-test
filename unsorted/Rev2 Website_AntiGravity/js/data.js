/**
 * MicroLab Structured Data Store
 * Reframed around durable embedded systems, concrete industrial applications,
 * and ongoing project blog posts with student Q&A.
 */

const MICROLAB_DATA = {
  // 10 Core Physical Embedded Industries
  industries: [
    {
      id: "automotive",
      name: "Automotive",
      icon: "🚗",
      components: "Engine ECUs, CAN-bus networks, radar proximity modules, battery management systems"
    },
    {
      id: "medical",
      name: "Medical Devices",
      icon: "🏥",
      components: "Infusion pump stepper drivers, pulse oximeter ADCs, ventilator airflow sensors"
    },
    {
      id: "industrial",
      name: "Industrial Automation",
      icon: "⚙️",
      components: "PLC relay banks, optical sorting sensors, conveyor variable-frequency drives"
    },
    {
      id: "aerospace",
      name: "Aerospace & Defence",
      icon: "✈️",
      components: "Flight-control IMUs, redundant servo actuators, cabin pressure transducers"
    },
    {
      id: "datacentre",
      name: "Data Centre Infrastructure",
      icon: "🖥️",
      components: "Rack thermal telemetry, hot-aisle damper controllers, power-distribution monitoring"
    },
    {
      id: "energy",
      name: "Energy & Grid",
      icon: "⚡",
      components: "Solar inverter MPPT controllers, sub-station current sensing, smart metering"
    },
    {
      id: "robotics",
      name: "Robotics & Motion",
      icon: "🤖",
      components: "End-effector tactile feedback, joint encoder SPI buses, brushless ESC controllers"
    },
    {
      id: "agriculture",
      name: "Smart Agriculture",
      icon: "🌱",
      components: "Soil volumetric water probes, greenhouse mist solenoids, solar daylight monitors"
    },
    {
      id: "building",
      name: "Building Automation",
      icon: "🏢",
      components: "HVAC BACnet zone dampers, dual-pyroelectric PIR lighting, access control relays"
    },
    {
      id: "telecom",
      name: "Telecom & RF",
      icon: "📡",
      components: "Cell-tower microwave mast telemetry, remote reboot relay switches, RF power monitors"
    }
  ],

  // Reframed Projects (Formula: [what it does] + [where it's used in industry])
  projects: [
    {
      id: "relay-control",
      title: "Switching Loads Safely",
      consequenceFormula: "The basis of industrial relay control and isolated load switching",
      industryTag: "Manufacturing & Energy",
      category: "relay",
      difficulty: "Beginner",
      timeEst: "45 mins",
      shortDesc: "Learn how microcontrollers isolate low-voltage logic (3.3V) from high-power loads using optocouplers and transistors to safely control motors, pumps, and lighting.",
      longDesc: "A microcontroller GPIO pin can only source 12–20 milliamps at 3.3V. Attempting to power a commercial heater, water pump, or industrial motor directly from a microcontroller pin would instantly destroy the silicon. In this project, students wire a galvanically isolated optocoupler relay module to switch external loads safely, learning the fundamental architecture found in factory PLCs, HVAC systems, and automotive fuse panels.",
      mfgApplication: "Industrial relays in motor contactors, automotive starter solenoids, and hospital backup power transfer switches.",
      pinoutTable: [
        { compPin: "VCC (+)", espPin: "VIN (5V / External)", note: "Relay coil requires separate 5V supply" },
        { compPin: "GND (-)", espPin: "GND (Common)", note: "Star ground with microcontroller" },
        { compPin: "IN1 (Trigger)", espPin: "GPIO 18", note: "Active-LOW or Active-HIGH optocoupler input" },
        { compPin: "COM & NO", espPin: "External Load Loop", note: "Switches external 12V/120V supply safely" }
      ],
      micropythonCode: `# MicroLab: Switching Loads Safely via Relay Control
from machine import Pin
import time

# Configure GPIO 18 as output for relay control
relay = Pin(18, Pin.OUT)

def set_industrial_load(state):
    """
    Control high-current circuit safely via optoisolator.
    Active-LOW relays trigger when pin is driven LOW (0).
    """
    if state:
        relay.value(0)  # Energize relay coil
        print("[RELAY] Coil ENERGIZED - Load Active (NO closed)")
    else:
        relay.value(1)  # De-energize relay coil
        print("[RELAY] Coil DE-ENERGIZED - Load Inactive (NO open)")

# Test load cycle: 3 cycles with 2-second hold
for cycle in range(1, 4):
    print(f"Cycle {cycle}: Activating load...")
    set_industrial_load(True)
    time.sleep(2)
    print(f"Cycle {cycle}: Disengaging load...")
    set_industrial_load(False)
    time.sleep(2)

print("Load sequence complete. System safe.")`,
      arduinoCode: `// MicroLab: Switching Loads Safely (Arduino C++)
const int RELAY_PIN = 18;

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  // Ensure relay is OFF at startup (Active LOW)
  digitalWrite(RELAY_PIN, HIGH);
  Serial.println("[SYSTEM] Isolated relay control initialized.");
}

void loop() {
  Serial.println("[RELAY] Activating external industrial load...");
  digitalWrite(RELAY_PIN, LOW); // Turn ON
  delay(2500);

  Serial.println("[RELAY] De-activating external industrial load...");
  digitalWrite(RELAY_PIN, HIGH); // Turn OFF
  delay(2500);
}`,
      bom: [
        { item: "ESP32 DevKit V1 Board", qty: "1", note: "Dual-core microcontroller with 3.3V logic" },
        { item: "5V Optocoupler 1-Channel Relay", qty: "1", note: "Galvanic isolation rated to 250VAC/10A" },
        { item: "Solderless Breadboard & Jumpers", qty: "1 set", note: "Male-to-male and male-to-female leads" },
        { item: "External 5V DC Power Source", qty: "1", note: "Powers relay coil without draining USB bus" }
      ]
    },
    {
      id: "analog-sensing",
      title: "Analog Sensing & Calibration",
      consequenceFormula: "How process sensors work in manufacturing quality control",
      industryTag: "Factory Automation",
      category: "analog",
      difficulty: "Beginner",
      timeEst: "60 mins",
      shortDesc: "Interface analog sensors with the ESP32's 12-bit Analog-to-Digital Converter (ADC), apply mathematical linear interpolation, and calibrate against factory thresholds.",
      longDesc: "Physical reality is continuous, but digital microcontrollers operate in discrete 1s and 0s. This project demystifies ADC resolution (0–4095 levels on 12-bit registers) by building an ambient light and voltage monitor using a photoresistor and precision voltage divider. Students write calibration math to map raw millivolt readings into standard engineering units (Lux and % threshold), exactly how industrial temperature, strain-gauge, and chemical sensors operate in automated plants.",
      mfgApplication: "Inline quality inspection, semiconductor cleanroom optical wafer verification, and automated welding flash detection.",
      pinoutTable: [
        { compPin: "LDR Terminal 1", espPin: "3.3V Rail", note: "High side of voltage divider" },
        { compPin: "LDR Terminal 2", espPin: "GPIO 34 (ADC1_CH6)", note: "Sense junction between LDR and resistor" },
        { compPin: "10kΩ Fixed Resistor", espPin: "GND Rail", note: "Pulldown reference to ground" }
      ],
      micropythonCode: `# MicroLab: Analog Sensing & ADC Calibration
from machine import ADC, Pin
import time

# Configure ADC on GPIO 34 (Input only pin)
adc = ADC(Pin(34))
# Set attenuation for full 0 - 3.3V range
adc.atten(ADC.ATTN_11DB)
adc.width(ADC.WIDTH_12BIT)

def read_calibrated_sensor():
    raw_val = adc.read() # 0 to 4095
    voltage_mv = (raw_val / 4095.0) * 3300.0
    # Map to calibrated percentage (0% dark to 100% full saturation)
    intensity_pct = max(0.0, min(100.0, (raw_val / 4095.0) * 100.0))
    return raw_val, voltage_mv, intensity_pct

print("Starting factory process sensor monitoring...")
while True:
    raw, mv, pct = read_calibrated_sensor()
    print(f"[ADC] Raw: {raw:4d} | Signal: {mv:6.1f} mV | Process Val: {pct:5.1f}%")
    if pct < 30.0:
        print("  -> STATUS: Below baseline threshold (Activating supplement)")
    time.sleep(1.0)`,
      arduinoCode: `// MicroLab: Analog Sensing & ADC Calibration (Arduino C++)
const int SENSOR_PIN = 34;

void setup() {
  Serial.begin(115200);
  analogReadResolution(12); // 12-bit ADC (0 - 4095)
  Serial.println("[ADC] Industrial sensor calibration ready.");
}

void loop() {
  int rawValue = analogRead(SENSOR_PIN);
  float voltage = (rawValue / 4095.0) * 3.3;
  float processPct = (rawValue / 4095.0) * 100.0;

  Serial.print("[ADC] Raw: "); Serial.print(rawValue);
  Serial.print(" | Volts: "); Serial.print(voltage, 2);
  Serial.print("V | Calibrated: "); Serial.print(processPct, 1);
  Serial.println("%");
  delay(1000);
}`,
      bom: [
        { item: "ESP32 Development Board", qty: "1", note: "Onboard 12-bit SAR ADC engine" },
        { item: "GL5528 Photoresistor", qty: "1", note: "Light dependent variable resistance element" },
        { item: "10kΩ 1% Metal Film Resistor", qty: "1", note: "Precision voltage divider divider pulldown" },
        { item: "Breadboard & Wires", qty: "1 set", note: "Prototyping circuit interconnects" }
      ]
    },
    {
      id: "ultrasonic-distance",
      title: "Distance & Proximity Sensing",
      consequenceFormula: "Collision avoidance in robotics and automotive parking systems",
      industryTag: "Robotics & Automotive",
      category: "distance",
      difficulty: "Intermediate",
      timeEst: "75 mins",
      shortDesc: "Generate 40 kHz ultrasonic acoustic chirps, measure round-trip flight times in microseconds, and calculate real-time millimeter distances to obstacles.",
      longDesc: "Self-driving cars, warehouse AGVs (Automated Guided Vehicles), and surgical robotic arms rely on time-of-flight acoustic or optical telemetry to prevent destructive collisions. In this lab, students interface an HC-SR04 ultrasonic transducer with an ESP32. They pulse the trigger pin with a 10-microsecond strobe, measure the echo return duration, and apply the speed-of-sound physics formula (v = 343 m/s) to compute distance with sub-centimeter accuracy.",
      mfgApplication: "Automotive reverse parking ultrasonic sensors, robotic warehouse AGV safety curtains, and liquid level tank monitoring.",
      pinoutTable: [
        { compPin: "VCC", espPin: "VIN (5V)", note: "Requires 5V for acoustic transducer power" },
        { compPin: "GND", espPin: "GND", note: "Common system ground" },
        { compPin: "TRIG (Strobe)", espPin: "GPIO 5", note: "Output: 10µs HIGH pulse generates 40kHz burst" },
        { compPin: "ECHO (Return)", espPin: "GPIO 18 (via 1k/2k Divider)", note: "Input: 5V echo stepped down to safe 3.3V" }
      ],
      micropythonCode: `# MicroLab: Ultrasonic Proximity & Collision Avoidance
from machine import Pin, time_pulse_us
import time

TRIG_PIN = 5
ECHO_PIN = 18

trig = Pin(TRIG_PIN, Pin.OUT)
echo = Pin(ECHO_PIN, Pin.IN)

def measure_distance_cm():
    # Ensure trigger is LOW
    trig.value(0)
    time.sleep_us(2)
    # Strobe 10 microsecond HIGH pulse
    trig.value(1)
    time.sleep_us(10)
    trig.value(0)

    # Measure echo HIGH duration in microseconds (max 30,000µs timeout)
    duration_us = time_pulse_us(echo, 1, 30000)
    if duration_us < 0:
        return None # Echo timed out
    
    # Speed of sound: 343 m/s = 0.0343 cm/µs. Round trip divide by 2.
    distance_cm = (duration_us * 0.0343) / 2.0
    return round(distance_cm, 1)

print("Ultrasonic proximity radar active. Monitoring safe perimeter...")
while True:
    dist = measure_distance_cm()
    if dist is not None:
        if dist < 15.0:
            print(f"[RADAR] ALERT: Obstacle at {dist} cm! (Triggering emergency brake)")
        else:
            print(f"[RADAR] Target clearance: {dist} cm [SAFE]")
    else:
        print("[RADAR] Out of range (> 400 cm)")
    time.sleep(0.5)`,
      arduinoCode: `// MicroLab: Ultrasonic Collision Avoidance (Arduino C++)
const int TRIG_PIN = 5;
const int ECHO_PIN = 18;

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  Serial.println("[RADAR] Ultrasonic distance sensor active.");
}

void loop() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  float distance = (duration * 0.0343) / 2.0;

  if (duration == 0) {
    Serial.println("[RADAR] Out of range.");
  } else {
    Serial.print("[RADAR] Obstacle distance: ");
    Serial.print(distance);
    Serial.println(" cm");
  }
  delay(500);
}`,
      bom: [
        { item: "ESP32 DevKit Board", qty: "1", note: "Microcontroller with microsecond timer registers" },
        { item: "HC-SR04 Ultrasonic Module", qty: "1", note: "40 kHz transmitter and receiver transducers" },
        { item: "1kΩ and 2kΩ Resistors", qty: "1 each", note: "Voltage divider to step 5V Echo down to 3.3V" },
        { item: "Breadboard & Jumper Wires", qty: "1 set", note: "Circuit wiring connections" }
      ]
    },
    {
      id: "environmental-monitor",
      title: "Environmental Monitoring & Control",
      consequenceFormula: "Smart agriculture and climate-controlled cleanroom manufacturing",
      industryTag: "Life Sciences & AgTech",
      category: "environmental",
      difficulty: "Intermediate",
      timeEst: "90 mins",
      shortDesc: "Read digital humidity and temperature telemetry via calibrated single-wire bus, compute dew points, and trigger automated climate actuators.",
      longDesc: "Modern pharmaceutical manufacturing, sterile hospital surgical suites, and commercial indoor vertical farms require strict climate envelope compliance. A single excursion above allowable humidity ruins cleanroom silicon wafers or causes biological crop loss. Students wire a digital temperature & relative humidity sensor to an ESP32, implement closed-loop hysteresis control, and stream telemetry over Wi-Fi or serial.",
      mfgApplication: "Semiconductor cleanroom monitoring, hospital vaccine cold-chain refrigeration, and vertical indoor greenhouse automation.",
      pinoutTable: [
        { compPin: "VCC (Pin 1)", espPin: "3.3V Rail", note: "Low-voltage sensor power" },
        { compPin: "DATA (Pin 2)", espPin: "GPIO 4", note: "Bi-directional digital communication with 4.7kΩ pullup" },
        { compPin: "NC (Pin 3)", espPin: "No Connect", note: "Unused pin" },
        { compPin: "GND (Pin 4)", espPin: "GND Rail", note: "System ground" }
      ],
      micropythonCode: `# MicroLab: Environmental Cleanroom & AgTech Monitor
from machine import Pin
import dht
import time

# DHT22 digital sensor connected on GPIO 4
sensor = dht.DHT22(Pin(4))

# Actuator control pins (e.g. exhaust fan relay & misting solenoid)
fan_relay = Pin(19, Pin.OUT)
fan_relay.value(1) # Off (Active-LOW)

HUMIDITY_LIMIT = 65.0 # Max allowable relative humidity %

print("Cleanroom environmental controller initialized.")
while True:
    try:
        sensor.measure()
        temp_c = sensor.temperature()
        temp_f = (temp_c * 9/5) + 32
        humidity = sensor.humidity()

        print(f"[ENV] Temp: {temp_c:.1f}°C ({temp_f:.1f}°F) | Rel Humidity: {humidity:.1f}%")

        if humidity > HUMIDITY_LIMIT:
            print("  -> EXCURSION DETECTED: Humidity exceeds threshold!")
            print("  -> Engaging industrial exhaust fan (GPIO 19 LOW)...")
            fan_relay.value(0)
        else:
            fan_relay.value(1)

    except OSError as e:
        print("[ENV ERROR] Sensor read failure. Retrying...")

    time.sleep(2.0)`,
      arduinoCode: `// MicroLab: Environmental Monitoring & Closed-Loop Control (C++)
#include "DHT.h"
#define DHTPIN 4
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);
const int FAN_PIN = 19;

void setup() {
  Serial.begin(115200);
  pinMode(FAN_PIN, OUTPUT);
  digitalWrite(FAN_PIN, HIGH); // OFF
  dht.begin();
  Serial.println("[ENV] Industrial environmental loop running.");
}

void loop() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h) || isnan(t)) {
    Serial.println("[ENV] Failed to read from DHT sensor!");
    return;
  }

  Serial.print("[ENV] Humidity: "); Serial.print(h);
  Serial.print("% | Temperature: "); Serial.print(t);
  Serial.println("°C");

  if (h > 65.0) {
    digitalWrite(FAN_PIN, LOW); // Turn fan ON
    Serial.println("  -> [ACTUATOR] Exhaust fan engaged.");
  } else {
    digitalWrite(FAN_PIN, HIGH);
  }
  delay(2000);
}`,
      bom: [
        { item: "ESP32 Microcontroller", qty: "1", note: "Processes digital sensor data and network packets" },
        { item: "DHT22 / AM2302 Sensor", qty: "1", note: "Digital calibrated capacitive humidity and thermistor" },
        { item: "4.7kΩ Pullup Resistor", qty: "1", note: "Ensures reliable high-speed 1-wire bus transitions" },
        { item: "5V Relay Board", qty: "1", note: "Controls exhaust fans and dehumidifiers" }
      ]
    },
    {
      id: "imu-motion",
      title: "6-DOF Inertial Motion Tracking",
      consequenceFormula: "Attitude control and stabilization in aerospace, drones, and robotics",
      industryTag: "Aerospace & Robotics",
      category: "motion",
      difficulty: "Advanced",
      timeEst: "90 mins",
      shortDesc: "Query 3-axis accelerometer and 3-axis rate gyroscope data via the I2C serial protocol, fuse readings, and track physical tilt angles in 3D space.",
      longDesc: "Quadcopters, satellites, autonomous ocean vessels, and industrial gimbal platforms must know their exact orientation relative to Earth's gravity vector in real time. Students connect an MPU-6050 6-Degree-of-Freedom IMU to the ESP32 hardware I2C bus (SDA/SCL), read high-speed raw 16-bit register values, and calculate pitch and roll using trigonometry and complementary filtering.",
      mfgApplication: "Drone flight controllers, aircraft artificial horizons, surgical robotic tool pose estimation, and seismic building monitors.",
      pinoutTable: [
        { compPin: "VCC", espPin: "3.3V Rail", note: "Main logic power" },
        { compPin: "GND", espPin: "GND", note: "Common ground" },
        { compPin: "SCL (I2C Clock)", espPin: "GPIO 22", note: "ESP32 Hardware I2C Clock" },
        { compPin: "SDA (I2C Data)", espPin: "GPIO 21", note: "ESP32 Hardware I2C Data" }
      ],
      micropythonCode: `# MicroLab: 6-DOF Inertial Motion Tracking
from machine import Pin, I2C
import time, math

i2c = I2C(0, scl=Pin(22), sda=Pin(21), freq=400000)
MPU_ADDR = 0x68

# Wake up MPU-6050 by clearing sleep bit in PWR_MGMT_1 register (0x6B)
i2c.writeto_mem(MPU_ADDR, 0x6B, bytes([0]))

def read_accel_raw():
    data = i2c.readfrom_mem(MPU_ADDR, 0x3B, 6)
    ax = int.from_bytes(data[0:2], 'big')
    ay = int.from_bytes(data[2:4], 'big')
    az = int.from_bytes(data[4:6], 'big')
    # Convert to signed 16-bit
    ax = ax - 65536 if ax > 32767 else ax
    ay = ay - 65536 if ay > 32767 else ay
    az = az - 65536 if az > 32767 else az
    return ax, ay, az

print("Inertial Measurement Unit active. Reading 3-axis vectors...")
while True:
    ax, ay, az = read_accel_raw()
    # Scale: +/- 2g range (16384 LSB/g)
    gx = ax / 16384.0
    gy = ay / 16384.0
    gz = az / 16384.0

    pitch = math.atan2(gy, math.sqrt(gx*gx + gz*gz)) * 57.2958
    roll  = math.atan2(-gx, gz) * 57.2958

    print(f"[IMU] Pitch: {pitch:6.1f}° | Roll: {roll:6.1f}° | Accel Gz: {gz:4.2f}g")
    time.sleep(0.2)`,
      arduinoCode: `// MicroLab: 6-DOF Inertial Motion Tracking (C++)
#include <Wire.h>
const int MPU_ADDR = 0x68;

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B); // Power management register
  Wire.write(0);    // Wake up
  Wire.endTransmission(true);
  Serial.println("[IMU] MPU-6050 ready for aerospace attitude tracking.");
}

void loop() {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 6, true);

  int16_t ax = Wire.read() << 8 | Wire.read();
  int16_t ay = Wire.read() << 8 | Wire.read();
  int16_t az = Wire.read() << 8 | Wire.read();

  Serial.print("[IMU] Raw Accel X: "); Serial.print(ax);
  Serial.print(" | Y: "); Serial.print(ay);
  Serial.print(" | Z: "); Serial.println(az);
  delay(200);
}`,
      bom: [
        { item: "ESP32 Dev Board", qty: "1", note: "High-speed 400kHz hardware I2C master controller" },
        { item: "MPU-6050 Breakout Board", qty: "1", note: "Triple-axis MEMS accelerometer and rate gyro" },
        { item: "Breadboard & Jumpers", qty: "1 set", note: "Short leads recommended for I2C signal integrity" }
      ]
    },
    {
      id: "servo-actuation",
      title: "Precision Servo Actuation",
      consequenceFormula: "Angle positioning in automated valves, robotic arms, and sorting gates",
      industryTag: "Industrial Automation",
      category: "motion",
      difficulty: "Intermediate",
      timeEst: "60 mins",
      shortDesc: "Generate precise 50 Hz Pulse-Width Modulation (PWM) waveforms with 16-bit timer precision to command mechanical positioning from 0° to 180°.",
      longDesc: "When an industrial factory diverts a defective bottle from a high-speed line or an aircraft adjusts an aileron flap, mechanical servos turn digital code into physical motion. Students master PWM period and duty cycle calculations, configuring the ESP32's hardware LEDC PWM channels to generate accurate 1.0ms–2.0ms high pulses every 20ms.",
      mfgApplication: "Packaging divert gates, robotic gripper actuation, camera pan-tilt gimbals, and automated HVAC duct dampers.",
      pinoutTable: [
        { compPin: "Brown / Black (GND)", espPin: "GND", note: "Common system ground" },
        { compPin: "Red (Power +5V)", espPin: "VIN (External 5V)", note: "Never power high-torque servos from 3.3V rail" },
        { compPin: "Orange / Yellow (PWM)", espPin: "GPIO 13", note: "50 Hz PWM duty cycle control output" }
      ],
      micropythonCode: `# MicroLab: Precision Servo Actuation via 50 Hz PWM
from machine import Pin, PWM
import time

# ESP32 hardware PWM on GPIO 13 at 50 Hz (20ms period)
servo_pwm = PWM(Pin(13), freq=50)

def set_servo_angle(angle_deg):
    """
    Standard RC Servo:
    0°   = 1.0 ms pulse (duty ~ 1638 in 16-bit: 1ms / 20ms * 65535)
    90°  = 1.5 ms pulse (duty ~ 4915)
    180° = 2.0 ms pulse (duty ~ 8192)
    """
    angle = max(0, min(180, angle_deg))
    pulse_ms = 1.0 + (angle / 180.0) * 1.0
    duty_16 = int((pulse_ms / 20.0) * 65535)
    servo_pwm.duty_u16(duty_16)
    print(f"[SERVO] Commanded angle: {angle:3d}° (Pulse: {pulse_ms:.2f} ms)")

print("Servo position controller active. Sweeping test cycle...")
for target in [0, 45, 90, 135, 180, 90, 0]:
    set_servo_angle(target)
    time.sleep(1.0)

print("Position sweep verified.")`,
      arduinoCode: `// MicroLab: Precision Servo Actuation (C++)
#include <ESP32Servo.h>
Servo industrialServo;
const int SERVO_PIN = 13;

void setup() {
  Serial.begin(115200);
  industrialServo.attach(SERVO_PIN);
  Serial.println("[SERVO] Precision actuator controller online.");
}

void loop() {
  for (int pos = 0; pos <= 180; pos += 45) {
    industrialServo.write(pos);
    Serial.print("[SERVO] Position set to: ");
    Serial.print(pos);
    Serial.println(" degrees");
    delay(1000);
  }
}`,
      bom: [
        { item: "ESP32 Development Board", qty: "1", note: "Generates microsecond-resolution hardware PWM" },
        { item: "SG90 Micro Servo Motor", qty: "1", note: "Geared DC motor with internal potentiometer feedback" },
        { item: "External 5V Power Supply", qty: "1", note: "Supplies inrush current without MCU brownouts" },
        { item: "Capacitor (100µF, 16V)", qty: "1", note: "Decoupling capacitor across servo power rails" }
      ]
    }
  ],

  // Dynamic Blog & Lab Updates with Student Discussion Q&A
  blogPosts: [
    {
      id: "water-quality-adc",
      title: "Building an Industrial Continuous Water Quality Probe with ESP32 & ADC Calibration",
      date: "September 2026",
      author: "Gary Khan",
      authorRole: "Founder & Lead Engineer",
      readTime: "7 min read",
      industryTag: "Water & Environmental",
      excerpt: "Why factory liquid level and chemical conductivity probes fail when using raw analog counts, and how mathematical two-point slope calibration turns unpredictable ADC signals into certifiable telemetry.",
      content: `
        <h3>The Physical Reality of Liquid Sensing</h3>
        <p>In consumer electronics, analog readings are often treated as simple 0-to-100 percentages. In commercial water treatment plants, municipal reservoirs, and vertical hydroponic facilities, an uncalibrated probe can cause chemical overdosing or tank rupture.</p>
        <p>The ESP32 microcontroller features two 12-bit SAR Analog-to-Digital Converters (ADC1 and ADC2). However, like most silicon ADCs, the transfer curve is non-linear at the extreme low end (< 100 mV) and high end (> 3100 mV). To build a reliable water probe, students must implement two-point factory calibration:</p>
        <pre><code># Two-point calibration formula:
slope = (target_high - target_low) / (raw_high - raw_low)
calibrated_val = target_low + slope * (raw_reading - raw_low)</code></pre>
        <h3>Hardware Noise Suppression</h3>
        <p>When measuring liquid conductivity, electromagnetic noise from nearby pump motors couples directly into high-impedance ADC pins. We teach students to add an RC low-pass filter (1kΩ series resistor and 100nF ceramic capacitor) right at the GPIO terminal, cutting 60 Hz hum before the signal ever reaches the processor.</p>
      `,
      comments: [
        {
          id: "c1",
          author: "Marcus Vance",
          role: "High School Junior (Cincinnati CLC)",
          date: "2 days ago",
          text: "When we tested our conductivity probe in the lab, the readings fluctuated by almost 150 ADC counts whenever the aquarium bubbler turned on. Adding the 100nF capacitor between GPIO 34 and GND instantly flattened the trace! Is that standard in automotive sensors too?",
          status: "approved",
          pinned: true,
          instructorReply: {
            author: "Gary Khan",
            role: "Founder & Lead Engineer",
            date: "1 day ago",
            text: "Spot on, Marcus. Every single automotive sensor lead that passes through an engine harness has hardware RC filtering or ferrite beads to suppress spark plug and alternator noise before the ECU reads it. Excellent observation."
          }
        },
        {
          id: "c2",
          author: "Elena Rostova",
          role: "Pre-Engineering Student",
          date: "3 days ago",
          text: "Why did we use ADC1 (pins 32-39) instead of ADC2? My code threw an error whenever Wi-Fi was enabled on the ESP32.",
          status: "approved",
          pinned: false,
          instructorReply: {
            author: "Gary Khan",
            role: "Founder & Lead Engineer",
            date: "2 days ago",
            text: "Great catch, Elena! On the ESP32, ADC2 is shared with the Wi-Fi subsystem. The moment Wi-Fi transmission begins, the hardware driver claims ADC2. In industrial designs, we always reserve ADC1 channels (GPIOs 32–39) for analog process variables so wireless telemetry never interferes with sensing."
          }
        }
      ]
    },
    {
      id: "pir-facility-security",
      title: "Commercial PIR Motion Sensing: Why Facility Security Uses Dual Pyroelectric Elements",
      date: "August 2026",
      author: "Gary Khan",
      authorRole: "Founder & Lead Engineer",
      readTime: "6 min read",
      industryTag: "Facility Security & Automation",
      excerpt: "How commercial occupancy sensors reject sunlight thermal drafts using differential infrared crystals, and how to write non-blocking state machines in MicroPython.",
      content: `
        <h3>Beyond the Toy Motion Detector</h3>
        <p>Most hobbyist tutorials show a PIR sensor wired to a simple buzzer that triggers on any voltage spike. In commercial facility management—such as hospital corridors or secure server rooms—false alarms cost thousands of dollars.</p>
        <p>Commercial PIR sensors like the HC-SR501 utilize a dual-element pyroelectric sensor behind a segmented Fresnel lens. The two crystal windows are wired in series opposition: if ambient sunlight or HVAC warm air warms both windows simultaneously, the two signals cancel out to zero. A human body walking past sequentially hits window A, then window B, generating a distinct differential wave.</p>
        <pre><code># Non-blocking state machine pattern
class MotionSupervisor:
    def __init__(self, pin_num):
        self.pin = Pin(pin_num, Pin.IN)
        self.state = "IDLE"
        self.last_trigger_ms = 0
        self.holdoff_ms = 3000</code></pre>
      `,
      comments: [
        {
          id: "c3",
          author: "David Chen",
          role: "High School Senior",
          date: "5 days ago",
          text: "Does the Fresnel lens invert the infrared image or does it split the zone into distinct detection cones?",
          status: "approved",
          pinned: false,
          instructorReply: {
            author: "Gary Khan",
            role: "Founder & Lead Engineer",
            date: "4 days ago",
            text: "It splits the coverage area into multiple interlaced detection cones. As you walk across the room, you pass in and out of active beams, which produces the alternating AC pulse that trips the comparator."
          }
        }
      ]
    },
    {
      id: "servo-pwm-robotics",
      title: "PWM Servo Motor Control in Industrial Pick-and-Place Automation",
      date: "July 2026",
      author: "Gary Khan",
      authorRole: "Founder & Lead Engineer",
      readTime: "8 min read",
      industryTag: "Industrial Robotics",
      excerpt: "Understanding the physics of mechanical torque, pulse-width modulation resolution, and why dedicated power distribution is non-negotiable in robotics.",
      content: `
        <h3>The Brownout Trap</h3>
        <p>The number one mistake students make in their first robotics project is plugging a servo's power lead directly into the microcontroller's 5V USB pin. When the servo starts moving from a dead stop, its electric motor pulls a peak stall current of 500mA to 1.2A.</p>
        <p>This instantaneous current surge causes the microcontroller's voltage rail to dip below 2.7V, triggering a brownout reset (BOR). To a student, it looks like their code crashed randomly. In reality, it is a hardware power architecture flaw. In MicroLab, we teach proper power domain separation on day one.</p>
      `,
      comments: [
        {
          id: "c4",
          author: "Amira Patel",
          role: "College Freshman (Mechanical Eng)",
          date: "1 week ago",
          text: "I spent three hours thinking my Python code had a memory leak until we separated the servo ground and power supply. That single lesson about inrush current and brownout resets saved me on my college midterm lab!",
          status: "approved",
          pinned: true,
          instructorReply: {
            author: "Gary Khan",
            role: "Founder & Lead Engineer",
            date: "6 days ago",
            text: "That is exactly why MicroLab exists, Amira. That intuition cannot be learned by dragging blocks on a screen or reading a slide deck. You have to feel the hardware reset and trace the power rail."
          }
        }
      ]
    }
  ],

  // Accurate FAQs addressing the specific bugs from the copy plan
  faqs: [
    {
      id: "faq-downloads",
      question: "How do I download the project code and circuit schematics?",
      answer: "Every project on MicroLab includes direct, 1-click downloads for both MicroPython (.py) scripts and Arduino C++ (.ino) sketches, alongside detailed wiring pinout tables and Bill of Materials (BOM). You do not need an account or subscription to download and use the files."
    },
    {
      id: "faq-hardware",
      question: "Can I buy the required hardware kits directly, or can I use my own parts?",
      answer: "Both! We provide curated, turnkey MicroLab Hardware Kits containing pre-tested ESP32 dev boards, industrial sensor modules, optocoupler relays, jumper leads, and breadboards. If you already own standard electronic components, you can follow any project using your own hardware by referencing our open Bill of Materials."
    },
    {
      id: "faq-age-range",
      question: "What age range is MicroLab designed for, and what prerequisites are required?",
      answer: "MicroLab is designed primarily for students ages 11–17 and early undergraduate engineering/CS students, as well as adult career changers. No prior electronics or programming experience is required. We start with the physical breadboard and first LED line, progressing directly into industrial embedded protocols."
    },
    {
      id: "faq-schools",
      question: "How can I bring MicroLab to a school, YMCA, library, or community center?",
      answer: "We partner directly with Cincinnati Community Learning Centers (CLCs), YMCAs, school districts, and libraries to deliver turnkey semester workshops, after-school cohorts, and summer intensives. We supply hardware kits, instructor guides, lesson plans, and onsite facilitator training. Contact our team through the 'For Schools & Programs' section to schedule an exploratory call."
    }
  ]
};
