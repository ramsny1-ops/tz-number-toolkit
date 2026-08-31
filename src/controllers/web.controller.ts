import type { Request, Response } from "express";
import { applicationConfig } from "../config/application.config.ts";
import { NETWORKS } from "../domain/networks.ts";
import {
  getBatchNumbers,
  getGenerationBatch,
  getStatistics,
  listGenerationBatches,
} from "../repositories/generation.repository.ts";

const base = {
  appName: applicationConfig.appName,
  networks: NETWORKS,
  apiBase: `${applicationConfig.apiPrefix}/${applicationConfig.apiVersion}`,
};

export const webController = {
  dashboard(_req: Request, res: Response) {
    res.render("dashboard/index", {
      ...base,
      title: "Dashboard",
      page: "dashboard",
      statistics: getStatistics(),
      recentBatches: listGenerationBatches(8),
    });
  },

  generator(_req: Request, res: Response) {
    res.render("generator/index", { ...base, title: "Generator", page: "generator" });
  },

  detector(_req: Request, res: Response) {
    res.render("detector/index", { ...base, title: "Detector", page: "detector" });
  },

  analyzer(_req: Request, res: Response) {
    res.render("analyzer/index", { ...base, title: "Bulk Analyzer", page: "analyzer" });
  },

  networks(_req: Request, res: Response) {
    res.render("networks/index", { ...base, title: "Networks", page: "networks" });
  },

  history(_req: Request, res: Response) {
    res.render("history/index", {
      ...base,
      title: "History",
      page: "history",
      batches: listGenerationBatches(100),
    });
  },

  historyDetail(req: Request, res: Response) {
    const batch = getGenerationBatch(req.params.id ?? "");
    if (!batch) return res.status(404).render("errors/404", { ...base, title: "Batch not found", page: "history", path: req.path });
    return res.render("history/detail", {
      ...base,
      title: batch.public_id,
      page: "history",
      batch,
      numbers: getBatchNumbers(batch.id, 500),
    });
  },

  developer(_req: Request, res: Response) {
    res.render("developer/index", {
      ...base,
      title: "Developer API",
      page: "developer",
      config: applicationConfig,
    });
  },
};
