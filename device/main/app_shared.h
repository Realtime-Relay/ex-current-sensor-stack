/*
 * app_shared.h — config constants + shared state accessed across tasks.
 *
 * Exposed globals:
 *   - g_sample_rate_ms: updated by the updateSampleRate RPC (device_task),
 *     read every loop by sensor_task. Units are milliseconds.
 *   - g_device: owned by device_task. Other tasks read it after
 *     DEVICE_READY_BIT is set on g_state_events.
 *   - g_state_events: synchronization between device_task (producer) and
 *     downstream tasks (consumers).
 */

#pragma once

#include <atomic>
#include <cstdint>

#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"

#include "driver/gpio.h"
#include "relay/device.h"

// ----------------------------------------------------------------------------
// Configuration — edit before flashing, or lift into Kconfig
// ----------------------------------------------------------------------------

#define WIFI_SSID          "Starlink Enhanced"
#define WIFI_PASS          "preetham.1964"

// I2C bus for INA219 (and any future I2C sensors).
// ESP32 default pins: SDA=GPIO21, SCL=GPIO22.
#define I2C_SDA_GPIO       GPIO_NUM_21
#define I2C_SCL_GPIO       GPIO_NUM_22
#define I2C_FREQ_HZ        100000   // 100 kHz — safe default, INA219 supports up to 2.56 MHz

// INA219 — 7-bit address is 0x40 with A0/A1 both tied to GND (default).
#define INA219_I2C_ADDR    0x40

// Relay output. GPIO 26 is safe (not strapping, not used by WiFi/flash/I2C).
// Most cheap 3V3/5V relay breakouts are active-LOW (trigger on GPIO LOW);
// bare MOSFET / SSR drivers are usually active-HIGH. Flip this macro to
// match your module.
#define RELAY_GPIO          GPIO_NUM_26
#define RELAY_ACTIVE_HIGH   0

// RPC names
#define RPC_UPDATE_RATE    "updateSampleRate"
#define RPC_SET_STATE      "state"

// Telemetry metric names — must match the schema registered on the RelayX console.
#define TELEMETRY_POWER    "power"     // mW
#define TELEMETRY_CURRENT  "current"   // mA
#define TELEMETRY_VOLT     "volt"      // V

// Sample rate bounds — all in milliseconds.
constexpr uint32_t SAMPLE_RATE_MIN_MS     = 100;      // 100 ms  — fast
constexpr uint32_t SAMPLE_RATE_MAX_MS     = 600000;   // 10 min  — slow
constexpr uint32_t SAMPLE_RATE_DEFAULT_MS = 10000;    // 10 s    — default

// ----------------------------------------------------------------------------
// Shared state
// ----------------------------------------------------------------------------

extern std::atomic<uint32_t> g_sample_rate_ms;
extern std::atomic<bool> g_relay_on;
extern RelayDevice *g_device;
extern EventGroupHandle_t g_state_events;

constexpr EventBits_t DEVICE_READY_BIT = BIT0;

// RelayX credentials — defined in app_shared.cpp.
extern const relay_device_config_t device_config;
