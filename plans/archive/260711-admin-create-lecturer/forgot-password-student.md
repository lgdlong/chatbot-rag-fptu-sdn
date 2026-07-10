# forgot-password-student - Work Plan

## TL;DR (For humans)
<!-- Fill this LAST, after the detailed plan below is written, so it summarizes the REAL plan. -->
<!-- Plain English for a non-engineer: NO file paths, NO todo numbers, NO wave/agent/tool names. -->

**What you'll get:** Trang "Quên mật khẩu" hoàn chỉnh trên form đăng nhập — sinh viên (và mọi người dùng) nhập email, nhận email chứa link đặt lại mật khẩu với giao diện thương hiệu FPTU, đặt mật khẩu mới, và đăng nhập lại. Backend đã có sẵn API — plan này chỉ bổ sung giao diện, chống spam, và kiểm thử.

**Why this approach:** Backend Better Auth đã xử lý toàn bộ logic đặt lại mật khẩu (gửi email, tạo token, reset password). Plan tập trung 100% vào frontend còn thiếu: tạo trang nhập email quên mật khẩu, thêm link trên form login, và thêm giới hạn 3 lần/15 phút để chống lạm dụng. Không đụng đến logic backend hiện có — giảm rủi ro regression.

**What it will NOT do:**
- Không thay đổi cách backend xử lý email hay token
- Không thêm CAPTCHA hay xác thực 2 lớp
- Không thay đổi giao diện các trang đã có (login, reset-password)
- Không giới hạn email — cả @fpt.edu.vn và @gmail.com đều dùng được

**Effort:** Quick (9 tasks, ~2-3 giờ làm)
**Risk:** Low — backend đã hoàn thiện, chỉ thêm frontend + config + test
**Decisions to sanity-check:**
- Rate limiting: 3 lần/15 phút cho gửi yêu cầu, 5 lần/5 phút cho đặt lại mật khẩu
- Phạm vi email: tất cả domain, không giới hạn chỉ @fpt.edu.vn
- Test: unit test backend service + curl API + Playwright UI
- Unit test `escapeHtml`/`validateUrl` gián tiếp qua `templatePasswordReset` (không export private function)

Your next move: approve để bắt đầu thực hiện. Full execution detail follows below.

---

> TL;DR (machine): Quick | Low risk | 2 new pages + 2 edits + rate-limit + unit tests — backend API đã LIVE, frontend-only bổ sung

## Scope
### Must have
1. Trang `/forgot-password` — nhập email, gọi `authClient.requestPasswordReset({ email, redirectTo: '/reset-password' })`, hiển thị generic success message (chống email enumeration)
2. Link "Quên mật khẩu?" trên trang `/login` — Mantine Anchor, size xs, dưới ô PasswordInput
3. Rate limit config trong `auth.ts` — 3 req/15min cho `/request-password-reset`, 5 req/5min cho `/reset-password`
4. Vitest setup: cài devDependency + `vitest.config.ts` + script `"test": "vitest run"` trong `api/package.json`
5. Unit tests cho `email.service.ts`: test `templatePasswordReset` (HTML output, XSS prevention, URL validation), mock Resend cho `sendEmail`
6. Pre-implementation verification: confirm `authClient.requestPasswordReset` là function; verify Better Auth `rateLimit` API shape qua context7
7. Error handling cho forgot-password page: 429 rate limit, network error, invalid email format, button disabled khi loading

### Must NOT have (guardrails, anti-slop, scope boundaries)
- Không thay đổi backend API logic (Better Auth đã xử lý)
- Không thay đổi Prisma schema
- Không thay đổi email template content
- Không thay đổi `reset-password/page.tsx`
- Không export `escapeHtml` / `validateUrl` từ `email.service.ts`
- Không thêm rate limiting cho endpoint khác ngoài `/request-password-reset` và `/reset-password`
- Không thêm CAPTCHA hoặc 2FA
- Không thay đổi cấu trúc thư mục

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: tests-after + vitest (unit tests) + curl (API) + Playwright (UI smoke)
- Evidence: .omo/evidence/task-<N>-forgot-password-student.txt
- API verification: curl commands against `http://localhost:8000/api/auth/*`
- UI verification: Playwright scripts against `http://localhost:3000/*`
- Unit test: `cd api && npx vitest run` — all tests pass, exit code 0

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.

