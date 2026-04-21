#include "ina219.h"

#include "esp_log.h"

static const char *TAG = "ina219";

// ----------------------------------------------------------------------------
// Register map (datasheet §8.6)
// ----------------------------------------------------------------------------

static constexpr uint8_t REG_CONFIG   = 0x00;
static constexpr uint8_t REG_SHUNT_V  = 0x01;
static constexpr uint8_t REG_BUS_V    = 0x02;
static constexpr uint8_t REG_POWER    = 0x03;
static constexpr uint8_t REG_CURRENT  = 0x04;
static constexpr uint8_t REG_CALIB    = 0x05;

// ----------------------------------------------------------------------------
// Config + calibration
// ----------------------------------------------------------------------------

// Config: 16V bus, PGA /8 (±320mV shunt = ±3.2A at 0.1Ω), 12-bit single-sample
// ADCs on both bus and shunt, continuous conversion mode.
//   bit15 RST       = 0
//   bit14 reserved  = 0
//   bit13 BRNG      = 0  (16V bus range)
//   bit12:11 PGA    = 11 (/8, ±320mV)
//   bit10:7 BADC    = 0011 (12-bit, single sample, ~532 µs)
//   bit6:3 SADC     = 0011
//   bit2:0 MODE     = 111 (shunt+bus continuous)
static constexpr uint16_t CONFIG_VALUE = 0x199F;

// Calibration (datasheet §8.5.1):
//   Current_LSB = 100 µA → full-scale ±3.2 A with signed 15-bit
//   Cal = trunc(0.04096 / (Current_LSB × R_shunt))
//       = trunc(0.04096 / (0.0001 × 0.1)) = 4096
static constexpr uint16_t CALIBRATION  = 4096;

// Unit conversions derived from calibration:
static constexpr float CURRENT_LSB_MA  = 0.1f;     // 100 µA per count → 0.1 mA
static constexpr float POWER_LSB_MW    = 2.0f;     // Power_LSB = 20 × Current_LSB = 2 mW
static constexpr float BUS_LSB_V       = 0.004f;   // 4 mV per count (after >>3)

static constexpr int I2C_TIMEOUT_MS    = 100;

// ----------------------------------------------------------------------------
// Register helpers — INA219 registers are 16-bit big-endian
// ----------------------------------------------------------------------------

static esp_err_t reg_write16(i2c_master_dev_handle_t dev, uint8_t reg, uint16_t value) {
    uint8_t buf[3] = {
        reg,
        static_cast<uint8_t>((value >> 8) & 0xFF),
        static_cast<uint8_t>(value & 0xFF),
    };
    return i2c_master_transmit(dev, buf, sizeof(buf), I2C_TIMEOUT_MS);
}

static esp_err_t reg_read16(i2c_master_dev_handle_t dev, uint8_t reg, uint16_t *out) {
    uint8_t buf[2] = {0, 0};
    esp_err_t err = i2c_master_transmit_receive(dev, &reg, 1, buf, sizeof(buf),
                                                I2C_TIMEOUT_MS);
    if (err != ESP_OK) return err;
    *out = (static_cast<uint16_t>(buf[0]) << 8) | buf[1];
    return ESP_OK;
}

// ----------------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------------

esp_err_t ina219_init(i2c_master_dev_handle_t dev) {
    esp_err_t err = reg_write16(dev, REG_CONFIG, CONFIG_VALUE);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to write CONFIG: %s", esp_err_to_name(err));
        return err;
    }
    err = reg_write16(dev, REG_CALIB, CALIBRATION);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to write CALIBRATION: %s", esp_err_to_name(err));
        return err;
    }
    ESP_LOGI(TAG, "Initialized (R_shunt=0.1Ω, I_LSB=%.1f mA, P_LSB=%.1f mW)",
             CURRENT_LSB_MA, POWER_LSB_MW);
    return ESP_OK;
}

esp_err_t ina219_read(i2c_master_dev_handle_t dev, ina219_readings *out) {
    if (!out) return ESP_ERR_INVALID_ARG;

    uint16_t bus_raw = 0, cur_raw = 0, pow_raw = 0;
    esp_err_t err;

    if ((err = reg_read16(dev, REG_BUS_V, &bus_raw)) != ESP_OK) return err;
    if ((err = reg_read16(dev, REG_CURRENT, &cur_raw)) != ESP_OK) return err;
    if ((err = reg_read16(dev, REG_POWER, &pow_raw)) != ESP_OK) return err;

    // Bus voltage: top 13 bits of the register are the voltage value, LSB=4mV.
    // Bottom 3 bits are CNVR (conversion ready) and OVF (math overflow) flags
    // plus one reserved — shift them off.
    out->bus_voltage_v = static_cast<int16_t>(bus_raw >> 3) * BUS_LSB_V;

    // Current register is signed int16 — sign indicates direction through shunt.
    out->current_ma = static_cast<int16_t>(cur_raw) * CURRENT_LSB_MA;

    // Power register is unsigned int16, always ≥ 0.
    out->power_mw = pow_raw * POWER_LSB_MW;

    return ESP_OK;
}
