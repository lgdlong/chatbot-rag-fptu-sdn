# QUY CHUẨN LẬP TRÌNH TIÊU CHUẨN (CODE STANDARDS GUIDE)

> Status: Current
> Audience: Developer
> Canonical: Yes
> Owner: Technical

Tài liệu này quy định bộ tiêu chuẩn kỹ thuật, phong cách lập trình và các quy chuẩn bảo mật bắt buộc áp dụng khi viết mã nguồn cho toàn bộ dự án **FPTU Chatbot RAG**.

---

## 🎯 1. Quy Chuẩn TypeScript & Clean Code

* **Strict Type Safety:**
  * Luôn luôn bật cấu hình `"strict": true` trong `tsconfig.json`.
  * Tuyệt đối **không sử dụng kiểu `any`**. Nếu một kiểu dữ liệu chưa xác định rõ trong quá trình parse, hãy sử dụng kiểu `unknown` và thực hiện Type Guard.
  * Mọi hàm, phương thức bắt buộc phải khai báo rõ ràng kiểu trả về (Return type).

* **Naming Conventions (Quy ước đặt tên):**
  * **Variables & Functions:** `camelCase` — ví dụ: `getUserSession`, `isTenantActive`
  * **Classes, Interfaces, Types:** `PascalCase` — ví dụ: `ChatSessionDto`, `CreateSyllabusInput`
  * **Database Models (Prisma):** `PascalCase` số ít — ví dụ: `Syllabus`, `ChatMessage`
  * **Constants:** `UPPER_SNAKE_CASE` — ví dụ: `MAX_VIDEO_DURATION_SECONDS`
  * **Files (Backend):** `kebab-case` — ví dụ: `chat.controller.ts`, `syllabus.controller.ts`
  * **Files (Frontend):** `PascalCase` cho components — ví dụ: `ChatbotWidget.tsx`, `AuthContext.tsx`

* **Database Mapping:**
  * Mọi Prisma model bắt buộc phải có `@@map("snake_case_table_name")`.
  * Mọi trường phải có `@map("snake_case_column_name")` nếu tên field TypeScript dùng camelCase.
  * Ví dụ: `syllabusId String @map("syllabus_id")` → bảng DB cột `syllabus_id`.

---

## ⚡ 2. Quy Chuẩn Backend Hono.js

* **Tuân thủ Web Standard API:**
  * Hono.js hoạt động dựa trên Web API tiêu chuẩn (Request, Response). Luôn dùng context `c` để lấy và trả dữ liệu.
  * Dùng `c.req.valid('json')` kết hợp với **Zod** để validate input tại middleware.

* **Controller Pattern:**
  * Mỗi module có 1 file controller (`*.controller.ts`) chứa `new Hono()` router riêng.
  * Mount router vào `app` trong `api/src/index.ts` — không để logic trong file entrypoint.
  * Ví dụ: `app.route("/api/syllabus", syllabusRouter)`.

* **Repository Pattern:**
  * Logic DB queries phức tạp tách vào `*.repository.ts` để tái sử dụng.
  * Ví dụ: `DocumentRepository.delete(id)` — xử lý cả Prisma delete + retrieval cleanup.

* **Xử lý Lỗi Tập Trung (Global Error Handling):**
  * Không viết `try-catch` lặp lại ở mọi endpoint.
  * Sử dụng `app.onError((err, c) => { ... })` để bắt mọi lỗi và trả về JSON chuẩn:
    ```json
    {
      "success": false,
      "error": {
        "code": "INTERNAL_SERVER_ERROR",
        "message": "Đã có lỗi hệ thống xảy ra."
      }
    }
    ```

* **SSE Streaming:**
  * Dùng Hono's `streamSSE()` helper cho các endpoint chat streaming.
  * Đảm bảo gửi `citations` cùng với hoặc sau stream text hoàn chỉnh.

* **Logging:**
  * Dùng `winston` logger (import từ `utils/logger.ts`) — **không dùng** `console.log` trong production code.
  * Logger middleware ghi request/response vào `logs/api.log`.

---

## 🎨 3. Quy Chuẩn Frontend Next.js

