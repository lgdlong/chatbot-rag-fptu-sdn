# Báo Cáo Tái Căn Chỉnh Scope, SRS Và Codebase

> [!IMPORTANT]
> Đây là báo cáo audit lịch sử, không phải source of truth hiện hành.
> Một số file được nhắc tới trong báo cáo này có thể đã bị xóa hoặc thay thế trong đợt dọn repo sau đó.
> Scope và tài liệu chính thức hiện tại nằm ở `docs/srs/`.

> Dự án: `chatbot-rag-fptu`
> Ngày đánh giá: 2026-06-22
> Mục tiêu: chốt lại baseline sản phẩm, xác định scope SDN chính thức, phân loại phần kế thừa được và phần legacy cần xóa.

---

## 1. Tóm tắt điều hành

Repo hiện tại không phải là một sản phẩm duy nhất phát triển liên tục theo một hướng. Nó là kết quả của 3 lớp chồng lên nhau:

1. Scope nhỏ của SWD đã được làm để demo nhanh.
2. Scope lớn hơn của SDN được viết vào SRS và docs.
3. Chuyển hướng kỹ thuật từ RAG thủ công sang `AnythingLLM`, để lại nhiều docs và code legacy.

Vì vậy, vấn đề lớn nhất của repo hiện nay không phải là thiếu code, mà là:

- Tài liệu đang mô tả nhiều hệ thống khác nhau.
- Frontend phần lớn là prototype/mock.
- Backend có phần thật, nhưng narrative kiến trúc chưa được chốt lại.
- Nhiều artifact từ scope cũ vẫn còn tồn tại, làm codebase nặng và gây nhiễu.

Kết luận chính:

- **Phase 1 chính thức** nên được định nghĩa lại theo đúng baseline SWD.
- **Phase 2 chính thức** là phần mở rộng SDN bám chặt vào syllabus.
- **AnythingLLM** nên được chốt là engine RAG chính thức.
- **Chat nên giới hạn theo môn** trong sản phẩm chính thức, không nên để multi-scope là behavior mặc định của hệ thống.
- Cần một đợt dọn repo có chủ đích để xóa narrative cũ về manual Qdrant, subscription/payment, và các màn hình mock không còn giá trị.

---

## 2. Bối cảnh lịch sử dự án

### 2.1 Giai đoạn SWD

Scope SWD ban đầu là một web app RAG nhỏ, với requirement thực chất là:

- upload tài liệu môn học,
- tự động chunk và embed,
- quản lý tài liệu theo môn, demo 1 môn là đủ,
- sinh viên chat hỏi đáp theo tài liệu,
- có trích dẫn nguồn,
- có lịch sử hội thoại,
- có source code và test set 50 câu hỏi.

Ngoài ra có thêm một phần subscription nhỏ.

### 2.2 Giai đoạn SDN

Khi mang sang SDN, bài toán được mở rộng thành một hệ thống backend nghiêm túc hơn:

- chatbot không chỉ hỏi đáp từ PDF,
- mà phải gắn chặt với `syllabus`,
- phải có lifecycle `draft / approved / active`,
- có business logic về course, curriculum, specialization,
- có role model và whitelist,
- có dữ liệu có cấu trúc và dữ liệu phi cấu trúc cùng tồn tại.

### 2.3 Chuyển hướng kỹ thuật

Ban đầu hệ thống đi theo hướng:

- chunking thủ công,
- embedding thủ công,
- vector DB thủ công kiểu `Qdrant`.

Sau đó tích hợp `AnythingLLM`, khiến nhiều phần manual cũ không còn là đường chính nhưng vẫn còn trong repo dưới dạng:

- docs cũ,
- openapi description cũ,
- code naming cũ,
- assumptions cũ về Qdrant/manual pipeline,
- một số artifact payment/subscription không còn nằm trong scope SDN.

---

## 3. Định nghĩa lại sản phẩm chính thức

## 3.1 Phase 1 chính thức

**Phase 1 = baseline kế thừa từ SWD.**

