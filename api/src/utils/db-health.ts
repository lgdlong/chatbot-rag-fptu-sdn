import { prisma } from "../modules/auth/services/db.service.js";
import { logger } from "./logger.js";

/**
 * Kiểm tra kết nối tới cơ sở dữ liệu PostgreSQL (qua Prisma) khi khởi chạy server.
 * Nếu kết nối thất bại, in thông báo lỗi chi tiết kèm hướng dẫn khắc phục và dừng tiến trình.
 */
export async function checkDatabaseConnection() {
  logger.info("Đang kiểm tra kết nối tới cơ sở dữ liệu PostgreSQL...");
  try {
    // Thực hiện truy vấn đơn giản để kiểm tra kết nối
    await prisma.$queryRaw`SELECT 1`;
    logger.info("Kết nối cơ sở dữ liệu PostgreSQL thành công!");
    return true;
  } catch (error: any) {
    const errorMsg = [
      "",
      "========================================================",
      "LỖI KẾT NỐI CƠ SỞ DỮ LIỆU (DATABASE CONNECTION ERROR)",
      "========================================================",
      `Chi tiết lỗi: ${error.message || error}`,
      "",
      "NGUYÊN NHÂN PHỔ BIẾN:",
      "  1. Docker Desktop chưa được khởi động trên máy tính của bạn.",
      "  2. Các container Docker (PostgreSQL, Redis, v.v.) chưa được bật.",
      "  3. Biến môi trường DATABASE_URL trong tệp .env ở thư mục gốc không chính xác.",
      "",
      "HƯỚNG DẪN KHẮC PHỤC:",
      "  Bước 1: Mở ứng dụng Docker Desktop trên máy tính.",
      "  Bước 2: Khởi chạy các container bằng một trong các cách sau:",
      "    - Sử dụng Makefile: Chạy lệnh `make dev` tại thư mục gốc của dự án.",
      "    - Chạy trực tiếp Docker Compose: Lệnh `docker-compose up -d` tại thư mục gốc.",
      "  Bước 3: Kiểm tra xem container đã chạy chưa bằng lệnh: `docker ps`.",
      "",
      "Vui lòng khởi động Docker và chạy các container trước khi khởi chạy API Server!",
      "========================================================"
    ].join("\n");

    logger.error(errorMsg);

    // Dừng server ngay lập tức để tránh lỗi lan truyền
    process.exit(1);
  }
}
