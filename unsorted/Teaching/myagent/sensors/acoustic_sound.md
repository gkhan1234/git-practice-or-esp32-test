# Acoustic & Sound Sensors Reference Guide

This document contains comprehensive details, connection schematics, logic level requirements, and sample code for popular acoustic and sound sensors used with Arduino and ESP32 microcontrollers.

---

<a name="ky038"></a>
## KY-037 / KY-038: Microphone Sound Detector

These modules feature a capacitive electret microphone and a built-in LM393 voltage comparator. They provide both an analog representation of sound intensity and a digital latch signal when sound exceeds a user-set threshold (adjusted via an onboard multi-turn potentiometer).

### Technical Specifications
* **Operating Voltage:** 3.3V – 5.0V
* **Outputs:** 
  * **Analog Output (AO):** Real-time microphone voltage signal.
  * **Digital Output (DO):** Comparator output (Active Low/High depending on board design; usually goes HIGH when sound exceeds threshold).

### Typical Pinout

| Pin Name | Description | Connection (Arduino / ESP32) |
| :--- | :--- | :--- |
| **AO** | Analog Output | Any Analog Input pin (e.g., GPIO 34 / Pin A0) |
| **GND** | Ground | GND |
| **VCC** | Power Supply | 3.3V (ESP32) or 5V (Arduino) |
| **DO** | Digital Output | Any Digital Input pin (e.g., GPIO 25) |

### Recommended Libraries
* **No Library Required**: Uses standard `analogRead()` for sound level monitoring or `digitalRead()` / pin interrupts to detect sudden loud sounds (e.g., claps).

### Arduino / ESP32 Sample Code (Clap Detector)
```cpp
const int digitalSoundPin = 25; // DO connected to GPIO 25
volatile bool soundDetected = false;

void IRAM_ATTR soundISR() {
  soundDetected = true;
}

void setup() {
  Serial.begin(115200);
  pinMode(digitalSoundPin, INPUT);
  
  // Attach interrupt to detect transition when sound exceeds threshold
  attachInterrupt(digitalPinToInterrupt(digitalSoundPin), soundISR, RISING);
}

void loop() {
  if (soundDetected) {
    Serial.println("Loud Sound (Clap) Detected!");
    soundDetected = false;
    delay(500); // Debounce delay to ignore echo/reverberations
  }
}
```

---

<a name="max4466"></a>
## MAX4466 / MAX9814: Analog Microphone Amplifiers

Unlike the KY-037, these modules are designed for capturing actual audio waveforms rather than just detecting threshold crossings. 
* **MAX4466:** Features an adjustable gain op-amp. Excellent for voice changers, audio recording, and frequency spectrum analysis (FFT).
* **MAX9814:** Features Automatic Gain Control (AGC). Ideal for capturing whisper-quiet sounds or loud sounds without clipping.

