# CODEBASE SUMMARY
## Tổng Quan Mã Nguồn

Tài liệu này tổng hợp thống kê và phân tích cấu trúc mã nguồn của dự án **FPTU Chatbot RAG** (cập nhật tự động dựa trên báo cáo scout).

---

## 1. Thống Kê Tổng Quan

| Metric | Value |
|--------|-------|
| **Total Source Files (TS/TSX)** | ~46 TypeScript/TSX |
| **Backend LOC** (api/) | ~15,400 |
| **Frontend LOC** (web/) | ~6,900 |
| **Documentation LOC** (docs/) | ~9,100 |
| **API Endpoints (Routes)** | ~40+ |
| **Database Models (Prisma)** | 21 models |

---

## 2. Technology Stack

### Backend (api/)
| Library | Version |
|---------|---------|
| Hono.js | 4.12.19 |
| TypeScript | 5.8.3 |
| Prisma | 5.18.0 |
| better-auth | 1.6.11 |
| ioredis | 5.10.1 |
| @google/genai | 2.4.0 |
| winston | 3.19.0 |
| @hono/swagger-ui | 0.6.1 |

### Frontend (web/)
| Library | Version |
|---------|---------|
| Next.js | 16.2.7 |
| React | 19.2.4 |
| Mantine UI | 9.3.0 |
| Tailwind CSS | 4 |
| @tabler/icons-react | 3.44.0 |
| recharts | 3.8.1 |

### Infrastructure
| Service | Technology |
|---------|------------|
| Relational DB | PostgreSQL (Docker) |
| Cache/Session | Redis (ioredis) |
| Vector DB | Qdrant |
| AI Embedding | Gemini 2.0 (gemini-embedding-002, 3072-dim) |
| AI Chat | Gemini 2.0 Flash (streaming SSE) |
| Build Orchestration | Turborepo |

---

## 3. Module Breakdown (api/)

| Module | Files | Mô tả |
|--------|-------|-------|
| **auth** | 5+ | Better Auth integration, whitelist, role-based access |
| **rag** (courses) | 2 | Course CRUD (`/api/courses`), RAG pipeline entrypoint |
| **chat** | 3 | SSE Streaming chat, session scoping, document catalog |
| **curriculum** | 1 | Majors, Specializations, Curriculum CRUD |
| **syllabus** | 1 | Syllabus CRUD, CLOs, Schedules, document upload/delete |
| **documents** | 2 | Document internal update controller + repository |
| **analytics** | - | Planned analytics module |

---

## 4. Cấu Trúc Thư Mục

```
chatbot-rag-fptu/
├── api/                            # Backend Workspace (Hono.js + TypeScript)
│   ├── prisma/
│   │   └── schema.prisma           # 21-model DB schema (FPTU domain)
│   └── src/
│       ├── config/                 # env.ts, openapi.ts
│       ├── constants/              # App-wide constants
│       ├── middlewares/            # logger.middleware.ts
│       ├── modules/
│       │   ├── auth/               # Better Auth, whitelist.controller, auth flows
│       │   ├── chat/               # chat.controller.ts, chat.repository.ts, chat-scope.service.ts
│       │   ├── courses/            # course.repository.ts (via ragRouter)
│       │   ├── curriculum/         # curriculum.controller.ts
│       │   ├── documents/          # document.internal.controller.ts, document.repository.ts
│       │   ├── rag/                # rag.controller.ts (RAG pipeline + vector search)
│       │   ├── syllabus/           # syllabus.controller.ts (full syllabus CRUD)
│       │   └── analytics/          # (planned)
│       ├── scripts/                # seed scripts, migration helpers
│       ├── types/                  # shared TypeScript types/interfaces
│       └── utils/                  # db-health.ts, logger.ts
├── web/                            # Frontend Workspace (Next.js 16 + Mantine)
│   ├── app/
│   │   ├── contexts/               # AuthContext.tsx
│   │   ├── login/                  # Login page
│   │   ├── student/                # Student dashboard + syllabus viewer
│   │   ├── teacher/                # Teacher docs, curriculum, syllabus, users
│   │   ├── superadmin/             # Superadmin users + whitelist pages
│   │   ├── layout.tsx, page.tsx
│   │   └── providers.tsx           # Mantine/TanStack provider wrappers
│   └── components/
│       ├── chatbot/                # ChatbotWidget.tsx (SSE streaming chat)
│       └── ProtectedRoute.tsx
├── docs/                           # Technical documentation
├── plans/                          # Implementation plans (archived)
├── docker-compose.yml              # PostgreSQL + Redis + Qdrant containers
├── Makefile                        # Monorepo task runner shortcuts
├── turbo.json                      # Turborepo pipeline config
└── package.json                    # Root workspace config
```