Đây là phần sản phẩm nhỏ nhưng chạy được, dùng làm nền để mở rộng.

### Mục tiêu sản phẩm

Cho phép giảng viên tải tài liệu môn học lên hệ thống và cho phép sinh viên hỏi đáp dựa trên tài liệu đó qua chatbot RAG.

### Functional scope chính thức

1. Quản lý tài liệu
- Upload tài liệu môn học.
- Xử lý tài liệu bất đồng bộ.
- Xem danh sách tài liệu đã index.
- Gắn tài liệu với đúng môn học.

2. Chat & hỏi đáp
- Tạo phiên chat theo môn học.
- Gửi câu hỏi tự nhiên.
- Nhận câu trả lời có citations.
- Lưu lịch sử hội thoại.
- Giới hạn trả lời trong phạm vi môn học.

3. Deliverables
- Web app chatbot.
- Source code.
- README.
- Bộ 50 câu hỏi + ground truth.

### Ghi chú quan trọng

Vì SWD chỉ yêu cầu demo 1 môn là đủ, nên Phase 1 không cần ép mình phải hoàn thiện toàn bộ domain curriculum/specialization/syllabus nâng cao.

---

## 3.2 Phase 2 chính thức

**Phase 2 = scope mở rộng của SDN.**

Đây là phần phát triển nghiêm túc theo hướng backend/business logic.

### Mục tiêu sản phẩm

Biến chatbot PDF đơn giản thành một hệ thống hỗ trợ syllabus có logic vận hành thực tế:

- mỗi môn có syllabus chính thức,
- syllabus có nhiều version,
- có approval/activation lifecycle,
- chatbot trả lời dựa trên cả syllabus có cấu trúc và tài liệu đính kèm,
- quản lý theo nghiệp vụ gần với hệ thống học vụ.

### Functional scope chính thức

1. Syllabus-centered domain
- Course
- Syllabus
- Materials
- CLOs
- Schedule
- Assessment scheme
- Video link nếu còn giữ

2. Business workflow
- Tạo draft
- Approve
- Activate
- Một môn có nhiều syllabus nhưng chỉ một bản active

3. Administration
- Whitelist sinh viên
- Duyệt lecturer
- Quản lý người dùng quản trị

4. RAG
- Chat chỉ theo môn
- Kết hợp structured syllabus data + document RAG
- Citation truy vết được

---

## 4. Quyết định kỹ thuật cần chốt

## 4.1 Engine RAG chính thức

### Khuyến nghị

**Chốt `AnythingLLM` là engine chính thức.**

### Lý do

- Đây là hướng code hiện tại đã đi sâu nhất.
- Nó giảm đáng kể lượng code phải tự duy trì ở tầng retrieval/agent/chat orchestration.
- Nó phù hợp với mục tiêu thực dụng: kế thừa code nhỏ để phát triển nhanh hơn.
- Manual Qdrant pipeline hiện không còn là đường vận hành chính trong code.

### Hệ quả

Sau khi chốt quyết định này:

- Các tài liệu ghi `Qdrant + manual custom RAG` như kiến trúc chính cần bị sửa hoặc chuyển thành `legacy/research`.
- Chỉ giữ Qdrant/manual pipeline nếu còn phục vụ tài liệu nghiên cứu hoặc phương án thay thế trong tương lai.
- Không để README, SRS và docs kỹ thuật tiếp tục mô tả song song 2 engine chính thức.

---

## 4.2 Chat scope chính thức

### Khuyến nghị

**Chat nên chỉ theo môn.**

### Lý do nghiệp vụ

Đối với SDN, mục tiêu là một hệ thống backend có business logic hợp lý. Chat theo môn tốt hơn vì:

- rõ boundary nghiệp vụ,
- dễ kiểm soát accuracy,
- dễ test,
- dễ viết guardrails,
- dễ giải thích cho người chấm,
- phù hợp trực tiếp với requirement “mini syllabus + RAG”.

### Lý do kỹ thuật

