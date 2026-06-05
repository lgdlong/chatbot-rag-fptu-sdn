# Báo cáo nghiên cứu: AnythingLLM cho chatbot syllabus và tài liệu môn học

## Thời gian nghiên cứu

- Thực hiện ngày: 2026-05-30

## Bối cảnh

Hệ thống cần phục vụ giảng viên theo 2 nhu cầu đồng thời:

1. Trả lời chính xác các thông tin có cấu trúc trong syllabus đã lưu ở PostgreSQL.
2. Trả lời nội dung bên trong tài liệu môn học như slide `.pptx`, sách, tài liệu `.pdf`, `.docx`.

Các ví dụ câu hỏi mục tiêu:

- "Quy tắc chấm điểm của progress test là gì?"
- "Final exam chiếm bao nhiêu phần trăm?"
- "CLO nào liên quan đến assessment này?"
- "Buổi 7 học gì?"
- "Trong slide có nói gì về dependency injection?"

## Vấn đề đã gặp

Trước đây đã thử route thủ công bằng keyword để tách câu hỏi sang SQL, nhưng kết quả kém. Sau đó dùng AnythingLLM thì chất lượng tốt hơn rõ rệt.

Nhận định sau nghiên cứu:

- Điều AnythingLLM làm tốt hơn không chỉ là vector search.
- Giá trị chính nằm ở lớp `agent/tool orchestration`.
- Tức là model có thể chọn tool phù hợp, thực hiện nhiều bước trung gian, rồi mới tổng hợp thành câu trả lời cuối.

## Kết luận chính

AnythingLLM có thể giải quyết bài toán này ở mức sản phẩm chạy được trước, nhưng hướng dùng đúng không phải:

- chỉ SQL Agent thuần
- hoặc chỉ vector search thuần

Hướng nên triển khai:

- `AnythingLLM Agent` làm lớp chat chính
- `RAG` cho tài liệu môn học
- `custom skill` hoặc `domain API` cho structured syllabus

Nói ngắn gọn:

- câu hỏi structured => dùng skill/API domain-specific
- câu hỏi về slide/sách/pdf => dùng RAG Search
- agent AnythingLLM quyết định và điều phối

## Những gì AnythingLLM thực sự cung cấp

### 1. Agent mode

AnythingLLM hỗ trợ chế độ agent, nơi LLM có thể sử dụng tools để hoàn thành yêu cầu thay vì chỉ trả lời bằng text. Hệ thống có thể tự xác định model có dùng tool được không, và vẫn có thể ép bằng `@agent`.

Ý nghĩa thực tế:

- không phải chỉ "nhìn keyword"
- model có thể chọn đúng tool theo ngữ cảnh
- có thể đi qua nhiều bước trước khi ra câu trả lời cuối

Nguồn:

- https://docs.anythingllm.com/agent/overview

### 2. Intelligent Tool Selection

AnythingLLM có cơ chế chỉ nạp các tool liên quan vào ngữ cảnh agent thay vì nhồi toàn bộ tool schemas vào prompt mỗi lượt chat.

Ý nghĩa thực tế:

- giảm token
- giảm nhiễu
- tăng xác suất model chọn đúng tool
- phù hợp với bài toán nhiều nguồn dữ liệu như syllabus SQL + document RAG

Nguồn:

- https://docs.anythingllm.com/agent/intelligent-tool-selection

### 3. Built-in agent skills

AnythingLLM có sẵn các skills quan trọng:

- `RAG Search`
- `SQL Agent`
- `List Documents`
- `Summarize Documents`

Ý nghĩa thực tế:

- có thể trả lời từ vector store
- có thể truy vấn dữ liệu DB thời gian thực
- có thể liệt kê tài liệu hiện có trong workspace
- có thể tóm tắt tài liệu trong workspace

Nguồn:

- https://docs.anythingllm.com/agent/usage/rag-search
- https://docs.anythingllm.com/agent/usage/sql-agent
- https://docs.anythingllm.com/agent/usage/list-documents
- https://docs.anythingllm.com/agent/usage/summarize-documents

### 4. Native tool calling và multi-step execution

