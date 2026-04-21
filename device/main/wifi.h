#pragma once

/*
 * Initialize the WiFi station interface and block until we have an IP.
 * Requires nvs_flash_init() + esp_event_loop_create_default() to run first.
 * On disconnect, the internal event handler auto-reconnects.
 */
void wifi_init_and_wait();
