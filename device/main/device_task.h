#pragma once

/*
 * Spawn the device task. Owns the RelayDevice lifecycle:
 *   - registers the updateSampleRate RPC handler
 *   - calls device->connect()
 *   - pumps device->process() continuously
 * Signals DEVICE_READY_BIT on g_state_events once CONNECTED.
 */
void device_task_start();
