## Onboarding frontend cho người mới

> Status: Current
> Audience: Operations / Developer
> Canonical: No — operational guidance
> Owner: Technical
>

Tài liệu này dành cho thành viên mới vào team frontend. Mục tiêu là giúp bạn hiểu dự án đủ nhanh để có thể cài đặt, chạy local, biết code nằm ở đâu, và bắt đầu sửa feature mà không phải đọc toàn bộ repository.

Nếu bạn cần runbook full-stack chi tiết hơn, xem thêm [`running_guide.md`](./running_guide.md). Tài liệu này chỉ tập trung vào góc nhìn frontend và rút ngắn thời gian bắt đầu.

---

## Bạn sẽ làm việc với gì

Project là monorepo gồm 2 workspace chính:

- `web/`: frontend Next.js 16 + React 19
- `api/`: backend Hono.js + Prisma + Better Auth

Một vài điểm quan trọng trước khi bắt đầu:

- Frontend hiện dùng **Mantine UI** là UI layer chính.
- Project có dùng Tailwind CSS, nhưng phần lớn màn hình hiện tại đang dựng bằng Mantine.
- File môi trường chỉ dùng **một file `.env` ở root**, không tạo `.env` riêng trong `web/` hoặc `api/`.
- Frontend hiện **chưa nối hoàn toàn auth thật**. `AuthContext` đang dùng mock user + `localStorage` để phục vụ UI flow.

---

## Repo map rất nhanh

Đây là những thư mục bạn sẽ đụng đến nhiều nhất khi làm frontend:

- `web/app/layout.tsx`: root layout của app
- `web/app/providers.tsx`: nơi bọc Mantine provider, notifications, modals, auth provider
- `web/app/contexts/AuthContext.tsx`: auth mock hiện tại
- `web/components/ProtectedRoute.tsx`: chặn route theo role
- `web/components/chatbot/ChatbotWidget.tsx`: widget chat chính
- `web/app/page.tsx`: landing page
- `web/app/login/page.tsx`: trang login
- `web/app/student/*`: portal sinh viên
- `web/app/teacher/*`: portal giảng viên
- `web/app/superadmin/*`: portal quản trị

Nếu mới vào dự án, hãy đọc theo thứ tự này:

1. `web/app/providers.tsx`
2. `web/app/layout.tsx`
3. `web/app/page.tsx`
4. `web/app/login/page.tsx`
5. role portal mà bạn đang sửa (`student`, `teacher`, hoặc `superadmin`)

---

## Prerequisites

Bạn cần cài sẵn:

- Node.js 20+
- npm
- Docker Desktop
- Git
- Make là **tùy chọn**, không bắt buộc

Project root đang dùng npm workspaces và Turborepo. `packageManager` ở root là `npm@11.11.1`.

---

## Bước 1: clone và cài dependencies

Chạy ở thư mục gốc của repo:

```bash
npm install
```

Nếu bạn có `make`, lệnh tương đương là:

```bash
make install
```

---

## Bước 2: tạo file môi trường

Tạo `.env` ở thư mục gốc.

Git Bash:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Những biến quan trọng nhất với frontend:

- `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`
- `BETTER_AUTH_URL=http://localhost:8000`
- `PORT=8000` cho backend
- `ANYTHING_LLM_URL=http://localhost:3004`

Lưu ý:

- Không tạo `.env` trong `web/`
- Không tạo `.env` trong `api/`
- Nếu frontend gọi sai API local, kiểm tra `NEXT_PUBLIC_API_BASE_URL` đầu tiên

---

## Bước 3: khởi động hạ tầng local

Project cần Docker services để backend chạy ổn định.

Chạy:

```bash
docker compose up -d
```

Nếu có `make`:

```bash
make db-up
```

Kiểm tra trạng thái container:

```bash
docker compose ps
```

Hoặc:

```bash
make db-status
```

Các cổng local quan trọng:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- AnythingLLM: `http://localhost:3004`
- PostgreSQL: `5432`

---

## Bước 4: đồng bộ database cho backend

Frontend không trực tiếp chạy Prisma, nhưng bạn vẫn cần backend lên đúng để test flow thực tế.

Chạy lần đầu:

```bash
npx --no-install --prefix api prisma db push --schema=api/prisma/schema.prisma
npx --no-install --prefix api prisma generate --schema=api/prisma/schema.prisma
```

Hoặc dùng shortcut:

```bash
make migrate
make prisma-generate
```

---

## Bước 5: chạy project khi develop frontend

Bạn nên mở **2 terminal**.

### Terminal 1: chạy backend

```bash
make dev-api
```

Nếu không dùng `make`:

```bash
npm run dev --prefix api
```

### Terminal 2: chạy frontend

```bash
make dev-web
```

Nếu không dùng `make`:

```bash
npm run dev --prefix web
```

Sau đó mở:

- `http://localhost:3000`
- hoặc vào thẳng `http://localhost:3000/login`

---

## Cách project frontend hoạt động

Nếu nhìn từ góc độ người mới, có thể hiểu app theo mental model này:

1. Người dùng vào landing page ở `web/app/page.tsx`
2. Từ đó đi đến `login`
3. Sau khi có session phía frontend, app điều hướng theo role:
   - `student`
   - `teacher`
   - `superadmin`
