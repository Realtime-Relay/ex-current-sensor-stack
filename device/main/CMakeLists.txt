idf_component_register(
    SRCS
        "main.cpp"
        "app_shared.cpp"
        "wifi.cpp"
        "device_task.cpp"
        "sensor_task.cpp"
        "ina219.cpp"
        "actuator.cpp"
    INCLUDE_DIRS "."
    REQUIRES device-cpp esp_driver_gpio esp_driver_i2c nvs_flash esp_wifi esp_netif esp_event
)
