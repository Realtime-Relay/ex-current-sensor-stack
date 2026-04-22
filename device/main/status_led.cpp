#include "status_led.h"
#include "app_shared.h"

#include <atomic>

#include "driver/gpio.h"
#include "esp_log.h"

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

static const char *TAG = "status-led";

static std::atomic<LedMode> s_mode{LedMode::OFF};

// Translate logical on/off to the GPIO level for this board's polarity.
static inline int level_for(bool on) {
    const bool high = STATUS_LED_ACTIVE_HIGH ? on : !on;
    return high ? 1 : 0;
}

static void write_led(bool on) {
    gpio_set_level(STATUS_LED_GPIO, level_for(on));
}

void status_led_init(void) {
    gpio_config_t cfg = {};
    cfg.pin_bit_mask = (1ULL << STATUS_LED_GPIO);
    cfg.mode = GPIO_MODE_OUTPUT;
    cfg.pull_up_en = GPIO_PULLUP_DISABLE;
    cfg.pull_down_en = GPIO_PULLDOWN_DISABLE;
    cfg.intr_type = GPIO_INTR_DISABLE;
    ESP_ERROR_CHECK(gpio_config(&cfg));

    write_led(false);
    ESP_LOGI(TAG, "Status LED initialized on GPIO %d (active %s)",
             STATUS_LED_GPIO, STATUS_LED_ACTIVE_HIGH ? "HIGH" : "LOW");
}

void status_led_set(LedMode mode) {
    s_mode.store(mode, std::memory_order_relaxed);
}

static void status_led_task(void *) {
    bool blink_phase = false;

    while (true) {
        const LedMode mode = s_mode.load(std::memory_order_relaxed);

        switch (mode) {
            case LedMode::OFF:
                write_led(false);
                vTaskDelay(pdMS_TO_TICKS(100));
                break;
            case LedMode::SOLID:
                write_led(true);
                vTaskDelay(pdMS_TO_TICKS(100));
                break;
            case LedMode::BLINK:
                blink_phase = !blink_phase;
                write_led(blink_phase);
                vTaskDelay(pdMS_TO_TICKS(200));
                break;
        }
    }
}

void status_led_start(void) {
    xTaskCreate(status_led_task, "status_led", 2048, nullptr, 3, nullptr);
}