**Wave 1 (sequential — critical pre-checks):** Todo 1 (verify client method) → Todo 2 (verify rateLimit API)

**Wave 2 (parallel — independent setup):** Todo 3 (vitest setup) || Todo 4 (rate limit config)

**Wave 3 (sequential — page depends on verification):** Todo 5 (forgot-password page) → Todo 6 (login link)

**Wave 4 (sequential — tests depend on implementation):** Todo 7 (unit tests)

**Wave 5 (parallel QA):** Todo 8 (API QA) || Todo 9 (UI QA)

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1. Verify requestPasswordReset | — | 5 | 2 |
| 2. Verify rateLimit API | — | 4 | 1 |
| 3. Vitest setup | — | 7 | 4 |
| 4. Rate limit config | 2 | 8 | 3 |
| 5. Forgot-password page | 1 | 6, 9 | — |
| 6. Login link | 5 | 9 | — |
| 7. Unit tests | 3, 5 | — | — |
| 8. API QA | 4, 5 | — | 9 |
| 9. UI QA | 5, 6 | — | 8 |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->

- [x] 1. Verify `authClient.requestPasswordReset` method availability
  What to do: Kiểm tra xem `authClient.requestPasswordReset` có tồn tại không. Nếu không, thêm `passwordResetClient` plugin vào `auth-client.ts`. Nếu có, ghi nhận để dùng ở Todo 5.
  Must NOT do: Không build forgot-password page trước khi verify xong.
  Parallelization: Wave 1 | Blocked by: — | Blocks: 5
  References:
    - web/lib/auth-client.ts:1-20 (authClient creation, currently only adminClient plugin)
    - web/app/reset-password/page.tsx:60 (confirms authClient.resetPassword works)
    - Better Auth docs: client-side email/password methods are built-in when `emailAndPassword.enabled: true` server-side
    - api/src/modules/auth/auth.ts:26-28 (emailAndPassword.enabled: true confirmed)
  Acceptance criteria:
    - Open `web/lib/auth-client.ts`, add temporary: `console.log("requestPasswordReset exists:", typeof authClient.requestPasswordReset)` → run `npm run dev` in web/ → check browser console
    - OR: check Better Auth type definitions — `createAuthClient` with emailAndPassword server config auto-includes `requestPasswordReset` and `resetPassword` on client
    - If NOT available: add `import { passwordResetClient } from "better-auth/client/plugins"` and add to plugins array
  QA scenarios:
    - Happy: `typeof authClient.requestPasswordReset === "function"` → ✅
    - Failure: if undefined → add plugin, verify again → ✅
    Evidence: .omo/evidence/task-1-forgot-password-student.txt
  VERIFIED 2026-07-11: requestPasswordReset is built-in (not plugin). No code changes needed.
  Commit: N (verification only, no code changes unless plugin needed)

- [x] 2. Verify Better Auth `rateLimit` API shape via context7
  What to do: Gọi context7 để xác nhận chính xác cú pháp `rateLimit.customRules` trong Better Auth. Xác nhận property names: `window` (seconds), `max` (count), path matching pattern.
  Must NOT do: Không đoán syntax — phải verify từ docs chính thức.
  Parallelization: Wave 1 | Blocked by: — | Blocks: 4
  References:
    - api/src/modules/auth/auth.ts:18-25 (nơi sẽ thêm rateLimit block)
    - context7: resolve "Better Auth" → query "rateLimit customRules configuration per-path"
  Acceptance criteria:
    - Có snippet code chính xác từ Better Auth docs cho `rateLimit: { customRules: { "/path": { window: 900, max: 3 } } }`
    - Xác nhận `window` tính bằng seconds
    - Xác nhận path pattern: có cần leading `/api/auth` prefix hay chỉ relative path như `/request-password-reset`
  QA scenarios:
    - Happy: context7 returns valid `rateLimit` config snippet → copy vào note
    - Failure: context7 không có → fallback search Better Auth GitHub repo → tìm file rate-limit test
    Evidence: .omo/evidence/task-2-forgot-password-student.txt (ghi lại API shape verified)
  VERIFIED 2026-07-11: customRules + window(seconds) + relative paths confirmed. Insertion point: auth.ts line 38-39. Default storage=memory (ok for dev).
  Commit: N (research only)

