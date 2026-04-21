#include "actuator.h"
#include "app_shared.h"

#include "driver/gpio.h"
#include "esp_log.h"

static const char *TAG = "actuator";

// Translate an on/off intent into the GPIO level for this module's polarity.
static inline int level_for(bool on) {
    const bool high = RELAY_ACTIVE_HIGH ? on : !on;
    return high ? 1 : 0;
}

void actuator_init(void) {
    gpio_config_t cfg = {};
    cfg.pin_bit_mask = (1ULL << RELAY_GPIO);
    cfg.mode = GPIO_MODE_OUTPUT;
    cfg.pull_up_en = GPIO_PULLUP_DISABLE;
    cfg.pull_down_en = GPIO_PULLDOWN_DISABLE;
    cfg.intr_type = GPIO_INTR_DISABLE;
    ESP_ERROR_CHECK(gpio_config(&cfg));

    // Drive the line to the OFF level immediately so the relay coil never
    // energizes during boot.
    gpio_set_level(RELAY_GPIO, level_for(false));
    g_relay_on.store(false, std::memory_order_relaxed);

    ESP_LOGI(TAG, "Relay initialized on GPIO %d (active %s) — OFF",
             RELAY_GPIO, RELAY_ACTIVE_HIGH ? "HIGH" : "LOW");
}

void actuator_set(bool on) {
    gpio_set_level(RELAY_GPIO, level_for(on));
    g_relay_on.store(on, std::memory_order_relaxed);
    ESP_LOGI(TAG, "Relay %s", on ? "ON" : "OFF");
}

bool actuator_get(void) {
    return g_relay_on.load(std::memory_order_relaxed);
}