- giảm độ phức tạp scope resolution,
- giảm nhầm lẫn giữa các môn,
- giảm noise của retrieval,
- dễ maintain hơn nhiều so với `ALL_COURSES / SELECTED_DOCUMENTS`.

### Kết luận

- `per-subject chat` nên là behavior chính thức.
- multi-scope chat, nếu còn muốn giữ, chỉ nên coi là future expansion chứ không phải core product.

---

## 4.3 Role model chính thức

### Hiện trạng

Tài liệu đang lẫn giữa:

- `Super Admin / Admin / Student`
- `Student / Lecturer / Super Admin`
- code backend hiện dùng `ADMIN / LECTURER / STUDENT`

### Khuyến nghị role model sản phẩm

Nên chốt role model nghiệp vụ là:

1. `SUPER_ADMIN`
- quản lý whitelist,
- duyệt lecturer request,
- quản lý tài khoản quản trị cao nhất,
- quản trị hệ thống.

2. `LECTURER`
- quản lý course/syllabus/document,
- vận hành nội dung học thuật.

3. `STUDENT`
- tìm môn học,
- xem syllabus đã publish,
- chat theo môn.

4. `SYSTEM`
- actor nội bộ cho ingestion/background jobs, không phải human role.

### Nhận xét

Nếu không có nhu cầu tách thêm một lớp `ADMIN` nghiệp vụ riêng biệt với `LECTURER`, thì không nên giữ cả hai vai trò vì sẽ làm permission matrix phình ra không cần thiết.

### Khuyến nghị triển khai

- Ở mức business và UI: dùng `SUPER_ADMIN / LECTURER / STUDENT`.
- Ở mức code hiện tại: có thể tạm map `ADMIN` hiện tại sang `SUPER_ADMIN` để giảm refactor ban đầu.
- Sau đó refactor enum/label sau, nhưng sản phẩm phải có một narrative duy nhất.

### Quyết định chốt

Sau khi đối chiếu requirement SWD và SDN, role model nên được chốt là:

- `SUPER_ADMIN`
- `LECTURER`
- `STUDENT`

Không nên giữ `ADMIN` như một vai trò nghiệp vụ song song với `LECTURER`, trừ khi sau này thật sự có thêm một lớp vận hành trung gian khác với giảng viên.

---

## 5. Audit requirement và tài liệu

## 5.1 Nhóm tài liệu phản ánh đúng SDN hơn

- `docs/srs/Requirements_Raw.md`
- `docs/srs/SRS_Summary.md`
- `docs/srs/SRS_Detailed.md`
- `docs/srs/docs/*`

Đây là cụm tài liệu gần với scope SDN nhất, dù vẫn còn mâu thuẫn với code thực.

## 5.2 Nhóm tài liệu phản ánh codebase lai

- `docs/project-overview-pdr.md`
- `docs/system_architecture.md`
- `docs/README.md`
- `docs/codebase-summary.md`
- `docs/development-roadmap.md`
- `docs/api/*.md`

Các tài liệu này đang trộn:

- scope nhỏ SWD,
- scope lớn SDN,
- Qdrant narrative,
- AnythingLLM narrative,
- chat multi-scope,
- role model không đồng nhất,
- subscription/payment artifacts.

## 5.3 Mâu thuẫn requirement chính

### Mâu thuẫn 1: RAG engine

- SRS nghiêng về `Qdrant + Gemini Embedding`.
- Code vận hành lại nghiêng về `AnythingLLM`.

### Mâu thuẫn 2: chat scope

- SRS lõi nói chatbot giới hạn theo môn.
- Backend schema/controller đang hỗ trợ multi-scope.

### Mâu thuẫn 3: upload format

- Tài liệu quảng bá `PDF/DOCX/PPTX/Image`.
- Backend hiện chặn và chỉ nhận `PDF`.

### Mâu thuẫn 4: role model

- Tài liệu thay đổi giữa `Admin`, `Lecturer`, `Super Admin`.
- UI còn có cả trang teacher users và superadmin users chồng chức năng.

### Mâu thuẫn 5: payment/subscription

