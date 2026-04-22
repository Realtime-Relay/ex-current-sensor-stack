#pragma once

/*
 * status_led — drives an LED that reflects the RelayX connection state.
 *
 *   OFF     before the first connect()
 *   SOLID   connected
 *   BLINK   disconnected or reconnecting (toggles every 200 ms)
 *
 * The LED GPIO + active polarity are defined in app_shared.h.
 */

enum class LedMode {
    OFF,
    SOLID,
    BLINK,
};

void status_led_init(void);
void status_led_start(void);
void status_led_set(LedMode mode);
