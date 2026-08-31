import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { fail } from "../utils/http.ts";

export function notFoundMiddleware(req: Request, res: Response): void {
  if (req.path.startsWith("/api/")) {
    fail(res, 404, "ROUTE_NOT_FOUND", "The requested API route does not exist.");
    return;
  }
  res.status(404).render("errors/404", { title: "Not found", path: req.path });
}

export function errorMiddleware(error: unknown, req: Request, res: Response, _next: NextFunction): void {
  console.error(error);
  if (res.headersSent) return;

  if (error instanceof ZodError) {
    fail(res, 422, "VALIDATION_ERROR", "Request validation failed.", error.flatten());
    return;
  }

  const message = error instanceof Error ? error.message : "Unexpected server error.";
  if (req.path.startsWith("/api/")) {
    fail(res, 500, "INTERNAL_SERVER_ERROR", message);
    return;
  }
  res.status(500).render("errors/500", { title: "Server error", message });
}
