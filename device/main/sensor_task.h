#pragma once

/*
 * Spawn the sensor task. Currently just scans the I2C bus every 10 seconds and
 * logs which addresses respond — used to verify the INA219 is wired and
 * powered correctly before we wire up actual reads.
 */
void sensor_task_start();