4. Mỗi role có layout riêng và route guard riêng
5. Một số dữ liệu và luồng hiện tại còn mang tính mock/UI-first để team frontend làm giao diện trước

Điểm dễ nhầm nhất là auth:

- Backend có Better Auth thật
- Nhưng frontend hiện tại đang dùng `AuthContext.tsx` với mock user và `localStorage`

Điều này nghĩa là nếu bạn đang sửa UI login hoặc điều hướng theo role, hãy đọc `AuthContext.tsx` trước khi giả định flow đang nối backend thật.

---

## Nên bắt đầu code từ đâu

Tùy task của bạn, đây là entry point nên mở đầu tiên:

### Nếu sửa theme hoặc provider chung

- `web/app/providers.tsx`
- `web/app/layout.tsx`
- `web/app/globals.css`

### Nếu sửa auth hoặc điều hướng

- `web/app/contexts/AuthContext.tsx`
- `web/components/ProtectedRoute.tsx`
- `web/app/login/page.tsx`

### Nếu sửa landing page

- `web/app/page.tsx`

### Nếu sửa portal sinh viên

- `web/app/student/layout.tsx`
- `web/app/student/page.tsx`
- `web/app/student/syllabus/[subjectCode]/page.tsx`

### Nếu sửa portal giảng viên

- `web/app/teacher/layout.tsx`
- `web/app/teacher/page.tsx`
- các route con trong `web/app/teacher/`

### Nếu sửa chatbot UI

- `web/components/chatbot/ChatbotWidget.tsx`

---

## Bộ lệnh bạn sẽ dùng hằng ngày

### Chạy frontend dev

```bash
make dev-web
```

### Chạy backend dev

```bash
make dev-api
```

### Lint frontend

```bash
make lint-web
```

### Build frontend

```bash
make build-web
```

### Kiểm tra health backend

```bash
make health-check
```

### Xem database bằng Prisma Studio

```bash
make prisma-studio
```

---

## Checklist trước khi nói “em xong task rồi”

Ít nhất hãy tự kiểm tra các bước này:

1. Frontend chạy được ở `localhost:3000`
2. Màn hình bạn sửa không vỡ layout
3. `make lint-web` đã được chạy và bạn đã đọc kỹ output
4. `make build-web` pass
5. Nếu task có liên quan API hoặc login, backend đang chạy ở `localhost:8000`

---

## Những điều dễ gây mất thời gian nếu không biết trước

### 1. Auth ở frontend đang là mock

`web/app/contexts/AuthContext.tsx` hiện dùng mock users và `localStorage`. Vì vậy:

- đừng vội debug Better Auth ở backend nếu bạn đang sửa UI login demo
- hãy xác nhận task của bạn là sửa demo flow hay nối auth thật

### 2. Styling hiện tại ưu tiên Mantine

Project có Tailwind, nhưng UI hiện tại chủ yếu dựng bằng Mantine. Khi thêm màn hình mới, nên nhìn pattern từ các file đang có trước khi tạo style mới.

### 3. `running_guide.md` là tài liệu full-stack, không phải frontend quick-start

Tài liệu đó hữu ích, nhưng dài hơn nhu cầu của người mới vào team frontend. Hãy dùng tài liệu này làm điểm bắt đầu, rồi mở `running_guide.md` khi cần chi tiết hơn.

### 4. Mọi env đều nằm ở root

Nếu app không nhận env, khả năng cao là bạn đã tạo file sai vị trí hoặc sửa nhầm file.

### 5. Frontend chưa có test setup riêng rõ ràng

Hiện tại luồng kiểm tra frontend thực tế nên ưu tiên:

- chạy local
- lint
- build
- test tay trên màn hình bị ảnh hưởng

### 6. Lint frontend hiện chưa hoàn toàn sạch

Ở thời điểm viết tài liệu này, `npm run lint --prefix web` vẫn đang báo một số lỗi/warning có sẵn trong codebase hiện tại. Vì vậy:

- đừng vội giả định lỗi lint đều do phần bạn vừa sửa
- hãy đọc output và tách rõ lỗi mới phát sinh với lỗi đã tồn tại từ trước
- với task chỉ sửa docs hoặc phần không liên quan, việc `build` pass thường phản ánh trạng thái thực tế tốt hơn

---

## Tài liệu nên mở tiếp theo

Sau khi đọc xong file này, nên mở thêm:

- [`./running_guide.md`](./running_guide.md): runbook full-stack
- [`../README.md`](../README.md): bản đồ tài liệu `docs/`
- [`../technical/README.md`](../technical/README.md): tài liệu kỹ thuật tổng quan
- [`../api/README.md`](../api/README.md): API và cách backend đang tổ chức

Nếu bạn cần hiểu kỹ kiến trúc hơn trước khi code, hãy đi tiếp vào `docs/technical/architecture/`.

---

## Quick start ngắn nhất

Nếu chỉ cần chạy lên thật nhanh để bắt đầu sửa UI, đây là chuỗi lệnh tối thiểu:

```bash
npm install
docker compose up -d
cp .env.example .env
make migrate
make prisma-generate
make dev-api
make dev-web
```

Sau đó mở `http://localhost:3000` và bắt đầu từ route bạn cần sửa.
