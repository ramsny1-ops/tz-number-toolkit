import { existsSync } from "node:fs";
import { applicationConfig } from "../src/config/application.config.ts";
import { NETWORKS } from "../src/domain/networks.ts";

console.log("TZ Number Toolkit doctor");
console.log(`Bun: ${Bun.version}`);
console.log(`Host: ${applicationConfig.host}`);
console.log(`Port: ${applicationConfig.port}`);
console.log(`Database: ${applicationConfig.databasePath}`);
console.log(`Networks in registry: ${NETWORKS.length}`);
console.log(`.env present: ${existsSync('.env') ? 'yes' : 'no'}`);
console.log("Run `bun run typecheck` and `bun test` for verification.");