Từ AnythingLLM `v1.11.1`, hệ thống đã overhaul tool calling để tận dụng native tool calling của model/provider khi hỗ trợ. Release notes nêu rõ:

- cho phép multi-step tool calls
- model tiếp tục làm việc cho đến khi hoàn tất câu trả lời
- có safeguard giới hạn số lần gọi tool để tránh loop

Ý nghĩa thực tế:

- tốt hơn hẳn kiểu route keyword một nhánh
- phù hợp với câu hỏi cần: hiểu ý định -> gọi tool -> lấy dữ liệu -> tổng hợp

Nguồn:

- https://docs.anythingllm.com/changelog/v1.11.1

### 5. Auto tool usage ở bản mới

Tài liệu AnythingLLM hiện tại cho biết agent có thể tự dùng tool nếu model hỗ trợ, không nhất thiết lúc nào cũng phải bắt đầu bằng `@agent`.

Nguồn:

- https://docs.anythingllm.com/agent/overview
- https://docs.anythingllm.com/changelog/v1.13.0

## Vì sao route keyword + SQL trước đây cho kết quả tệ

Lý do không nằm ở việc SQL sai hoàn toàn, mà ở cách orchestration quá thô.

Các điểm yếu điển hình:

1. Ý định người dùng không map sạch vào keyword.
2. Một câu hỏi thường cần nhiều bước hơn 1 query.
3. Nhiều câu là hybrid, cần cả structured facts lẫn document context.
4. Câu trả lời cuối cần được model tổng hợp tốt từ kết quả truy xuất.
5. Router keyword không có bước khám phá schema hay tự sửa hướng.

Trong khi đó SQL Agent của AnythingLLM hỗ trợ chuỗi hành động như:

- `list-databases`
- `list-tables`
- `check-table-schema`
- `query`

Nguồn:

- https://docs.anythingllm.com/agent/usage/sql-agent

## Giới hạn của built-in SQL Agent

Không nên thần thánh hóa built-in SQL Agent cho bài toán syllabus production.

Lý do:

1. Nó phù hợp với truy vấn analytics hoặc khám phá dữ liệu hơn là domain QA cực chính xác.
2. Docs cảnh báo phải dùng `read-only database user`.
3. Nếu cho nó truy cập schema quá rộng, agent có thể bị loãng ngữ cảnh hoặc truy vấn sai domain.
4. Với sản phẩm lecturer-facing, cần domain contract chặt hơn.

Nguồn:

- https://docs.anythingllm.com/agent/usage/sql-agent

## Giới hạn của RAG thuần

AnythingLLM cũng nói rõ RAG không phải quá trình "hiểu nghĩa" hoàn hảo. Đây vẫn là quá trình tìm các chunk gần nhất trong vector space rồi lọc theo score.

Hệ quả:

- nếu dùng RAG thuần cho các trường structured như trọng số điểm, điều kiện qua môn, CLO mapping, rất dễ sai hoặc thiếu
- các facts dạng cột/bảng vẫn nên lấy từ structured source

Nguồn:

- https://docs.anythingllm.com/chatting-with-documents/rag-in-anythingllm

## Kiến trúc đề xuất để ship sản phẩm trước

### Mục tiêu

Một chatbot cho giảng viên có thể:

- trả lời chính xác thông tin structured trong syllabus
- trả lời nội dung từ tài liệu môn học
- không buộc giảng viên phải tự mở syllabus và đọc thủ công

### Kiến trúc ngắn gọn

1. `AnythingLLM` là lớp chat/agent chính.
2. Mỗi `syllabus active` tương ứng một `workspace`.
3. Mọi tài liệu môn học được embed vào workspace đó.
4. Structured syllabus không đưa hoàn toàn qua SQL Agent tự do.
5. Thay vào đó, bổ sung `custom agent skill` hoặc `backend API` hẹp chỉ phục vụ syllabus domain.

## Mô hình khuyến nghị

### Thành phần 1: Workspace theo syllabus

Mỗi syllabus active có một workspace AnythingLLM riêng.

Workspace này chứa:

- slide `.pptx`
- sách
- tài liệu `.pdf`
- `.docx`
- các file hỗ trợ khác của môn

Lợi ích:

