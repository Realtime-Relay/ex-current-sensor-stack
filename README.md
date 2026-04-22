# ex-current-sensor-stack

Reference implementation for the [Current Sensor Tutorial](https://docs.relay-x.io/examples/current-sensor) on the RelayX docs site.

An ESP32 reads current, voltage, and power from an INA219 sensor and publishes the readings to a React dashboard over RelayX. The dashboard displays live values and controls a relay on the device through two RPC endpoints.

## Layout

- `device/` — ESP-IDF C++ firmware for the ESP32
- `dashboard/` — React + Vite app

### Dashboard components

The dashboard contains two kinds of components:

| Component | Role |
|-----------|------|
| `TopBar`, `DeviceCard`, `EventsAlerts`, `SampleRateDialog`, `Toast` | Full-featured production UI used by the main `App`. |
| `LiveChart`, `SessionButton`, `SampleRateForm` | Minimal reference components used in the tutorial. They show the RelayX integration pattern without the styling chrome. Not imported by the main `App`. |

If you're following the tutorial, the reference components are the files to copy and adapt into your own project.

## Running

See the [tutorial](https://docs.relay-x.io/examples/current-sensor) for setup and credentials. Once configured:

```bash
# Device
cd device
idf.py build
idf.py -p /dev/cu.usbserial-110 flash monitor

# Dashboard (in a separate terminal)
cd dashboard
npm install
cp .env.example .env.local   # fill in your RelayX keys
npm run dev
```
