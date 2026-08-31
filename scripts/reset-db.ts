import { existsSync, rmSync } from "node:fs";
import { applicationConfig } from "../src/config/application.config.ts";

for (const path of [applicationConfig.databasePath, `${applicationConfig.databasePath}-shm`, `${applicationConfig.databasePath}-wal`]) {
  if (existsSync(path)) rmSync(path);
}
console.log(`Reset database files for ${applicationConfig.databasePath}. They will be recreated on next startup.`);
