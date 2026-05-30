# Sequence Diagrams — RAG Chatbot & Mini FLM

> **Phiên bản:** 1.0 — 23/05/2026
> **Tham chiếu:** [SRS_Detailed.md](file:///e:/FPT/Semester_7/SDN302/srs/SRS_Detailed.md) | [User Flows](file:///e:/FPT/Semester_7/SDN302/srs/docs/user_flows.md)

---

## Mục Lục

1. [Đăng Nhập Sinh Viên (Google OAuth + Whitelist)](#1-đăng-nhập-sinh-viên-google-oauth--whitelist)
2. [Chatbot Hỏi Đáp (RAG Pipeline)](#2-chatbot-hỏi-đáp-rag-pipeline)
3. [Upload & Index Tài Liệu](#3-upload--index-tài-liệu)
4. [Tạo & Phê Duyệt Syllabus](#4-tạo--phê-duyệt-syllabus)
5. [Xóa Tài Liệu](#5-xóa-tài-liệu)
6. [Vô Hiệu Hóa Syllabus](#6-vô-hiệu-hóa-syllabus)
7. [Đăng Nhập Admin](#7-đăng-nhập-admin)
8. [Search Syllabus](#8-search-syllabus)

---

## 1. Đăng Nhập Sinh Viên (Google OAuth + Whitelist)

> **Actors:** Sinh viên, Google OAuth, Better Auth, Backend, PostgreSQL
> **Tham chiếu:** FR-07.2, EC-30

```mermaid
sequenceDiagram
    actor SV as 👨‍🎓 Sinh viên
    participant FE as Frontend
    participant Google as Google OAuth
    participant BA as Better Auth
    participant BE as Backend API
    participant DB as PostgreSQL

    SV->>FE: Nhấn "Đăng nhập bằng Google"
    FE->>Google: Redirect OAuth popup
    SV->>Google: Chọn tài khoản Google
    Google->>FE: Trả về ID token + email
    FE->>BE: POST /auth/google (id_token)
    BE->>BA: Xác minh token Google
    BA->>Google: Verify ID token
    Google-->>BA: Token hợp lệ, email: sv@fpt.edu.vn
    BA->>DB: SELECT FROM email_whitelist WHERE email = ?
    
    alt Email trong whitelist ✅
        DB-->>BA: Tìm thấy
        BA->>DB: Tạo/Cập nhật User + Session
        BA-->>BE: Session token
        BE-->>FE: 200 OK + JWT
        FE-->>SV: Redirect → Trang chủ
    else Email KHÔNG trong whitelist ❌
        DB-->>BA: Không tìm thấy
        BA-->>BE: 403 Forbidden
        BE-->>FE: "Email chưa được trường cấp quyền"
        FE-->>SV: Hiển thị lỗi trên trang đăng nhập
    end
```

---

## 2. Chatbot Hỏi Đáp (RAG Pipeline)

> **Actors:** Sinh viên, Backend, PostgreSQL, Qdrant, LLM
> **Tham chiếu:** FR-04.3, FR-04.4, FR-06.1–FR-06.5, BR-06

```mermaid
sequenceDiagram
    actor SV as 👨‍🎓 Sinh viên
    participant FE as Frontend
    participant BE as Backend API
    participant DB as PostgreSQL
    participant QD as Qdrant
    participant LLM as LLM Service

    SV->>FE: Gửi câu hỏi (VD: "FER202 thi cuối kỳ bao nhiêu %?")
    FE->>BE: POST /chat/message {sessionId, subjectCode: "FER202", question}
    
    Note over BE: Bước 1: Validate
    BE->>BE: Kiểm tra ≤ 5000 ký tự
    BE->>BE: Kiểm tra session ≤ 100 tin nhắn

    Note over BE: Bước 2: Scope theo Subject Code
    BE->>DB: Query structured syllabus data<br/>WHERE subject_code = "FER202"
    DB-->>BE: metadata, CLOs, schedule,<br/>assessment_scheme, materials

    Note over BE: Bước 3: Vector Search
    BE->>QD: Search vectors<br/>filter: {subject_code: "FER202", is_active: true}<br/>top_k: 5
    QD-->>BE: Top-5 relevant chunks<br/>(+ source file, chapter, page)

    Note over BE: Bước 4: Xây dựng context
    BE->>BE: Merge structured data + vector chunks
    BE->>BE: Build prompt:<br/>- System: "Chỉ trả lời từ context"<br/>- Context: structured + chunks<br/>- History: chat lịch sử<br/>- Question: câu hỏi SV

    Note over BE: Bước 5: LLM Generation
    BE->>LLM: Generate response (timeout: 3 phút)
    
    alt LLM phản hồi thành công ✅
        LLM-->>BE: Câu trả lời + citations
        BE->>DB: Lưu Message (role: user + assistant)
        BE-->>FE: 200 OK {answer, citations[]}
        FE-->>SV: Hiển thị câu trả lời + trích dẫn nguồn
    else LLM timeout (> 3 phút) ❌
        LLM-->>BE: Timeout
        BE-->>FE: 504 "Hệ thống xử lý lâu, vui lòng thử lại"
        FE-->>SV: Hiển thị thông báo lỗi
    else Qdrant không phản hồi ❌
        QD-->>BE: Connection error
        BE->>DB: Vẫn query structured data
        BE->>LLM: Generate từ structured data only
        LLM-->>BE: Câu trả lời (hạn chế)
        BE-->>FE: 200 OK {answer, warning: "search tạm không khả dụng"}
        FE-->>SV: Hiển thị câu trả lời + cảnh báo
    end
```

---

## 3. Upload & Index Tài Liệu

> **Actors:** Admin, Backend, Queue, Qdrant
> **Tham chiếu:** FR-03.1–FR-03.5, EC-01–EC-07

```mermaid
sequenceDiagram
    actor AD as 👨‍💼 Admin
    participant FE as Frontend
    participant BE as Backend API
    participant DB as PostgreSQL
    participant Q as Task Queue
    participant CK as Chunking Service
    participant EM as Embedding Service<br/>(Gemini)
    participant QD as Qdrant

    AD->>FE: Chọn file + Subject Code
    FE->>BE: POST /documents/upload (file, subjectCode)
    
    Note over BE: Validate
    BE->>BE: Kiểm tra MIME type (PDF/DOCX/PPTX/Image)
    BE->>BE: Kiểm tra kích thước ≤ 50MB
    BE->>BE: Kiểm tra file không trống
    BE->>DB: Kiểm tra số file hiện có (≤ 10)

    alt Validation thất bại ❌
        BE-->>FE: 400 Bad Request (lý do cụ thể)
        FE-->>AD: Hiển thị lỗi
    else Validation OK ✅
        BE->>DB: INSERT Document (status: "Đang chờ")
        BE-->>FE: 202 Accepted
        FE-->>AD: Hiển thị "Đang chờ xử lý"
        
        BE->>Q: Enqueue task: {documentId}

        Q->>CK: Process document
        CK->>DB: UPDATE status = "Đang xử lý"
        Note over FE: Status cập nhật realtime
        CK->>CK: Tách file thành chunks
        
        alt Chunking thành công
            CK->>EM: Gửi chunks để embedding
            EM->>EM: Gemini Embedding<br/>(multilingual VI-EN)
            EM->>QD: Upsert vectors<br/>(metadata: subjectCode, is_active, docId)
            QD-->>EM: OK
            EM->>DB: UPDATE status = "Đã index"
            Note over FE: Status: ✅ Đã index
        else Chunking/Embedding thất bại
            CK->>DB: UPDATE status = "Thất bại"
            Note over FE: Status: ❌ Thất bại<br/>Admin có thể xóa + upload lại
        end
    end
```

---

## 4. Tạo & Phê Duyệt Syllabus

> **Actors:** Admin, Backend, PostgreSQL
> **Tham chiếu:** FR-02.1–FR-02.3, BR-09, BR-10

```mermaid
sequenceDiagram
    actor AD as 👨‍💼 Admin
    participant FE as Frontend
    participant BE as Backend API
    participant DB as PostgreSQL
    participant AL as AuditLog

    Note over AD,DB: Bước 1: Tạo bản nháp
    AD->>FE: Nhập thông tin syllabus
    FE->>BE: POST /syllabus {metadata, CLOs, schedule, assessment, materials}
    BE->>BE: Validate: Subject Code unique,<br/>tổng weight = 100%
    
    alt Validation OK ✅
        BE->>DB: INSERT Syllabus<br/>is_active=FALSE, is_approved=FALSE
        BE->>DB: INSERT CLOs, Schedule, Assessment, Materials
        BE-->>FE: 201 Created
        FE-->>AD: Bản nháp đã lưu
    else Validation thất bại ❌
        BE-->>FE: 400 Bad Request
        FE-->>AD: Hiển thị lỗi
    end

    Note over AD,DB: Bước 2: Phê duyệt
    AD->>FE: Nhấn "Phê duyệt"
    FE->>BE: PATCH /syllabus/:id/approve
    BE->>DB: UPDATE is_approved = TRUE
    BE->>AL: INSERT AuditLog<br/>{action: APPROVE, userId, syllabusId}
    BE-->>FE: 200 OK
    FE-->>AD: ✅ Đã phê duyệt

    Note over AD,DB: Bước 3: Kích hoạt
    AD->>FE: Nhấn "Kích hoạt"
    FE->>BE: PATCH /syllabus/:id/activate
    BE->>DB: Kiểm tra is_approved = TRUE
    
    alt Chưa approved ❌
        BE-->>FE: 400 "Phải phê duyệt trước khi kích hoạt"
        FE-->>AD: Hiển thị lỗi (BR-09)
    else Đã approved ✅
        BE->>DB: UPDATE SET is_active=FALSE<br/>WHERE subject_code = ? AND is_active = TRUE
        Note over DB: Deactivate tất cả bản cũ
        BE->>DB: UPDATE SET is_active=TRUE<br/>WHERE id = ?
        BE->>QD: Update metadata is_active<br/>cho embeddings liên quan
        BE->>AL: INSERT AuditLog {action: ACTIVATE}
        BE-->>FE: 200 OK
        FE-->>AD: ✅ Syllabus đang hoạt động
    end
```

---

## 5. Xóa Tài Liệu

> **Actors:** Admin, Backend, PostgreSQL, Qdrant
> **Tham chiếu:** FR-03.7, BR-07

```mermaid
sequenceDiagram
    actor AD as 👨‍💼 Admin
    participant FE as Frontend
    participant BE as Backend API
    participant DB as PostgreSQL
    participant QD as Qdrant

    AD->>FE: Nhấn "Xóa" trên file
    FE->>FE: Hiển thị dialog xác nhận
    AD->>FE: Xác nhận xóa
    FE->>BE: DELETE /documents/:id
    
    BE->>DB: SELECT document WHERE id = ?
    DB-->>BE: {id, fileName, subjectCode}
    
    BE->>QD: DELETE vectors WHERE documentId = ?
    QD-->>BE: Deleted N chunks
    
    BE->>DB: DELETE document WHERE id = ?
    DB-->>BE: OK
    
    BE->>DB: INSERT AuditLog<br/>{action: DELETE_DOCUMENT}
    
    BE-->>FE: 200 OK
    FE-->>AD: ✅ File đã xóa
    
    Note over AD: Chatbot sẽ không còn trả lời<br/>từ nội dung file này
```

---

## 6. Vô Hiệu Hóa Syllabus

> **Actors:** Admin, Backend, PostgreSQL, Qdrant
> **Tham chiếu:** FR-02.5, BR-11, BR-19

```mermaid
sequenceDiagram
    actor AD as 👨‍💼 Admin
    participant FE as Frontend
    participant BE as Backend API
    participant DB as PostgreSQL
    participant QD as Qdrant
    participant AL as AuditLog

    AD->>FE: Nhấn "Vô hiệu hóa" syllabus
    FE->>BE: PATCH /syllabus/:id/deactivate
    
    BE->>DB: UPDATE is_active = FALSE<br/>WHERE id = ?
    Note over DB: Syllabus ẩn khỏi SV<br/>nhưng vẫn trong DB
    
    BE->>QD: UPDATE metadata is_active = FALSE<br/>WHERE subjectCode = ? AND syllabusId = ?
    Note over QD: Embeddings vẫn tồn tại<br/>nhưng bị filter khỏi search
    
    BE->>AL: INSERT AuditLog<br/>{action: DEACTIVATE, syllabusId}
    
    BE-->>FE: 200 OK
    FE-->>AD: 🔒 Syllabus đã vô hiệu hóa

    Note over AD: Có thể re-activate sau này<br/>mà không cần re-embed
```

---

## 7. Đăng Nhập Admin

> **Actors:** Admin, Better Auth, PostgreSQL
> **Tham chiếu:** FR-07.1

```mermaid
sequenceDiagram
    actor AD as 👨‍💼 Admin
    participant FE as Frontend
    participant BE as Backend API
    participant BA as Better Auth
    participant DB as PostgreSQL

    AD->>FE: Nhập email + mật khẩu
    FE->>BE: POST /auth/login {email, password}
    BE->>BA: Authenticate
    BA->>DB: SELECT user WHERE email = ?
    DB-->>BA: User record + hashed password
    BA->>BA: Verify password hash
    
    alt Credentials hợp lệ ✅
        BA->>DB: Create session
        BA-->>BE: Session + JWT tokens
        BE-->>FE: 200 OK {accessToken, refreshToken}
        FE->>FE: Lưu token
        FE-->>AD: Redirect → Dashboard
    else Credentials sai ❌
        BA-->>BE: 401 Unauthorized
        BE-->>FE: "Sai email hoặc mật khẩu"
        FE-->>AD: Hiển thị lỗi
    end
```

---

## 8. Search Syllabus

> **Actors:** Admin/Sinh viên, Backend, PostgreSQL
> **Tham chiếu:** FR-02.8, FR-02.9, GAP-05

```mermaid
sequenceDiagram
    actor User as 👤 Người dùng
    participant FE as Frontend
    participant BE as Backend API
    participant DB as PostgreSQL

    User->>FE: Nhập Subject Code (VD: "fer")
    FE->>BE: GET /syllabus/search?q=fer&role={admin|student}
    
    BE->>BE: Kiểm tra role người dùng

    alt Admin
        BE->>DB: SELECT * FROM syllabus<br/>WHERE subject_code ILIKE '%fer%'<br/>ORDER BY created_at DESC
        Note over DB: Fuzzy match,<br/>trả về TẤT CẢ trạng thái
    else Sinh viên
        BE->>DB: SELECT * FROM syllabus<br/>WHERE subject_code ILIKE '%fer%'<br/>AND is_active = TRUE AND is_approved = TRUE
        Note over DB: Chỉ active + approved
    end

    DB-->>BE: Kết quả (nhiều syllabus)
    BE-->>FE: 200 OK [{syllabusId, subjectCode,<br/>subjectName, syllabusName,<br/>isActive, isApproved, decisionNo}]
    
    FE->>FE: Render bảng kết quả<br/>(TanStack Virtual infinity scroll)
    FE-->>User: Hiển thị bảng:<br/>Syllabus ID | Subject Code | Subject Name<br/>Syllabus Name (link) | Status | DecisionNo
    
    User->>FE: Click Syllabus Name link
    FE->>FE: Navigate → Trang chi tiết syllabus
```

---

## 9. Bảng Tổng Hợp Sequence Diagrams

| # | Diagram | Actors | FR/BR tham chiếu | Phức tạp |
|---|---|---|---|---|
| 1 | Đăng nhập SV (Google OAuth) | SV, Google, Better Auth, DB | FR-07.2, EC-30 | Trung bình |
| 2 | Chatbot RAG Pipeline | SV, BE, DB, Qdrant, LLM | FR-04, FR-06, BR-06 | **Cao** |
| 3 | Upload & Index tài liệu | Admin, BE, Queue, Qdrant | FR-03, EC-01→EC-10 | Cao |
| 4 | Tạo & Phê duyệt syllabus | Admin, BE, DB | FR-02.1→02.3, BR-09→10 | Trung bình |
| 5 | Xóa tài liệu | Admin, BE, DB, Qdrant | FR-03.7, BR-07 | Thấp |
| 6 | Vô hiệu hóa syllabus | Admin, BE, DB, Qdrant | FR-02.5, BR-11, BR-19 | Thấp |
| 7 | Đăng nhập Admin | Admin, Better Auth, DB | FR-07.1 | Thấp |
| 8 | Search syllabus | Admin/SV, BE, DB | FR-02.8, FR-02.9 | Trung bình |
