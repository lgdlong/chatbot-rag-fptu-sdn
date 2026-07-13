# Danh Sách Bug Cần Fix

> **Ngày**: 2026-07-13
> **Nguồn**: Tổng hợp từ `QA_Final_Report.md` và `Business_Logic_Gaps_Admin.md`

---

## 1. 🔴 CITATION BUG — KHÔNG HIỂN THỊ DỮ LIỆU THẬT

**Nguồn:** QA_Final_Report.md — Mục IV.1

**Trạng thái:** ✅ **Đã fix**

**Vấn đề:** Chatbot chỉ show "[1] Nguồn tài liệu [2] Nguồn tài liệu..." — ko có data thật. Không có layer transform, citation là raw AnythingLLM shape khớp vs field frontend mong đợi.

**Root cause:** Pipeline 3 kiểu shape khác nhau — AnythingLLM raw → backend cast ảo → frontend field mismatch.

**Fix đã triển khai:**

| File | Thay đổi |
|------|----------|
| `api/src/modules/rag/services/rag.service.ts` | Thêm `transformCitations()` — map AnythingLLM sources → `{ documentName, excerpt }`. Check đa field name (`title`, `filename`, `textContent`, `content`, `text`, `snippet`, `metadata.title`). `formatDocumentName()` — `syllabus_123_snapshot.md` → `"syllabus"`. |
| `api/src/modules/chat/services/chat.service.ts` | Cập nhật `ChatCitation` type — `{ documentName, excerpt }` khớp transform output. |
| `api/src/config/env.ts` | Cập nhật system prompt — refusal message thêm hướng dẫn đặt câu hỏi cụ thể. Rule #5: câu ngắn vẫn được suy luận, ko từ chối vội. |
| `web/components/chatbot/ChatbotWidget.tsx` | Display compact — chỉ unique document names, bỏ excerpt. |
| `web/components/chatbot/subcomponents/ChatMessageList.tsx` | Citation block thu gọn — text xám nhỏ `[Nguồn: syllabus]`, ko icon, ko border, ko padding. |

**Kết quả:** Citation hiển thị gọn: `[Nguồn: syllabus]` hoặc `[Nguồn: TenFile.pdf]`. Guard prompt hướng dẫn user đặt câu hỏi rõ hơn nếu bị từ chối.

---

## 2. 🟡 DUPLICATED ACTIVE SYLLABUSES (VIOLATES BR-03)

**Nguồn:** QA_Final_Report.md — Mục IV.3

**Trạng thái:** ✅ **Đã resolve — data DB sạch**

**Mô tả:** QA report cũ ghi nhận nhiều course có **2 syllabus cùng active** (vi phạm BR-03: mỗi subject chỉ tối đa 1 syllabus active). Ví dụ: EXE201, SSG104, SWE201c...

**Kiểm tra DB trực tiếp (2026-07-13):**
- **0 courses** bị duplicate (0 rows từ query `HAVING COUNT(s.id) > 1`)
- **49 active syllabuses** tổng cộng — khớp số course đã seed
- 3 courses ko active syllabus (PRN212, PRN222, TMI101 — môn chuyên ngành, hợp lệ)

**Nguyên nhân tự resolve:** `SyllabusService.activateSyllabus()` đã gọi `deactivateOthersInCourse()` trong `$transaction` từ sẵn. Quá trình re-seed sau khi thêm guard đã tự cleanup data legacy.

**Mức độ ảnh hưởng:** ✅ **Không còn ảnh hưởng.**

---

## 3. 🟡 Cập Nhật Email Template — Chỉ Rõ "Vào Settings Đổi Mật Khẩu"

**Nguồn:** Business_Logic_Gaps_Admin.md — Mục 3

**Trạng thái:** ✅ **Đã fix**

**Trước:** `templateLecturerApproved()` trong `email.service.ts` có dòng:
> "Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu."

**Sau:** Đã cập nhật thành:
> "Sau khi đăng nhập, vào menu **Cài đặt (Settings)** → **Đổi mật khẩu** để đặt mật khẩu mới."

**File đã sửa:**
| File | Sửa |
|------|-----|
| `api/src/modules/auth/services/email.service.ts` | Update `templateLecturerApproved()` — thêm hướng dẫn chi tiết đường dẫn settings + link |

---

## Tổng Quan Mức Độ

| Priority | Bug | Trạng thái | Nỗ lực |
|----------|-----|------------|--------|
| 🔴 P0 | Citation bug — không hiển thị nguồn thật | ✅ Đã fix | ~0.5 ngày |
| 🟡 P1 | Duplicated active syllabuses (BR-03) | ✅ DB clean, tự resolve | — |
| 🟡 P1 | Email template không chỉ rõ settings path | ✅ Đã fix | ~0.25 ngày |

---

*Report tổng hợp từ QA_Final_Report.md và Business_Logic_Gaps_Admin.md — 2026-07-13*
