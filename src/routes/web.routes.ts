import { Router } from "express";
import { webController } from "../controllers/web.controller.ts";

export const webRouter = Router();
webRouter.get("/", webController.dashboard);
webRouter.get("/generator", webController.generator);
webRouter.get("/detector", webController.detector);
webRouter.get("/analyzer", webController.analyzer);
webRouter.get("/networks", webController.networks);
webRouter.get("/history", webController.history);
webRouter.get("/history/:id", webController.historyDetail);
webRouter.get("/developer", webController.developer);
