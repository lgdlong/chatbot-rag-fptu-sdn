#!/usr/bin/env bash
# ============================================================================
# Track B -- Auth (LecturerAdmin) module smoke test (layer-refactor plan, todo 22)
# ============================================================================
# Manual run: bring up the API first, then execute this script.
#
#   cd api && npm run dev          # in one terminal
#   bash api/src/scripts/test-lecturer-admin.sh   # in another
#
# Prereqs:
#   - Server reachable at $BASE_URL (default http://localhost:8000)
#   - $ADMIN_EMAIL + $ADMIN_PASSWORD env vars set to a real ADMIN account
#     (so the script can sign in itself). If absent, set $ADMIN_COOKIE
#     manually instead.
#   - bash, curl, jq installed.
#
# Status expectations (matches the pre-refactor controller exactly):
#   200 OK   -- successful create / disable / enable
#   400      -- missing/empty required field, invalid email, or "not a lecturer"
#   401      -- no session cookie
#   403      -- non-admin role
#   404      -- target user not found
#   409      -- email already in system
#   500      -- unexpected (asserts should still pass for valid inputs)
#
# If the server is not running, treat this file as a TEST PLAN: the comments
# document every endpoint, every payload, and the expected HTTP status.
# ============================================================================

set -u

BASE_URL="${BASE_URL:-http://localhost:8000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
COOKIE="${ADMIN_COOKIE:-}"
TS="$(date +%s)"
LECTURER_EMAIL="e2e_lecturer_${TS}@fpt.edu.vn"
LECTURER_NAME="E2E Lecturer ${TS}"

pass=0
fail=0
skipped=0

red()   { printf "\033[31m%s\033[0m\n" "$1"; }
green() { printf "\033[32m%s\033[0m\n" "$1"; }
yel()   { printf "\033[33m%s\033[0m\n" "$1"; }
bold()  { printf "\033[1m%s\033[0m\n" "$1"; }

assert_status() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    green "  PASS  $label  (HTTP $actual)"
    pass=$((pass+1))
  else
    red   "  FAIL  $label  expected $expected got $actual"
    fail=$((fail+1))
  fi
}

# Run a request, echo only the HTTP status code.
hit() {
  local method="$1" path="$2" body="${3:-}" extra="${4:-}"
  if [[ -n "$body" ]]; then
    curl -s -o /dev/null -w "%{http_code}" \
      -X "$method" "$BASE_URL$path" \
      -H "Content-Type: application/json" \
      ${COOKIE:+-H "Cookie: $COOKIE"} \
      $extra \
      --data-raw "$body"
  else
    curl -s -o /dev/null -w "%{http_code}" \
      -X "$method" "$BASE_URL$path" \
      ${COOKIE:+-H "Cookie: $COOKIE"} \
      $extra
  fi
}

# Full response body (stdout).
body() {
  local method="$1" path="$2" body="${3:-}" extra="${4:-}"
  if [[ -n "$body" ]]; then
    curl -s -X "$method" "$BASE_URL$path" \
      -H "Content-Type: application/json" \
      ${COOKIE:+-H "Cookie: $COOKIE"} \
      $extra \
      --data-raw "$body"
  else
    curl -s -X "$method" "$BASE_URL$path" \
      ${COOKIE:+-H "Cookie: $COOKIE"} \
      $extra
  fi
}

