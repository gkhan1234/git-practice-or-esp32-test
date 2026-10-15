import sys
import select
from machine import Pin, PWM

# Serial PWM server: reads comma-separated commands from stdin (the USB
# serial line) and drives the LEDC peripheral accordingly. One line in,
# one line back.
#
#   SET,<pin>,<freq_hz>,<duty_u16>   -> attach/update PWM on <pin>
#   OFF,<pin>                        -> stop PWM on <pin>, drive it low
#   PING                             -> PONG (liveness check)

pwms = {}


def set_pwm(pin_num, freq, duty):
    pwm = pwms.get(pin_num)
    if pwm is None:
        pwm = PWM(Pin(pin_num))
        pwms[pin_num] = pwm
    pwm.freq(freq)
    pwm.duty_u16(duty)


def stop_pwm(pin_num):
    pwm = pwms.pop(pin_num, None)
    if pwm is not None:
        pwm.deinit()
        Pin(pin_num, Pin.OUT).value(0)


print("READY: ESP32 PWM Serial Server")

while True:
    if select.select([sys.stdin], [], [], 0.01)[0]:
        line = sys.stdin.readline().strip()
        if not line:
            continue
        parts = line.split(",")
        cmd = parts[0]
        try:
            if cmd == "SET":
                pin_num = int(parts[1])
                freq = int(parts[2])
                duty = int(parts[3])
                set_pwm(pin_num, freq, duty)
                print("OK SET {} {} {}".format(pin_num, freq, duty))
            elif cmd == "OFF":
                pin_num = int(parts[1])
                stop_pwm(pin_num)
                print("OK OFF {}".format(pin_num))
            elif cmd == "PING":
                print("PONG")
            else:
                print("ERR unknown command: {}".format(cmd))
        except Exception as e:
            print("ERR {}".format(e))
