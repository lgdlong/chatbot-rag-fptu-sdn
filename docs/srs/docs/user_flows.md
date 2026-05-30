# User Flows — RAG Chatbot & Mini FLM

> **Phiên bản:** 1.0 — 23/05/2026
> **Tham chiếu:** [SRS_Detailed.md](file:///e:/FPT/Semester_7/SDN302/srs/SRS_Detailed.md) | [Use Case Diagrams](file:///e:/FPT/Semester_7/SDN302/srs/docs/use_case_diagrams.md)

---

## Mục Lục

1. [Luồng Sinh Viên: Đăng Nhập & Hỏi Đáp](#1-luồng-sinh-viên-đăng-nhập--hỏi-đáp)
2. [Luồng Admin: Quản Lý Syllabus](#2-luồng-admin-quản-lý-syllabus)
3. [Luồng Admin: Upload & Xử Lý Tài Liệu](#3-luồng-admin-upload--xử-lý-tài-liệu)
4. [Luồng Admin: Quản Lý Chương Trình Đào Tạo](#4-luồng-admin-quản-lý-chương-trình-đào-tạo)
5. [Luồng Super Admin: Quản Lý Tài Khoản](#5-luồng-super-admin-quản-lý-tài-khoản)
6. [Luồng Xác Thực (Auth)](#6-luồng-xác-thực-auth)

---

## 1. Luồng Sinh Viên: Đăng Nhập & Hỏi Đáp

### 1.1 Tổng quan luồng chính

```mermaid
flowchart TD
    Start(["🎓 Sinh viên mở ứng dụng"])
    Login["Trang đăng nhập"]
    Google["Đăng nhập Google OAuth"]
    CheckWL{"Email trong whitelist?"}
    Reject["❌ Từ chối:<br/>Email chưa được trường cấp quyền"]
    Home["🏠 Trang chủ<br/>(Search môn học)"]
    Search["Nhập Subject Code<br/>(VD: FER202)"]
    Results["Kết quả tìm kiếm<br/>(chỉ active + approved)"]
    SubjectPage["📖 Trang môn học<br/>(Syllabus đầy đủ trên web)"]
    OpenChat["💬 Mở chatbot<br/>(giới hạn theo môn)"]
    AskQuestion["Gửi câu hỏi<br/>(Việt/Anh, ≤ 5000 ký tự)"]
    GetAnswer["Nhận câu trả lời<br/>+ trích dẫn nguồn"]
    ContinueChat{"Hỏi tiếp?"}
    ViewHistory["📋 Xem lịch sử chat"]
    DeleteChat["🗑️ Xóa phiên chat"]
    End(["Kết thúc"])

    Start --> Login
    Login --> Google
    Google --> CheckWL
    CheckWL -->|Có| Home
    CheckWL -->|Không| Reject
    Reject --> Login
    Home --> Search
    Search --> Results
    Results --> SubjectPage
    SubjectPage --> OpenChat
    OpenChat --> AskQuestion
    AskQuestion --> GetAnswer
    GetAnswer --> ContinueChat
    ContinueChat -->|Có| AskQuestion
    ContinueChat -->|Không| ViewHistory
    ViewHistory --> DeleteChat
    DeleteChat --> End

    SubjectPage -.->|Xem trực tiếp| End
```

### 1.2 Chi tiết từng bước

| Bước | Hành động | Màn hình / Component | Ghi chú |
|---|---|---|---|
| 1 | Sinh viên truy cập ứng dụng | Trang đăng nhập | Nút "Đăng nhập bằng Google" |
| 2 | Nhấn đăng nhập Google | Google OAuth popup | Better Auth xử lý |
| 3 | Hệ thống kiểm tra email whitelist | — (backend) | Email không trong whitelist → thông báo lỗi |
| 4 | Đăng nhập thành công → Trang chủ | Trang chủ | Thanh search Subject Code |
| 5 | Nhập Subject Code (VD: "FER202") | Thanh search | Chỉ hiện kết quả `is_active=True AND is_approved=True` |
| 6 | Nhấn chọn môn từ kết quả | Trang môn học | Hiển thị syllabus đầy đủ (scrollable) |
| 7 | Nhấn nút "Hỏi đáp" / mở chatbot | Panel chatbot bên phải | Giới hạn scope trong môn đang xem |
| 8 | Gõ câu hỏi, gửi | Input chat | ≤ 5.000 ký tự |
| 9 | Chờ phản hồi | Loading indicator | Timeout: 3 phút |
| 10 | Đọc câu trả lời + trích dẫn | Bubble chat + citations block | Click trích dẫn xem chi tiết |
| 11 | Tiếp tục hỏi hoặc kết thúc | Chat input / nút đóng | ≤ 100 tin nhắn/phiên |

---

## 2. Luồng Admin: Quản Lý Syllabus

### 2.1 Tạo & Phê Duyệt Syllabus Mới

```mermaid
flowchart TD
    Start(["👨‍💼 Admin đăng nhập"])
    Dashboard["🏠 Dashboard Admin"]
    NavSyllabus["Vào mục Quản lý Syllabus"]
    SearchExisting["Search Subject Code<br/>(kiểm tra đã tồn tại chưa)"]
    Exists{"Subject Code<br/>đã tồn tại?"}
    CreateNew["📝 Tạo bản nháp mới<br/>is_active=F, is_approved=F"]
    InputMeta["Nhập metadata<br/>(tên, tín chỉ, prerequisites...)"]
    InputCLO["Nhập CLOs"]
    InputSchedule["Nhập Schedule<br/>(60+ sessions)"]
    InputAssess["Nhập Assessment Scheme"]
    ValidateWeight{"Tổng weight<br/>= 100%?"}
    ErrorWeight["❌ Lỗi: Tổng weight ≠ 100%"]
    InputMaterial["Nhập Materials"]
    SaveDraft["💾 Lưu bản nháp"]
    Review["📋 Review bản nháp"]
    Approve["✅ Phê duyệt<br/>→ is_approved=True"]
    LogAudit["📝 Ghi AuditLog:<br/>ai duyệt, lúc nào"]
    Activate["🚀 Kích hoạt<br/>→ is_active=True"]
    AutoDeactivate["⚙️ Tự động deactivate<br/>bản cũ cùng Subject Code"]
    Done(["✅ Syllabus đang hoạt động<br/>Sinh viên có thể xem & chat"])

    Start --> Dashboard
    Dashboard --> NavSyllabus
    NavSyllabus --> SearchExisting
    SearchExisting --> Exists
    Exists -->|Không| CreateNew
    Exists -->|Có, muốn thêm phiên bản mới| CreateNew
    CreateNew --> InputMeta
    InputMeta --> InputCLO
    InputCLO --> InputSchedule
    InputSchedule --> InputAssess
    InputAssess --> ValidateWeight
    ValidateWeight -->|Không| ErrorWeight
    ErrorWeight --> InputAssess
    ValidateWeight -->|Có| InputMaterial
    InputMaterial --> SaveDraft
    SaveDraft --> Review
    Review --> Approve
    Approve --> LogAudit
    LogAudit --> Activate
    Activate --> AutoDeactivate
    AutoDeactivate --> Done
```

### 2.2 Sửa & Vô Hiệu Hóa Syllabus

```mermaid
flowchart TD
    Start(["👨‍💼 Admin"])
    Search["Search Subject Code"]
    ViewAll["Xem tất cả phiên bản<br/>(active/inactive/approved/unapproved)"]
    Select["Chọn phiên bản cần xử lý"]

    Decision{"Hành động?"}

    EditMinor["✏️ Sửa nhỏ<br/>(typo, note)<br/>Ghi đè trực tiếp"]
    Deactivate["🔒 Vô hiệu hóa<br/>is_active=False<br/>(ẩn, giữ trong DB)"]
    HardDelete["🗑️ Xóa vật lý<br/>Hard delete khỏi DB<br/>+ Xóa mọi embedding"]
    ConfirmDelete{"Xác nhận xóa?<br/>(không thể hoàn tác)"}

    Done(["✅ Hoàn tất"])

    Start --> Search
    Search --> ViewAll
    ViewAll --> Select
    Select --> Decision
    Decision -->|Sửa nhỏ| EditMinor
    Decision -->|Ẩn| Deactivate
    Decision -->|Xóa hẳn| HardDelete
    HardDelete --> ConfirmDelete
    ConfirmDelete -->|Có| Done
    ConfirmDelete -->|Không| Select
    EditMinor --> Done
    Deactivate --> Done
```

### 2.3 Search Syllabus (Admin vs Sinh Viên)

```mermaid
flowchart LR
    subgraph Admin_Search["Admin Search"]
        AS1["Nhập Subject Code<br/>(fuzzy search)"]
        AS2["Kết quả: TẤT CẢ trạng thái"]
        AS3["Bảng: Syllabus ID, Subject Code,<br/>Subject Name, Syllabus Name (link),<br/>IsActive, IsApproved, DecisionNo"]
        AS4["Sort & Filter trên các cột"]
        AS5["Infinity scroll<br/>(TanStack Virtual)"]

        AS1 --> AS2 --> AS3 --> AS4 --> AS5
    end

    subgraph SV_Search["Sinh Viên Search"]
        SS1["Nhập Subject Code"]
        SS2["Kết quả: chỉ<br/>is_active=T AND is_approved=T"]
        SS3["Click vào → Trang môn học"]

        SS1 --> SS2 --> SS3
    end
```

---

## 3. Luồng Admin: Upload & Xử Lý Tài Liệu

```mermaid
flowchart TD
    Start(["👨‍💼 Admin"])
    SelectSubject["Chọn môn học"]
    CheckLimit{"Đã có < 10 file?"}
    LimitError["❌ Đã đạt giới hạn 10 file.<br/>Xóa file cũ trước."]

    ChooseAction{"Hành động?"}

    UploadFile["📤 Upload file<br/>(PDF/DOCX/PPTX/Image)"]
    ValidateFile{"Validate:<br/>≤ 50MB? Đúng format?<br/>Không trống?"}
    RejectFile["❌ Từ chối upload<br/>(lý do cụ thể)"]
    Queued["⏳ Đang chờ xử lý"]
    Chunking["⚙️ Auto Chunking"]
    Embedding["⚙️ Auto Embedding<br/>(Gemini Embedding → Qdrant)"]
    Indexed["✅ Đã index"]
    Failed["❌ Thất bại<br/>(Admin có thể xóa + upload lại)"]

    AddVideo["🔗 Gắn video URL<br/>(YouTube/GDrive)"]
    ValidateURL{"URL hợp lệ?"}
    SaveURL["💾 Lưu metadata URL"]
    RejectURL["❌ URL không hợp lệ"]

    ViewList["📋 Xem danh sách tài liệu<br/>(trạng thái index)"]
    DeleteFile["🗑️ Xóa file<br/>(+ xóa embeddings Qdrant)"]

    Start --> SelectSubject
    SelectSubject --> CheckLimit
    CheckLimit -->|Có| ChooseAction
    CheckLimit -->|Không| LimitError

    ChooseAction -->|Upload file| UploadFile
    ChooseAction -->|Gắn video| AddVideo
    ChooseAction -->|Xem danh sách| ViewList
    ChooseAction -->|Xóa file| DeleteFile

    UploadFile --> ValidateFile
    ValidateFile -->|Hợp lệ| Queued
    ValidateFile -->|Không| RejectFile
    Queued --> Chunking
    Chunking --> Embedding
    Embedding -->|Thành công| Indexed
    Embedding -->|Thất bại| Failed

    AddVideo --> ValidateURL
    ValidateURL -->|Có| SaveURL
    ValidateURL -->|Không| RejectURL
```

---

## 4. Luồng Admin: Quản Lý Chương Trình Đào Tạo

```mermaid
flowchart TD
    Start(["👨‍💼 Admin"])
    Dashboard["Dashboard Admin"]
    NavCurriculum["Vào mục Chương trình ĐT"]

    ChooseAction{"Hành động?"}

    CreateMajor["CRUD Ngành<br/>(VD: Software Engineering)"]
    CreateSpec["CRUD Chuyên ngành hẹp<br/>(VD: React/NodeJS, .NET)"]
    CreateCurr["Tạo Chương trình ĐT<br/>ID: BIT_SE_NJS_19B"]
    AssignSubjects["Gán môn học theo kỳ<br/>(44 chung + 4 đặc thù)"]
    Check4{"Đúng 4 môn đặc thù?"}
    Warn4["⚠️ Cảnh báo: ≠ 4 môn<br/>(cho phép lưu)"]
    Done(["✅ Hoàn tất"])

    Start --> Dashboard
    Dashboard --> NavCurriculum
    NavCurriculum --> ChooseAction
    ChooseAction -->|Ngành| CreateMajor
    ChooseAction -->|CNHEP| CreateSpec
    ChooseAction -->|Chương trình| CreateCurr

    CreateCurr --> AssignSubjects
    AssignSubjects --> Check4
    Check4 -->|Có| Done
    Check4 -->|Không| Warn4
    Warn4 --> Done

    CreateMajor --> Done
    CreateSpec --> Done
```

---

## 5. Luồng Super Admin: Quản Lý Tài Khoản

```mermaid
flowchart TD
    Start(["🔑 Super Admin"])
    Login["Đăng nhập<br/>(email/password)"]
    Dashboard["Dashboard Super Admin"]

    ChooseAction{"Hành động?"}

    ManageAdmins["👥 Quản lý tài khoản Admin<br/>(tạo/xóa/vô hiệu hóa)"]
    ManageWhitelist["📧 Quản lý whitelist email<br/>(thêm/xóa email SV)"]
    AllAdminFeatures["📦 Tất cả tính năng Admin<br/>(CRUD, upload, search...)"]

    Start --> Login
    Login --> Dashboard
    Dashboard --> ChooseAction
    ChooseAction -->|Tài khoản| ManageAdmins
    ChooseAction -->|Whitelist| ManageWhitelist
    ChooseAction -->|Quản lý nội dung| AllAdminFeatures
```

---

## 6. Luồng Xác Thực (Auth)

### 6.1 Đăng Nhập Admin

```mermaid
flowchart TD
    Start(["Admin mở trang"])
    LoginPage["Trang đăng nhập Admin"]
    InputCreds["Nhập email + mật khẩu"]
    BetterAuth["Better Auth xử lý"]
    Valid{"Credentials hợp lệ?"}
    Success["✅ Redirect → Dashboard"]
    Fail["❌ Sai email/mật khẩu"]
    ForgotPW["Quên mật khẩu?<br/>→ Better Auth reset flow"]

    Start --> LoginPage
    LoginPage --> InputCreds
    InputCreds --> BetterAuth
    BetterAuth --> Valid
    Valid -->|Có| Success
    Valid -->|Không| Fail
    Fail --> LoginPage
    LoginPage --> ForgotPW
```

### 6.2 Đăng Nhập Sinh Viên (Google OAuth)

```mermaid
flowchart TD
    Start(["Sinh viên mở trang"])
    LoginPage["Trang đăng nhập"]
    ClickGoogle["Nhấn 'Đăng nhập bằng Google'"]
    GooglePopup["Google OAuth popup"]
    SelectAccount["Chọn tài khoản Google"]
    GetToken["Nhận ID token"]
    CheckWhitelist{"Email trong<br/>whitelist?"}
    Success["✅ Redirect → Trang chủ"]
    Reject["❌ Email chưa được cấp quyền.<br/>Liên hệ admin."]

    Start --> LoginPage
    LoginPage --> ClickGoogle
    ClickGoogle --> GooglePopup
    GooglePopup --> SelectAccount
    SelectAccount --> GetToken
    GetToken --> CheckWhitelist
    CheckWhitelist -->|Có| Success
    CheckWhitelist -->|Không| Reject
    Reject --> LoginPage
```

---

## 7. Bảng Tham Chiếu Luồng ↔ Use Case ↔ FR

| Luồng | Use Case | FR | Actor |
|---|---|---|---|
| 1 — SV đăng nhập & hỏi đáp | UC-07.2, UC-04.1→UC-04.6 | FR-07.2, FR-04.1→FR-04.8 | Sinh viên |
| 2.1 — Tạo & phê duyệt syllabus | UC-02.1→UC-02.3 | FR-02.1→FR-02.3 | Admin |
| 2.2 — Sửa & vô hiệu hóa | UC-02.4→UC-02.6 | FR-02.4→FR-02.6 | Admin |
| 2.3 — Search syllabus | UC-02.8, UC-02.9 | FR-02.8, FR-02.9 | Admin, SV |
| 3 — Upload tài liệu | UC-03.1→UC-03.5 | FR-03.1→FR-03.8 | Admin |
| 4 — Chương trình ĐT | UC-01.1→UC-01.4 | FR-01.1→FR-01.5 | Admin |
| 5 — Quản lý tài khoản | UC-07.3, UC-07.6, UC-07.7 | FR-07.3→FR-07.7 | Super Admin |
| 6 — Auth | UC-07.1, UC-07.2 | FR-07.1→FR-07.5 | Admin, SV |
