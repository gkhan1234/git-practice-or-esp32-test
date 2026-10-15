# AGV Warehouse Robot — Bill of Materials

Platform: ESP32 + MicroPython · 4×AA power · QR manifest via ESP32-CAM · Obstacle avoidance via HC-SR04
Class size: 1 AGV per student group. Prices are approximate USD, bulk/AliExpress-class suppliers.

## Core electronics

| # | Part | Spec / Notes | Qty | Purpose | ~$ |
|---|------|--------------|-----|---------|----|
| 1 | ESP32 DevKit V1 | 30/38-pin, CP2102 or CH340 USB | 1 | Main robot brain (MicroPython) | 5 |
| 2 | ESP32-CAM | OV2640, 4 MB PSRAM | 1 | QR manifest scanning at dock | 8 |
| 3 | ESP32-CAM programmer | MB-style USB-UART adapter | 1 | Flashing/UART link to main ESP32 | 2 |
| 4 | HC-SR04 | Ultrasonic rangefinder | 1 | Obstacle detection (the "avoidance camera") | 1.50 |
| 5 | MPU6050 (GY-521) | I2C accelerometer + gyro | 1 | Smoothness/shock/tilt data | 2 |
| 6 | INA219 | I2C current + voltage sensor | 1 | Battery voltage/current → Wh efficiency data | 2 |
| 7 | DRV8833 driver | Dual H-bridge, 2.7–10.8 V, 1.5 A/ch, PWM — no BEC, needs separate 5 V rail | 1 | TT motor drive | 2.50 |
| 8 | SSD1306 OLED | 0.96" I2C 128×32, 4-pin | 1 | Live mission display: status, next stop, speed, battery V, dwell countdown | 3 |
| 9 | Buzzer + LED | Active buzzer 3–5 V, 5 mm LED | 1 each | Alarm on low battery / errors | 0.50 |

## Drive & chassis

| # | Part | Spec / Notes | Qty | Purpose | ~$ |
|---|------|--------------|-----|---------|----|
| 10 | TT gear motor | 3–6 V, ~200 RPM, with encoder slots | 2 | Differential drive | 3 |
| 11 | TT motor encoder kit | Encoder disc + IR slot sensor pair (reader included) | 2 | Real speed/distance data (essential for efficiency metrics) | 2 |
| 12 | TT wheels + caster | 65 mm rubber wheels, 1 metal ball caster | 2 + 1 | Drive + balance | 3 |
| 13 | Chassis | 2WD TT chassis kit **or** custom plate from your vehicle drawing | 1 | Base platform | 4 |
| 14 | Upper deck / standoffs | M3 standoffs 20–30 mm + screws | 1 set | Electronics deck above motors | 2 |

## Power

| # | Part | Spec / Notes | Qty | Purpose | ~$ |
|---|------|--------------|-----|---------|----|
| 15 | Battery holder | 4×AA with switch + DC plug | 1 | Power source (6 V nominal) | 1 |
| 16 | AA NiMH rechargeables | 2000 mAh (eneloop-type) | 8 | 2 sets per group (1 running, 1 charging) | 10 |
| 17 | AA smart charger | 4-bay | 1 | "Charging station" for the fleet | 12 |
| 18 | Buck converter | Mini 360 / LM2596, set to 5 V | 1 | Stable 5 V for ESP32 + logic | 1.50 |
| 19 | INA219 shunt note | Place INA219 between pack and load | — | Measures whole-system draw | — |

## QR & navigation

| # | Part | Spec / Notes | Qty | Purpose | ~$ |
|---|------|--------------|-----|---------|----|
| 20 | QR manifest labels | 3–5 cm, matte paper, plain ASCII IDs | 20 | Mission manifests + spare set | 1 (print) |
| 21 | Stop point markers | Printed floor markers P1–P5 | 5 | Visual stop locations (optional) | — |
| 22 | Home dock marker | QR "HOME" + alignment lines | 1 | Return-to-home target / charge bay | — |
| 23 | Dock contacts (optional) | Brass strips + spring pins | 1 set | Real charging contact demo (advanced) | 3 |

## Wiring & assembly

| # | Part | Spec / Notes | Qty | Purpose | ~$ |
|---|------|--------------|-----|---------|----|
| 24 | Jumper wires | M-M, M-F, F-F, 20 cm | 3 packs | Connections | 3 |
| 25 | Perfboard or breakout | 5×7 cm perfboard + header pins | 1 | Clean sensor/driver wiring hub | 1 |
| 26 | Micro-USB data cables | **Data-capable** (not charge-only) | 2 | Flashing ESP32 + ESP32-CAM | 3 |
| 27 | Misc hardware | M3 screws/nuts, zip ties, heatshrink, switch | 1 kit | Assembly | 3 |

## Summary

| Category | ~Cost per AGV |
|----------|---------------|
| Core electronics | ~27 |
| Drive & chassis | ~15 |
| Power | ~15 (shared charger amortized) |
| QR & markers | ~2 |
| Wiring & misc | ~7 |
| **Total** | **≈ $65 per group** |

## Pin budget check (main ESP32)
- TT motors ×2 + encoders → DRV8833 (4 GPIO, PWM for speed) + encoder inputs (4 GPIO)
- HC-SR04 → 2 GPIO (Trig/Echo, use 5 V-tolerant divider on Echo)
- MPU6050 + INA219 + OLED → I2C bus (2 GPIO shared)
- ESP32-CAM → UART2 (2 GPIO)
- Buzzer + LED → 2 GPIO
- Fits a 30-pin DevKit with margin; avoid strapping pins (0, 2, 5, 12, 15) where possible.
