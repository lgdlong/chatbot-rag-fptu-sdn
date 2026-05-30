# Chatbot RAG FPTU - Tài Liệu Đặc Tả Yêu Cầu & Thiết Kế Hệ Thống (SRS)

Kho lưu trữ này chứa toàn bộ tài liệu đặc tả yêu cầu phần mềm (SRS), phân tích nghiệp vụ, thiết kế hệ thống, kiến trúc dữ liệu và mô tả luồng giao diện cho dự án **Chatbot RAG Hỗ Trợ Học Tập Tại Đại Học FPT**.

---

## 🔗 Liên Kết Tới Dự Án Chính

Mã nguồn triển khai thực tế của hệ thống (bao gồm Backend API Gateway viết bằng Hono.js + TypeScript và Frontend giao diện người dùng Next.js 15 App Router + Tailwind CSS) được quản lý tại repository chính:

👉 **[Repository mã nguồn chính: chatbot-rag-fptu](https://github.com/lgdlong/chatbot-rag-fptu)**

---

## 📂 Cấu Trúc Thư Mục Tài Liệu

Repository này được tổ chức như sau để phục vụ quá trình nghiên cứu, phân tích nghiệp vụ (Business Analysis) và thiết kế hệ thống trước khi đưa vào phát triển mã nguồn:

```text
chatbot-rag-fptu-srs/
├── .agents/                    # Cấu hình quy tắc và kỹ năng của AI Agent
├── data/                       # Dữ liệu mẫu môn học và chương trình đào tạo (Syllabus/Curriculum)
├── docs/                       # Các tài liệu phân tích chi tiết và sơ đồ thiết kế
│   ├── SRS_BA_Review_Report.md # Báo cáo đánh giá SRS từ góc nhìn Business Analyst
│   ├── THIET_KE_CSDL.md        # Thiết kế chi tiết cơ sở dữ liệu (Database Design)
│   ├── sequence_diagrams.md    # Các biểu đồ tuần tự (Sequence Diagrams) mô tả luồng nghiệp vụ
│   ├── use_case_diagrams.md    # Biểu đồ ca sử dụng (Use Case Diagrams)
│   ├── user_flows.md           # Luồng đi của người dùng (User Flows)
│   ├── ui_ux_specifications.md # Đặc tả chi tiết giao diện & phong cách thiết kế UI/UX
│   ├── moscow_priorities.md    # Phân loại mức độ ưu tiên tính năng theo MoSCoW
│   └── curriculum_comparison_report.md # Báo cáo phân tích chương trình học FPTU
├── Requirements_Raw.md         # Yêu cầu thô ban đầu từ phía các bên liên quan
├── SRS_Summary.md              # Bản tóm tắt ngắn gọn các tính năng chính của SRS
├── SRS_Detailed.md             # Tài liệu Đặc tả Yêu cầu Phần mềm (SRS) chi tiết toàn diện
└── more_info.md                # Tài liệu bổ sung thông tin hệ thống
```

---

## 📝 Mô Tả Chi Tiết Các Tài Liệu Cốt Lõi

### 1. Đặc Tả Yêu Cầu & Nghiệp Vụ
*   **[SRS_Detailed.md](file:///e:/FPT/Semester_7/SDN302/srs/SRS_Detailed.md)**: Tài liệu nền tảng mô tả đầy đủ các yêu cầu chức năng (Functional Requirements), yêu cầu phi chức năng (Non-functional Requirements), kiến trúc RAG tích hợp (Multimodal RAG, Chunking, Embeddings), và mô hình phân quyền đa trường (Multi-tenant).
*   **[SRS_Summary.md](file:///e:/FPT/Semester_7/SDN302/srs/SRS_Summary.md)**: Bản tóm tắt cô đọng giúp lập trình viên và các bên liên quan nhanh chóng nắm bắt phạm vi sản phẩm.
*   **[Requirements_Raw.md](file:///e:/FPT/Semester_7/SDN302/srs/Requirements_Raw.md)**: Lưu trữ các ghi chép ban đầu, ý tưởng và yêu cầu thô thu thập từ người dùng cuối.
*   **[docs/SRS_BA_Review_Report.md](file:///e:/FPT/Semester_7/SDN302/srs/docs/SRS_BA_Review_Report.md)**: Báo cáo rà soát, đánh giá các điểm mâu thuẫn, thiếu sót trong SRS và đề xuất cải tiến của Business Analyst.

### 2. Thiết Kế Hệ Thống & Sơ Đồ Kỹ Thuật
*   **[docs/THIET_KE_CSDL.md](file:///e:/FPT/Semester_7/SDN302/srs/docs/THIET_KE_CSDL.md)**: Đặc tả cấu trúc cơ sở dữ liệu chi tiết. Định nghĩa các bảng quan trọng như `User`, `Tenant`, `Syllabus`, `Document`, `ChatSession`, `ChatMessage`, và các quan hệ 1-N, N-N.
*   **[docs/sequence_diagrams.md](file:///e:/FPT/Semester_7/SDN302/srs/docs/sequence_diagrams.md)**: Biểu diễn luồng tương tác tuần tự bằng Mermaid.js cho các nghiệp vụ phức tạp như: Luồng Chat và xử lý RAG (Streaming SSE), luồng tải lên và xử lý tài liệu đa phương thức (Embedding slide, video/audio), và luồng đồng bộ thời khóa biểu/chương trình học.
*   **[docs/use_case_diagrams.md](file:///e:/FPT/Semester_7/SDN302/srs/docs/use_case_diagrams.md)**: Sơ đồ ca sử dụng phân cấp quyền hạn giữa Sinh viên, Giảng viên, và Quản trị viên (Admin).
*   **[docs/moscow_priorities.md](file:///e:/FPT/Semester_7/SDN302/srs/docs/moscow_priorities.md)**: Bảng xếp hạng các tính năng phải có (Must-have), nên có (Should-have), có thể có (Could-have), và chưa cần thiết (Won't-have) cho phiên bản MVP.

### 3. Trải Nghiệm Người Dùng (UI/UX)
*   **[docs/ui_ux_specifications.md](file:///e:/FPT/Semester_7/SDN302/srs/docs/ui_ux_specifications.md)**: Định hình ngôn ngữ thiết kế sang trọng, tối giản (Glassmorphism, Dark mode, Sleek Animations). Đặc tả chi tiết các khung nhìn như Hộp thoại Chat, Trang quản lý tài liệu, Dashboard Admin, và Báo cáo học tập.
*   **[docs/user_flows.md](file:///e:/FPT/Semester_7/SDN302/srs/docs/user_flows.md)**: Mô tả trực quan các bước người dùng tương tác với hệ thống từ khi đăng nhập, thực hiện hội thoại cho đến khi kiểm tra nguồn trích dẫn tài liệu (Citations).

---

## 🛠 Hướng Dẫn Cập Nhật & Đóng Góp Tài Liệu

Khi cập nhật hoặc viết mới các tài liệu trong repository này, vui lòng tuân thủ quy trình sau:
1.  **Sử dụng Mermaid.js**: Đối với tất cả sơ đồ (Sequence, Use Case, Flowchart), sử dụng cú pháp Mermaid.js trực tiếp trong các tệp Markdown để dễ dàng chỉnh sửa và theo dõi lịch sử qua Git.
2.  **Liên kết chéo (Cross-referencing)**: Khi nhắc đến một thực thể hoặc một luồng nghiệp vụ đã được định nghĩa ở file khác, hãy sử dụng liên kết tương đối để người đọc dễ dàng điều hướng.
3.  **Quy chuẩn Đặt Commit**: Tuân thủ quy tắc viết commit bằng tiếng Việt rõ ràng, ngắn gọn và có ý nghĩa tương ứng với tài liệu được cập nhật.
