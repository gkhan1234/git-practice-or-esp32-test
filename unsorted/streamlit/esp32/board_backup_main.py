import sys
import select
from machine import Pin

# Built-in LED on most ESP32 boards is on GPIO 2
led = Pin(2, Pin.OUT)

print("ESP32 USB Serial Test Ready!")

while True:
    # Check if there is data waiting in the USB Serial buffer
    if select.select([sys.stdin], [], [], 0.01)[0]:
        # Read the line sent from Node-RED
        command = sys.stdin.readline().strip()

        if command == "LED_ON":
            led.value(1)
            print("Status: LED is ON")
        elif command == "LED_OFF":
            led.value(0)
            print("Status: LED is OFF")