- cô lập tri thức theo môn/syllabus version
- giảm nhiễu giữa các môn
- agent chỉ thấy đúng tài liệu liên quan

### Thành phần 2: Một bản `syllabus.md` sinh từ SQL

Ngoài tài liệu gốc, nên sinh thêm một file text có cấu trúc từ dữ liệu SQL, ví dụ `syllabus.md`, rồi embed vào workspace.

Nội dung file này gồm:

- course code, course name
- prerequisites
- credits
- tools
- assessment schemes
- CLOs
- weekly schedules
- materials
- references

Vai trò:

- làm lớp backup text-based cho RAG
- giúp AnythingLLM vẫn có thể trả lời khi agent không gọi skill
- giúp summary/search tự nhiên hơn

Lưu ý:

- file này không thay thế structured source
- nó chỉ là lớp hỗ trợ cho agent + RAG

### Thành phần 3: Custom agent skill `syllabus-lookup`

Đây là phần quan trọng nhất.

Thay vì để built-in SQL Agent truy cập tự do toàn bộ database, nên tạo một custom skill như `syllabus-lookup`.

Skill này gọi tới API backend hoặc query read-only view rất hẹp, ví dụ các action:

- `get_assessment_rules`
- `get_clos`
- `get_schedule`
- `get_prerequisites`
- `get_credits`
- `get_tools`
- `get_materials`
- `get_references`

AnythingLLM hỗ trợ custom agent skills qua `plugin.json` và `handler.js`.

Nguồn:

- https://docs.anythingllm.com/agent/custom/introduction
- https://docs.anythingllm.com/agent/custom/developer-guide

### Thành phần 4: Built-in skills cần bật

Nên bật ít nhất:

- `RAG Search`
- `List Documents`
- `Summarize Documents`
- `syllabus-lookup` custom skill

Không khuyến nghị dùng built-in `SQL Agent` làm đường chính cho lecturer chatbot, trừ khi dùng như fallback hoặc cho nội bộ admin/debug.

## Luồng trả lời khuyến nghị

### Trường hợp 1: hỏi về grading / assessment

Ví dụ:

- "Quy tắc chấm điểm progress test là gì?"
- "Final exam chiếm bao nhiêu phần trăm?"

Luồng:

1. Agent nhận diện đây là structured syllabus query.
2. Gọi `syllabus-lookup.get_assessment_rules`.
3. Nhận JSON hoặc text đã chuẩn hóa.
4. Tổng hợp thành câu trả lời tiếng Việt dễ đọc.

### Trường hợp 2: hỏi về CLO

Ví dụ:

- "Môn này có những CLO nào?"
- "Assessment này map với CLO nào?"

Luồng:

1. Agent gọi `syllabus-lookup.get_clos`.
2. Nếu cần liên kết assessment, gọi tiếp action phù hợp.
3. Tổng hợp.

### Trường hợp 3: hỏi về lịch buổi học

Ví dụ:

- "Buổi 7 học gì?"
- "Tuần nào học về REST API?"

Luồng:

1. Nếu câu hỏi là exact structured => `syllabus-lookup.get_schedule`.
2. Nếu câu hỏi mơ hồ hoặc nội dung chi tiết trong slide => `RAG Search`.
3. Nếu cần, agent kết hợp cả 2 nguồn.

### Trường hợp 4: hỏi về nội dung tài liệu

Ví dụ:

- "Trong slide có nói gì về dependency injection?"
- "Tài liệu nào nói về OAuth2?"

Luồng:

1. Agent dùng `RAG Search`.
2. Có thể dùng `List Documents` nếu cần xác định tài liệu hiện có.
3. Có thể dùng `Summarize Documents` khi người dùng yêu cầu tóm tắt.

## Vì sao giải pháp này hợp với bài toán lecturer

Mục tiêu của lecturer không phải "trải nghiệm agent đẹp".
Mục tiêu là:

- hỏi tự nhiên
- nhận câu trả lời đúng
- không phải mở syllabus đọc tay
- có thể hỏi cả structured policy lẫn nội dung bài giảng

Giải pháp này đáp ứng đúng:

- facts quan trọng lấy từ source chuẩn
- tri thức tài liệu lấy từ RAG
- agent đứng giữa để chọn công cụ phù hợp

