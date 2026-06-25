# HỆ THỐNG TRUY XUẤT KIẾN THỨC ĐA PHƯƠNG THỨC HỖ TRỢ HỌC TẬP (FPTU CHATBOT RAG)
## Đề Tài Nghiên Cứu Khoa Học & Ứng Dụng Thực Tiễn: So Sánh RAG và Fine-tuning trong Bối Cảnh Tiếng Việt

[![Hono](https://img.shields.io/badge/Backend-Hono.js-orange.svg?style=flat-square)](https://hono.dev)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black.svg?style=flat-square)](https://nextjs.org)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-blue.svg?style=flat-square)](https://prisma.io)
[![Better Auth](https://img.shields.io/badge/Auth-Better%20Auth-purple.svg?style=flat-square)](https://better-auth.com)

Chào mừng bạn đến với repository chính thức của dự án **FPTU Chatbot RAG**. Đây là hệ thống hỏi đáp thông minh dựa trên tri thức bài giảng đa phương thức, đồng thời là môi trường thực nghiệm để đánh giá, so sánh hiệu năng giữa phương pháp **Retrieval-Augmented Generation (RAG)** và **Fine-tuning** đối với kho tài liệu học tập tiếng Việt tại Đại học FPT.

---

## 🚀 Tính Năng Nổi Bật Hệ Thống

Hệ thống được thiết kế theo các tiêu chuẩn kỹ thuật hiện đại của năm 2026, cung cấp các tính năng vượt trội:

1. **Quản Lý Tài Liệu Đa Phương Thức (Multimodal Ingestion Pipeline):**
   * Hỗ trợ tải lên và trích xuất tài liệu `PDF` cho Release A.
   * Các định dạng khác được xem là phạm vi mở rộng, không phải baseline hiện tại.
2. **Chiến Lược Phân Đoạn Nâng Cao (Advanced Chunking Strategy):**
   * Sử dụng cơ chế kết hợp giữa **Document-based chunking** (chia theo Slide/trang bài học thực tế) và **Semantic chunking** để giữ trọn vẹn ngữ cảnh học thuật và cấu trúc logic của giáo trình.
3. **Giao Diện Trực Quan & Trích Dẫn Minh Bạch (Citation UI):**
   * Phản hồi dạng **Streaming (SSE)** thời gian thực với hiệu ứng gõ chữ mượt mà.
   * Hiển thị nguồn trích dẫn cụ thể (Slide số mấy, trang nào, giây thứ bao nhiêu trong video). Người dùng click vào nguồn sẽ được chuyển hướng trực tiếp đến trang PDF hoặc tua chính xác đến giây video tương ứng.
4. **Bảo Mật Phiên & Phân Quyền Theo Vai Trò:**
   * Hệ thống phục vụ cho một trường đại học duy nhất. Truy cập được kiểm soát bằng Better Auth session cookie, whitelist email và role `ADMIN` / `LECTURER` / `STUDENT`.
5. **Cơ Chế Kiểm Soát LLM (Knowledge Guardrails):**
   * Ngăn chặn hoàn toàn hiện tượng ảo tưởng (hallucination) của LLM bằng hệ thống Prompt chặt chẽ. Nếu câu hỏi nằm ngoài phạm vi tài liệu đã chỉ mục, chatbot sẽ lịch sự từ chối trả lời thay vì tự sáng tạo thông tin.

---

## 📊 Kết Quả Nghiên Cứu Thực Nghiệm (RAG vs Fine-tuning)

Hệ thống được tối ưu hóa dựa trên các nghiên cứu thực nghiệm chi tiết đối với ngôn ngữ tiếng Việt:

### 1. Đánh Giá Tổng Quan: RAG và Fine-tuning

| Tiêu Chí Đánh Giá | Retrieval-Augmented Generation (RAG) | Fine-tuning (Huấn Luyện Tinh Chỉnh) |
| :--- | :--- | :--- |
| **Độ chính xác dữ kiện** | **Vượt trội** (Truy xuất trực tiếp từ tài liệu gốc, triệt tiêu ảo tưởng) | **Trung bình** (Dễ bị hallucination nếu câu hỏi lệch cấu trúc dữ liệu train) |
| **Chi phí vận hành** | **Rất thấp** (Chỉ tốn phí API Embedding & lưu trữ Vector DB) | **Rất cao** (Cần hạ tầng GPU mạnh, chi phí train và cập nhật cực lớn) |
| **Khả năng cập nhật tri thức** | **Tức thời** (Chỉ cần cập nhật, thêm/xóa file trong Vector DB) | **Độ trễ cao** (Phải huấn luyện lại từ đầu mỗi khi có giáo trình mới) |
| **Khả năng kiểm chứng** | **Rõ ràng** (Có nguồn trích dẫn cụ thể: trang slide, giây video) | **Không có** (Câu trả lời sinh ra hoàn toàn từ trọng số mô hình) |

### 2. Chiến Lược Chunking Tối Ưu Cho Slide PDF Bài Giảng

* **Fixed-size Chunking (Kém nhất):** Cắt ngang bullet points, mất ý nghĩa ngữ cảnh giữa các trang slide.
* **Semantic & Document-based Chunking (Tối ưu nhất):** Chia tài liệu dựa trên cấu trúc các tiêu đề bài giảng (`Slide X: ...`), kết hợp phân đoạn ngữ nghĩa để giữ trọn ý nghĩa của từng bullet point.
* **Overlap Khuyến Nghị:** 50 - 100 tokens để duy trì tính liên kết thông tin giữa các slide kề nhau.

### 3. Đánh Giá Mô Hình Embedding Tiếng Việt (Vietnamese STS Benchmarks)

| Tên Mô Hình Embedding | Chỉ Số STS-Vi | MRR@10 (Retrieval) | Tốc độ xử lý (sent/s) | Khuyến Nghị Sử Dụng |
| :--- | :---: | :---: | :---: | :--- |
| **`BAAI/bge-vi-base`** | **0.88** | **0.84** | 950 | **Tối ưu nhất cho RAG tiếng Việt thô và slide** |
| `sBERT-Vi` | 0.86 | 0.81 | 1,100 | Phù hợp các chatbot hội thoại thông thường |
| `multilingual-e5-base` | 0.85 | 0.80 | 900 | Tốt cho hệ thống đa ngôn ngữ |
| `Gemini Embedding 2` | *N/A* | *High (Multimodal)* | API-dependent | **Bắt buộc cho RAG Đa phương thức (Video/Audio/Ảnh)** |

---

## 🏗️ Kiến Trúc Hệ Thống (System Architecture)

```mermaid
graph TD
    Client[Next.js 15 App Router <br> Web App] <-->|HTTPS / SSE Streaming| API[Hono.js Backend <br> Node.js Runtime]
    
    subgraph Storage [Tầng Lưu Trữ & Truy Vấn]
        API <-->|Prisma ORM| RDB[(PostgreSQL / SQLite <br> Metadata & Sessions)]
        API <-->|Retrieval API| VDB[(AnythingLLM Workspace <br> Retrieval Layer)]
    end

    subgraph AI_Services [Dịch Vụ AI Phân Tích]
        API -->|LLM & Multimodal| Gemini[Google Gemini API <br> Gemini 2.0 / Embedding 2]
        API -->|Vietnamese Embedding| LocalEmbedding[Local Embedding Node <br> BAAI/bge-vi-base]
    end
```

---

## 📂 Bản Đồ Thư Mục Monorepo

```
chatbot-rag-fptu/
├── api/                        # Backend Workspace (Hono.js + TypeScript, cổng 8000)
│   ├── prisma/
│   │   └── schema.prisma       # 21 Prisma models — FPTU academic domain
│   └── src/                    # Controllers, modules, utils
├── web/                        # Frontend Workspace (Next.js 16 + Mantine UI, cổng 3000)
│   ├── app/                    # App Router pages (student, teacher, superadmin, login)
│   └── components/             # Reusable components (ChatbotWidget, ProtectedRoute)
├── docs/                       # Tài liệu theo audience/ownership
│   ├── srs/                    # Business source of truth
│   ├── technical/              # Architecture / backend / standards / rag
│   ├── operations/             # Runbooks & deployment guides
│   ├── planning/               # Roadmaps & non-canonical plans
│   ├── research/               # Evidence & reference material
│   └── archive/                # Historical / superseded docs
├── plans/                      # Implementation plans (archived)
├── logs/                       # Runtime logs (api.log)
├── docker-compose.yml          # PostgreSQL + retrieval containers
├── turbo.json                  # Turborepo pipeline config
├── Makefile                    # Monorepo task runner shortcuts
└── package.json                # Root workspace config
```

---

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Nhanh (Quick Start)

Dự án cung cấp tệp `Makefile` để đơn giản hóa tất cả các thao tác trên cả hai không gian làm việc.

### 1. Chuẩn Bị Môi Trường (.env)

> [!WARNING]
> Không bao giờ tạo các file `.env` cục bộ bên trong thư mục `api/` hoặc `web/`.
> Toàn bộ cấu hình hệ thống phải được lưu trữ duy nhất tại file `.env` ở **thư mục gốc (root)** của dự án. 

Sao chép file cấu hình mẫu và điền đầy đủ các khóa API cần thiết:
```bash
cp .env.example .env
```

### 2. Các Bước Khởi Chạy Nhanh

Thực hiện tuần tự các lệnh sau tại thư mục gốc:

1. **Khởi động database Docker:**
   ```bash
   make db-up
   ```
2. **Đồng bộ cơ sở dữ liệu và tạo Prisma Client:**
   ```bash
   make migrate
   make prisma-generate
   ```
3. **Chạy song song Backend và Frontend:**
   * Trong một terminal mới, chạy Backend API (cổng `8000`):
     ```bash
     make dev-api
     ```
   * Trong một terminal khác, chạy Frontend Web (cổng `3000`):
     ```bash
     make dev-web
     ```
4. **Kiểm tra trạng thái hoạt động (Health check):**
   ```bash
   make health-check
   ```

Để biết thêm chi tiết về tất cả lệnh CLI khả dụng, vui lòng tham khảo [CLAUDE.md](./CLAUDE.md).

---

## 📄 Tài Liệu Tham Khảo Dành Cho Nhà Phát Triển
* **Bản đồ tài liệu đầy đủ:** Xem [docs/README.md](./docs/README.md).
* **SRS / scope chính thức:** Xem [docs/srs/README.md](./docs/srs/README.md).
* **Kiến trúc kỹ thuật:** Xem [docs/technical/README.md](./docs/technical/README.md).
* **Vận hành / runbook:** Xem [docs/operations/README.md](./docs/operations/README.md).
* **Planning / roadmap:** Xem [docs/planning/README.md](./docs/planning/README.md).
* **Research / evidence:** Xem [docs/research/README.md](./docs/research/README.md).
* **Archive / lịch sử:** Xem [docs/archive/README.md](./docs/archive/README.md).
