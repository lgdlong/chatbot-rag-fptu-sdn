- upload file cần thêm hình ảnh.
- việc upload video cần phải xem lại có thực sự cần thiết không, nếu không cần thiết embedding video thì đăng video lên một kênh khác như youtube hoặc google drive rồi gắn url vào.
- hệ thống có dùng cả qdrant để cho phần embedding các file nữa, pgvector chỉ là giải pháp tạm nghĩ ra khi cần embedding các sysllabus, thứ được lưu dạng có cấu trúc trong postgres chứ không embedding như một pdf (thường embedding sẽ là upload đoạn text hoặc các file vào để embedding, nhưng khi lưu trong database có cấu trúc nhưu postgres mà không phải là file, tôi không biết những dữ liệu đó sẽ được RAG như nào, vì nó chỉ có thể sql chứ không lưu dạng vector).
- FR-03.7, Re-index tài liệu, Admin có thể yêu cầu re-index một file (xóa cũ → chunk + embed lại). -> thứ này tôi không rõ, nhưng tôi không muốn soft delete, muốn reindex thì xoá file cũ và upload lại một file mới cho đơn giản.
- "Dữ liệu đánh giá lấy từ bảng cấu trúc (Postgres), không phụ thuộc vector search" -> tôi cần kết hợp giữa dữ liệu có cấu trúc và vector. đơn giản là vì các syllabus có cấu trúc. nếu tôi không muốn nó có cấu trúc thì có thể chuyển toàn bộ thành pdf rồi đưa vào embedding, nhưng như vậy không tốt và tôi không muốn.
- Cần đánh giá logic này: Khi mở một môn học lên bằng web, thì con chatbot chỉ nên giới hạn phạm vi kiến thức trong môn đó và những tài liệu của môn đó. Như vậy sẽ giúp chatbot giới hạn kiến thức và trả lời chính xác hơn, tránh lan man. Tôi không hiểu về một web FLM hay syllabus tốt thì nên thế nào nên cần đánh giá lại logic này xem có nên dùng không.
- trong `data/` là toàn bộ dữ liệu và cấu trúc sau khi tôi crawl data từ web syllabus của trường. phần "FR-06: Kiến Trúc Hybrid RAG" hơi kỳ lạ, tôi không nghĩ có thể query SQL cho thông tin về syllabus, hầu như data của nó đều là text và rất ít số để mà sql, và cũng không cần thiết. chỉ cần khi vào syllabus thì show thẳng toàn bộ lên web, sau đó cấp một con chatbot để hỏi về sysllabus là được.
- "BR-04, Multi-tag bắt buộc, Mỗi môn phải gắn ≥ 1 tag chuyên ngành. Cho phép gắn nhiều tag (môn chéo/gộp)." -> Ở syllabus này, từ kì 1 -> 4 là các môn chung, cơ bản, đại cương, và kì 8 cũng có vài môn đại cương. tôi nghĩ các môn đại chương thì không nên gắn tag gì, chỉ nên gắn tags cho cho các môn thuộc một trong các nhánh chuyên ngành hẹp như từ kỳ 5 trở đi, như vậy sẽ tối giản hệ thống hơn là việc gắn mọi tag cho mọi môn.
- khái niệm "đánh giá" ở đây chính là "assessment_scheme" trong `data\20260522_133015_FER202_details.json`, nó không phải theo nghĩa đánh giá thông thường, mà là các thông tin về việc điểm số, các bài kiểm tra, các bài thi. cho nên "BR-05, Tổng % đánh giá = 100, Khi nhập thông tin đánh giá, tổng % các thành phần phải = 100%." thứ % này được gọi là "weight" trong "assessment_scheme".
- `data\fap_curriculum_text.json` đây là data về môn học và học kì của ngành SE với combo/chuyên ngành hẹp là `React/Nodejs`. có thể lấy data này để hiểu thêm về flm của trường.
- thông tin về các combo/chuyên ngành hẹp là bí mật và tôi không thể crawl từ public được. tôi cần có cách để tự thêm sau.
- về multi-tag tôi không hiểu rõ nó là như thế nào. nhưng combo/chuyên ngành hẹp được giải thích như sau: khi lên đến kì 5, sinh viên phải chọn một chuyên ngành hẹp cho mình sau khi đã học đủ các môn đại cương cần thiết, sẽ có nhiều chuyên ngành hẹp để sinh viên lựa chọn, trước khi chọn chuyên ngành hẹp, thì sẽ có 4 slot trống môn. sau khi chọn chuyên ngành hẹp thì sinh viên sẽ được gán một id kiểu như "BIT_SE_NJS_19B" hay "BIT_SE_NET_19B"... thứ này sẽ định hình toàn bộ khung chương trình đầy đủ của sinh viên. 4 slot trống sẽ được điền đầy đủ với các môn khác nhau tuỳ chuyên  ngành hẹp. nhưng không có môn nào thuộc 2 chuyên ngành hẹp, mỗi chuyên ngành hẹp/combo có một bộ 4 môn riêng biệt được phân biệt kiểu "BIT_Ngành học_Chuyên ngành hẹp_Số này không rõ" thông tin so sánh 2 ID khác nhau sẽ định hình curriculum khác nhau ở `docs\curriculum_comparison_report.md`. hãy nghiên cứu đễ kiểu hơn về business flm.

