import { app } from "./app.ts";
import { applicationConfig } from "./config/application.config.ts";

const server = app.listen(applicationConfig.port, applicationConfig.host, () => {
  console.log(`${applicationConfig.appName} running at http://${applicationConfig.host}:${applicationConfig.port}`);
});

function shutdown(signal: string): void {
  console.log(`\n${signal} received. Closing HTTP server...`);
  server.close(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