* **Server Components (RSC) làm Mặc định:**
  * Mọi Component mặc định phải là Server Component.
  * Chỉ thêm `'use client'` khi component dùng React Hooks (`useState`, `useEffect`) hoặc event handlers.

* **Mantine UI:**
  * Dùng Mantine components thay vì tự viết CSS phức tạp (Button, Modal, Table, Form, Notifications...).
  * Dùng `@mantine/notifications` cho toast messages — không dùng alert/confirm native.
  * Dùng `@mantine/form` cho form validation — không tự viết validation logic.
  * Dùng `@mantine/dropzone` cho file upload UI.

* **Auth Context:**
  * Truy cập user info và session qua `useAuth()` hook từ `AuthContext.tsx`.
  * Bọc pages cần bảo vệ bằng `<ProtectedRoute>` component.

* **Data Fetching:**
  * Dùng `fetch` với `credentials: 'include'` để gửi cookie session.
  * Xử lý loading state bằng Mantine `<Skeleton>` hoặc `<Loader>`.
  * Không tạo global state phức tạp nếu có thể dùng local state + React Query.

* **Tối ưu hóa:**
  * Dùng `<Image>` của Next.js thay cho `<img>` thô.
  * Dùng `next/font` cho font tối ưu hóa.

---

## 🔒 4. Quy Tắc Bảo Mật & Data Integrity

* **Session Validation:**
  * Mọi protected endpoint phải validate session qua Better Auth trước khi thực thi logic.
  * Dùng `auth.api.getSession(c.req.raw)` để lấy thông tin user hiện tại.

* **Role-Based Access:**
  * Kiểm tra `user.role` trước mọi mutation operation (create, update, delete).
  * `STUDENT` chỉ được đọc; `LECTURER` được quản lý tài liệu; `ADMIN` có toàn quyền.

* **Retrieval Isolation:**
  * Mọi query retrieval bắt buộc phải có `filter` theo `syllabus_id` hoặc danh sách `document_id`.
  * **Không bao giờ** query toàn bộ collection mà không có payload filter.

* **Cascade Delete Integrity:**
  * Khi xóa `Document`: xóa vectors trong retrieval store trước, sau đó xóa record DB.
  * Khi xóa `Syllabus`: Prisma cascade xóa tất cả sub-tables tự động.
  * Không để "orphan" vectors trong retrieval store.

* **Input Validation:**
  * Tất cả input từ client phải được validate bằng Zod schema trước khi xử lý.
  * File uploads phải kiểm tra MIME type và giới hạn size.

---

## 🧬 5. Quy Tắc RAG Ecosystem Integrity

* **Embedding Consistency:**
  * Tài liệu text/slide dùng `BAAI/bge-vi-base` hoặc `gemini-embedding-002`.
  * Video/Audio dùng `gemini-embedding-002` (multimodal native).
  * **Không được trộn embedding models** trong cùng một retrieval collection.

* **Chunk Metadata:**
  * Mọi vector upsert phải kèm payload đầy đủ: `document_id`, `syllabus_id`, `page` (hoặc `timestamp` cho video), `text` snippet.

* **Status Tracking:**
  * `Document.status` phải phản ánh đúng trạng thái xử lý: `PENDING → PROCESSING → COMPLETED | FAILED`.
  * Worker update status qua `PATCH /api/internal/documents/:id`.

---

## 📦 6. Quy Trình Git & Pull Request

* **Quy tắc đặt tên nhánh (Branch Naming):**
  * Feature: `feature/ten-tinh-nang` — ví dụ: `feature/chat-scoping`
  * Bugfix: `bugfix/ten-loi` — ví dụ: `bugfix/sse-close-event`
  * Docs: `docs/ten-tai-lieu` — ví dụ: `docs/update-roadmap`

* **Commit Convention (Conventional Commits — Tiếng Việt):**
  * Format: `<type>(<scope>): <mô tả tiếng Việt>`
  * Các type hợp lệ: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
  * Ví dụ: `feat(chat): thêm dynamic document scoping cho chat session`
  * Ví dụ: `fix(syllabus): sửa lỗi cascade delete không xóa vectors trong retrieval store`

* **Quy tắc push:**
  * Không push trực tiếp lên `main`. Luôn tạo PR.
  * Kiểm tra lint (`make lint-api`, `make lint-web`) trước khi push.
