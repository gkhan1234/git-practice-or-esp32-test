# Sensors, Actuators & Motor Control

## 1. DC Motors & Driving Circuits

### Why You Cannot Drive a Motor Directly from an ESP32 GPIO
An ESP32 GPIO pin can supply a maximum of **12mA** safely.
Even a tiny DC toy motor draws **100mA to 500mA** running freely, and over **1000mA (1 Amp)** when stalled or starting up!
Attempting to connect a motor directly to a GPIO pin will immediately burn out the microcontroller output stage.

### Single-Direction DC Motor Control (MOSFET Driver)
To turn a motor on/off or vary speed using PWM in one direction:
- **Components:** Logic-level N-Channel MOSFET (e.g. IRLZ44N), 100Ω gate resistor, 10kΩ gate pull-down resistor, 1N4001 flyback diode, external motor power supply (e.g. 5V - 12V).
- **Wiring Layout:**
  ```
  Motor (+)  <---> External Power Supply Positive (+V_motor)
  Motor (-)  <---> MOSFET Drain (D)
  Flyback Diode: Cathode (stripe) to Motor (+), Anode to Motor (-)
  MOSFET Source (S) <---> Common GND (tied to ESP32 GND and Power Supply GND)
  ESP32 GPIO <---> 100Ω Resistor <---> MOSFET Gate (G)
  MOSFET Gate (G) <---> 10kΩ Resistor <---> Common GND
  ```
- **MicroPython Speed Control:**
  ```python
  import time
  from machine import PWM, Pin

  # Setup PWM on GPIO 25 at 1000Hz
  motor_pwm = PWM(Pin(25), freq=1000)

  # Ramp up speed
  for duty in range(0, 1024, 100):
      motor_pwm.duty(duty)
      time.sleep(0.5)

  # Turn off
  motor_pwm.duty(0)
  ```

### Bi-Directional Motor Control (H-Bridge Drivers: L298N / TB6612FNG)
An H-bridge uses 4 switches to reverse the polarity of voltage across the motor terminals, allowing forward and reverse rotation:
- **TB6612FNG (Recommended for modern projects):** Highly efficient MOSFET-based H-bridge, produces very little heat, 3.3V logic compatible.
- **L298N:** Classic dual H-bridge (BJT based). Drops ~2V internally as heat. Ensure the 5V logic jumper is set properly.

---

## 2. Servo Motors (SG90 / MG995)

Servos contain a DC motor, gearbox, potentiometer, and control circuit. They rotate to a specific angle (typically 0° to 180°) based on the width of a 50Hz PWM pulse.

### Pinout (Standard 3-wire):
- **Brown or Black:** GND (connect to ESP32 GND and External 5V supply GND).
- **Red:** Power (+5V external supply). *Do NOT use ESP32 3.3V pin!*
- **Orange or Yellow:** Signal (connect to ESP32 GPIO, e.g., GPIO 13).

---

## 3. Ultrasonic Distance Sensor (HC-SR04 / RCWL-1601)

Sends out a 40kHz ultrasound burst and measures the time until the echo bounces back:
$$\text{Distance (cm)} = \frac{\text{Time in microseconds} \times 0.0343}{2}$$

### Interfacing HC-SR04 with ESP32:
- Standard HC-SR04 runs on **5V VCC**.
- The `Trigger` pin accepts 3.3V logic from the ESP32 directly.
- **CRITICAL:** The `Echo` pin outputs a **5V signal**! Feeding 5V into an ESP32 GPIO pin will burn it out.
- **Solution:** Place a voltage divider on the Echo line:
  - Echo pin -> 1kΩ resistor -> ESP32 GPIO (reads ~3.3V)
  - ESP32 GPIO -> 2kΩ resistor -> GND

### MicroPython HC-SR04 Example:
```python
import time
from machine import Pin, time_pulse_us

trig = Pin(5, Pin.OUT)
echo = Pin(18, Pin.IN)

trig.value(0)
time.sleep_ms(50)


def get_distance_cm():
    # Send 10µs pulse to trigger
    trig.value(1)
    time.sleep_us(10)
    trig.value(0)

    # Measure echo pulse duration in microseconds
    duration = time_pulse_us(echo, 1, 30000)  # 30ms timeout (~5 meters)
    if duration < 0:
        return None  # Out of range or timeout
    distance = (duration * 0.0343) / 2
    return distance


while True:
    dist = get_distance_cm()
    if dist is not None:
        print("Distance: {:.1f} cm".format(dist))
    else:
        print("Out of range")
    time.sleep(0.2)
```

---

## 4. Light Sensor (LDR / Photoresistor)
An LDR changes its resistance based on ambient light:
- Bright light: Resistance drops (hundreds of Ohms).
- Darkness: Resistance increases (Mega-Ohms).

### Circuit (Voltage Divider to ESP32 ADC):
- Connect 3.3V to one leg of LDR.
- Connect other leg of LDR to ESP32 GPIO 34 (ADC1).
- Connect a 10kΩ resistor from GPIO 34 to GND.
- As light increases, LDR resistance decreases, so the voltage at GPIO 34 rises toward 3.3V.
