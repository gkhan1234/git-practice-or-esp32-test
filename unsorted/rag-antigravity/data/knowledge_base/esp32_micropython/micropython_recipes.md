# MicroPython Programming Patterns for ESP32

## 1. Digital Output: Blinking an LED
To control an LED connected to GPIO 2 (common onboard LED) or external pin:

```python
import time
from machine import Pin

# Setup GPIO 2 as an output
led = Pin(2, Pin.OUT)

while True:
    led.value(1)  # Turn LED on (3.3V)
    time.sleep(0.5)
    led.value(0)  # Turn LED off (0V)
    time.sleep(0.5)
```

## 2. Digital Input: Push Button with Internal Pull-up
Always use a pull-up or pull-down resistor so the pin doesn't "float" (pick up random electrical noise).

```python
import time
from machine import Pin

# Pin.PULL_UP holds pin at 3.3V when button is not pressed.
# Wire button between GPIO 4 and GND. When pressed, value() is 0.
button = Pin(4, Pin.IN, Pin.PULL_UP)
led = Pin(2, Pin.OUT)

while True:
    if button.value() == 0:  # Pressed!
        led.value(1)
    else:
        led.value(0)
    time.sleep(0.05)  # Simple debounce delay
```

## 3. Analog Input (ADC): Reading Potentiometers and Sensors
ESP32 has a 12-bit ADC (values from 0 to 4095).
By default, the input voltage range is limited to ~1.0V unless attenuation is configured!

```python
import time
from machine import ADC, Pin

# Use ADC1 pins like GPIO 34, 35, 36, 39 to avoid Wi-Fi conflicts
pot = ADC(Pin(34))

# Set 11dB attenuation to read full 0V to 3.3V range!
pot.atten(ADC.ATTN_11DB)
pot.width(ADC.WIDTH_12BIT)  # 0 to 4095 resolution

while True:
    raw_val = pot.read()
    voltage = (raw_val / 4095.0) * 3.3
    print("Raw: {} | Voltage: {:.2f}V".format(raw_val, voltage))
    time.sleep(0.2)
```

## 4. Pulse Width Modulation (PWM): LED Dimming & Motors
PWM switches voltage on and off quickly to simulate analog voltage output.

```python
import time
from machine import PWM, Pin

# PWM frequency: 1000Hz is typical for LEDs
pwm_led = PWM(Pin(2), freq=1000)

# In ESP32 MicroPython, duty cycle is 0 to 1023 (10-bit)
while True:
    # Fade in
    for duty in range(0, 1024, 50):
        pwm_led.duty(duty)
        time.sleep(0.02)
    # Fade out
    for duty in range(1023, -1, -50):
        pwm_led.duty(duty)
        time.sleep(0.02)
```

## 5. Servo Motor Control with PWM (SG90)
Standard hobby servos require a 50Hz PWM frequency ($20\text{ms}$ period).
- **0 degrees:** ~1.0ms pulse (duty $\approx 25$ to $40$)
- **90 degrees:** ~1.5ms pulse (duty $\approx 75$ to $77$)
- **180 degrees:** ~2.0ms pulse (duty $\approx 115$ to $125$)

```python
import time
from machine import PWM, Pin

servo = PWM(Pin(13), freq=50)


def set_angle(angle):
    # Map 0 - 180 degrees to duty cycle approx 26 to 128 (out of 1024)
    duty = int(26 + (angle / 180.0) * (128 - 26))
    servo.duty(duty)


# Sweep servo back and forth
while True:
    set_angle(0)
    time.sleep(1)
    set_angle(90)
    time.sleep(1)
    set_angle(180)
    time.sleep(1)
```

> [!WARNING]
> Powering the servo directly from the ESP32's 3.3V pin can cause brownouts (reboots) or destroy the regulator. Power the servo from external 5V and connect the external GND to ESP32 GND!

## 6. I2C Bus Scanner
For connecting displays (SSD1306 OLED) or digital sensors (BME280, MPU6050):

```python
from machine import I2C, Pin

# ESP32 default hardware I2C pins: SCL=GPIO 22, SDA=GPIO 21
i2c = I2C(0, scl=Pin(22), sda=Pin(21), freq=400000)

devices = i2c.scan()
print("Scanning I2C bus...")
if not devices:
    print("No I2C devices found! Check wiring and pull-up resistors.")
else:
    for device in devices:
        print("Device found at hex address: 0x{:02X}".format(device))
```
