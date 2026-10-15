"""
ESP32 + DHT10 / AHT10 Sensor Reader in MicroPython
--------------------------------------------------
Default Wiring:
  - DHT10 VCC -> ESP32 3.3V
  - DHT10 GND -> ESP32 GND
  - DHT10 SCL -> ESP32 GPIO 22
  - DHT10 SDA -> ESP32 GPIO 21
"""

import time
from machine import I2C, Pin


class DHT10:
    I2C_ADDR = 0x38

    def __init__(self, i2c: I2C, address: int = I2C_ADDR):
        self.i2c = i2c
        self.address = address
        self._init_sensor()

    def _init_sensor(self):
        """Send initialization and calibration command to the DHT10/AHT10."""
        time.sleep_ms(100)
        try:
            # 0xE1, 0x08, 0x00: System initialization/calibration
            self.i2c.writeto(self.address, bytes([0xE1, 0x08, 0x00]))
            time.sleep_ms(20)
        except OSError as e:
            raise RuntimeError(
                f"Could not connect to DHT10 at address {hex(self.address)}. Check wiring! Error: {e}"
            )

    def read(self):
        """
        Trigger measurement and return (temperature_celsius, relative_humidity_percent).
        Raises RuntimeError if sensor is busy or fails to respond.
        """
        # 1. Trigger measurement command: 0xAC 0x33 0x00
        self.i2c.writeto(self.address, bytes([0xAC, 0x33, 0x00]))

        # 2. Wait for measurement conversion (~75-80ms)
        time.sleep_ms(80)

        # 3. Read 6 response bytes
        data = self.i2c.readfrom(self.address, 6)

        # 4. Check status bit 7 (0 = ready, 1 = busy)
        if data[0] & 0x80:
            raise RuntimeError("Sensor is busy.")

        # 5. Extract 20-bit raw data
        raw_humidity = (data[1] << 12) | (data[2] << 4) | (data[3] >> 4)
        raw_temp = ((data[3] & 0x0F) << 16) | (data[4] << 8) | data[5]

        # 6. Apply conversion formulas
        # Humidity (%): (raw / 2^20) * 100
        # Temperature (°C): ((raw / 2^20) * 200) - 50
        humidity = (raw_humidity / 1048576.0) * 100.0
        temp_c = (raw_temp / 1048576.0) * 200.0 - 50.0

        return temp_c, humidity


def main():
    print("=========================================")
    print(" ESP32 + DHT10 MicroPython Sensor Test   ")
    print("=========================================")

    # Initialize Hardware I2C on ESP32 default pins: SCL=GPIO22, SDA=GPIO21
    i2c = I2C(0, scl=Pin(22), sda=Pin(21), freq=100000)

    # Scan I2C bus to verify sensor presence
    devices = i2c.scan()
    print("I2C bus scan result:", [hex(d) for d in devices])

    if DHT10.I2C_ADDR not in devices:
        print(f"Warning: 0x38 not found in I2C scan! Please check connections.")

    # Initialize sensor instance
    sensor = DHT10(i2c)
    print("DHT10 initialized successfully!\n")

    while True:
        try:
            temp_c, humidity = sensor.read()
            temp_f = (temp_c * 9.0 / 5.0) + 32.0

            print(f"Temperature: {temp_c:.1f} °C ({temp_f:.1f} °F)  |  Humidity: {humidity:.1f} %")
        except Exception as e:
            print("Error reading sensor:", e)

        time.sleep(2)


if __name__ == "__main__":
    main()
