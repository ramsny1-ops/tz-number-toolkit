import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { join } from "node:path";
import { apiBasePath, applicationConfig } from "./config/application.config.ts";
import { initializeDatabase } from "./database/database.ts";
import { errorMiddleware, notFoundMiddleware } from "./middlewares/error.middleware.ts";
import { requestIdMiddleware } from "./middlewares/request-id.middleware.ts";
import { apiRouter } from "./routes/api.routes.ts";
import { webRouter } from "./routes/web.routes.ts";

initializeDatabase();

export const app = express();
app.disable("x-powered-by");
app.set("view engine", "ejs");
app.set("views", join(import.meta.dir, "views"));

app.use(requestIdMiddleware);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  referrerPolicy: { policy: "no-referrer" },
}));
app.use(cors({ origin: applicationConfig.appOrigin, credentials: false }));
app.use(compression());
app.use(morgan(applicationConfig.nodeEnv === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "256kb" }));
app.use(express.static(join(import.meta.dir, "../public"), { maxAge: applicationConfig.nodeEnv === "production" ? "1h" : 0 }));

app.use(apiBasePath, rateLimit({
  windowMs: applicationConfig.rateLimitWindowMs,
  limit: applicationConfig.rateLimitMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
}), apiRouter);

app.use(webRouter);
app.use(notFoundMiddleware);
app.use(errorMiddleware);
