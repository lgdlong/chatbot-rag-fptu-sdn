# TÀI LIỆU THIẾT KẾ KIẾN TRÚC & KỸ THUẬT (TECHNICAL & ARCHITECTURE DESIGN)

> Status: Current
> Audience: Developer
> Canonical: Yes
> Owner: Technical

Tài liệu này trình bày thiết kế kiến trúc kỹ thuật hiện tại của hệ thống **FPTU Chatbot RAG**.

> [!IMPORTANT]
> Đây là tài liệu kỹ thuật, không phải source of truth nghiệp vụ.

---

## 1. Kiến Trúc Tổng Thể (System Architecture)

Hệ thống được xây dựng theo mô hình **Monorepo Client-Server**, phân tách rõ ràng giữa lớp giao diện (Frontend) và lớp nghiệp vụ (Backend API), quản lý bởi **Turborepo**.

```mermaid
graph TD
    Client["Next.js 16 App Router
    Web App (port 3000)"] <-->|HTTPS / SSE Streaming| API["Hono.js Backend
    Node.js Runtime (port 8000)"]

    subgraph Storage ["Tầng Lưu Trữ & Truy Vấn"]
        API <-->|Prisma ORM| RDB[("PostgreSQL
        Metadata & Sessions")]
        API <-->|REST API| VDB[("AnythingLLM
        Workspace Retrieval")]
    end

    subgraph AI_Services ["Dịch Vụ AI"]
    API -->|"Embedding + Chat Streaming"| Gemini["Google Gemini API
    gemini-embedding-002 / gemini-2.0-flash"]
        API -->|"Vietnamese Embedding"| LocalEmbedding["Local Embedding
        BAAI/bge-vi-base"]
    end

    subgraph Auth ["Xác Thực"]
        API <-->|Better Auth| AuthDB["User / Session / Account
        tables in PostgreSQL"]
    end
```

### 1.1 Frontend (Next.js 16)
* **Công nghệ:** **Next.js App Router**, **TypeScript**, **Mantine UI**, **Tailwind CSS**.
* **Đặc điểm:**
  * Sử dụng Mantine UI thay cho shadcn/ui — component library đầy đủ với form, modals, notifications.
  * `AuthContext.tsx` quản lý trạng thái đăng nhập và role routing (`/student`, `/teacher`, `/superadmin`).
  * `ChatbotWidget.tsx` nhận SSE stream từ `/api/chat/stream`.
  * `ProtectedRoute.tsx` bảo vệ các trang yêu cầu xác thực.
* **Structure:**
  * `/login` — trang đăng nhập
  * `/student` — Student dashboard + Syllabus viewer
  * `/teacher` — Teacher docs, curriculum, syllabus, users management
  * `/superadmin` — Superadmin whitelist + user management

### 1.2 Backend (Hono.js)
* **Công nghệ:** **Hono.js**, **TypeScript**, **Node.js**.
* **Đặc điểm:**
  * CORS cấu hình để reflect origin (phù hợp dev với nhiều port).
  * Swagger UI tự động sinh từ `openApiDoc` tại `/api/docs`.
  * Tất cả routes được mount trong `api/src/index.ts` với mô-đun `Hono` riêng biệt.
  * File uploads phục vụ static từ `/uploads/*`.

### 1.3 Tầng Dữ Liệu
* **PostgreSQL + Prisma ORM:** Lưu trữ domain data (curriculum, syllabus, users, chat history).
* **AnythingLLM:** Workspace retrieval cho syllabus-scoped chat.

---

## 2. Luồng Dữ Liệu Chi Tiết (Data Flows)

### 2.1 Luồng Upload & Index Tài Liệu (Document Ingestion Pipeline)

```mermaid
sequenceDiagram
    autonumber
    actor L as Giảng viên
    participant FE as Next.js Web App
    participant BE as Hono.js API
    participant FS as File System (/uploads)
    participant E as Gemini Embedding API
    participant VDB as AnythingLLM Workspace
    participant RDB as PostgreSQL

    L->>FE: Upload File (PDF)
    FE->>BE: POST /api/syllabus/:syllabusId/documents (multipart)
    BE->>FS: Lưu file vật lý vào /uploads
    BE->>RDB: Tạo Document record (status: PENDING)
    BE-->>FE: Response { id, status: "PENDING" }

    Note over BE: Async ingestion được API điều phối nội bộ
    BE->>FS: Đọc file vật lý khi xử lý ingestion
    BE->>BE: Trích xuất text / chunking theo tài liệu
    BE->>E: Gọi embedding cho từng chunk khi cần
    E-->>BE: Vectors
    BE->>VDB: Đồng bộ retrieval payload hiện hành
    BE->>RDB: Cập nhật status → COMPLETED
    BE->>BE: PATCH /api/internal/documents/:id (status update nội bộ)
```

