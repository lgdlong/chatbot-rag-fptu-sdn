import type { MiddlewareHandler } from "hono";
import { logger } from "../utils/logger.js";

export const loggerMiddleware: MiddlewareHandler = async (c, next) => {
  const { method, url } = c.req;
  const userAgent = c.req.header("user-agent") || "unknown";
  
  // Lấy IP của client từ headers chuẩn
  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
    c.req.header("x-real-ip") ||
    "unknown";
  
  const start = performance.now();

  // Ghi nhận request đi vào
  logger.info(`--> %s %s - IP: %s - UA: %s`, method, url, ip, userAgent);

  await next();

  const duration = Math.round(performance.now() - start);
  const status = c.res.status;

  // Ghi nhận response dựa trên mã trạng thái HTTP
  if (status >= 500) {
    logger.error(`<-- %s %s - Status: %d - %dms`, method, url, status, duration);
  } else if (status >= 400) {
    logger.warn(`<-- %s %s - Status: %d - %dms`, method, url, status, duration);
  } else {
    logger.info(`<-- %s %s - Status: %d - %dms`, method, url, status, duration);
  }
};
