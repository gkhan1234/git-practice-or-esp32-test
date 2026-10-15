#include <Wire.h>
#include <Adafruit_AHTX0.h>

Adafruit_AHTX0 aht;

// ESP32 default I2C pins
#define I2C_SDA 21
#define I2C_SCL 22

void setup() {
  Serial.begin(115200);
  while (!Serial);

  Serial.println("=========================================");
  Serial.println(" ESP32 + DHT10 (Adafruit AHTX0 Library) ");
  Serial.println("=========================================");

  // Initialize I2C bus on GPIO 21 (SDA) and GPIO 22 (SCL)
  Wire.begin(I2C_SDA, I2C_SCL);

  if (!aht.begin(&Wire)) {
    Serial.println("Error: Could not detect DHT10 / AHT10 sensor. Check wiring!");
    while (1) {
      delay(10);
    }
  }

  Serial.println("DHT10 detected and ready!\n");
}

void loop() {
  sensors_event_t humidity, temp;
  aht.getEvent(&humidity, &temp);

  float temp_c = temp.temperature;
  float temp_f = (temp_c * 9.0 / 5.0) + 32.0;

  Serial.print("Temperature: ");
  Serial.print(temp_c, 1);
  Serial.print(" °C (");
  Serial.print(temp_f, 1);
  Serial.print(" °F)  |  Humidity: ");
  Serial.print(humidity.relative_humidity, 1);
  Serial.println(" %");

  delay(2000);  // Sample every 2 seconds
}