- SWD có subscription nhỏ.
- SDN hiện tại không lấy payment làm trung tâm.
- Repo vẫn còn docs, dep và migration artifacts liên quan.

---

## 6. Audit codebase hiện tại

## 6.1 Backend đang là phần đáng giữ nhất

Backend hiện là phần có giá trị kế thừa nhiều nhất của repo, đặc biệt ở:

- `api/prisma/schema.prisma`
- `api/src/modules/syllabus/*`
- `api/src/modules/curriculum/*`
- `api/src/modules/auth/*`
- `api/src/modules/chat/*`
- `api/src/modules/rag/*`

Nhưng backend vẫn có những điểm cần tái căn chỉnh:

- naming chưa phản ánh sản phẩm chính thức,
- còn mở rộng hơn scope cần thiết,
- docs/openapi mô tả khác với code,
- role check chưa khớp narrative cuối cùng.

## 6.2 Frontend hiện tại chủ yếu là prototype

Hầu hết màn hình web hiện là mock/prototype UI, không phải front-end production đã nối backend thật.

### Bằng chứng

- `web/app/contexts/AuthContext.tsx` dùng mock users và localStorage.
- `web/app/student/page.tsx` dùng `ALL_SUBJECTS` hardcoded.
- `web/app/student/syllabus/[subjectCode]/page.tsx` đọc JSON static trong `web/app/imports`.
- `web/components/chatbot/ChatbotWidget.tsx` dùng câu trả lời mock theo keyword.
- `web/app/teacher/documents/page.tsx` dùng `mockDocuments`.
- `web/app/teacher/syllabus/page.tsx` dùng `mockSyllabi`.
- `web/app/teacher/users/page.tsx` dùng `mockAdmins`, `mockWhitelist`.
- `web/app/superadmin/admins/page.tsx` và `web/app/superadmin/whitelist/page.tsx` chỉ thao tác local state.

### Kết luận

Frontend hiện tại cần được xem là:

- prototype để giữ idea UI,
- không được xem là bằng chứng “đã implement xong product”.

---

## 7. Phân loại màn hình: production target hay prototype/mock

## 7.1 Production target nên giữ

Đây là các màn hình nên tồn tại trong sản phẩm chính thức.

### Core Phase 1

- `/login`
- `/student`
- `/student/syllabus/[subjectCode]`
- `ChatbotWidget`
- `/teacher`
- `/teacher/documents`

### Core Phase 2

- `/teacher/syllabus`
- `/teacher/syllabus/create`
- `/teacher/curriculum`
- `/superadmin`
- `/superadmin/admins`
- `/superadmin/whitelist`

## 7.2 Prototype/mock hiện tại

Các file sau là prototype/mock ở thời điểm audit:

- `web/app/contexts/AuthContext.tsx`
- `web/app/student/page.tsx`
- `web/app/student/syllabus/[subjectCode]/page.tsx`
- `web/components/chatbot/ChatbotWidget.tsx`
- `web/app/teacher/page.tsx`
- `web/app/teacher/documents/page.tsx`
- `web/app/teacher/syllabus/page.tsx`
- `web/app/teacher/syllabus/create/page.tsx`
- `web/app/teacher/curriculum/page.tsx`
- `web/app/teacher/users/page.tsx`
- `web/app/superadmin/page.tsx`
- `web/app/superadmin/admins/page.tsx`
- `web/app/superadmin/whitelist/page.tsx`

## 7.3 Màn hình trùng chức năng hoặc nên xóa

### `web/app/teacher/users/page.tsx`

Nên xóa hoặc bỏ khỏi roadmap chính vì:

- chồng với `superadmin/admins`,
- chồng với `superadmin/whitelist`,
- không khớp role model đề xuất.

### `web/app/imports/*.json`

Chỉ phục vụ prototype syllabus viewer, không nên tiếp tục là nguồn dữ liệu runtime.

---

## 8. Nhóm chức năng nên giữ, nên mở rộng, nên xóa

## 8.1 Keep

