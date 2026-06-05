import winston from "winston";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

// Lấy thư mục hiện tại của file
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Tìm thư mục gốc của dự án (nơi chứa file turbo.json) bằng cách duyệt ngược lên
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.resolve(dir, "turbo.json"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return dir;
}

const projectRoot = findProjectRoot(__dirname);
const logFilePath = path.resolve(projectRoot, "logs/api.log");

// Đảm bảo thư mục logs tồn tại trước khi Winston ghi file
const logDir = path.dirname(logFilePath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Định dạng log cho File (định dạng JSON giúp dễ truy vấn/phân tích)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Định dạng log cho Console (định dạng màu sắc rõ ràng cho Dev)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: fileFormat,
  transports: [
    // Ghi mọi log từ mức "info" trở lên vào file api.log
    new winston.transports.File({
      filename: logFilePath,
      level: "info",
    }),
    // Đồng thời in log ra console
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});
