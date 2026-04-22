#include "app_shared.h"

std::atomic<uint32_t> g_sample_rate_ms{SAMPLE_RATE_DEFAULT_MS};
std::atomic<bool> g_relay_on{false};
RelayDevice *g_device = nullptr;
EventGroupHandle_t g_state_events = nullptr;

const relay_device_config_t device_config = {
    .api_key = "",
    .secret  = "",
    .mode    = RELAY_MODE_PRODUCTION,
};
