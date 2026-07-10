> Status: Historical — raw stakeholder input
> Audience: Stakeholder / BA
> Canonical: No — superseded by SRS_Detailed.md
> Owner: Business

"
 "Xây dựng chatbot cho phép sinh viên hỏi đáp dựa trên tài liệu môn học" thầy cho phép mình làm dự án này, tạo ra một cái trang web RAG, nhập tài liệu môn học vào và nó trả lời

A. Tính năng hệ thống:
1. Quản lý tài liệu
•		 Upload PDF, DOCX, slide bài giảng
•		 Tự động chunk & embed tài liệu
•		 Quản lý theo môn học / chương (chỉ cần demo 1 môn)
•		 Xem danh sách tài liệu đã index
2. Chat & Hỏi đáp
•		 Chat tự nhiên theo ngữ cảnh hội thoại
•		 Trích dẫn nguồn tài liệu gốc
•		 Giới hạn trả lời trong phạm vi tài liệu
•		 Lịch sử hội thoại theo phiên

B. Sản phẩm bàn giao (Deliverables):
1. Sản phẩm kỹ thuật:
  - Web app chatbot
  - Source code trên GitHub (có README)
  - Test set 50 câu hỏi + ground truth (là tập câu hỏi + câu trả lời đúng được chuẩn bị sẵn bởi con người, dùng để đánh giá xem chatbot trả lời có chính xác không)

"

Thông tin thêm:
tài liệu môn học, chương.
gom nhóm theo combo chuyên ngành.
quản lý version của tài liệu.
yêu cầu lấy hết các chuyên ngành của trường.
một số môn học chéo chuyên ngành hay học gộp chuyên ngành.
đánh giá của các môn.
còn phải hỏi được về đánh giá.
làm giống như một flm mini trợ lý biên soạn flm

Câu hỏi cần làm rõ:
- Thầy yêu cầu lấy hết chuyên ngành, nhưng em không thể biết được tất cả các chuyên ngành đang tồn tại. Em sẽ thiết kế database để hỗ trợ phân loại cho đủ các chuyên ngành và combo. Nhưng dữ liệu upload thực tế em sẽ lấy khoảng 10 môn nhé? --> toàn bộ môn SE  học kì 1-8.

- Có cần thêm xoá sửa một môn học (syllabus) không? --> có curd.

- Quản lý version các tài liệu là quản lý các version của việc edit sysllabus nhỏ như là chỉnh một note trong đó hay là version kiểu như có 2 môn FER cùng lúc là FER202 và FER201m. --> sửa nhỏ thì coi là curd, sửa lớn thì tạo một subject code mới là xong.
