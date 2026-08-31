import type { Response } from "express";

export function ok<T>(res: Response, data: T, status = 200): Response {
  return res.status(status).json({
    success: true,
    status,
    requestId: res.locals.requestId,
    timestamp: new Date().toISOString(),
    data,
  });
}

export function fail(res: Response, status: number, code: string, message: string, details?: unknown): Response {
  return res.status(status).json({
    success: false,
    status,
    requestId: res.locals.requestId,
    timestamp: new Date().toISOString(),
    error: { code, message, ...(details === undefined ? {} : { details }) },
  });
}