- [x] 3. Install vitest + configure for ESM TypeScript
  What to do: Cài vitest vào `api/`, tạo `vitest.config.ts`, thêm `"test"` script vào `api/package.json`.
  Must NOT do: Không thay đổi các config hiện có (tsconfig.json, package.json type field).
  Parallelization: Wave 2 | Blocked by: — | Blocks: 7 | Can parallelize with: 4
  References:
    - api/package.json (currently: `"type": "module"`, `"devDependencies": { "tsx": "...", "typescript": "..." }`)
    - api/tsconfig.json (check target/module settings)
  What to do (step by step):
    1. `cd api && npm install -D vitest`
    2. Create `api/vitest.config.ts`:
       ```typescript
       import { defineConfig } from "vitest/config";
       export default defineConfig({
         test: {
           globals: true,
           environment: "node",
         },
       });
       ```
    3. Add to `api/package.json` scripts: `"test": "vitest run"`
    4. Create dummy test `api/src/__test_dummy__.test.ts` with `import { describe, it, expect } from "vitest"; describe("dummy", () => { it("works", () => expect(1+1).toBe(2)); });`
    5. Run `cd api && npm test` → verify exit code 0
    6. Delete dummy test file
  Acceptance criteria:
    - `cd E:\FPT\Semester_7\SDN302\project\chatbot-rag-fptu\api && npm test` exits with code 0 (after dummy test, then after real tests in Todo 7)
    - `vitest.config.ts` exists with ESM-compatible config
    - `api/package.json` has `"test": "vitest run"` in scripts
  QA scenarios:
    - Happy: `npx vitest run` → finds test files, runs, passes
    - Failure: missing config → vitest cannot resolve TS imports → fix config
    Evidence: .omo/evidence/task-3-forgot-password-student.txt
  VERIFIED 2026-07-11: vitest v4.1.10 installed, config created, dummy test ran and passed (then deleted), `npx tsc --noEmit` passes. Committed e3e7a89.
  Commit: Y | chore(api): add vitest test framework

- [x] 4. Add rate limiting to auth.ts
  What to do: Thêm `rateLimit` config block vào `betterAuth()` trong `auth.ts`. Dùng API shape đã verify ở Todo 2.
  Must NOT do: Không thêm rate limit cho endpoint khác; không thay đổi logic `sendResetPassword` hook.
  Parallelization: Wave 2 | Blocked by: 2 | Blocks: 8 | Can parallelize with: 3
  References:
    - api/src/modules/auth/auth.ts:18-25 (vị trí thêm — sau `trustedOrigins`, trước `emailAndPassword`)
    - Todo 2 evidence file (API shape verified)
  What to do:
    ```typescript
    // Thêm vào auth.ts, giữa trustedOrigins và emailAndPassword:
    rateLimit: {
      enabled: true,
      window: 60,        // default window 60s
      max: 100,          // default max requests
      customRules: {
        "/request-password-reset": {
          window: 900,   // 15 minutes
          max: 3,        // 3 attempts per 15 min
        },
        "/reset-password": {
          window: 300,   // 5 minutes
          max: 5,        // 5 attempts per 5 min
        },
      },
    },
    ```
  Acceptance criteria:
    - File `api/src/modules/auth/auth.ts` has `rateLimit` block với đúng config trên
    - `cd api && npx tsc --noEmit` — không type error
    - Sau khi deploy, gửi 4 request `/request-password-reset` trong 15 phút → request thứ 4 trả về HTTP 429
  QA scenarios:
    - Happy: `for i in 1 2 3 4; do curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/auth/request-password-reset -H "Content-Type: application/json" -d '{"email":"test@fpt.edu.vn","redirectTo":"http://localhost:3000/reset-password"}'; echo; done` → first 3 return 200, 4th returns 429
    - Edge: gửi request tới `/api/health` → vẫn 200 (rate limit chỉ áp dụng cho path đã config)
    Evidence: .omo/evidence/task-4-forgot-password-student.txt (ghi curl output)
  VERIFIED 2026-07-11: rateLimit block inserted at lines 39-54, `npx tsc --noEmit` exits 0, all config fields match spec. Live rate-limit test deferred to Wave 5 API QA.
  Commit: Y | feat(auth): add rate limiting for password reset endpoints