# ---------------------------------------------------------------------------
# 0. Sign in as admin (only if credentials supplied AND no manual cookie).
# ---------------------------------------------------------------------------
if [[ -z "$COOKIE" && -n "$ADMIN_EMAIL" && -n "$ADMIN_PASSWORD" ]]; then
  bold "[0/4] SIGN IN as $ADMIN_EMAIL"
  signin_resp=$(curl -s -i -X POST "$BASE_URL/api/auth/sign-in/email" \
    -H "Content-Type: application/json" \
    --data-raw "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
  COOKIE=$(echo "$signin_resp" | grep -i '^set-cookie:' | head -n1 | sed 's/^[Ss]et-[Cc]ookie: //; s/;.*$//')
  if [[ -z "$COOKIE" ]]; then
    yel "  Sign-in failed -- no session cookie returned. Subsequent admin tests will be 401."
    skipped=$((skipped+1))
  else
    green "  PASS  signed in, cookie captured"
    pass=$((pass+1))
  fi
elif [[ -z "$COOKIE" ]]; then
  yel "ADMIN_COOKIE / ADMIN_EMAIL+ADMIN_PASSWORD not set -- admin tests will be 401/403."
  yel "Set ADMIN_COOKIE or both ADMIN_EMAIL and ADMIN_PASSWORD before running."
  skipped=$((skipped+1))
fi

bold ""
bold "=== Track B: LecturerAdmin module smoke test ==="
bold "Base URL        : $BASE_URL"
bold "Lecturer email  : $LECTURER_EMAIL"
bold "Lecturer name   : $LECTURER_NAME"
bold ""

# ---------------------------------------------------------------------------
# 1. CREATE lecturer
# ---------------------------------------------------------------------------
bold "[1/4] CREATE-LECTURER"

# 1.1 Happy path -- 200 with credentials + resetLink
create_body="{\"name\":\"$LECTURER_NAME\",\"email\":\"$LECTURER_EMAIL\"}"
code=$(hit POST /api/admin/create-lecturer "$create_body")
assert_status "POST /admin/create-lecturer (happy path) -> 200" 200 "$code"

# 1.2 Extract new userId from the response for disable/enable tests
new_user_json=$(body POST /api/admin/create-lecturer \
  "{\"name\":\"${LECTURER_NAME}_2\",\"email\":\"e2e_lecturer_${TS}_2@fpt.edu.vn\"}")
new_user_id=$(echo "$new_user_json" | jq -r '.credentials // .userId // .id // empty' 2>/dev/null)

# 1.3 Missing name -> 400
code=$(hit POST /api/admin/create-lecturer \
  "{\"name\":\"\",\"email\":\"e2e_lecturer_missing_${TS}@fpt.edu.vn\"}")
assert_status "POST /admin/create-lecturer (empty name) -> 400" 400 "$code"

# 1.4 Missing email -> 400
code=$(hit POST /api/admin/create-lecturer \
  "{\"name\":\"No Email\",\"email\":\"\"}")
assert_status "POST /admin/create-lecturer (empty email) -> 400" 400 "$code"

# 1.5 Invalid email format -> 400
code=$(hit POST /api/admin/create-lecturer \
  "{\"name\":\"Bad Email\",\"email\":\"not-an-email\"}")
assert_status "POST /admin/create-lecturer (bad email) -> 400" 400 "$code"

# 1.6 Duplicate email -> 409
code=$(hit POST /api/admin/create-lecturer "$create_body")
assert_status "POST /admin/create-lecturer (duplicate email) -> 409" 409 "$code"

# ---------------------------------------------------------------------------
# 2. DISABLE lecturer
# ---------------------------------------------------------------------------
bold "[2/4] DISABLE-LECTURER"

# 2.1 Use a known seeded lecturer if we don't have a new_user_id from create.
# Falls back to env var $LECTURER_USER_ID for manual runs.
target_id="${new_user_id:-${LECTURER_USER_ID:-}}"
if [[ -z "$target_id" || "$target_id" == "null" ]]; then
  yel "  No lecturer userId available -- disable/enable tests SKIPPED."
  yel "  Set LECTURER_USER_ID env var to a known LECTURER id to run them."
  skipped=$((skipped+3))
else
  # 2.2 Happy path -- 200
  code=$(hit POST "/api/admin/disable-lecturer/$target_id")
  assert_status "POST /admin/disable-lecturer/:id (happy path) -> 200" 200 "$code"

  # 2.3 Unknown user -> 404
  code=$(hit POST "/api/admin/disable-lecturer/00000000-0000-0000-0000-000000000000")
  assert_status "POST /admin/disable-lecturer/:id (unknown id) -> 404" 404 "$code"
fi

# ---------------------------------------------------------------------------
# 3. ENABLE lecturer
# ---------------------------------------------------------------------------
bold "[3/4] ENABLE-LECTURER"

if [[ -n "$target_id" && "$target_id" != "null" ]]; then
  # 3.1 Happy path -- 200
  code=$(hit POST "/api/admin/enable-lecturer/$target_id")
  assert_status "POST /admin/enable-lecturer/:id (happy path) -> 200" 200 "$code"

  # 3.2 Re-enable idempotency -- still 200 (state already on)
  code=$(hit POST "/api/admin/enable-lecturer/$target_id")
  assert_status "POST /admin/enable-lecturer/:id (idempotent) -> 200" 200 "$code"

  # 3.3 Unknown user -> 404
  code=$(hit POST "/api/admin/enable-lecturer/00000000-0000-0000-0000-000000000000")
  assert_status "POST /admin/enable-lecturer/:id (unknown id) -> 404" 404 "$code"
fi

# ---------------------------------------------------------------------------
# 4. AUTH guard (requireAdmin)
# ---------------------------------------------------------------------------
bold "[4/4] AUTH GUARD"

# 4.1 No cookie -> 401
OLD_COOKIE="$COOKIE"
COOKIE=""
code=$(hit POST /api/admin/create-lecturer "$create_body")
assert_status "POST /admin/create-lecturer (no auth) -> 401" 401 "$code"
COOKIE="$OLD_COOKIE"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
bold ""
bold "=== Summary ==="
green "Passed   : $pass"
if [[ $fail -gt 0 ]]; then red "Failed   : $fail"; else green "Failed   : $fail"; fi
if [[ $skipped -gt 0 ]]; then yel "Skipped  : $skipped"; else green "Skipped  : 0"; fi

exit $(( fail > 0 ? 1 : 0 ))
