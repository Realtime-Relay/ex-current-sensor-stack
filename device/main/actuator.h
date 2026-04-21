#pragma once

#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Initialize the GPIO driving the relay. Leaves the relay OFF.
 * Must be called before actuator_set().
 */
void actuator_init(void);

/**
 * Command the relay ON or OFF. Writes the appropriate GPIO level for the
 * module's polarity (see RELAY_ACTIVE_HIGH in app_shared.h) and updates
 * g_relay_on atomically.
 */
void actuator_set(bool on);

/**
 * Returns the last commanded state.
 */
bool actuator_get(void);

#ifdef __cplusplus
}
#endif