### 2.2 Luồng Chat & Hỏi Đáp RAG (Chat Flow)

```mermaid
sequenceDiagram
    autonumber
    actor S as Sinh viên
    participant FE as Next.js Web App
    participant BE as Hono.js API
    participant RDB as PostgreSQL
    participant E as Gemini Embedding
    participant VDB as AnythingLLM Workspace
    participant LLM as Gemini Flash

    S->>FE: Gõ câu hỏi & Chọn syllabus đang mở
    FE->>BE: POST /api/chat/stream (JSON: sessionId, message)
    BE->>RDB: Đọc ChatSession → xác định syllabus đang mở
    BE->>RDB: Đọc lịch sử chat gần nhất (context window)
    BE->>E: Tạo embedding cho câu hỏi
    E-->>BE: Query vector
    BE->>VDB: Retrieval trong workspace hiện tại
    VDB-->>BE: Top relevant chunks
    BE->>BE: Xây dựng Prompt (System + Context chunks + History + Question)
    BE->>LLM: Gửi Prompt → yêu cầu streaming response
    loop SSE Streaming
        LLM-->>BE: Token chunks
        BE-->>FE: SSE data events
    end
    FE-->>S: Hiển thị câu trả lời real-time + Citations
    BE->>RDB: Lưu ChatMessage (content + citations JSON)
```

---

## 3. Pipeline Xử Lý Đa Phương Thức (Multimodal Processing)

* **Video / images / other formats:** không thuộc Release A.
* **PDF:** nguồn chính cho ingestion.

---

## 4. Thiết Kế Cơ Sở Dữ Liệu (Database Schema Design)

Schema được thiết kế đặc thù cho cấu trúc học thuật FPT University với **21 models**.

### 4.1 Domain Hierarchy (FPTU Academic Structure)

```
Major (SE, AI, BIT...)
  └── Specialization (NJS, NET, FE...)
        └── Curriculum (BIT_SE_NJS_19B)
              └── CurriculumSubject (semesterNo, isSpecializationSpecific)
                    └── Course (SDN302, FER202)
                          └── Syllabus (phiên bản 1 môn, isApproved, isActive)
                                ├── SyllabusClo         (CLO1, CLO2...)
                                ├── SyllabusSchedule    (60 buổi học)
                                ├── AssessmentScheme    (phân bổ điểm)
                                ├── SyllabusMaterial    (học liệu)
                                ├── ConstructiveQuestion (câu hỏi Edunext)
                                ├── SyllabusReference   (tài liệu tham khảo)
                                ├── VideoLink           (video bài giảng)
                                └── Document            (file upload → retrieval store)
```

### 4.2 Chat Models

```
ChatSession (scopeMode: SELECTED_SYLLABUS)
  └── ChatMessage          (sender: USER | ASSISTANT, citations: Json?)
```

### 4.3 Auth & Admin Models (Better Auth)

```
User (id, email, role: ADMIN|LECTURER|STUDENT, banned)
  ├── Session (token, expiresAt, ipAddress)
  ├── Account (providerId, accessToken)
  └── AuditLog (action, entityType, entityId, details)

EmailWhitelist    (email — chỉ email này mới được đăng ký)
Verification      (identifier, value, expiresAt)
```

---

## 5. Bảo Mật & Data Integrity

### 5.1 Authentication Flow
1. User POST `/api/auth/sign-up/email` → Better Auth kiểm tra `EmailWhitelist`
2. Login tạo `Session` trong PostgreSQL
3. Mọi request protected phải có cookie session hợp lệ
4. Middleware Better Auth validate session và inject `user` vào context

### 5.2 Data Integrity Rules
- **Cascade Delete:** Xóa `Syllabus` → cascade xóa toàn bộ `Document`, `SyllabusSchedule`, `SyllabusClo`...
- **Vector Sync:** Xóa `Document` phải đồng bộ xóa vectors trong retrieval store trước
- **Active Syllabus:** Chỉ có thể có 1 Syllabus `isActive=true` trên 1 Course tại một thời điểm
- **Role Check:** Mọi mutating operation phải kiểm tra `user.role` trước khi thực thi

---

> [!IMPORTANT]
> **Lưu ý Cô Lập Dữ Liệu:** Mọi query retrieval phải giới hạn trong syllabus/workspace đang mở. Không được truy vấn vượt scope.

---

> **Last Updated:** 2026-06-05
> **Version:** 2.0