Những phần nên giữ làm nền:

- Prisma schema domain học thuật
- Auth bằng Better Auth
- Whitelist
- Lecturer request
- Syllabus CRUD + lifecycle
- Document upload/delete flow
- Chat session/message persistence
- AnythingLLM integration

## 8.2 Expansion

Những phần nên giữ trong roadmap SDN nhưng chưa coi là baseline:

- Curriculum/major/specialization hoàn chỉnh
- Full syllabus authoring UI
- Citation click mở file đúng vị trí
- Video link/business rules nếu còn cần
- Audit log hiển thị rõ ràng

## 8.3 Legacy hoặc candidate for removal

### Candidate xóa mạnh

1. Subscription/payment scope nếu không còn nằm trong SDN
- `docs/api/00_subscriptions.md`
- references tới subscriptions trong `docs/api/README.md`, `docs/api/api_reference.md`, `docs/api/agent-instructions.md`, `docs/api/quality-checklist.md`
- dependency `@payos/node` nếu không còn code thật dùng
- migration/payment artifact nếu không còn phục vụ hệ thống

2. Narrative manual-Qdrant như “current architecture”
- các docs mô tả manual Qdrant là đường chính
- các ghi chú openapi nói quota/payment nếu không còn thật

3. Teacher users duplicate page
- `web/app/teacher/users/page.tsx`

4. Static prototype data
- `web/app/imports/*.json`

### Candidate giữ nhưng hạ xuống legacy/research

- tài liệu nghiên cứu `AnythingLLM vs manual`
- nội dung mô tả `Qdrant` như phương án nghiên cứu hoặc kiến trúc cũ

---

## 9. Đánh giá riêng về subscription/payment

User đã xác nhận:

- SWD có thêm một subscription nhỏ.
- SDN hiện tập trung vào syllabus + RAG + business logic backend.

### Nhận định

Subscription/payment không phải trục lõi của bài toán SDN hiện tại.

### Khuyến nghị

Vì payment/subscription đã được quyết định loại khỏi SDN:

- loại toàn bộ payment/subscription khỏi scope sản phẩm chính thức,
- xóa docs và dependency liên quan,
- không để openapi/chat docs còn mô tả quota, gói Basic/Silver/Gold,
- không để người đọc repo hiểu nhầm đây là core business module.

---

## 10. Đánh giá riêng về mock vs code thật

## 10.1 Backend

Backend build được và có nhiều route thật.

Nhưng “thật” ở đây không đồng nghĩa với “đã chốt đúng sản phẩm”. Nó chỉ có nghĩa là phần backend đang tiến gần sản phẩm hơn frontend.

## 10.2 Frontend

Frontend build được nhưng chưa phải bằng chứng readiness.

Lý do:

- dựa vào local state và mock constants,
- chưa gọi API thật ở hầu hết màn hình,
- login flow chưa phản ánh auth backend thật,
- chatbot UI chưa gắn vào SSE thật trong thực tế hiện tại,
- lint đang fail.

### Kết luận

Frontend nên được gọi đúng tên là:

- “UI prototype / visual scaffolding”

chứ không nên gọi là:

- “frontend implementation đã xong”.

---

## 11. Role model và permission matrix đề xuất

| Hành động | STUDENT | LECTURER | SUPER_ADMIN |
|---|---|---|---|
| Đăng nhập | Có | Có | Có |
| Xem syllabus đã publish | Có | Có | Có |
| Chat theo môn | Có | Có | Có |
| Upload/xóa document | Không | Có | Có |
| Tạo/sửa syllabus | Không | Có | Có |
| Approve/activate syllabus | Không | Có hoặc Có điều kiện | Có |
| Quản lý curriculum | Không | Có hoặc Có điều kiện | Có |
| Duyệt lecturer request | Không | Không | Có |
| Quản lý whitelist | Không | Không | Có |
| Quản lý admin cấp cao | Không | Không | Có |

### Ghi chú

Nếu muốn backend/business logic “thực tế hơn”, có thể siết:

