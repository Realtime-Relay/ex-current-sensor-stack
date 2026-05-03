#include "device_task.h"
#include "actuator.h"
#include "app_shared.h"
#include "status_led.h"

#include <cinttypes>
#include <cstdio>

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "esp_log.h"
#include "cJSON.h"

static const char *TAG = "device-task";

// ----------------------------------------------------------------------------
// RPC: updateSampleRate
// Expected payload: { "rate": <milliseconds> }   // 100 – 600000 (10 min)
// Responds with:    { "rate": <applied_ms>, "status": "ok" }
// ----------------------------------------------------------------------------

// Helper — build a { "message": <text> } object, send it as an RPC error,
// and clean up.
static void rpc_send_error(relay_rpc_request_t *req, const char *message) {
    cJSON *err = cJSON_CreateObject();
    cJSON_AddStringToObject(err, "message", message);
    req->error(err);
    cJSON_Delete(err);
}

static void rpc_update_sample_rate(relay_rpc_request_t *req) {
    ESP_LOGI(TAG, "RPC %s invoked (payload_len=%zu)",
             RPC_UPDATE_RATE, req->payload_len);

    cJSON *payload = (req->payload && req->payload_len > 0)
        ? cJSON_Parse(req->payload)
        : nullptr;

    if (!payload) {
        rpc_send_error(req, "invalid or empty JSON payload");
        g_device->log.error("%s: invalid or empty JSON payload", RPC_UPDATE_RATE);
        return;
    }

    cJSON *rate_item = cJSON_GetObjectItem(payload, "rate");
    if (!rate_item || !cJSON_IsNumber(rate_item)) {
        rpc_send_error(req, "missing or non-numeric 'rate'");
        g_device->log.error("%s: missing or non-numeric 'rate'", RPC_UPDATE_RATE);
        cJSON_Delete(payload);
        return;
    }

    int requested = rate_item->valueint;
    if (requested < static_cast<int>(SAMPLE_RATE_MIN_MS) ||
        requested > static_cast<int>(SAMPLE_RATE_MAX_MS)) {
        char buf[96];
        std::snprintf(buf, sizeof(buf),
                      "rate must be between %" PRIu32 " and %" PRIu32 " ms",
                      SAMPLE_RATE_MIN_MS, SAMPLE_RATE_MAX_MS);
        rpc_send_error(req, buf);
        g_device->log.warn("%s: rate %d out of range [%" PRIu32 ", %" PRIu32 "]",
                           RPC_UPDATE_RATE, requested,
                           SAMPLE_RATE_MIN_MS, SAMPLE_RATE_MAX_MS);
        cJSON_Delete(payload);
        return;
    }

    g_sample_rate_ms.store(static_cast<uint32_t>(requested),
                           std::memory_order_relaxed);
    ESP_LOGI(TAG, "Sample rate updated to %d ms", requested);
    g_device->log.info("sample rate updated to %d ms", requested);

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddNumberToObject(resp, "rate", requested);
    cJSON_AddStringToObject(resp, "status", "ok");
    req->respond(resp);
    cJSON_Delete(resp);

    cJSON_Delete(payload);
}

// ----------------------------------------------------------------------------
// RPC: state
// Expected payload: { "on": true | false }
// Also accepts { "on": 0 | 1 } for convenience.
// Responds with:    { "on": <applied>, "status": "ok" }
// ----------------------------------------------------------------------------

static void rpc_set_state(relay_rpc_request_t *req) {
    ESP_LOGI(TAG, "RPC %s invoked (payload_len=%zu)",
             RPC_SET_STATE, req->payload_len);

    cJSON *payload = (req->payload && req->payload_len > 0)
        ? cJSON_Parse(req->payload)
        : nullptr;

    if (!payload) {
        rpc_send_error(req, "invalid or empty JSON payload");
        g_device->log.error("%s: invalid or empty JSON payload", RPC_SET_STATE);
        return;
    }

    cJSON *on_item = cJSON_GetObjectItem(payload, "on");
    bool target;

    if (on_item && cJSON_IsBool(on_item)) {
        target = cJSON_IsTrue(on_item);
    } else if (on_item && cJSON_IsNumber(on_item)) {
        target = on_item->valueint != 0;
    } else {
        rpc_send_error(req, "expected { \"on\": true | false }");
        g_device->log.error("%s: expected { \"on\": true | false }", RPC_SET_STATE);
        cJSON_Delete(payload);
        return;
    }

    actuator_set(target);
    g_device->log.info("relay set %s", target ? "ON" : "OFF");

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddBoolToObject(resp, "on", target);
    cJSON_AddStringToObject(resp, "status", "ok");
    req->respond(resp);
    cJSON_Delete(resp);

    cJSON_Delete(payload);
}

// ----------------------------------------------------------------------------
// Task
// ----------------------------------------------------------------------------

static void device_task(void *) {
    g_device = new RelayDevice(device_config);

    g_device->connection.on_status([](relay_connection_status_t status) {
        switch (status) {
            case RELAY_STATUS_CONNECTED:
                ESP_LOGI(TAG, "Device connected");
                xEventGroupSetBits(g_state_events, DEVICE_READY_BIT);
                status_led_set(LedMode::SOLID);
                g_device->log.info("device connected");
                break;
            case RELAY_STATUS_DISCONNECTED:
                ESP_LOGW(TAG, "Device disconnected");
                status_led_set(LedMode::BLINK);
                g_device->log.warn("device disconnected");
                break;
            case RELAY_STATUS_RECONNECTING:
                ESP_LOGW(TAG, "Device reconnecting...");
                status_led_set(LedMode::BLINK);
                g_device->log.warn("device reconnecting");
                break;
            case RELAY_STATUS_RECONNECTED:
                ESP_LOGI(TAG, "Device reconnected");
                status_led_set(LedMode::SOLID);
                g_device->log.info("device reconnected");
                break;
            default:
                break;
        }
    });

    // connect() first — listen() issues a live SUB to the server.
    relay_err_t err = g_device->connect();
    if (err != RELAY_OK) {
        ESP_LOGE(TAG, "Relay connect failed: %d — SDK will retry", err);
    }

    err = g_device->rpc.listen(RPC_UPDATE_RATE, rpc_update_sample_rate);
    if (err != RELAY_OK) {
        ESP_LOGE(TAG, "Failed to register %s RPC: %d", RPC_UPDATE_RATE, err);
    } else {
        ESP_LOGI(TAG, "Registered RPC handler: %s", RPC_UPDATE_RATE);
    }

    err = g_device->rpc.listen(RPC_SET_STATE, rpc_set_state);
    if (err != RELAY_OK) {
        ESP_LOGE(TAG, "Failed to register %s RPC: %d", RPC_SET_STATE, err);
    } else {
        ESP_LOGI(TAG, "Registered RPC handler: %s", RPC_SET_STATE);
    }

    while (true) {
        g_device->process();
        vTaskDelay(pdMS_TO_TICKS(5));
    }
}

void device_task_start() {
    // 16 KB stack matches the SDK example. RelayDevice holds several KB of
    // static buffers plus a TLS context.
    xTaskCreate(device_task, "device_task", 16384, nullptr, 5, nullptr);
}
