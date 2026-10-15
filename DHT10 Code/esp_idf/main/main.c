#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "esp_err.h"
#include "driver/i2c.h"

static const char *TAG = "DHT10_ESP32";

#define I2C_MASTER_NUM              I2C_NUM_0
#define I2C_MASTER_SDA_IO           GPIO_NUM_21
#define I2C_MASTER_SCL_IO           GPIO_NUM_22
#define I2C_MASTER_FREQ_HZ          100000
#define I2C_MASTER_TX_BUF_DISABLE   0
#define I2C_MASTER_RX_BUF_DISABLE   0
#define I2C_MASTER_TIMEOUT_MS       1000

#define DHT10_SENSOR_ADDR           0x38

/**
 * @brief Initialize the ESP32 I2C Master interface
 */
static esp_err_t i2c_master_init(void) {
    i2c_config_t conf = {
        .mode = I2C_MODE_MASTER,
        .sda_io_num = I2C_MASTER_SDA_IO,
        .sda_pullup_en = GPIO_PULLUP_ENABLE,
        .scl_io_num = I2C_MASTER_SCL_IO,
        .scl_pullup_en = GPIO_PULLUP_ENABLE,
        .master.clk_speed = I2C_MASTER_FREQ_HZ,
        .clk_flags = 0,
    };

    esp_err_t err = i2c_param_config(I2C_MASTER_NUM, &conf);
    if (err != ESP_OK) {
        return err;
    }

    return i2c_driver_install(I2C_MASTER_NUM, conf.mode,
                              I2C_MASTER_RX_BUF_DISABLE,
                              I2C_MASTER_TX_BUF_DISABLE, 0);
}

/**
 * @brief Send initialization and calibration command to DHT10
 */
static esp_err_t dht10_init_sensor(void) {
    vTaskDelay(pdMS_TO_TICKS(100));

    // Initialization command: 0xE1 0x08 0x00
    uint8_t init_cmd[3] = {0xE1, 0x08, 0x00};
    esp_err_t ret = i2c_master_write_to_device(
        I2C_MASTER_NUM,
        DHT10_SENSOR_ADDR,
        init_cmd,
        sizeof(init_cmd),
        pdMS_TO_TICKS(I2C_MASTER_TIMEOUT_MS)
    );

    vTaskDelay(pdMS_TO_TICKS(20));
    return ret;
}

/**
 * @brief Read temperature and humidity from DHT10
 */
static esp_err_t dht10_read(float *temperature, float *humidity) {
    // 1. Send measurement trigger: 0xAC 0x33 0x00
    uint8_t trigger_cmd[3] = {0xAC, 0x33, 0x00};
    esp_err_t ret = i2c_master_write_to_device(
        I2C_MASTER_NUM,
        DHT10_SENSOR_ADDR,
        trigger_cmd,
        sizeof(trigger_cmd),
        pdMS_TO_TICKS(I2C_MASTER_TIMEOUT_MS)
    );
    if (ret != ESP_OK) {
        return ret;
    }

    // 2. Wait for measurement conversion (~75-80ms)
    vTaskDelay(pdMS_TO_TICKS(80));

    // 3. Read 6 response bytes
    uint8_t data[6] = {0};
    ret = i2c_master_read_from_device(
        I2C_MASTER_NUM,
        DHT10_SENSOR_ADDR,
        data,
        sizeof(data),
        pdMS_TO_TICKS(I2C_MASTER_TIMEOUT_MS)
    );
    if (ret != ESP_OK) {
        return ret;
    }

    // 4. Check status bit 7 (0 = ready, 1 = busy)
    if (data[0] & 0x80) {
        ESP_LOGW(TAG, "Sensor is still busy, data not ready");
        return ESP_ERR_INVALID_STATE;
    }

    // 5. Extract 20-bit raw values
    uint32_t raw_hum = ((uint32_t)data[1] << 12) | ((uint32_t)data[2] << 4) | ((uint32_t)data[3] >> 4);
    uint32_t raw_temp = (((uint32_t)data[3] & 0x0F) << 16) | ((uint32_t)data[4] << 8) | (uint32_t)data[5];

    // 6. Formulas:
    // Humidity (%) = (raw / 2^20) * 100
    // Temperature (°C) = ((raw / 2^20) * 200) - 50
    *humidity = ((float)raw_hum / 1048576.0f) * 100.0f;
    *temperature = (((float)raw_temp / 1048576.0f) * 200.0f) - 50.0f;

    return ESP_OK;
}

void app_main(void) {
    ESP_LOGI(TAG, "Starting ESP-IDF DHT10 / AHT10 Application...");

    ESP_ERROR_CHECK(i2c_master_init());
    ESP_LOGI(TAG, "I2C initialized (SDA: GPIO %d, SCL: GPIO %d)", I2C_MASTER_SDA_IO, I2C_MASTER_SCL_IO);

    esp_err_t err = dht10_init_sensor();
    if (err == ESP_OK) {
        ESP_LOGI(TAG, "DHT10 initialized successfully!");
    } else {
        ESP_LOGE(TAG, "Failed to initialize DHT10: %s (check wiring)", esp_err_to_name(err));
    }

    while (1) {
        float temperature = 0.0f;
        float humidity = 0.0f;

        esp_err_t status = dht10_read(&temperature, &humidity);
        if (status == ESP_OK) {
            float temp_f = (temperature * 9.0f / 5.0f) + 32.0f;
            ESP_LOGI(TAG, "Temperature: %.1f °C (%.1f °F) | Humidity: %.1f %%",
                     temperature, temp_f, humidity);
        } else {
            ESP_LOGW(TAG, "Failed to read sensor: %s", esp_err_to_name(status));
        }

        vTaskDelay(pdMS_TO_TICKS(2000));
    }
}