## Cấu hình RAG cần lưu ý

AnythingLLM cho biết:

- tài liệu embed vào workspace sẽ khả dụng cho mọi thread trong workspace
- RAG chỉ lấy một lượng context nhỏ liên quan
- có thể tinh chỉnh workspace settings
- với LanceDB có thể bật `Accuracy Optimized` để search nhiều chunk hơn rồi rerank

Điều này hữu ích nếu thấy trả lời tài liệu chưa tốt.

Nguồn:

- https://docs.anythingllm.com/chatting-with-documents/introduction

## Khuyến nghị triển khai thực tế trong dự án này

### Nên làm ngay

1. Dùng AnythingLLM làm chat layer chính cho lecturer.
2. Giữ workspace theo syllabus hoặc course-syllabus version.
3. Embed toàn bộ slide, pdf, docx, books của môn vào workspace.
4. Sinh `syllabus.md` từ PostgreSQL và add vào workspace.
5. Xây custom skill `syllabus-lookup` cho structured data.
6. Bật `RAG Search`, `List Documents`, `Summarize Documents`.

### Không nên làm đường chính

1. Không nên tiếp tục route keyword SQL thủ công.
2. Không nên trông chờ vector search thuần trả đúng grading rules.
3. Không nên để built-in SQL Agent truy cập toàn DB production schema như đường chính của sản phẩm.

## Kiến trúc đề xuất cuối cùng

```text
Lecturer Chat
   |
   v
AnythingLLM Agent
   |
   +-- structured syllabus question
   |      -> custom skill: syllabus-lookup
   |      -> backend API / read-only domain view
   |
   +-- document/content question
   |      -> RAG Search on workspace documents
   |
   +-- document inventory / summary question
          -> List Documents / Summarize Documents
```

## Kết luận cuối

Nếu mục tiêu là "sản phẩm hoạt động trước", thì hướng phù hợp nhất là:

- dùng `AnythingLLM` cho lớp agent/chat
- dùng `RAG` cho tài liệu môn học
- dùng `custom skill` hoặc `domain API` cho syllabus structured

Đây là phương án thực dụng hơn cả:

- chính xác hơn SQL keyword route
- ổn định hơn vector-only
- ít rủi ro hơn so với để built-in SQL Agent tự do xử lý toàn bộ domain
- phù hợp trực tiếp với use case giảng viên

## Nguồn tham khảo

- AnythingLLM Docs Home: https://docs.anythingllm.com/
- AI Agents Overview: https://docs.anythingllm.com/agent/overview
- Agent Setup: https://docs.anythingllm.com/agent/setup
- Intelligent Tool Selection: https://docs.anythingllm.com/agent/intelligent-tool-selection
- RAG Search: https://docs.anythingllm.com/agent/usage/rag-search
- SQL Agent: https://docs.anythingllm.com/agent/usage/sql-agent
- List Documents: https://docs.anythingllm.com/agent/usage/list-documents
- Summarize Documents: https://docs.anythingllm.com/agent/usage/summarize-documents
- Using Documents in Chat: https://docs.anythingllm.com/chatting-with-documents/introduction
- RAG in AnythingLLM: https://docs.anythingllm.com/chatting-with-documents/rag-in-anythingllm
- AI Agent not using tools: https://docs.anythingllm.com/agent-not-using-tools
- Custom Agent Skills Introduction: https://docs.anythingllm.com/agent/custom/introduction
- Custom Agent Skill Developer Guide: https://docs.anythingllm.com/agent/custom/developer-guide
- Changelog v1.11.1: https://docs.anythingllm.com/changelog/v1.11.1
- Changelog v1.13.0: https://docs.anythingllm.com/changelog/v1.13.0

## Câu hỏi mở

1. Skill `syllabus-lookup` sẽ gọi trực tiếp DB read-only hay gọi qua API Hono nội bộ?
2. Mỗi workspace nên map theo `courseId`, `syllabusId`, hay `courseCode_syllabusId` như cách repo đang làm?
3. Có cần cho lecturer hỏi đa môn trong cùng một chat hay chỉ 1 workspace/1 môn tại một thời điểm?