- `LECTURER` chỉ tạo/sửa draft,
- `SUPER_ADMIN` mới approve/activate.

Nhưng nếu muốn giảm phức tạp cho đồ án:

- cho `LECTURER` tự approve/activate syllabus của mình.

Hai lựa chọn đều hợp lý, nhưng phải chọn một.

---

## 12. Kiến trúc sản phẩm đề xuất sau khi tái căn chỉnh

### Product narrative chính thức

Đây là hệ thống hỗ trợ học tập theo môn học, trong đó:

- `AnythingLLM` là engine RAG chính,
- `PostgreSQL` lưu domain có cấu trúc,
- chatbot hoạt động theo từng môn học,
- syllabus là thực thể trung tâm của hệ thống,
- lecturer quản lý nội dung,
- super admin quản lý quyền truy cập.

### Không nên tiếp tục mô tả sản phẩm như sau

- chatbot hỏi toàn bộ kho tài liệu không rõ scope,
- hệ RAG thủ công custom là trục chính,
- có đủ payment plan/quota như SaaS consumer,
- multi-tenant phức tạp,
- teacher và admin chồng vai trò không rõ ranh giới.

---

## 13. Danh sách vấn đề cần xử lý theo thứ tự

## P0 - Chốt quyết định

1. Freeze role model chính thức.
2. Freeze chat scope chính thức là `per-subject`.
3. Freeze `AnythingLLM` là engine chính thức.
4. Freeze payment/subscription có còn trong SDN hay không.
5. Freeze danh sách màn hình production target.

## P1 - Dọn tài liệu

1. Viết lại README theo narrative mới.
2. Viết lại `docs/project-overview-pdr.md`.
3. Viết lại `docs/system_architecture.md`.
4. Dọn `docs/api/*` cho khớp backend thật.
5. Chuyển các docs manual Qdrant sang legacy/research nếu cần.

## P2 - Dọn codebase

1. Xóa page trùng chức năng.
2. Xóa static imports phục vụ prototype nếu không còn dùng.
3. Xóa payment/subscription artifacts nếu loại scope.
4. Xóa docs references không còn giá trị.
5. Xóa code/comment/openapi mô tả features không còn chính thức.

## P3 - Chuẩn hóa backend

1. Đồng bộ role names.
2. Đồng bộ endpoint descriptions.
3. Bỏ multi-scope product behavior nếu không dùng.
4. Siết document format theo scope thật.
5. Kiểm tra lại auth flow theo role model mới.

## P4 - Làm lại frontend đúng nghĩa

1. Bỏ AuthContext mock.
2. Nối login vào Better Auth thật.
3. Nối student search + syllabus detail vào API.
4. Nối chat widget vào SSE thật.
5. Nối teacher/superadmin pages vào backend thật.
6. Xóa prototype-only behavior.

---

## 14. Kết luận cuối cùng

Repo hiện tại không nên được xem là “dự án lớn bị dở dang”.

Nó nên được xem đúng hơn là:

- một **baseline sản phẩm nhỏ từ SWD** đã tạo ra được phần lõi,
- sau đó được **mở rộng thành một hướng sản phẩm SDN** nghiêm túc hơn,
- nhưng chưa trải qua bước **tái căn chỉnh scope, vai trò, kiến trúc và narrative**.

### Quyết định khuyến nghị

1. **Phase 1 chính thức**: chatbot tài liệu môn học kế thừa từ SWD.
2. **Phase 2 chính thức**: mini syllabus system + RAG theo môn của SDN.
3. **AnythingLLM**: engine RAG chính thức.
4. **Chat scope**: chỉ theo môn.
5. **Role model**: `SUPER_ADMIN / LECTURER / STUDENT`.
6. **Legacy không kế thừa**: xóa hẳn khỏi repo.

Nếu làm đúng bước này, codebase sẽ nhẹ hơn, narrative rõ hơn, và team có thể xử lý từng vấn đề một thay vì tiếp tục chồng thêm logic lên một nền chưa được chuẩn hóa.
