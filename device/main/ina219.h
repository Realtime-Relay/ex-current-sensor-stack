/*
 * ina219.h — minimal driver for the TI INA219 high-side current/power monitor.
 *
 * Assumes a 0.1Ω shunt (standard on Adafruit / SparkFun / most eBay modules)
 * and a 16V bus range. Calibrated for ±3.2A with 100 µA current LSB.
 *
 * Usage:
 *     i2c_master_dev_handle_t dev;  // obtained from i2c_master_bus_add_device
 *     ina219_init(dev);
 *     ina219_readings r;
 *     if (ina219_read(dev, &r) == ESP_OK) { use r.bus_voltage_v, etc. }
 */

#pragma once

#include "driver/i2c_master.h"
#include "esp_err.h"

struct ina219_readings {
    float bus_voltage_v;   // bus voltage in volts (0 – 16 V for this config)
    float current_ma;      // current in milliamperes (signed — direction matters)
    float power_mw;        // power in milliwatts (always positive)
};

esp_err_t ina219_init(i2c_master_dev_handle_t dev);
esp_err_t ina219_read(i2c_master_dev_handle_t dev, ina219_readings *out);
