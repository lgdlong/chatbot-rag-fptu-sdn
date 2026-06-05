# Kế Hoạch Chuyển Đổi & Triển Khai Hệ Thống: FPTU Chatbot RAG & Mini FLM

Tài liệu này trình bày kế hoạch chuyển dịch chi tiết đã được đối chiếu chéo và hoàn toàn khớp (fit) với **[SRS_Detailed.md](file:///e:/FPT/Semester_7/SDN302/project/chatbot-rag-fptu/docs/srs/SRS_Detailed.md)**. Các quyết định thiết kế cốt lõi đã được thống nhất:
1.  **Dọn dẹp Qdrant hoàn toàn**: Sử dụng độc quyền **AnythingLLM** để chunking, embedding và tìm kiếm vector cho các tài liệu phi cấu trúc (PDF, DOCX, PPTX). Loại bỏ hoàn toàn Qdrant và bảng `DocumentChunk` chứa vector trong PostgreSQL để tối ưu sự tinh gọn cho CSDL.
2.  **Sử dụng Mantine UI**: Giao diện Next.js sẽ được xây dựng 100% bằng thư viện **Mantine UI**. Tuyệt đối không sử dụng shadcn/ui.
3.  **Whitelist Email cụ thể**: Quản lý whitelist bằng cách import chi tiết từng địa chỉ email của sinh viên vào bảng `EmailWhitelist` trong database và kiểm tra trong Better Auth.
4.  **Cô lập tài nguyên Docker**: Đổi tên docker project thành `chatbot-rag-fptu-sdn` và các container name thành `*-sdn` tương ứng để chạy song song, không xung đột với dự án cũ đang hoạt động.
5.  **Giữ lại luồng `LecturerRequest`**: Không xóa mô hình và nghiệp vụ `LecturerRequest`. Đây vẫn là cơ chế cần thiết để kiểm soát việc cấp quyền giảng viên.
6.  **Không dùng vai trò `SuperAdmin`**: Hệ thống chỉ dùng các vai trò nghiệp vụ cần thiết như `ADMIN`, `LECTURER`, `STUDENT`. Mọi logic, UI và policy liên quan tới `SuperAdmin` phải được loại bỏ để tránh phức tạp hóa phân quyền.
7.  **`LECTURER` quản lý Syllabus, `ADMIN` không quản lý Syllabus**: Quyền quản lý, biên tập, duyệt và kích hoạt syllabus sẽ thuộc vai trò `LECTURER`. Vai trò `ADMIN` chỉ nên xử lý vận hành hệ thống và các tác vụ quản trị chung, không can thiệp vòng đời syllabus.

---

## 🔍 Đối Chiếu & Giải Pháp Khớp Chi Tiết (Alignment Details)

Để đảm bảo hệ thống đáp ứng 100% các yêu cầu nghiệp vụ nghiêm ngặt trong `SRS_Detailed.md`, chúng tôi đã thiết kế các giải pháp cụ thể cho từng hạng mục như sau:

### 1. Giải Pháp Quản Lý Vòng Đời & Lọc Tài Liệu Theo Syllabus Active (FR-06.8 & BR-19)
*   **Thách thức của SRS**: Khi syllabus cũ bị vô hiệu hóa (`is_active=False`), các tài liệu upload thuộc syllabus đó không được tham chiếu trong chatbot. Chỉ tìm kiếm tài liệu thuộc syllabus đang active.
*   **Giải pháp với AnythingLLM**:
    *   *Phương án chọn*: **Cô lập Workspace AnythingLLM theo từng phiên bản Syllabus**. Thay vì tạo 1 Workspace chung cho mã môn học, chúng ta sẽ tạo Workspace trong AnythingLLM theo định dạng slug: `{subject_code}_{syllabus_id}` (ví dụ: `fer202_12580`).
    *   *Cách thức hoạt động*:
        *   Khi Lecturer tạo và upload tài liệu cho một Syllabus mới, tài liệu đó được index riêng trong Workspace của Syllabus đó.
        *   Khi sinh viên mở trang môn học và chat, backend Hono.js sẽ xác định Syllabus đang active của môn học đó (`is_active=True AND is_approved=True`), tìm ra `syllabus_id` tương ứng và điều hướng API chat đến đúng Workspace `{subject_code}_{syllabus_id}`.
        *   Khi kích hoạt Syllabus mới và deactivate Syllabus cũ, hệ thống chỉ việc chuyển hướng gọi API chat sang Workspace mới. Toàn bộ tài liệu của Syllabus cũ được lưu trữ nguyên vẹn ở Workspace cũ và tự động bị cô lập khỏi chatbot của sinh viên mà không cần chạy lại pipeline embedding hay re-embed phức tạp. Điều này hoàn toàn khớp và tối ưu hơn nhiều so với thiết kế filter Qdrant cũ!

### 2. Thiết Kế Trợ Lý FLM & RAG Engine (FR-05 & FR-06.2)
*   **Thách thức của SRS**: Yêu cầu trả lời chính xác 100% các câu hỏi có cấu trúc về syllabus (Assessment weight %, tín chỉ, chuẩn đầu ra CLOs, lịch trình, môn tiên quyết) và kết hợp thông tin phi cấu trúc.
*   **Giải pháp cụ thể**:
    *   Chúng ta xây dựng một **Intent Router (Bộ phân tích ý định)** bằng LLM hoặc regex từ khóa nâng cao tại backend Hono.js.
    *   Khi sinh viên gửi câu hỏi:
        *   *Ý định tra cứu Syllabus (FLM)*: Nếu hỏi về trọng số điểm, tín chỉ, CLOs... Backend sẽ query trực tiếp dữ liệu từ PostgreSQL qua Prisma (ví dụ bảng `AssessmentScheme`, `SyllabusClo`, `SyllabusSchedule`). Sau đó, gộp dữ liệu JSON có cấu trúc này vào prompt gửi cho Gemini làm ngữ cảnh tối thượng, ép LLM trả lời chuẩn xác 100% dựa trên bảng biểu đó.
        *   *Ý định hỏi bài học/tài liệu phi cấu trúc*: Backend gọi API stream-chat của Workspace AnythingLLM tương ứng với Syllabus đang active để lấy nội dung giải thích từ tài liệu đã upload.

### 3. Ràng Buộc Cơ Cấu Đánh Giá (BR-05 & EC-28)
*   **Thách thức của SRS**: Tổng trọng số (`weight`) của tất cả các đầu điểm trong Assessment Scheme phải bằng đúng **100%**. Trường `weight` tương ứng với thuộc tính weight trong dữ liệu syllabus (dạng NUMERIC hoặc số thực có phần trăm).
*   **Giải pháp cụ thể**:
    *   *Trong Database*: Lưu trường `weight` trong bảng `assessment_schemes` dưới dạng `Decimal(5, 2)` (định dạng số, ví dụ `15.00` tương ứng 15%).
    *   *Ở Backend*: Trước khi lưu hoặc cập nhật bất kỳ Assessment Scheme nào của Syllabus, backend sẽ cộng tổng tất cả các `weight` lại. Nếu tổng khác `100.00`, backend sẽ chặn và trả về lỗi HTTP 400 kèm thông báo: *"Tổng trọng số đánh giá phải bằng 100%. Hiện tại: {X}%"*.
    *   *Ở Frontend (Mantine)*: Thiết kế form nhập Assessment Scheme động. Hiển thị tổng weight thời gian thực và highlight màu đỏ cảnh báo nếu tổng weight khác 100%, khóa nút "Lưu".

### 4. Quản Lý File Tài Liệu (FR-03 & EC-04 & EC-10)
*   **Thách thức của SRS**: Giới hạn kích thước file **tối đa 50MB**, tối đa **10 file/subject**. Video chỉ lưu URL bên ngoài (YouTube / Google Drive) và không chunk/embed.
*   **Giải pháp cụ thể**:
    *   *Validate File*: Frontend và backend sẽ kiểm tra kích thước file (`fileSize <= 50 * 1024 * 1024`) trước khi gửi lên AnythingLLM.
    *   *Validate Số lượng*: Khi Lecturer upload, backend sẽ đếm số lượng tài liệu đã upload cho Subject Code đó trong database. Nếu đã đạt 10 file, hệ thống sẽ block và thông báo: *"Đã đạt giới hạn 10 file cho môn này. Vui lòng xóa bớt file cũ"*.
    *   *Video Links*: Lưu trữ trực tiếp trong bảng `VideoLink` riêng biệt, không đẩy qua AnythingLLM để tránh chunking.

### 5. Câu Hỏi Kiến Tạo Edunext (Constructive Questions)
*   **Thách thức của SRS**: Một số môn học đặc thù (như EXE101) có cấu trúc câu hỏi kiến tạo Edunext dạng `0-n`.
*   **Giải pháp cụ thể**:
    *   Database schema hỗ trợ bảng `constructive_questions` liên kết 1-N với `Syllabus`.
    *   Giao diện chi tiết syllabus (Mantine UI) sẽ hiển thị tab/mục "Câu hỏi Edunext" một cách có điều kiện: chỉ hiển thị khi môn học đó có tồn tại câu hỏi Edunext trong DB, các môn lý thuyết bình thường không có sẽ tự động ẩn đi để giao diện gọn gàng.

### 6. Xác Thực Email Whitelist (FR-07 & EC-30)
*   **Thách thức của SRS**: Chỉ sinh viên đăng nhập Google OAuth có email nằm trong `EmailWhitelist` mới được phép truy cập.
*   **Giải pháp cụ thể**:
    *   Tận dụng hệ thống Hook của **Better Auth**.
    *   Trong `auth.ts`, cấu hình hook `beforeSignIn` hoặc callback xác thực Google:
        ```ts
        async beforeSignIn(session) {
          if (session.user.role === 'Student' || session.user.email.endsWith('@fpt.edu.vn')) {
            const whitelisted = await prisma.emailWhitelist.findUnique({
              where: { email: session.user.email }
            });
            if (!whitelisted) {
              throw new Error("Email chưa được trường cấp quyền truy cập. Liên hệ admin để được hỗ trợ.");
            }
          }
        }
        ```
    *   Sinh viên không whitelisted sẽ bị chặn ngay lập tức ở luồng Auth và chuyển hướng về trang đăng nhập với thông báo lỗi rõ ràng.

---

## 🛠️ Thiết Kế Cơ Sở Dữ Liệu Chi Tiết (Prisma Schema Alignment)

Dưới đây là thiết kế Schema Prisma mới đã được dọn dẹp sạch sẽ Qdrant/pgvector và các bảng nạp tiền cũ, hoàn toàn khớp với đặc tả `THIET_KE_CSDL.md` và `SRS_Detailed.md`:

```prisma
// (Chi tiết Prisma Schema được lưu trữ tại api/prisma/schema.prisma)
```

---

## 🛠️ Đề Xuất Thay Đổi Mã Nguồn (Proposed Changes)

### 1. Database & Better Auth
*   [MODIFY] [schema.prisma](file:///e:/FPT/Semester_7/SDN302/project/chatbot-rag-fptu/api/prisma/schema.prisma):
    *   **Xóa bỏ**: model `DocumentChunk`, các bảng `Subscription`, `Transaction`.
    *   **Giữ lại**: bảng `LecturerRequest` cùng toàn bộ workflow xét duyệt cấp quyền giảng viên.
    *   **Thêm mới**: `Major`, `Specialization`, `Curriculum`, `CurriculumSubject`, `Syllabus`, `SyllabusMaterial`, `SyllabusClo`, `SyllabusSchedule`, `ConstructiveQuestion`, `AssessmentScheme`, `SyllabusReference`, `EmailWhitelist`, `VideoLink`, `AuditLog`.
    *   **Sửa đổi**: Bảng `Course` đóng vai trò là `Subject` (Môn học), liên kết 1-N với `Syllabus`.
*   [MODIFY] [auth.ts](file:///e:/FPT/Semester_7/SDN302/project/chatbot-rag-fptu/api/src/modules/auth/auth.ts):
    *   Thêm Better Auth hook kiểm tra email sinh viên đối chiếu với bảng `EmailWhitelist` khi đăng nhập bằng Google OAuth.
    *   Chuẩn hóa role về đúng 3 vai trò vận hành: `ADMIN`, `LECTURER`, `STUDENT`. Loại bỏ mọi nhánh xử lý `SuperAdmin`.

### 2. Backend API
*   [DELETE] `api/src/modules/rag/services/qdrant.service.ts`: Xóa bỏ hoàn toàn do không sử dụng Qdrant.
*   [MODIFY] [rag.service.ts](file:///e:/FPT/Semester_7/SDN302/project/chatbot-rag-fptu/api/src/modules/rag/services/rag.service.ts):
    *   Loại bỏ các hàm vector search nội bộ bằng Prisma SQL (`runVectorSearch`, `runLexicalRescueSearch`).
    *   Xây dựng bộ phân tích ý định (Intent Router): Nếu câu hỏi liên quan đến dữ liệu syllabus có cấu trúc -> truy vấn Postgres qua Prisma -> dùng Gemini format câu trả lời. Nếu câu hỏi liên quan đến tài liệu -> stream-chat qua AnythingLLM.
*   [NEW] API CRUD Ngành, CN hẹp, Khung CTĐT.
*   [NEW] API CRUD Syllabus & duyệt/kích hoạt (2-flag lifecycle) cho `LECTURER`, không cấp quyền này cho `ADMIN`.
*   [MODIFY] API quản lý danh sách `EmailWhitelist` theo vai trò `ADMIN`, không tạo thêm vai trò `SuperAdmin`.
*   [MODIFY] Giữ và làm sạch API `LecturerRequest` để tiếp tục hỗ trợ quy trình xin cấp quyền giảng viên.

### 3. Frontend Next.js Pages (Mantine UI)
*   [MODIFY] [layout.tsx](file:///e:/FPT/Semester_7/SDN302/project/chatbot-rag-fptu/web/app/layout.tsx): Bọc ứng dụng trong `MantineProvider` với custom theme (Navy & Gold, radius = 0).
*   [MODIFY] [login/page.tsx](file:///e:/FPT/Semester_7/SDN302/project/chatbot-rag-fptu/web/app/(auth)/login/page.tsx): Redesign giao diện đăng nhập sử dụng Mantine components.
*   [NEW] `web/app/(dashboard)/courses/[code]/page.tsx`: Trang chi tiết môn học dual-pane chuẩn FLM (Syllabus bên trái, Chatbot bên phải).
*   [NEW] `web/app/(dashboard)/admin/curriculum/`: UI CRUD Ngành/CN hẹp/Khung CTĐT.
*   [NEW] `web/app/(dashboard)/lecturer/syllabus/`: UI cho `LECTURER` quản lý, duyệt và kích hoạt Syllabus.
*   [NEW] `web/app/(dashboard)/admin/whitelist/`: UI cho `ADMIN` import/whitelist email sinh viên.
*   [MODIFY] Giữ hoặc hoàn thiện UI `LecturerRequest` để `ADMIN` xét duyệt yêu cầu cấp quyền giảng viên.

### 4. Docker & Deployment Configurations
*   [MODIFY] [docker-compose.yml](file:///e:/FPT/Semester_7/SDN302/project/chatbot-rag-fptu/docker-compose.yml): Đổi tên docker project thành `chatbot-rag-fptu-sdn` và các container name thành `*-sdn` để tránh xung đột với dự án cũ đang hoạt động.
*   [MODIFY] [docker-compose.prod.yml](file:///e:/FPT/Semester_7/SDN302/project/chatbot-rag-fptu/docker-compose.prod.yml): Đổi tên docker project thành `chatbot-rag-production-sdn` và các container name thành `*-sdn` tương ứng.

---

## 🔮 Kế Hoạch Thực Hiện & Phân Kỳ (Phasing Roadmap)

### Giai Đoạn 1: Cấu Trúc Lại Database & Tích Hợp Whitelist (3 ngày)
1. Cập nhật `schema.prisma`, xóa bỏ pgvector/Qdrant/Subscription/Transaction, giữ `LecturerRequest`, thêm các bảng dữ liệu FLM mới.
2. Chạy Prisma migration để cập nhật database PostgreSQL.
3. Cấu hình Better Auth hook kiểm tra whitelist email sinh viên và chuẩn hóa role về `ADMIN` / `LECTURER` / `STUDENT`.
4. Viết database seed mới để nạp dữ liệu mẫu (Ngành SE, chuyên ngành NodeJS/.NET, 10 môn học chính khóa, whitelist email test, tài khoản `ADMIN`, dữ liệu mẫu `LecturerRequest`).

### Giai Đoạn 2: Xây Dựng RAG Engine & Trợ Lý FLM (4 ngày)
1. Viết API CRUD Syllabus và các bảng con (CLO, Schedule, Assessment...) với quyền thao tác thuộc `LECTURER`.
2. Viết API CRUD Ngành, CN hẹp, Khung chương trình đào tạo.
3. Viết logic Intent Router trong `rag.service.ts`: tự động phân tách câu hỏi hỏi về syllabus (Postgres) hay hỏi lý thuyết bài học (AnythingLLM).
4. Giữ và hoàn thiện workflow `LecturerRequest` để `ADMIN` có thể xét duyệt cấp quyền giảng viên.
5. Kiểm thử API qua script tự động để đảm bảo độ chính xác của các câu trả lời syllabus là 100%.

### Giai Đoạn 3: Triển Khai Giao Diện Người Dùng Mantine UI (5 ngày)
1. Cấu hình Mantine theme, tạo các layout cơ bản.
2. Xây dựng trang chi tiết môn học dual-pane chuẩn FLM: tích hợp chatbot FAB, dialog, burger session drawer và citation block.
3. Xây dựng các trang quản trị phù hợp vai trò:
   * `LECTURER`: duyệt/kích hoạt và quản lý syllabus.
   * `ADMIN`: import danh sách whitelist email sinh viên, xét duyệt `LecturerRequest`.
4. Xử lý UI/UX mượt mà, hover effects, chuyển trang, loading indicators.

### Giai Đoạn 4: Đánh Giá & Bàn Giao (2 ngày)
1. Chuẩn bị bộ test 50 câu hỏi chuẩn (Human Ground Truth).
2. Chạy thử nghiệm định lượng và tối ưu hóa hệ thống.
3. Hoàn thiện tài liệu README.md và bàn giao sản phẩm.

---

## 🧪 Kế Hoạch Xác Minh (Verification Plan)

1.  **Dọn dẹp Qdrant & Docker Isolation**: Xác nhận không còn service Qdrant chạy trong docker-compose. Xác nhận các container name và project name đã được cấu hình với hậu tố `-sdn` và chạy thành công mà không gây xung đột với dự án cũ.
2.  **Đăng nhập Whitelist**: Nhập email sinh viên thử nghiệm vào database -> đăng nhập Google thành công. Thử đăng nhập bằng email Google khác -> Hệ thống chặn và báo lỗi đỏ.
3.  **Trợ lý FLM**: Chatbot phải trả lời chính xác 100% các câu hỏi về syllabus có cấu trúc (vd: trọng số, tín chỉ) nhờ truy xuất trực tiếp PostgreSQL qua Prisma.
4.  **UI/UX**: Kiểm tra các giao diện đảm bảo tính nhất quán của theme Mantine (Navy & Gold, góc vuông radius = 0).

---

*Tài liệu đối chiếu và rà soát được biên soạn bởi Antigravity AI Agent dành cho nhóm SDN302.*
