import { Router } from "express";
import { apiController } from "../controllers/api.controller.ts";

export const apiRouter = Router();

apiRouter.get("/health", apiController.health);
apiRouter.get("/networks", apiController.networks);
apiRouter.get("/networks/:slug", apiController.network);

apiRouter.post("/numbers/generate", apiController.generate);
apiRouter.post("/numbers/detect", apiController.detect);
apiRouter.post("/numbers/validate", apiController.validate);
apiRouter.post("/numbers/normalize", apiController.normalize);
apiRouter.post("/numbers/analyze", apiController.analyze);

apiRouter.get("/generations", apiController.generations);
apiRouter.get("/generations/:id", apiController.generation);
apiRouter.delete("/generations/:id", apiController.deleteGeneration);
apiRouter.get("/generations/:id/export/:format", apiController.export);
apiRouter.get("/statistics", apiController.statistics);
