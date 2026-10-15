# ESP32 DevKitC 30-Pin Pinout (ESP-WROOM-32)

Chip: ESP32-D0WD-V3 rev3.1 | MAC: 14:33:5c:38:27:ec
Firmware: MicroPython v1.28.0 (2026-04-06)
Serial port: /dev/cu.usbserial-0001 @ 115200 baud

Orientation: USB connector facing DOWN, left side = left column.

---

## LEFT SIDE (top to bottom)

| Pin | Label | GPIO | Function |
|-----|-------|------|----------|
| L1  | 3V3   | —    | 3.3V power output |
| L2  | EN    | —    | Reset (active HIGH) |
| L3  | VP    | 36   | Input only, ADC1_CH0 |
| L4  | VN    | 39   | Input only, ADC1_CH3 |
| L5  | IO34  | 34   | Input only, ADC1_CH6 |
| L6  | IO35  | 35   | Input only, ADC1_CH7 |
| L7  | IO32  | 32   | ADC1_CH4, Touch9 |
| L8  | IO33  | 33   | ADC1_CH5, Touch8 |
| L9  | IO25  | 25   | ADC2_CH8, DAC1 |
| L10 | IO26  | 26   | ADC2_CH9, DAC2 |
| L11 | IO27  | 27   | ADC2_CH7, Touch7 |
| L12 | IO14  | 14   | ADC2_CH6, Touch6, HSPI CLK |
| L13 | IO12  | 12   | ADC2_CH5, Touch5, HSPI MISO — strapping pin |
| L14 | GND   | —    | Ground |
| L15 | IO13  | 13   | ADC2_CH4, Touch4, HSPI MOSI |

---

## RIGHT SIDE (top to bottom)

| Pin | Label | GPIO | Function |
|-----|-------|------|----------|
| R1  | GND   | —    | Ground |
| R2  | IO23  | 23   | VSPI MOSI |
| R3  | IO22  | 22   | I2C SCL (default) |
| R4  | TX    | 1    | UART0 TX — used by USB serial |
| R5  | RX    | 3    | UART0 RX — used by USB serial |
| R6  | IO21  | 21   | I2C SDA (default) |
| R7  | GND   | —    | Ground |
| R8  | IO19  | 19   | VSPI MISO |
| R9  | IO18  | 18   | VSPI CLK |
| R10 | IO5   | 5    | VSPI CS0 — strapping pin |
| R11 | IO17  | 17   | UART2 TX |
| R12 | IO16  | 16   | UART2 RX |
| R13 | IO4   | 4    | ADC2_CH0, Touch0 |
| R14 | IO0   | 0    | BOOT button, ADC2_CH1, Touch1 — strapping pin |
| R15 | IO2   | 2    | ADC2_CH2, Touch2 — strapping pin |

---

## GPIO Categories

| Category | GPIOs |
|----------|-------|
| Safe general-purpose I/O | 4, 13, 14, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33 |
| Input only (no pull-up/down) | 34, 35, 36 (VP), 39 (VN) |
| Strapping pins (affect boot) | 0, 2, 5, 12, 15 |
| UART0 (USB serial) | TX=1, RX=3 — avoid while using mpremote/REPL |
| UART2 | TX=17, RX=16 |
| I2C defaults | SDA=21, SCL=22 |
| SPI (VSPI) defaults | MOSI=23, MISO=19, CLK=18, CS=5 |
| DAC | DAC1=25, DAC2=26 |
| Do NOT use | 6, 7, 8, 9, 10, 11 — internal SPI flash |

---

## MicroPython Usage Examples

```python
from machine import Pin, ADC, DAC, I2C, SPI

# Digital output
led = Pin(2, Pin.OUT)
led.value(1)

# Digital input with pull-up
btn = Pin(4, Pin.IN, Pin.PULL_UP)
print(btn.value())

# ADC (input-only pins)
adc = ADC(Pin(36))
adc.atten(ADC.ATTN_11DB)   # 0-3.3V range
print(adc.read())           # 0-4095

# DAC output
dac = DAC(Pin(25))
dac.write(128)              # 0-255

# I2C
i2c = I2C(0, scl=Pin(22), sda=Pin(21), freq=400000)
print(i2c.scan())

# Internal temperature sensor
import esp32
print(esp32.raw_temperature(), 'F')
```
