# UI/UX Specifications — RAG Chatbot & Mini FLM

> **Phiên bản:** 2.0 — 23/05/2026
> **Tham chiếu:** [SRS_Detailed.md](file:///e:/FPT/Semester_7/SDN302/srs/SRS_Detailed.md)
> **UI tham khảo:** FPT FLM — `flm.fpt.edu.vn/gui/role/student/SyllabusDetails?sylID=12580`
> **UI Library:** Mantine (latest) — `https://mantine.dev/`

---

## Mục Lục

0. [Design System](#0-design-system)
1. [Nguyên Tắc Thiết Kế](#1-nguyên-tắc-thiết-kế)
2. [Trang Đăng Nhập](#2-trang-đăng-nhập)
3. [Trang Chủ (Search Môn Học)](#3-trang-chủ-search-môn-học)
4. [Trang Chi Tiết Môn Học (Syllabus)](#4-trang-chi-tiết-môn-học-syllabus)
5. [Chatbot — Floating Bubble & Dialog](#5-chatbot--floating-bubble--dialog)
6. [Dashboard Admin](#6-dashboard-admin)
7. [Trang Search Syllabus (Admin)](#7-trang-search-syllabus-admin)
8. [Trang Upload Tài Liệu](#8-trang-upload-tài-liệu)
9. [Responsive & Mobile](#9-responsive--mobile)

---

## 0. Design System

### 0.1 UI Library — Mantine (Latest)

| Hạng mục | Chi tiết |
|---|---|
| **Library** | [Mantine](https://mantine.dev/) — phiên bản mới nhất |
| **Lý do chọn** | Hỗ trợ sẵn nhiều component (Table, Modal, Drawer, TextInput, Badge, Button, Notification, Popover...), TypeScript-first, theme system linh hoạt |
| **Cách dùng màu** | Dùng Mantine `createTheme()` để override toàn bộ color tokens — không dùng inline style |
| **Icon** | `@tabler/icons-react` (kèm sẵn với Mantine ecosystem) |

```ts
// Ví dụ cấu hình Mantine theme
import { createTheme, MantineProvider } from '@mantine/core';

const theme = createTheme({
  primaryColor: 'navy',
  colors: {
    navy: [
      '#E8EFF7', '#C5D5E9', '#9DBAD9', '#739FC9',
      '#4A85B9', '#2563A8', '#1A3A5C', '#0D2137',
      '#081627', '#040D18',
    ],
    gold: [
      '#FFF8E1', '#FFECB3', '#FFE082', '#FFD54F',
      '#FFCA28', '#FFC107', '#FFB300', '#FFA000',
      '#FF8F00', '#FF6F00',
    ],
  },
  defaultRadius: 0,          // border vuông toàn cục
  fontFamily: 'Inter, sans-serif',
  headings: { fontFamily: 'Inter, sans-serif' },
});
```

### 0.2 Color Palette — Xanh Dương Đậm (Navy) & Vàng Gold

> **Chủ đề:** Nền sáng, sang trọng, chuyên nghiệp

| Token | Mã màu | Mantine key | Sử dụng |
|---|---|---|---|
| **Primary (Navy Blue)** | `#1A3A5C` | `navy.6` | Buttons chính, header, active states, accents |
| **Primary Dark** | `#0D2137` | `navy.7` | Hover trên primary |
| **Primary Light** | `#E8EFF7` | `navy.0` | Nền section highlight, badge bg |
| **Accent (Gold)** | `#FFC107` | `gold.5` | CTA phụ, badge active, citation border, icon accent |
| **Accent Dark** | `#FFA000` | `gold.7` | Hover trên gold, warning dark |
| **BG Primary** | `#FFFFFF` | `white` | Nền trang chính |
| **BG Secondary** | `#F9FAFB` | `gray.0` | Nền card, sidebar, alternate rows |
| **BG Elevated** | `#F1F3F5` | `gray.1` | Nền modal header, table header |
| **Text Primary** | `#1A1A1A` | `dark.9` | Text nội dung chính |
| **Text Secondary** | `#6B7280` | `gray.6` | Label, caption, placeholder |
| **Border** | `#D1D5DB` | `gray.3` | Border cho table, input, card |
| **Success** | `#16A34A` | `green.7` | Approved, active, indexed |
| **Warning** | `#FFC107` | `gold.5` | Pending, draft |
| **Danger** | `#DC2626` | `red.7` | Error, inactive, failed |

### 0.3 Typography

| Ngữ cảnh | Font | Size | Weight |
|---|---|---|---|
| **Heading H1** | Inter | 24px | 700 |
| **Heading H2** | Inter | 20px | 600 |
| **Heading H3** | Inter | 16px | 600 |
| **Body** | Inter | 14px | 400 |
| **Caption / Label** | Inter | 12px | 400 |
| **Code / Mono** | JetBrains Mono | 13px | 400 |

### 0.4 Border & Shape

> **Nguyên tắc:** Border **vuông hoàn toàn** (`border-radius: 0`) cho toàn bộ UI, trừ một số trường hợp đặc biệt.

| Component | Border Radius | Lý do |
|---|---|---|
| Button, Input, Card, Table | `0` (vuông) | Phong cách chuyên nghiệp, nghiêm túc |
| Badge, Tag | `2px` | Cực ít bo — vẫn nhận diện được dạng badge |
| Chatbot Floating Button | `50%` (tròn hoàn toàn) | Theo convention FAB (Floating Action Button) |
| Chatbot Dialog Box | `0` (vuông) | Nhất quán với design hệ thống |
| Avatar | `50%` (tròn) | Convention UI |
| Toast/Notification | `0` | Nhất quán |

### 0.5 Spacing & Shadow

| Level | Value | Dùng cho |
|---|---|---|
| XS | `4px` | Padding icon, gap nhỏ |
| SM | `8px` | Padding badge, gap element |
| MD | `16px` | Padding card, section nội bộ |
| LG | `24px` | Padding page, gap giữa sections |
| XL | `32px` | Margin giữa các khối lớn |
| **Shadow** | `0 1px 4px rgba(0,0,0,0.12)` | Card, dialog box — tối giản |

---

## 1. Nguyên Tắc Thiết Kế

### 1.1 Design Philosophy

| Nguyên tắc | Áp dụng |
|---|---|
| **Content-first** | Thông tin syllabus là trung tâm — chatbot hỗ trợ bên cạnh |
| **Tham khảo FLM** | Layout trang syllabus dựa theo FPT FLM hiện tại (familiar UX cho SV FPT) |
| **Single page scroll** | Trang chi tiết syllabus: tất cả trên 1 trang scrollable (không tabs, không pagination) |
| **Progressive disclosure** | Dữ liệu dài (schedule 60 sessions) dùng collapsible/accordion |
| **Dual-pane** | Trang môn học: syllabus bên trái, chatbot bên phải (hoặc slide-out panel) |
| **Accessible** | Contrast ratio WCAG AA, keyboard navigation, semantic HTML |

### 1.2 Color Palette

> **Màu chính thức:** Xanh dương đậm (`#1A3A5C`) + Vàng Gold (`#FFC107`) — xem chi tiết tại [Section 0.2](#02-color-palette--xanh-dương-đậm-navy--vàng-gold)

| Token | Màu | Sử dụng |
|---|---|---|
| **Primary** | `#1A3A5C` (Navy Blue) | Buttons chính, header, active states |
| **Primary Hover** | `#0D2137` | Hover trên primary |
| **Accent** | `#FFC107` (Gold) | CTA phụ, citation border, icon accent |
| **BG Primary** | `#FFFFFF` | Nền trang |
| **BG Secondary** | `#F9FAFB` | Nền card, sidebar |
| **Text Primary** | `#1A1A1A` | Text nội dung |
| **Text Secondary** | `#6B7280` | Label, caption |
| **Success** | `#16A34A` | Approved, active |
| **Warning** | `#FFC107` | Draft, pending |
| **Danger** | `#DC2626` | Error, inactive |

---

## 2. Trang Đăng Nhập

### 2.1 Layout

```
┌───────────────────────────────────────────────────┐
│                                                   │
│              🎓 [Logo Dự Án]                      │
│         RAG Chatbot & Mini FLM                    │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │                                             │  │
│  │        [🔵 Đăng nhập bằng Google]           │  │
│  │                                             │  │
│  │  ─────────── hoặc ───────────               │  │
│  │                                             │  │
│  │  Email: [________________]                  │  │
│  │  Mật khẩu: [________________]               │  │
│  │  [Quên mật khẩu?]                          │  │
│  │  [Đăng nhập Admin]                          │  │
│  │                                             │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
└───────────────────────────────────────────────────┘
```

### 2.2 Hành vi

| Element | Hành vi |
|---|---|
| "Đăng nhập bằng Google" | Google OAuth popup → kiểm tra whitelist → redirect trang chủ |
| "Đăng nhập Admin" | Form email/password → Better Auth → redirect dashboard |
| Quên mật khẩu | Better Auth default reset flow |
| Email không trong whitelist | Toast error: "Email chưa được trường cấp quyền truy cập. Liên hệ admin." |

---

## 3. Trang Chủ (Search Môn Học)

### 3.1 Layout — Sinh Viên

```
┌───────────────────────────────────────────────────┐
│ [Logo] RAG Chatbot               [Avatar ▼ Logout]│
├───────────────────────────────────────────────────┤
│                                                   │
│         🔍 Tìm kiếm môn học                      │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │  Nhập Subject Code (VD: FER202)...  [🔍]   │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  Kết quả:                                         │
│  ┌─────────────────────────────────────────────┐  │
│  │ 📖 FER202 — Front-End web development      │  │
│  │    with React                               │  │
│  │    3 tín chỉ | Decision: 359/QĐ-ĐHFPT      │  │
│  │                              [Xem chi tiết →]│  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
└───────────────────────────────────────────────────┘
```

### 3.2 Hành vi

| Element | Hành vi |
|---|---|
| Search input | Debounce 300ms, gọi API search khi ≥ 2 ký tự |
| Kết quả | Chỉ hiện `is_active=True AND is_approved=True` |
| "Xem chi tiết" | Navigate → Trang chi tiết môn học |
| Không tìm thấy | Hiển thị: "Không tìm thấy môn học với mã này" |

---

## 4. Trang Chi Tiết Môn Học (Syllabus)

> **Layout chính:** Tất cả trên 1 trang scrollable — tham khảo FPT FLM

### 4.1 Layout Overview

```
┌───────────────────────────────────────────────────────────────┐
│ [← Quay lại] RAG Chatbot          [Avatar ▼] [💬 Chatbot]   │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────┐  ┌──────────────────┐  │
│  │                                  │  │  💬 CHATBOT      │  │
│  │  THÔNG TIN MÔN HỌC              │  │  (slide-out      │  │
│  │  (scrollable content)            │  │   panel phải)    │  │
│  │                                  │  │                  │  │
│  │  ┌────────────────────────────┐  │  │  ┌──────────┐   │  │
│  │  │ Section 1: Thông tin chung │  │  │  │ Messages │   │  │
│  │  └────────────────────────────┘  │  │  │          │   │  │
│  │                                  │  │  │          │   │  │
│  │  ┌────────────────────────────┐  │  │  │          │   │  │
│  │  │ Section 2: CLOs            │  │  │  │          │   │  │
│  │  └────────────────────────────┘  │  │  │          │   │  │
│  │                                  │  │  │          │   │  │
│  │  ┌────────────────────────────┐  │  │  └──────────┘   │  │
│  │  │ Section 3: Schedule        │  │  │  ┌──────────┐   │  │
│  │  │ (collapsible)              │  │  │  │ Input    │   │  │
│  │  └────────────────────────────┘  │  │  └──────────┘   │  │
│  │                                  │  │                  │  │
│  │  ┌────────────────────────────┐  │  └──────────────────┘  │
│  │  │ Section 4: Assessment      │  │                        │
│  │  └────────────────────────────┘  │                        │
│  │                                  │                        │
│  │  ┌────────────────────────────┐  │                        │
│  │  │ Section 5: Tài liệu       │  │                        │
│  │  └────────────────────────────┘  │                        │
│  │                                  │                        │
│  └──────────────────────────────────┘                        │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### 4.2 Section 1: Thông Tin Chung (Metadata)

Hiển thị dạng **bảng key-value** giống FLM:

```
┌──────────────────────────────────────────────────────┐
│ 📋 THÔNG TIN CHUNG                                  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Subject Code:      FER202                           │
│  Tên môn (VN):      Phát triển web Front-End với     │
│                     React                            │
│  Tên môn (EN):      Front-End web development        │
│                     with React                       │
│  Số tín chỉ:        3                               │
│  Bậc học:           Bachelor                         │
│  Phân bổ thời gian: 45h contact + 1h final exam      │
│                     + 85' practical + 104h self-study │
│  Điều kiện tiên quyết: WED201c                       │
│  Thang điểm:        10                               │
│  Điểm trung bình tối thiểu: 5                        │
│  Quyết định:        359/QĐ-ĐHFPT dated 04/09/2025   │
│                                                      │
│  📝 Mô tả môn học:                                  │
│  ┌────────────────────────────────────────────────┐  │
│  │ Learn front-end web development for            │  │
│  │ implementing a multi-platform solution...      │  │
│  │ [Xem thêm ▼]                                   │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  📝 Nhiệm vụ sinh viên:                             │
│  ┌────────────────────────────────────────────────┐  │
│  │ • Attend at least 80% of contact slots...      │  │
│  │ • Complete all exercises on time...            │  │
│  │ [Xem thêm ▼]                                   │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  🔧 Công cụ:                                        │
│  • Visual Studio Code                                │
│  • Node.js                                           │
│  • Gemini, Grok, ChatGPT                             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Lưu ý UX:**
- Text mô tả dài → truncate 3 dòng + nút "Xem thêm"
- Điều kiện tiên quyết → hiển thị dạng clickable link nếu môn đó tồn tại trong hệ thống

### 4.3 Section 2: Chuẩn Đầu Ra (CLOs)

Hiển thị dạng **bảng**:

```
┌──────────────────────────────────────────────────────┐
│ 🎯 CHUẨN ĐẦU RA (CLOs)                     9 CLOs  │
├──────┬────────┬──────────────────────────────────────┤
│  #   │  CLO   │ Mô tả                               │
├──────┼────────┼──────────────────────────────────────┤
│  1   │ CLO1   │ Discuss the common front-end web     │
│      │        │ UI frameworks                        │
├──────┼────────┼──────────────────────────────────────┤
│  2   │ CLO2   │ Discuss Bootstrap UI framework       │
├──────┼────────┼──────────────────────────────────────┤
│  3   │ CLO3   │ Discuss Node.js, npm and ES6         │
│      │        │ for React development                │
├──────┼────────┼──────────────────────────────────────┤
│ ...  │ ...    │ ...                                  │
├──────┼────────┼──────────────────────────────────────┤
│  9   │ CLO9   │ Apply AI tools in React development  │
└──────┴────────┴──────────────────────────────────────┘
```

### 4.4 Section 3: Kế Hoạch Giảng Dạy (Schedule)

> **⚠️ Dữ liệu dài nhất**: FER202 có **60 sessions** → cần xử lý UX đặc biệt

Hiển thị dạng **bảng collapsible** — mặc định hiển thị 10 session đầu, nút "Xem tất cả":

```
┌──────────────────────────────────────────────────────────────┐
│ 📅 KẾ HOẠCH GIẢNG DẠY                          60 sessions  │
├──────┬───────────────────┬──────────┬──────┬─────────────────┤
│ Sess │ Chủ đề            │ Phương   │ CLO  │ Nhiệm vụ SV    │
│      │                   │ pháp     │      │                 │
├──────┼───────────────────┼──────────┼──────┼─────────────────┤
│  1   │ Assignment Intro  │ Offline  │ CLO1 │ Study brief...  │
│      │ with AI           │          │ -9   │                 │
├──────┼───────────────────┼──────────┼──────┼─────────────────┤
│  2   │ Course Intro:     │ Offline  │ CLO1 │ Study slides... │
│      │ Full Stack &      │          │      │                 │
│      │ React 19          │          │      │                 │
├──────┼───────────────────┼──────────┼──────┼─────────────────┤
│ ...  │ ...               │ ...      │ ...  │ ...             │
├──────┼───────────────────┼──────────┼──────┼─────────────────┤
│  10  │ Lab 1 Review      │ Offline  │ CLO1 │ Submit Lab 1... │
├──────┴───────────────────┴──────────┴──────┴─────────────────┤
│                     [▼ Xem tất cả 60 sessions]               │
└──────────────────────────────────────────────────────────────┘
```

**Hành vi:**
- Mặc định: hiển thị 10 session đầu
- Nút "Xem tất cả" → mở rộng toàn bộ 60 sessions (smooth animation)
- Nút "Thu gọn" → quay lại hiện 10 session đầu
- Mỗi hàng có thể click để expand xem thêm chi tiết (student_materials, student_tasks đầy đủ)

### 4.5 Section 4: Cơ Cấu Đánh Giá (Assessment Scheme)

Hiển thị dạng **bảng** (dữ liệu thực từ FER202):

```
┌──────────────────────────────────────────────────────────────┐
│ 📊 CƠ CẤU ĐÁNH GIÁ                          Tổng: 100%     │
├───────────────┬───────────┬────────┬──────────┬──────────────┤
│ Thành phần    │ Loại      │ Weight │ Thời gian│ CLOs         │
├───────────────┼───────────┼────────┼──────────┼──────────────┤
│ Assignment    │ on-going  │ 15.0%  │ At home  │ CLO1-CLO9    │
├───────────────┼───────────┼────────┼──────────┼──────────────┤
│ Labs (6 phần) │ on-going  │ 20.0%  │ Tutorial │ CLO1-CLO9    │
├───────────────┼───────────┼────────┼──────────┼──────────────┤
│ Practical Exam│ on-going  │ 20.0%  │ 85'      │ CLO1-CLO9    │
├───────────────┼───────────┼────────┼──────────┼──────────────┤
│ Progress Test │ on-going  │ 15.0%  │ 30' each │ CLO1-CLO8    │
│ (2 phần)      │           │        │          │              │
├───────────────┼───────────┼────────┼──────────┼──────────────┤
│ Final Exam    │ Final     │ 30.0%  │ 60'      │ CLO1-CLO9    │
├───────────────┴───────────┼────────┼──────────┴──────────────┤
│                    TỔNG   │ 100.0% │                         │
└───────────────────────────┴────────┴─────────────────────────┘
```

**Hành vi:**
- Click vào mỗi hàng → mở rộng hiện thêm: completion criteria, question type, grading guide, note
- Thanh tổng weight tự động tính, highlight đỏ nếu ≠ 100%

### 4.6 Section 5: Tài Liệu Tham Khảo (Materials)

```
┌──────────────────────────────────────────────────────┐
│ 📚 TÀI LIỆU THAM KHẢO                              │
├──────────────────────────────────────────────────────┤
│                                                      │
│  📗 Bootstrap Documentation                          │
│     🔗 https://getbootstrap.com/docs/5.3/...         │
│                                                      │
│  📗 React Official Documentation                     │
│     🔗 https://react.dev/learn                       │
│                                                      │
│  📗 React: Start a new project                       │
│     🔗 https://react.dev/learn/start-a-new-...       │
│                                                      │
│  📎 Video bổ sung:                                   │
│     🎬 YouTube: React Tutorial [link →]               │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 5. Chatbot — Floating Bubble & Dialog

### 5.1 Tổng Quan Interaction Pattern

Chatbot sử dụng pattern **Floating Action Button (FAB)** — phổ biến trong các ứng dụng chat / support:

| Trạng thái | Hình dạng | Vị trí | Hành động |
|---|---|---|---|
| **Đóng (mặc định)** | Hình tròn (FAB) | Góc dưới bên phải màn hình | Click → mở dialog |
| **Mở** | Hộp chữ nhật (Dialog Box) | Fixed, góc dưới bên phải | Click × → thu về FAB |

---

### 5.2 Trạng Thái 1: Floating Bubble (FAB)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   [Trang môn học — scrollable]                      │
│                                                     │
│                                                     │
│                                                     │
│                                              ┌────┐ │
│                                              │ 💬 │ │
│                                              │    │ │
│                                              └────┘ │
│                                           [FAB tròn]│
└─────────────────────────────────────────────────────┘
```

**Thông số FAB:**

| Thuộc tính | Giá trị |
|---|---|
| Kích thước | `56px × 56px` |
| Hình dạng | Tròn hoàn toàn (`border-radius: 50%`) |
| Màu nền | `#1A3A5C` (Navy Blue primary) |
| Icon | `IconMessageCircle` (Tabler Icons), màu trắng, `28px` |
| Vị trí | `position: fixed; bottom: 24px; right: 24px; z-index: 1000` |
| Shadow | `0 4px 12px rgba(0,0,0,0.25)` |
| Hover | Nền → `#0D2137`, scale `1.05`, transition `200ms ease` |
| Badge thông báo | Số tin nhắn chưa đọc (nếu có) — badge vàng gold `#FFC107`, góc trên phải FAB |

---

### 5.3 Trạng Thái 2: Dialog Box

Khi click vào FAB, dialog box mở ra — **không phải full screen**, là một hộp chữ nhật cố định ở góc dưới phải:

```
                               ┌──────────────────────────┐
                               │ ≡  Hỏi đáp FER202     × │  ← Header
                               │ [burger]   [tên môn]  [X]│
                               ├──────────────────────────┤
                               │                          │
                               │  🤖 Xin chào! Tôi là    │
                               │  trợ lý của FER202.      │
                               │                          │  ← Messages
                               │  👤 FER202 thi cuối kỳ  │     area
                               │      bao nhiêu phần trăm?│  (scrollable)
                               │                          │
                               │  🤖 Final Exam chiếm     │
                               │     30% tổng điểm.       │
                               │                          │
                               │  ┌──────────────────┐    │
                               │  │ 📎 Nguồn:        │    │  ← Citation
                               │  │ Assessment Scheme│    │     block
                               │  │ Final exam 30.0% │    │
                               │  └──────────────────┘    │
                               │                          │
                               ├──────────────────────────┤
                               │ [Nhập câu hỏi...    ] [➤]│  ← Input
                               └──────────────────────────┘
```

**Thông số Dialog Box:**

| Thuộc tính | Giá trị |
|---|---|
| Kích thước | `380px × 560px` (desktop) |
| Vị trí | `position: fixed; bottom: 24px; right: 24px; z-index: 999` |
| Border radius | `0` (vuông hoàn toàn) |
| Border | `1px solid #D1D5DB` |
| Shadow | `0 8px 32px rgba(0,0,0,0.18)` |
| Animation mở | Scale từ FAB → dialog box, `300ms ease-out` (transform-origin: bottom right) |
| Animation đóng | Reverse — thu về vị trí FAB, `250ms ease-in` |

---

### 5.4 Header Dialog Box

```
┌──────────────────────────────────────────┐
│  ≡   Hỏi đáp FER202                   × │
│ [🍔]  [tên môn học]              [✕ đóng]│
└──────────────────────────────────────────┘
```

| Element | Mô tả |
|---|---|
| **Burger button (≡)** | Góc trên bên TRÁI header. Click → mở **Session List Drawer** (xem 5.5) |
| **Tên môn** | Text "Hỏi đáp FER202" — tên Subject Code của môn đang xem. Căn giữa header |
| **Nút đóng (×)** | Góc trên bên PHẢI. Click → thu dialog về FAB |
| **Màu header** | Nền `#1A3A5C` (Navy Blue), text + icon màu trắng |
| **Height header** | `48px` |
| **Border bottom** | `1px solid #0D2137` |

---

### 5.5 Session List Drawer (Mở Từ Burger Menu)

Khi nhấn burger button (≡), một **drawer / overlay panel** trượt ra từ bên trái của dialog box (không phải từ cạnh màn hình):

```
┌──────────────┬──────────────────────────┐
│ ← Đóng       │  ≡  Hỏi đáp FER202    × │
│              ├──────────────────────────┤
│ 📋 SESSIONS  │                          │
│              │  🤖 Xin chào! Tôi là    │
│  [+ Mới]     │  trợ lý của FER202.      │
│              │                          │
│ ── Hôm nay ──│  (messages vẫn hiện sau) │
│ ┌──────────┐ │                          │
│ │ FER202   │ │                          │
│ │ "thi cuối│ │                          │
│ │ kỳ..."   │ │                          │
│ │ 14:30 [🗑]│ │                          │
│ └──────────┘ │                          │
│              │                          │
│ ── Hôm qua ──│                          │
│ ┌──────────┐ │                          │
│ │ FER202   │ │                          │
│ │ "prereq  │ │                          │
│ │ là gì?" │ │                          │
│ │ 10:15 [🗑]│ │                          │
│ └──────────┘ │                          │
│              ├──────────────────────────┤
│              │ [Nhập câu hỏi...    ] [➤]│
└──────────────┴──────────────────────────┘
```

**Thông số Session Drawer:**

| Thuộc tính | Giá trị |
|---|---|
| Chiều rộng | `160px` (trượt đè lên phần trái dialog box) |
| Chiều cao | Bằng chiều cao dialog box |
| Animation | Trượt từ trái sang phải, `250ms ease-out` |
| Nền | `#F9FAFB` (BG Secondary) |
| Border phải | `1px solid #D1D5DB` |
| Nút đóng | `← Đóng` — click để đóng drawer, quay về chat |
| **Nút "+ Mới"** | Mantine `Button` variant `outline`, màu `navy`, text "+ Phiên mới" |
| **Session item** | Card nhỏ, nền trắng, border `1px solid #E5E7EB`. Hiện: Subject Code, preview câu hỏi đầu, timestamp |
| **Session active** | Nền `#E8EFF7` (navy.0), border trái `2px solid #1A3A5C` |
| **Nút xóa session** | Icon `🗑` nhỏ, hiện khi hover vào session item |
| **Nhóm theo ngày** | "Hôm nay", "Hôm qua", "Tuần trước"... — label xám nhỏ phân cách |

**Click session:** Chọn session → drawer tự đóng, chat area load messages của session đó.

---

### 5.6 Messages Area

| Component | Mô tả |
|---|---|
| **Message bubble (user)** | Căn phải. Nền `#1A3A5C` (navy), text trắng. Border radius `0`. Padding `10px 14px` |
| **Message bubble (bot)** | Căn trái. Nền `#F1F3F5` (gray.1), text `#1A1A1A`. Border radius `0`. Padding `10px 14px` |
| **Citation block** | Card nhỏ dưới message bot. Border trái `3px solid #FFC107` (gold accent). Nền `#FFFDE7`. Hiện: nguồn file/section + đoạn trích gốc (italic, truncated 2 dòng) |
| **Timestamp** | Caption `#6B7280`, `12px`, hiện dưới mỗi bubble |
| **Typing indicator** | 3 dots animation (Mantine `Loader` hoặc custom CSS) khi LLM đang trả lời |

---

### 5.7 Input Area

```
┌──────────────────────────────────────┐
│ [Nhập câu hỏi về FER202...       ][➤]│
│                        0 / 5000       │
└──────────────────────────────────────┘
```

| Element | Mô tả |
|---|---|
| **TextInput / Textarea** | Mantine `Textarea` autosize (1–4 dòng). Placeholder: "Nhập câu hỏi về {SubjectCode}..." |
| **Nút gửi** | Mantine `ActionIcon`, màu `navy`, icon `IconSend`. Disabled khi input rỗng hoặc LLM đang xử lý |
| **Ký tự counter** | Caption phải: `{n} / 5000`. Màu đỏ khi > 4900 |
| **Phím tắt** | `Enter` gửi. `Shift+Enter` xuống dòng |
| **Border top** | `1px solid #D1D5DB` |
| **Height** | `56px` (1 dòng), tự mở rộng tối đa `128px` (4 dòng) |

---

### 5.8 Trạng Thái Đặc Biệt

| Trạng thái | Hiển thị |
|---|---|
| **LLM đang xử lý** | Typing indicator (3 dots) + text nhỏ "Đang tìm kiếm..." | 
| **Ngoài phạm vi môn** | 🤖 "Mình chỉ trả lời được về [SubjectCode] thôi nhé." |
| **Không tìm thấy** | 🤖 "Mình không tìm thấy thông tin liên quan. Bạn thử hỏi cụ thể hơn nhé." |
| **Qdrant down** | 🤖 "Dịch vụ tìm kiếm tạm không hoạt động. Bạn có thể đọc thông tin trên trang." |
| **LLM timeout** | Mantine `Notification` warning: "Hệ thống xử lý lâu hơn bình thường. Thử lại nhé." |
| **Hết limit 100 tin nhắn** | Input disabled. Banner vàng gold: "Phiên chat đã đạt 100 tin nhắn. [+ Tạo phiên mới]" |
| **Câu hỏi > 5000 ký tự** | Counter đỏ, nút gửi disabled, tooltip: "Câu hỏi quá dài" |

---

### 5.9 Mantine Components Mapping

| UI Element | Mantine Component |
|---|---|
| FAB nút tròn | `ActionIcon` (`radius="xl"`, size `56`) |
| Dialog Box wrapper | `Paper` (`shadow="lg"`, `radius={0}`) trong `Portal` |
| Header | `Group` với `Box` background `navy.6` |
| Burger button | `Burger` component |
| Session drawer | `Drawer` (`position="left"`, target dialog scope) hoặc `Collapse` từ trái |
| Session item | `NavLink` hoặc custom `UnstyledButton` |
| Messages area | `ScrollArea` với auto-scroll to bottom |
| Message bubble | `Paper` (`radius={0}`, `p="sm"`) |
| Citation block | `Alert` (`color="yellow"`, `radius={0}`) |
| Input area | `Textarea` (`autosize`, `maxRows={4}`) + `ActionIcon` |
| Typing indicator | `Loader` (`type="dots"`, `color="navy"`) |
| Toast/error | `notifications.show()` từ `@mantine/notifications` |

---

## 6. Dashboard Admin

### 6.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] RAG Admin Dashboard                    [Avatar ▼]    │
├────────────┬────────────────────────────────────────────────┤
│            │                                                │
│  📊 Tổng quan│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐│
│            │  │  12    │ │  48    │ │  156   │ │  3     ││
│  📖 Syllabus│  │ Subjects│ │ Syllabus│ │ Files  │ │ Failed ││
│            │  │ (active)│ │ (total)│ │ indexed│ │        ││
│  📤 Upload  │  └────────┘ └────────┘ └────────┘ └────────┘│
│            │                                                │
│  📁 Tài liệu│  ┌──────────────────────────────────────────┐│
│            │  │ 📋 Hoạt động gần đây                      ││
│  🏫 Chương │  │                                            ││
│  trình ĐT  │  │ • Admin uploaded slides_ch1.pdf → FER202  ││
│            │  │ • Admin approved SDN302 syllabus           ││
│  👥 Tài    │  │ • 2 files queued for indexing              ││
│  khoản     │  │                                            ││
│            │  └──────────────────────────────────────────┘│
│  📧 Whitelist│                                              │
│            │                                                │
└────────────┴────────────────────────────────────────────────┘
```

### 6.2 Sidebar Navigation

| Menu | Trang | Quyền |
|---|---|---|
| 📊 Tổng quan | Dashboard overview | Admin, Super Admin |
| 📖 Syllabus | Search & quản lý syllabus | Admin, Super Admin |
| 📤 Upload | Upload & quản lý tài liệu | Admin, Super Admin |
| 🏫 Chương trình ĐT | CRUD Ngành/CNHEP/Curriculum | Admin, Super Admin |
| 👥 Tài khoản | Quản lý Admin accounts | Super Admin only |
| 📧 Whitelist | Quản lý email SV whitelist | Super Admin only |

---

## 7. Trang Search Syllabus (Admin)

### 7.1 Layout

```
┌────────────────────────────────────────────────────────────────┐
│ 📖 Quản Lý Syllabus                         [+ Tạo mới]       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  🔍 Search: [Nhập Subject Code...          ] [🔍]              │
│                                                                │
│  Filter: [Trạng thái ▼] [Approved ▼]  Sort: [Mới nhất ▼]      │
│                                                                │
├───────┬──────────┬─────────────┬──────────────┬────┬────┬──────┤
│ Syl   │ Subject  │ Subject     │ Syllabus     │Act │App │Decis.│
│ ID    │ Code     │ Name        │ Name (link)  │ive │rov│ No   │
├───────┼──────────┼─────────────┼──────────────┼────┼────┼──────┤
│ 12580 │ FER202   │ Front-End   │ FE web dev   │ ✅ │ ✅ │359/  │
│       │          │ web dev     │ with React → │    │    │QĐ-  │
│       │          │ with React  │              │    │    │ĐHFPT│
├───────┼──────────┼─────────────┼──────────────┼────┼────┼──────┤
│ 9426  │ FER201m  │ Front-End   │ Older        │ ❌ │ ❌ │—     │
│       │          │ web dev     │ version →    │    │    │      │
├───────┼──────────┼─────────────┼──────────────┼────┼────┼──────┤
│ 12588 │ PRN232   │ Building    │ Cross-Plat   │ ❌ │ ❌ │—     │
│       │          │ Cross-Plat  │ Backend →    │    │    │      │
├───────┴──────────┴─────────────┴──────────────┴────┴────┴──────┤
│                    ↓ Loading more... (infinity scroll)          │
└────────────────────────────────────────────────────────────────┘
```

### 7.2 Hành vi

| Feature | Mô tả |
|---|---|
| **Search** | Fuzzy match trên Subject Code, debounce 300ms |
| **Sort** | Theo Syllabus ID, Subject Code, hoặc ngày tạo |
| **Filter** | Theo IsActive (All/Active/Inactive) và IsApproved (All/Approved/Unapproved) |
| **Infinity scroll** | Dùng TanStack Virtual, load thêm khi scroll gần cuối |
| **Syllabus Name** | Clickable link → navigate tới trang chi tiết syllabus |
| **IsActive badge** | ✅ xanh = active, ❌ đỏ = inactive |
| **IsApproved badge** | ✅ xanh = approved, ❌ đỏ = unapproved |
| **Row actions** | Hover → hiện nút: [Sửa] [Duyệt] [Kích hoạt] [Vô hiệu hóa] [Xóa] (tùy trạng thái) |

---

## 8. Trang Upload Tài Liệu

### 8.1 Layout

```
┌────────────────────────────────────────────────────────────┐
│ 📤 Upload Tài Liệu — FER202                               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                                                     │  │
│  │          📁 Kéo thả file vào đây                    │  │
│  │          hoặc [Chọn file]                           │  │
│  │                                                     │  │
│  │  Hỗ trợ: PDF, DOCX, PPTX, PNG, JPG                 │  │
│  │  Tối đa: 50MB/file • 10 file/môn                   │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  🔗 Thêm video URL                                 │  │
│  │  URL: [https://youtube.com/...              ] [+]   │  │
│  │  Tiêu đề: [_________________________]              │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  📋 Tài liệu đã upload (7/10):                            │
│  ┌──────────────────┬──────────┬───────────┬───────────┐  │
│  │ File              │ Kích thước│ Trạng thái │ Hành động│  │
│  ├──────────────────┼──────────┼───────────┼───────────┤  │
│  │ 📄 slides_ch1.pdf│ 12.3 MB  │ ✅ Đã index│ [🗑 Xóa] │  │
│  │ 📄 slides_ch2.pdf│ 8.7 MB   │ ✅ Đã index│ [🗑 Xóa] │  │
│  │ 📄 lab1.docx     │ 2.1 MB   │ ⏳ Đang XL │          │  │
│  │ 🖼 diagram.png   │ 1.5 MB   │ ✅ Đã index│ [🗑 Xóa] │  │
│  │ 🎬 React Tutorial│ URL      │ —         │ [🗑 Xóa] │  │
│  └──────────────────┴──────────┴───────────┴───────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 8.2 Trạng thái file

| Trạng thái | Badge | Ý nghĩa |
|---|---|---|
| ⏳ Đang chờ | Vàng | File đã upload, chờ vào queue |
| ⚙️ Đang xử lý | Xanh dương + spinner | Đang chunking & embedding |
| ✅ Đã index | Xanh lá | Hoàn tất, chatbot có thể dùng |
| ❌ Thất bại | Đỏ | Lỗi chunking/embedding → xóa và upload lại |

---

## 9. Responsive & Mobile

### 9.1 Breakpoints

| Breakpoint | Kích thước | Layout |
|---|---|---|
| **Desktop** | ≥ 1024px | Dual-pane (syllabus + chatbot side panel) |
| **Tablet** | 768px–1023px | Single column, chatbot overlay modal |
| **Mobile** | < 768px | Single column, chatbot full-screen modal |

### 9.2 Mobile-specific

- Chatbot mở full-screen overlay (swipe down để đóng)
- Schedule table → horizontal scroll
- Assessment table → card layout (mỗi thành phần 1 card)
- Search results → card list thay vì table
- Sidebar admin → hamburger menu