---

- upload file cần thêm hình ảnh.
- việc upload video cần phải xem lại có thực sự cần thiết không, nếu không cần thiết embedding video thì đăng video lên một kênh khác như youtube hoặc google drive rồi gắn url vào.
- hệ thống có dùng cả qdrant để cho phần embedding các file nữa, pgvector chỉ là giải pháp tạm nghĩ ra khi cần embedding các sysllabus, thứ được lưu dạng có cấu trúc trong postgres chứ không embedding như một pdf (thường embedding sẽ là upload đoạn text hoặc các file vào để embedding, nhưng khi lưu trong database có cấu trúc nhưu postgres mà không phải là file, tôi không biết những dữ liệu đó sẽ được RAG như nào, vì nó chỉ có thể sql chứ không lưu dạng vector).
- FR-03.7, Re-index tài liệu, Admin có thể yêu cầu re-index một file (xóa cũ → chunk + embed lại). -> thứ này tôi không rõ, nhưng tôi không muốn soft delete, muốn reindex thì xoá file cũ và upload lại một file mới cho đơn giản.
- "Dữ liệu đánh giá lấy từ bảng cấu trúc (Postgres), không phụ thuộc vector search" -> tôi cần kết hợp giữa dữ liệu có cấu trúc và vector. đơn giản là vì các syllabus có cấu trúc. nếu tôi không muốn nó có cấu trúc thì có thể chuyển toàn bộ thành pdf rồi đưa vào embedding, nhưng như vậy không tốt và tôi không muốn.
- Cần đánh giá logic này: Khi mở một môn học lên bằng web, thì con chatbot chỉ nên giới hạn phạm vi kiến thức trong môn đó và những tài liệu của môn đó. Như vậy sẽ giúp chatbot giới hạn kiến thức và trả lời chính xác hơn, tránh lan man. Tôi không hiểu về một web FLM hay syllabus tốt thì nên thế nào nên cần đánh giá lại logic này xem có nên dùng không.
- trong `data/` là toàn bộ dữ liệu và cấu trúc sau khi tôi crawl data từ web syllabus của trường. phần "FR-06: Kiến Trúc Hybrid RAG" hơi kỳ lạ, tôi không nghĩ có thể query SQL cho thông tin về syllabus, hầu như data của nó đều là text và rất ít số để mà sql, và cũng không cần thiết. chỉ cần khi vào syllabus thì show thẳng toàn bộ lên web, sau đó cấp một con chatbot để hỏi về sysllabus là được.
- "BR-04, Multi-tag bắt buộc, Mỗi môn phải gắn ≥ 1 tag chuyên ngành. Cho phép gắn nhiều tag (môn chéo/gộp)." -> Ở syllabus này, từ kì 1 -> 4 là các môn chung, cơ bản, đại cương, và kì 8 cũng có vài môn đại cương. tôi nghĩ các môn đại chương thì không nên gắn tag gì, chỉ nên gắn tags cho cho các môn thuộc một trong các nhánh chuyên ngành hẹp như từ kỳ 5 trở đi, như vậy sẽ tối giản hệ thống hơn là việc gắn mọi tag cho mọi môn.
- khái niệm "đánh giá" ở đây chính là "assessment_scheme" trong `data\20260522_133015_FER202_details.json`, nó không phải theo nghĩa đánh giá thông thường, mà là các thông tin về việc điểm số, các bài kiểm tra, các bài thi. cho nên "BR-05, Tổng % đánh giá = 100, Khi nhập thông tin đánh giá, tổng % các thành phần phải = 100%." thứ % này được gọi là "weight" trong "assessment_scheme".
- `data\fap_curriculum_text.json` đây là data về môn học và học kì của ngành SE với combo/chuyên ngành hẹp là `React/Nodejs`. có thể lấy data này để hiểu thêm về flm của trường.
- thông tin về các combo/chuyên ngành hẹp là bí mật và tôi không thể crawl từ public được. tôi cần có cách để tự thêm sau.
- về multi-tag tôi không hiểu rõ nó là như thế nào. nhưng combo/chuyên ngành hẹp được giải thích như sau: khi lên đến kì 5, sinh viên phải chọn một chuyên ngành hẹp cho mình sau khi đã học đủ các môn đại cương cần thiết, sẽ có nhiều chuyên ngành hẹp để sinh viên lựa chọn, trước khi chọn chuyên ngành hẹp, thì sẽ có 4 slot trống môn. sau khi chọn chuyên ngành hẹp thì sinh viên sẽ được gán một id kiểu như "BIT_SE_NJS_19B" hay "BIT_SE_NET_19B"... thứ này sẽ định hình toàn bộ khung chương trình đầy đủ của sinh viên. 4 slot trống sẽ được điền đầy đủ với các môn khác nhau tuỳ chuyên  ngành hẹp. nhưng không có môn nào thuộc 2 chuyên ngành hẹp, mỗi chuyên ngành hẹp/combo có một bộ 4 môn riêng biệt được phân biệt kiểu "BIT_Ngành học_Chuyên ngành hẹp_Số này không rõ" thông tin so sánh 2 ID khác nhau sẽ định hình curriculum khác nhau ở `docs\curriculum_comparison_report.md`. hãy nghiên cứu đễ kiểu hơn về business flm.

