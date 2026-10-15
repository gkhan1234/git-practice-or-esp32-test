#include <Wire.h>

#define DHT10_ADDR 0x38  // Default I2C address for DHT10 / AHT10

// ESP32 default I2C pins
#define I2C_SDA 21
#define I2C_SCL 22

void initDHT10() {
  Wire.beginTransmission(DHT10_ADDR);
  Wire.write(0xE1);  // Calibration command
  Wire.write(0x08);
  Wire.write(0x00);
  Wire.endTransmission();
  delay(20);
}

void setup() {
  Serial.begin(115200);
  while (!Serial);

  Serial.println("=====================================");
  Serial.println(" ESP32 + DHT10 / AHT10 Sensor Test  ");
  Serial.println("=====================================");

  // Initialize I2C communication
  Wire.begin(I2C_SDA, I2C_SCL);
  delay(100);

  // Initialize and calibrate sensor
  initDHT10();
  Serial.println("Sensor initialized successfully!\n");
}

void loop() {
  // 1. Send measurement trigger command
  Wire.beginTransmission(DHT10_ADDR);
  Wire.write(0xAC);  // Measurement trigger
  Wire.write(0x33);
  Wire.write(0x00);
  Wire.endTransmission();

  // DHT10 measurement takes ~75-80ms
  delay(80);

  // 2. Request 6 data bytes from sensor
  if (Wire.requestFrom(DHT10_ADDR, 6) == 6) {
    uint8_t data[6];
    for (int i = 0; i < 6; i++) {
      data[i] = Wire.read();
    }

    // Check status bit 7 (0 = measurement ready, 1 = busy)
    if ((data[0] & 0x80) == 0) {
      // 3. Extract 20-bit raw humidity & temperature
      uint32_t raw_humidity = ((uint32_t)data[1] << 12) | ((uint32_t)data[2] << 4) | ((uint32_t)data[3] >> 4);
      uint32_t raw_temp     = (((uint32_t)data[3] & 0x0F) << 16) | ((uint32_t)data[4] << 8) | (uint32_t)data[5];

      // Conversion formulas:
      // Humidity (%) = (raw / 2^20) * 100
      // Temperature (°C) = ((raw / 2^20) * 200) - 50
      float humidity    = ((float)raw_humidity / 1048576.0) * 100.0;
      float temperature = (((float)raw_temp / 1048576.0) * 200.0) - 50.0;
      float temp_f      = (temperature * 9.0 / 5.0) + 32.0;

      // Print results to Serial Monitor
      Serial.print("Temperature: ");
      Serial.print(temperature, 1);
      Serial.print(" °C (");
      Serial.print(temp_f, 1);
      Serial.print(" °F)  |  Humidity: ");
      Serial.print(humidity, 1);
      Serial.println(" %");
    } else {
      Serial.println("Sensor is still busy, skipping reading...");
    }
  } else {
    Serial.println("Error: Failed to read data from DHT10. Please check wiring!");
  }

  // Read every 2 seconds
  delay(2000);
}
