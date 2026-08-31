const numberFromEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const applicationConfig = Object.freeze({
  appName: process.env.APP_NAME ?? "TZ Number Toolkit",
  nodeEnv: process.env.NODE_ENV ?? "development",
  host: process.env.HOST ?? "127.0.0.1",
  port: numberFromEnv(process.env.PORT, 9367),
  appOrigin: process.env.APP_ORIGIN ?? "http://127.0.0.1:9367",
  databasePath: process.env.DATABASE_PATH ?? "./data/tz-number-toolkit.sqlite",
  maxGenerationSize: numberFromEnv(process.env.MAX_GENERATION_SIZE, 10_000),
  maxAnalysisSize: numberFromEnv(process.env.MAX_ANALYSIS_SIZE, 20_000),
  rateLimitWindowMs: numberFromEnv(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitMax: numberFromEnv(process.env.RATE_LIMIT_MAX, 300),
  apiPrefix: "/api",
  apiVersion: "v1",
});

export const apiBasePath = `${applicationConfig.apiPrefix}/${applicationConfig.apiVersion}`;
