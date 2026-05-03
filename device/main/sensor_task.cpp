#include "sensor_task.h"
#include "app_shared.h"
#include "ina219.h"

#include <cinttypes>
#include <cmath>

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "esp_err.h"
#include "esp_log.h"

#include "driver/i2c_master.h"

#include "cJSON.h"

static const char *TAG = "sensor-task";

static i2c_master_bus_handle_t s_bus = nullptr;
static i2c_master_dev_handle_t s_ina219 = nullptr;

static esp_err_t setup_i2c_and_ina219() {
    // I2C master bus
    i2c_master_bus_config_t bus_cfg = {};
    bus_cfg.i2c_port = I2C_NUM_0;
    bus_cfg.sda_io_num = I2C_SDA_GPIO;
    bus_cfg.scl_io_num = I2C_SCL_GPIO;
    bus_cfg.clk_source = I2C_CLK_SRC_DEFAULT;
    bus_cfg.glitch_ignore_cnt = 7;
    bus_cfg.flags.enable_internal_pullup = true;

    esp_err_t err = i2c_new_master_bus(&bus_cfg, &s_bus);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "i2c_new_master_bus failed: %s", esp_err_to_name(err));
        return err;
    }

    // Add INA219 as a device on the bus
    i2c_device_config_t dev_cfg = {};
    dev_cfg.dev_addr_length = I2C_ADDR_BIT_LEN_7;
    dev_cfg.device_address = INA219_I2C_ADDR;
    dev_cfg.scl_speed_hz = I2C_FREQ_HZ;

    err = i2c_master_bus_add_device(s_bus, &dev_cfg, &s_ina219);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "i2c_master_bus_add_device(0x%02X) failed: %s",
                 INA219_I2C_ADDR, esp_err_to_name(err));
        return err;
    }

    return ina219_init(s_ina219);
}

static void publish_readings(const ina219_readings &r) {
    // INA219 reports current signed (it supports bidirectional sensing). For
    // our unidirectional load, magnitude is what matters — wiring Vin+/Vin-
    // the "wrong" way simply flips the sign.
    const float current_ma_abs = std::fabs(r.current_ma);

    relay_err_t err;

    err = g_device->telemetry.publish_number(TELEMETRY_POWER, r.power_mw);
    if (err != RELAY_OK && err != RELAY_ERR_BUFFERED) {
        ESP_LOGW(TAG, "publish %s failed: %d", TELEMETRY_POWER, err);
        g_device->log.warn("publish %s failed: %d", TELEMETRY_POWER, err);
    }

    err = g_device->telemetry.publish_number(TELEMETRY_CURRENT, current_ma_abs);
    if (err != RELAY_OK && err != RELAY_ERR_BUFFERED) {
        ESP_LOGW(TAG, "publish %s failed: %d", TELEMETRY_CURRENT, err);
        g_device->log.warn("publish %s failed: %d", TELEMETRY_CURRENT, err);
    }

    err = g_device->telemetry.publish_number(TELEMETRY_VOLT, r.bus_voltage_v);
    if (err != RELAY_OK && err != RELAY_ERR_BUFFERED) {
        ESP_LOGW(TAG, "publish %s failed: %d", TELEMETRY_VOLT, err);
        g_device->log.warn("publish %s failed: %d", TELEMETRY_VOLT, err);
    }
}

static void sensor_task(void *) {
    if (setup_i2c_and_ina219() != ESP_OK) {
        ESP_LOGE(TAG, "Sensor setup failed — task exiting");
        vTaskDelete(nullptr);
        return;
    }

    // Wait for the SDK's first CONNECTED before we start publishing. Buffered
    // sends after this point survive reconnects automatically.
    xEventGroupWaitBits(g_state_events, DEVICE_READY_BIT,
                        pdFALSE, pdTRUE, portMAX_DELAY);
    ESP_LOGI(TAG, "Sensor task started (default_rate=%" PRIu32 " ms)",
             SAMPLE_RATE_DEFAULT_MS);
    g_device->log.info("sensor task started (rate=%" PRIu32 " ms)",
                       SAMPLE_RATE_DEFAULT_MS);

    while (true) {
        ina219_readings r;
        esp_err_t err = ina219_read(s_ina219, &r);

        if (err == ESP_OK) {
            ESP_LOGI(TAG, "V=%.3fV  I=%.2fmA  P=%.2fmW",
                     r.bus_voltage_v, std::fabs(r.current_ma), r.power_mw);
            publish_readings(r);

            // Detect AC load presence via current draw while the relay is
            // energized. Hysteresis: OFF below 2 mA, ON above 6 mA.
            // OFF events stream every loop while we're in OFF; ON fires once
            // on the rising transition.
            static bool ac_off = false;
            const float current_ma_abs = std::fabs(r.current_ma);
            const bool relay_on = g_relay_on.load(std::memory_order_relaxed);

            if (relay_on && current_ma_abs < AC_OFF_THRESHOLD_MA) {
                cJSON *evt = cJSON_CreateObject();
                cJSON_AddStringToObject(evt, EVENT_FIELD_AC_STATE, AC_STATE_OFF);
                g_device->event.send_json(EVENT_POWER_STATE, evt);
                cJSON_Delete(evt);
                ac_off = true;
            } else if (relay_on && current_ma_abs > AC_ON_THRESHOLD_MA && ac_off) {
                cJSON *evt = cJSON_CreateObject();
                cJSON_AddStringToObject(evt, EVENT_FIELD_AC_STATE, AC_STATE_ON);
                g_device->event.send_json(EVENT_POWER_STATE, evt);
                cJSON_Delete(evt);
                ac_off = false;
            } else if (!relay_on) {
                ac_off = false;
            }
        } else {
            ESP_LOGW(TAG, "INA219 read failed: %s", esp_err_to_name(err));
            g_device->log.error("INA219 read failed: %s", esp_err_to_name(err));
        }

        uint32_t rate_ms = g_sample_rate_ms.load(std::memory_order_relaxed);
        vTaskDelay(pdMS_TO_TICKS(rate_ms));
    }
}

void sensor_task_start() {
    xTaskCreate(sensor_task, "sensor_task", 4096, nullptr, 4, nullptr);
}