---

thêm thông tin: flm chỉ cho search syllabus chứ không list toàn bộ syllabus ra, và tôi phát hiện một vài thứ. ID của syllabus rất lớn lên tới ~12000, lý do là vì 2 cột chính IsActive, IsApproved. tôi nghĩ thứ này là lý do khiến ID lớn nhưng search ra rất ít, ngoài ra cũng là cơ chế soft delete của nó, nếu không approve thì cứ để ở đó, khi xoá thì hard delete. và chỉ hiện những cái nào đang isActive. bằng chứng là `data\20260522_223218_PRN232_details.json` có "is_approved": "False", "is_active": "False". thiết kế này đã đủ tốt chưa? nếu rồi thì cứ dùng logic này không cần thiết kế lại. đây là logic về syllabus của flm, hãy cập nhật thêm thông tin vào các tài liệu srs. 

---

- gap01: có "Quên mật khẩu", cơ chế Session management, token hết hạn đều do better auth quản lý với setting default. sẽ thủ công sql để thêm một tài khoản super admin đầu tiên. sinh viên guest thì phải đăng nhập bằng tài khoản trường cấp để access, trường có thể add một list email sinh viên vào, sinh viên sẽ đăng nhập bằng tài khoản google, nếu email đăng nhập vào đã được trường add thì có thể đăng nhập, còn không thì không có quyền.
```tsx
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './services/db.service.js'
import { organization } from 'better-auth/plugins/organization'
import { admin } from 'better-auth/plugins/admin'
import { openAPI } from 'better-auth/plugins'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    organization(),
    admin(),
    openAPI(),
  ],
})
```
- gap02: đề xuất này hợp lý.
- gap03: đề xuất này hợp lý
- gap04: đề xuất này hợp lý, hãy vẽ riêng các document chi tiết đầy đủ như use case diagram (quan trọng) và user flow và sequence diagram. mỗi loại diagram nên có một document riêng, không viết chung với nhau.
- gap05: admin search sẽ thấy tất cả, nó sẽ thuộc về admin quản lý syllabus, có đủ các tính năng search, sort, filter...; cần có hỗ trợ fuzzy search; chỉ search bằng subject code; kết quả search hiển thị dạng table gồm các thông tin "Syllabus ID, Subject Code, Subject Name, Syllabus Name, IsActive, IsApproved, DecisionNo MM/dd/yyyy", Syllabus Name sẽ hiển thị một url nhấn vào dẫn đến syllabus detail; kết quả thường không nhiều, hãy cho infinity scroll (ở web có thể dùng "https://tanstack.com/virtual/latest" để hỗ trợ).
- gap06: Kích thước file upload tối đa 50MB, Số file tối đa per subject	là 10, Độ dài câu hỏi tối đa là 5000 ký tự, Số tin nhắn tối đa per session không có, Context window size LLM không cần, Số lượng phiên chat đồng thời 100 tin nhắn/phiên, Top-K 5 chunks, Thời gian timeout LLM là 3 phút.
- gap07: đề xuất này hợp lý.
- gap08: hiện tại hệ thống (chatbot-rag-fptu) đang dùng gemini-embbeding-001 và gemini-embedding-2 đều hỗ trợ đa ngôn ngữ việt-anh rất tốt, tài liệu chính thức "https://ai.google.dev/gemini-api/docs/embeddings".
- gap12: đề xuất này hợp lý
- gap13: không cho phép is_active=True, is_approved=False, mặc định là is_active=False, is_approved=False và chỉ khi is_approved=True thì mới cho phép is_active=True. sinh viên chỉ có thể xem và chatbot chỉ trả lời syllabus có is_active=True, is_approved=True.
- gap09: hãy thêm một document cho moscow.
- gap10: đề xuất này hợp lý
- gap11: việc import dữ liệu vào database tôi sẽ tự lo liệu theo cách riêng, srs không cần quan tâm. hãy đảm bảo database schema có validate đầy đủ theo business.
- gap14: tất cả trên 1 trang scrollable, yêu cầu ux mẫu giống trang "https://flm.fpt.edu.vn/gui/role/student/SyllabusDetails?sylID=12580". tạo một document để mô tả chi tiết những thông tin ux/ui này.
- gap15: đề xuất này hợp lý

---

thông tin thêm:
- ui chatbot nên là như sau, khi chưa mở chatbot thì nó là một hình tròn nằm ở dưới góc phải màn hình, khi mở lên thì nó cần là một hình chữ nhật như một hộp hội thoại, góc trên bên trái hộp hội thoại sẽ có nút menu hay nut burger, khi nhất vào sẽ mở một list session chat lên để chọn các session.
- về ui, mặc định là nền sáng, dùng màu xanh lá đậm và vàng gold làm cơ sở, tôi muốn nó trông sang trọng, các border nên giữ vuông hoặc cực ít bo góc, trông sẽ chuyên nghiệp hơn. sử dụng thư viện mantine với version latest làm cơ sở ui vì nó hỗ trợ nhiều ui có sẵn, tài liệu chi tiết "https://mantine.dev/".