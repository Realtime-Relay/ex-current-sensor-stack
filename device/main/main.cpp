/*
 * ex-cold-storage-stack / device
 *
 * Thin orchestrator: init NVS, bring up WiFi, spawn the device + sensor tasks.
 * All real work lives in wifi.cpp, device_task.cpp, sensor_task.cpp.
 */

#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"

#include "esp_err.h"
#include "esp_log.h"
#include "nvs_flash.h"

#include "actuator.h"
#include "app_shared.h"
#include "device_task.h"
#include "sensor_task.h"
#include "wifi.h"

static const char *TAG = "main";

extern "C" void app_main(void) {
    ESP_LOGI(TAG, "ex-cold-storage-stack / device starting");

    // NVS required by the WiFi driver.
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // Sync primitive between device_task (producer, sets DEVICE_READY_BIT on
    // first CONNECTED) and any downstream consumers.
    g_state_events = xEventGroupCreate();

    // Relay is initialized before WiFi so it's guaranteed OFF the moment the
    // GPIO is usable — no window where a floating pin could energize the coil.
    actuator_init();

    wifi_init_and_wait();

    device_task_start();
    sensor_task_start();
}