### Technical Specifications
* **Operating Voltage:** 2.7V – 5.5V (Powering via 3.3V is highly recommended to minimize power line noise from the microcontroller's digital switching)
* **Output:** Analog audio waveform centered around VCC/2 (Requires AC coupling capacitor or DC bias offset subtraction in code).

### Typical Pinout

| Pin Name (MAX4466) | Pin Name (MAX9814) | Description | Connection (Arduino / ESP32) |
| :--- | :--- | :--- | :--- |
| **VCC** | **VDD** | Power Supply | 3.3V (Highly filtered analog rail) |
| **GND** | **GND** | Ground | GND |
| **OUT** | **OUT** | Analog Audio Output | Analog Input pin (e.g., GPIO 36 / Pin A0) |
| *N/A* | **GAIN** | Gain Select (MAX9814 only) | Connect to GND (50dB), VDD (40dB), or Float (60dB) |
| *N/A* | **AR** | Attack/Release Ratio | Connect to VDD or GND to adjust response (Optional) |

### Recommended Libraries
* **No Library Required**: Captured raw using high-speed ADC sampling (timer interrupts or I2S ADC mode on ESP32).
* **arduinoFFT** by Didier Dousset (To perform Fast Fourier Transforms and detect dominant audio frequencies).

### Arduino / ESP32 Sample Code (Vpp Sound Level Meter)
```cpp
const int micPin = 36; // OUT pin connected to GPIO 36 (ADC1_CH0)
const int sampleWindow = 50; // Sample window width in mS (50 mS = 20Hz)
unsigned int sample;

void setup() {
  Serial.begin(115200);
}

void loop() {
  unsigned long startMillis = millis(); // Start of sample window
  unsigned int peakToPeak = 0;   // peak-to-peak level

  unsigned int signalMax = 0;
  unsigned int signalMin = 4095; // ESP32 12-bit ADC max

  // collect data for 50 mS
  while (millis() - startMillis < sampleWindow) {
    sample = analogRead(micPin);
    if (sample < 4095) { // filter out spurious readings
      if (sample > signalMax) {
        signalMax = sample; // save just the peak high level
      } else if (sample < signalMin) {
        signalMin = sample; // save just the peak low level
      }
    }
  }
  
  peakToPeak = signalMax - signalMin;  // max - min = peak-to-peak amplitude
  float volts = (peakToPeak * 3.3) / 4095.0;  // convert to volts for ESP32

  Serial.print("Volts Peak-to-Peak: ");
  Serial.println(volts);
  
  delay(10);
}
```

---

<a name="inmp441"></a>
## INMP441: I2S Digital Microphone

The INMP441 is a high-performance, low-power, digital-output, omnidirectional MEMS microphone with a bottom port. It outputs a 24-bit industry-standard I2S (Inter-IC Sound) digital audio signal, bypassing the microcontroller's analog-to-digital converter completely to deliver noise-free audio.

### Technical Specifications
* **Operating Voltage:** 1.8V – 3.3V (Do **not** connect to 5V; this will damage the sensor chip)
* **Interface:** I2S (Digital audio protocol using clock lines and a serial data line)
* **SNR (Signal-to-Noise Ratio):** 61 dBA

### Typical Pinout

| Pin Name | Description | Connection (ESP32 Example) |
| :--- | :--- | :--- |
| **VDD** | Power Supply (1.8V - 3.3V) | 3.3V |
| **GND** | Ground | GND |
| **L/R** | Left/Right Channel Select | GND (Left Channel) or VDD (Right Channel) |
| **WS** | Word Select (LRCLK) | GPIO 25 |
| **SD** | Serial Data (DOUT) | GPIO 33 |
| **SCK** | Serial Clock (BCLK) | GPIO 32 |

### Software / Driver Guide
Because the INMP441 outputs raw I2S data, standard `analogRead()` cannot be used. Instead, configure the native ESP32 I2S peripherals.
* **Native Approach:** Include the `#include <driver/i2s.h>` header which is part of the ESP32 Arduino Core.
* **Simplifying Library:** **ESP32-AudioTools** by Phil Schatzmann provides a clean stream-based C++ interface for configuration and digital signal processing.

### ESP32 Sample Code (Using Native I2S API)
```cpp
#include <driver/i2s.h>

#define I2S_WS 25
#define I2S_SD 33
#define I2S_SCK 32
#define I2S_PORT I2S_NUM_0

void setup() {
  Serial.begin(115200);
  
  // Set up I2S Configuration
  const i2s_config_t i2s_config = {
    .mode = i2s_mode_t(I2S_MODE_MASTER | I2S_MODE_RX), // Master Receiver mode
    .sample_rate = 16000,                              // 16kHz sample rate
    .bits_per_sample = i2s_bits_per_sample_t(16),       // 16-bit audio depth
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,       // L/R pin grounded -> Left only
    .communication_format = i2s_comm_format_t(I2S_COMM_FORMAT_STAND_I2S),
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,          // Interrupt level 1
    .dma_buf_count = 8,                                // Number of DMA buffers
    .dma_buf_len = 64,                                 // Size of each buffer
    .use_apll = false
  };

  // Set up I2S Pin mappings
  const i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_SCK,
    .ws_io_num = I2S_WS,
    .data_out_num = -1, // Not used (input only)
    .data_in_num = I2S_SD
  };

  // Install and start I2S driver
  i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
  i2s_set_pin(I2S_PORT, &pin_config);
  i2s_start(I2S_PORT);
}

void loop() {
  int32_t raw_sample = 0;
  size_t bytes_read = 0;
  
  // Read a single 32-bit container (DMA handles buffering)
  i2s_read(I2S_PORT, &raw_sample, sizeof(raw_sample), &bytes_read, portMAX_DELAY);
  
  if (bytes_read > 0) {
    // Standardize 24-bit signed data packed into 32-bit variable
    raw_sample >>= 14; // Shift according to sample depth and configuration
    Serial.println(raw_sample); // Output to Serial Plotter to see waveform
  }
}
```