---

## 5. API Routes (Mounted in api/src/index.ts)

| Mount Path | Module | Mô tả |
|-----------|--------|-------|
| `GET/POST /api/auth/*` | Better Auth | Auth handler (sign-in, register, session, org) |
| `GET/POST/PATCH/DELETE /api/courses` | ragRouter | Course CRUD + RAG pipeline |
| `GET/POST/PATCH/DELETE /api/chat/*` | chatRouter | Chat sessions, SSE stream, document catalog |
| `GET/POST/PUT/DELETE /api/curriculum/*` | curriculumRouter | Majors, Specializations, Curriculums |
| `GET/POST/PUT/PATCH/DELETE /api/syllabus/*` | syllabusRouter | Full Syllabus + Documents management |
| `PATCH /api/internal/documents/:id` | internalRouter | Internal document status update |
| `GET/POST /api/whitelist` | whitelistRouter | Email whitelist admin management |
| `GET/POST/PATCH /api/auth-admin/*` | lecturerRequestRouter | Lecturer registration request management |
| `GET /api/health` | inline | Health check (DB + memory) |
| `GET /api/doc` | inline | OpenAPI JSON document |
| `GET /api/docs` | Swagger UI | Swagger interactive docs |

---

## 6. Key Integrations

### Gemini API (`@google/genai`)
- **Embedding:** `gemini-embedding-002` — 3072-dimension vectors
- **Chat:** Streaming response via Gemini 2.0 Flash
- **Multimodal:** Video/Image embedding support

### Qdrant Vector DB
- **Collection:** syllabus documents (chunks + metadata)
- **Filtering:** by `syllabus_id` / `course_id`
- **Payload:** `text`, `page`, `document_id`, `timestamp`

### Better Auth
- **Plugins:** Admin plugin (role management, user banning)
- **Adapter:** Prisma
- **Session:** Database sessions + Redis cache

### Turborepo
- Manages parallel build/dev tasks across `api/` and `web/` workspaces

---

## 7. Quy Ước Code

| Convention | Rule |
|-----------|------|
| **Types / Interfaces** | PascalCase (`UserDto`, `SyllabusDto`) |
| **Variables & Functions** | camelCase (`userId`, `getChatSession`) |
| **Constants** | UPPER_SNAKE_CASE (`MAX_FILE_SIZE`) |
| **Files** | kebab-case (`chat.controller.ts`) |
| **Strict Types** | `unknown` + type guard; tuyệt đối không dùng `any` |
| **Database Map** | `@@map("snake_case")` trên mọi model |

---

## 8. Development Commands

```bash
# Database
make db-up            # Khởi chạy Docker containers (PostgreSQL + Redis + Qdrant)
make db-down          # Dừng containers
make migrate          # Push Prisma schema → DB (prisma db push)
make prisma-generate  # Generate Prisma Client
make prisma-studio    # Mở Prisma Studio GUI

# Backend
make dev-api          # Chạy Hono.js dev server (cổng 8000)
make build-api        # Build production bundle

# Frontend
make dev-web          # Chạy Next.js dev server (cổng 3000)
make build-web        # Build production bundle

# All
make dev-all          # Chạy cả API + Web song song
make health-check     # Kiểm tra /api/health endpoint
```

---

> **Last Updated:** 2026-06-05
> **Source:** Scout Report — cập nhật từ codebase thực tế