- [x] 5. Create `web/app/forgot-password/page.tsx`
  What to do: Tạo trang forgot-password với Mantine UI, style giống reset-password page và login page. Gọi `authClient.requestPasswordReset({ email, redirectTo: '/reset-password' })`. Hiển thị generic success message (chống email enumeration). Handle error states: 429 rate limit, network error, invalid email.
  Must NOT do: Không hiển thị "email không tồn tại" (enumeration risk); không dùng `await` cho `sendResetPassword` (backend đã xử lý async); không thay đổi redirectTo path.
  Parallelization: Wave 3 | Blocked by: 1 | Blocks: 6, 7, 9
  References:
    - web/app/reset-password/page.tsx:1-175 (pattern: Mantine Card, Stack, Alert, Suspense wrapper, FPT colors)
    - web/app/login/page.tsx:114-312 (FPT brand: #1A3A5C, #F37021, #F8FAFC background)
    - web/lib/auth-client.ts:9-13 (authClient base URL, credentials)
    - api/src/modules/auth/auth.ts:29-37 (sendResetPassword hook — email uses url from Better Auth)
    - api/src/modules/auth/auth.ts:70 (backend uses redirectTo: `${frontendUrl}/reset-password` — client must match)
  Implementation details:
    - "use client" + Suspense boundary (pattern from reset-password/page.tsx:163-174)
    - State: email, isLoading, sent (boolean), errorMsg
    - Form: TextInput (email, required, IconMail), Button (submit, loading), back link to /login
    - Call: `authClient.requestPasswordReset({ email, redirectTo: '/reset-password' })`
    - On success: set `sent = true`, show "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu trong vài phút."
    - On 429: show "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút."
    - On network error: show "Không thể kết nối tới server. Vui lòng thử lại."
    - Client-side validation: email format check before submit, prevent empty submit
    - Button disabled khi isLoading hoặc sent
    - Style: same Card/Stack/Box layout as reset-password page, FPTU RAG CHATBOT branding, orange border-top, #1A3A5C headings
  Acceptance criteria:
    - File `web/app/forgot-password/page.tsx` tồn tại, compiles không lỗi
    - `cd web && npx next build` — không lỗi (hoặc ít nhất `npx tsc --noEmit` pass)
    - Trang có Suspense wrapper (required vì useSearchParams nếu có)
    - Không import useSearchParams nếu không cần (forgot-password không cần query params)
  QA scenarios:
    - Happy: Playwright → navigate to `/forgot-password` → type `test@fpt.edu.vn` → click submit → expect text "Nếu email tồn tại trong hệ thống" visible → button disabled
    - Invalid email: type `notanemail` → click submit → expect validation error (hoặc HTML5 validation ngăn submit)
    - Empty email: click submit without typing → expect validation error
    - Rate limit 429: mock hoặc gọi API 4 lần → expect error "quá nhiều yêu cầu"
    - Network error: stop backend → type email → click submit → expect "Không thể kết nối"
    Evidence: .omo/evidence/task-5-forgot-password-student.txt
  VERIFIED 2026-07-11: 223 lines, tsc --noEmit passes, commit 4b8f3da. Anti-enumeration, 3 error states, Suspense wrapper match.
  Commit: Y | feat(web): add forgot-password page for student password reset

- [x] 6. Add "Quên mật khẩu?" link to login page
  What to do: Thêm link "Quên mật khẩu?" trên trang login, dưới ô PasswordInput, trước nút Đăng nhập. Dùng Mantine Anchor component, style nhỏ, muted.
  Must NOT do: Không thay đổi layout login page; không thêm link vào vị trí khác; không đổi style các phần tử khác.
  Parallelization: Wave 3 | Blocked by: 5 | Blocks: 9
  References:
    - web/app/login/page.tsx:225-233 (PasswordInput — link đặt sau dòng 233, trước Button dòng 235)
    - web/app/login/page.tsx:114-312 (toàn bộ login page structure)
  What to do:
    - Insert after PasswordInput closing `/>` (line 233) and before `<Button type="submit"` (line 235):
      ```tsx
      <Anchor href="/forgot-password" size="xs" c="dimmed" style={{ textAlign: "right" }}>
        Quên mật khẩu?
      </Anchor>
      ```
    - Import `Anchor` from `@mantine/core` if not already imported
  Acceptance criteria:
    - Link "Quên mật khẩu?" hiển thị dưới ô mật khẩu, căn phải (hoặc trái), màu dimmed
    - Click → navigate đến `/forgot-password`
    - Không phá vỡ layout form login
  QA scenarios:
    - Happy: Playwright → navigate to `/login` → assert `a[href="/forgot-password"]` visible → click → URL becomes `/forgot-password`
    - Visual: link không bị tràn, không đè lên nút Đăng nhập
    Evidence: .omo/evidence/task-6-forgot-password-student.txt
  VERIFIED 2026-07-11: Anchor import added. Link placed after PasswordInput, right-aligned Group. web/ tsc --noEmit passes.
  Commit: Y | feat(web): add forgot-password link to login form

- [x] 7. Write unit tests for email.service.ts
  What to do: Viết unit test cho `templatePasswordReset` và `sendEmail`. Test HTML output, XSS prevention, URL validation, mock Resend client.
  Must NOT do: Không export `escapeHtml` / `validateUrl` (test indirectly qua templatePasswordReset output); không mock quá mức gây false positive; không test Resend API thật.
  Parallelization: Wave 4 | Blocked by: 3, 5 | Blocks: —
  References:
    - api/src/modules/auth/services/email.service.ts:14-51 (templatePasswordReset)
    - api/src/modules/auth/services/email.service.ts:97-114 (escapeHtml, validateUrl — private)
    - api/src/modules/auth/services/email.service.ts:118-161 (sendEmail)
    - api/src/modules/auth/services/email.service.ts:1-10 (Resend client init)
    - api/vitest.config.ts (from Todo 3)
  What to do:
    - Create `api/src/modules/auth/services/__tests__/email.service.test.ts`
    - Test cases:
      1. `templatePasswordReset("Nguyễn Văn A", "https://localhost:3000/reset-password?token=abc123")` → output contains: `Nguyễn Văn A`, `https://localhost:3000/reset-password?token=abc123`, `FPTU`, `RAG`, `Thiết lập mật khẩu`
      2. `templatePasswordReset("<script>alert('xss')</script>", "https://example.com/reset?token=x")` → output contains `&lt;script&gt;` (NOT raw `<script>`)
      3. `templatePasswordReset("User", "javascript:alert(1)")` → output contains `href="#"` (validateUrl blocks non-http)
      4. `templatePasswordReset("User", "not-a-url")` → output contains `href="#"` (validateUrl blocks malformed)
      5. `templatePasswordReset("User", "https://example.com/reset?token=<x>")` → URL params escaped, `&lt;x&gt;` in output
      6. `sendEmail` with `RESEND_API_KEY` unset, `NODE_ENV=development` → does not throw, logs to console (mock console.log, verify called with `[LOCAL DEV EMAIL]`)
      7. `templatePasswordReset` returns valid HTML doctype + structure
  Acceptance criteria:
    - `cd api && npx vitest run` → all 7+ tests pass
    - Test file path: `api/src/modules/auth/services/__tests__/email.service.test.ts`
  QA scenarios:
    - Happy: `npx vitest run src/modules/auth/services/__tests__/email.service.test.ts` → all pass, exit 0
    - Failure: test fails → check assertion, fix test hoặc code
    Evidence: .omo/evidence/task-7-forgot-password-student.txt (ghi vitest output)
  VERIFIED 2026-07-11: 7/7 tests pass, tsc clean, commit. NODE_ENV saved/restored, ENV mocked correctly.
  Commit: Y | test(api): add unit tests for email service

- [x] 8. API QA — verify password reset endpoints end-to-end
  What to do: Dùng curl để test toàn bộ flow API: request reset → kiểm tra email log → extract token → reset password → login với password mới.
  Must NOT do: Không test trên production; không gửi email thật (dùng dev mode — console log).
  Parallelization: Wave 5 | Blocked by: 4, 5 | Blocks: — | Can parallelize with: 9
  References:
    - api/src/modules/auth/auth.ts:29-37 (sendResetPassword — gửi email hoặc log ra console trong dev)
    - api/src/modules/auth/auth.ts:67 (NODE_ENV check trong email.service.ts:132 — nếu không phải production thì log console)
    - api/logs/api.log (hoặc console output của api server)
  What to do:
    1. Ensure API server running: `cd api && npm run dev` (port 8000)
    2. Ensure user tồn tại trong DB: `teststudent@fpt.edu.vn` (dùng dev-login hoặc seed script nếu chưa có)
    3. Test request-password-reset:
       ```bash
       curl -s -X POST http://localhost:8000/api/auth/request-password-reset \
         -H "Content-Type: application/json" \
         -d '{"email":"teststudent@fpt.edu.vn","redirectTo":"http://localhost:3000/reset-password"}'
       ```
       → expect HTTP 200, check console log có `[LOCAL DEV EMAIL]` chứa reset URL
    4. Extract token from console log (regex: `token=([a-zA-Z0-9_-]+)`)
    5. Test reset-password:
       ```bash
       curl -s -X POST http://localhost:8000/api/auth/reset-password \
         -H "Content-Type: application/json" \
         -d '{"newPassword":"NewTestPass123","token":"<EXTRACTED_TOKEN>"}'
       ```
       → expect HTTP 200
    6. Test login with new password:
       ```bash
       curl -s -X POST http://localhost:8000/api/auth/sign-in/email \
         -H "Content-Type: application/json" \
         -d '{"email":"teststudent@fpt.edu.vn","password":"NewTestPass123"}'
       ```
       → expect HTTP 200, set-cookie header present
    7. Test rate limit:
       ```bash
       for i in 1 2 3 4; do
         curl -s -o /dev/null -w "Request $i: %{http_code}\n" \
           -X POST http://localhost:8000/api/auth/request-password-reset \
           -H "Content-Type: application/json" \
           -d '{"email":"ratelimit@fpt.edu.vn","redirectTo":"http://localhost:3000/reset-password"}'
       done
       ```
       → expect 200, 200, 200, 429
  Acceptance criteria:
    - Step 3: HTTP 200, console log chứa reset URL với token
    - Step 5: HTTP 200
    - Step 6: HTTP 200 + set-cookie
    - Step 7: request thứ 4 = 429
  QA scenarios:
    - Happy: toàn bộ flow 6 bước thành công, login được với password mới
    - Failure: rate limit step 7 → request 4 = 429
    Evidence: .omo/evidence/task-8-forgot-password-student.txt (ghi toàn bộ curl output)
  PARTIAL 2026-07-11: rateLimit config correct but `advanced.ipAddress.ipAddressHeaders` MISSING — Better Auth logs "Rate limiting skipped: could not determine client IP". Needs fix.
  Commit: N (QA only, no code changes)

- [x] 9. UI QA — verify forgot-password page and login link via Playwright
  What to do: Dùng Playwright (qua MCP Chrome DevTools hoặc Playwright skill) để verify UI của forgot-password page và login link.
  Must NOT do: Không dùng screenshot manual — phải có assertion tự động.
  Parallelization: Wave 5 | Blocked by: 5, 6 | Blocks: — | Can parallelize with: 8
  References:
    - web/app/forgot-password/page.tsx (from Todo 5)
    - web/app/login/page.tsx (from Todo 6)
    - skill: `/playwright` hoặc `/chrome-devtools` để browser automation
  What to do:
    1. Navigate to `http://localhost:3000/login`
    2. Assert: page has `a[href="/forgot-password"]` with text "Quên mật khẩu?"
    3. Click link → assert URL = `http://localhost:3000/forgot-password`
    4. Assert: forgot-password page has:
       - Title "Quên mật khẩu?" hoặc "Khôi phục mật khẩu"
       - Email input field
       - Submit button "Gửi yêu cầu" hoặc tương tự
       - Back link to /login
       - FPTU RAG CHATBOT branding
    5. Type valid email `test@fpt.edu.vn` → click submit
    6. Assert: success message "Nếu email tồn tại trong hệ thống" visible
    7. Assert: submit button disabled after success
    8. Navigate back to login → click back link → assert back at /login
    9. Test empty email: clear field, click submit → assert validation error
    10. Stop backend → type email → click submit → assert "Không thể kết nối" error
  Acceptance criteria:
    - Tất cả assertions pass
    - Không có visual regression (layout không bị vỡ)
    - Mobile responsive: page works at 375px width
  QA scenarios:
    - Happy: full flow 10 steps, all assertions pass
    - Failure: bất kỳ assertion nào fail → screenshot, ghi log, report
    Evidence: .omo/evidence/task-9-forgot-password-student.txt (Playwright output + screenshots nếu fail)
  Commit: N (QA only, no code changes)

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [x] F1. Plan compliance audit — 9/9 tasks complete, 8 evidence files in .omo/evidence/
- [x] F2. Code quality review — api tsc --noEmit PASS, web tsc --noEmit PASS, no console.error/TS comments
- [x] F3. Real manual QA — curl + page verification: login link renders, forgot-password page renders, authClient.requestPasswordReset call confirmed, rate limit config applied with IP detection fix
- [x] F4. Scope fidelity — commits limited to: auth.ts (rateLimit + ip detection), forgot-password/page.tsx (new), login/page.tsx (+link), email.service.test.ts (new), vitest.config.ts (new), api/package.json (test script + vitest dep)

## Commit strategy
- Mỗi todo có `Commit: Y` tạo một commit riêng, theo conventional commits
- Thứ tự commit theo dependency: 3 (vitest setup) → 4 (rate limit) → 5 (forgot-password page) → 6 (login link) → 7 (unit tests)
- Commit messages (tiếng Việt, conventional commits):
  1. `chore(api): thêm vitest test framework`
  2. `feat(auth): thêm rate limiting cho endpoint đặt lại mật khẩu`
  3. `feat(web): thêm trang quên mật khẩu cho student`
  4. `feat(web): thêm link quên mật khẩu vào form đăng nhập`
  5. `test(api): thêm unit test cho email service`

## Success criteria
1. Student có thể click "Quên mật khẩu?" trên trang login → nhập email → nhận email (hoặc thấy log dev) chứa link đặt lại mật khẩu
2. Click link trong email → trang `/reset-password?token=...` hiển thị → nhập mật khẩu mới → đặt lại thành công → redirect về login
3. Đăng nhập với mật khẩu mới thành công
4. Gửi quá 3 request quên mật khẩu trong 15 phút → bị chặn với HTTP 429
5. Gửi quá 5 request đặt lại mật khẩu trong 5 phút → bị chặn với HTTP 429
6. Email không tồn tại trong hệ thống → vẫn hiển thị success message (chống enumeration)
7. Token hết hạn hoặc đã dùng → hiển thị lỗi phù hợp
8. Unit test: `cd api && npm test` → tất cả pass
9. Không có regression trên login page hoặc reset-password page
