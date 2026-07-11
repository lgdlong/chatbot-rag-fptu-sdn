#!/usr/bin/env bash
# ============================================================================
# Track D -- Course module smoke test (layer-refactor plan, todo 14)
# ============================================================================
# Manual run: bring up the API first, then execute this script.
#
#   cd api && npm run dev          # in one terminal
#   bash api/src/scripts/test-courses.sh   # in another (or this one)
#
# Prereqs:
#   - Server reachable at $BASE_URL (default http://localhost:8000)
#   - $COOKIE env var set to a valid LECTURER or ADMIN session cookie
#     (sign in via /api/auth/sign-in/email first, then copy the cookie
#     value). The LECTURER/ADMIN role is required for POST/PATCH/DELETE;
#     GET works for any authenticated user.
#   - bash, curl, jq installed.
#
# Status expectations (matches the pre-refactor controller exactly):
#   200 OK   -- read endpoints, successful updates, successful delete
#   201      -- create endpoint
#   400      -- validation failure (missing/empty required field)
#   401      -- no session cookie
#   403      -- non-lecturer/admin role
#   404      -- not found
#   409      -- duplicate code (POST) or duplicate code (PATCH) or
#               course still has documents (DELETE)
#   500      -- unexpected (asserts should still pass for valid inputs)
#
# The router is mounted at /api/courses (see api/src/index.ts), NOT
# /api/rag -- the task description uses the file name but the actual
# route prefix is /api/courses.
#
# If the server is not running, treat this file as a TEST PLAN: the
# comments document every endpoint, every payload, and the expected
# HTTP status. Mark "manual run later" by running the script after
# `npm run dev`.
# ============================================================================

set -u

BASE_URL="${BASE_URL:-http://localhost:8000}"
COOKIE="${COOKIE:-}"
TS="$(date +%s)"
COURSE_CODE="E2E_${TS}"
COURSE_NAME="E2E Course ${TS}"

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

# JSON body of a response (stdout).
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

if [[ -z "$COOKIE" ]]; then
  yel "COOKIE not set -- all authenticated endpoints will be reported as 401/403."
  yel "Set COOKIE before running for full coverage."
  skipped=$((skipped+1))
fi

bold ""
bold "=== Track D: Course module smoke test ==="
bold "Base URL     : $BASE_URL"
bold "Course code  : $COURSE_CODE"
bold ""

# ---------------------------------------------------------------------------
# 1. READ (GET /api/courses) -- any logged-in user
# ---------------------------------------------------------------------------
bold "[1/4] GET /api/courses (list)"

# 1.1 List courses
code=$(hit GET /api/courses)
assert_status "GET /api/courses" 200 "$code"

# 1.2 No cookie -> 401 (negative case)
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/courses")
assert_status "GET /api/courses (no auth) -> 401" 401 "$code"

# ---------------------------------------------------------------------------
# 2. CREATE (POST /api/courses) -- LECTURER or ADMIN
# ---------------------------------------------------------------------------
bold "[2/4] POST /api/courses (create)"

# 2.1 Create a fresh course
code=$(hit POST /api/courses \
  "{\"code\":\"$COURSE_CODE\",\"name\":\"$COURSE_NAME\"}")
assert_status "POST /api/courses" 201 "$code"

# 2.2 Duplicate code -> 409 (case-insensitive match)
code=$(hit POST /api/courses \
  "{\"code\":\"${COURSE_CODE,,}\",\"name\":\"Duplicate\"}")
assert_status "POST /api/courses (duplicate code, lowercase) -> 409" 409 "$code"

# 2.3 Missing fields -> 400
code=$(hit POST /api/courses "{\"code\":\"\",\"name\":\"\"}")
assert_status "POST /api/courses (missing fields) -> 400" 400 "$code"

# 2.4 Fetch the new course id for downstream tests
course_id=$(body GET /api/courses | jq -r ".courses[] | select(.code==\"$COURSE_CODE\") | .id")
if [[ -z "$course_id" || "$course_id" == "null" ]]; then
  red "  Could not find created course $COURSE_CODE -- subsequent tests will fail"
  fail=$((fail+1))
fi

# 2.5 Newly created course should have documentCount: 0
new_doc_count=$(body GET /api/courses | jq -r ".courses[] | select(.id==\"$course_id\") | .documentCount")
if [[ "$new_doc_count" == "0" ]]; then
  green "  PASS  new course documentCount == 0"
  pass=$((pass+1))
else
  red   "  FAIL  new course documentCount expected 0 got $new_doc_count"
  fail=$((fail+1))
fi

# ---------------------------------------------------------------------------
# 3. UPDATE (PATCH /api/courses/:courseId) -- LECTURER or ADMIN
# ---------------------------------------------------------------------------
bold "[3/4] PATCH /api/courses/:courseId (update)"

# 3.1 Update name only (no code change) -- 200
code=$(hit PATCH "/api/courses/$course_id" \
  "{\"code\":\"$COURSE_CODE\",\"name\":\"E2E Course ${TS} Renamed\"}")
assert_status "PATCH /api/courses/:id (name only)" 200 "$code"

# 3.2 Update code (triggers AnythingLLM workspace rename loop). Use a
#     unique new code so we never collide with anything else in the DB.
NEW_CODE="${COURSE_CODE}_V2"
code=$(hit PATCH "/api/courses/$course_id" \
  "{\"code\":\"$NEW_CODE\",\"name\":\"E2E Course ${TS} Renamed\"}")
assert_status "PATCH /api/courses/:id (code change)" 200 "$code"

# 3.3 Duplicate code (back to original) -> 409
code=$(hit PATCH "/api/courses/$course_id" \
  "{\"code\":\"E2E_DUP_${TS}\",\"name\":\"Foo\"}")
# (must first create the dup, then try to change to it; skipped to keep
# the script linear -- see test 3.4 below for the 409 guard)

# 3.4 Missing fields -> 400
code=$(hit PATCH "/api/courses/$course_id" "{\"code\":\"\",\"name\":\"\"}")
assert_status "PATCH /api/courses/:id (missing fields) -> 400" 400 "$code"

# 3.5 Not found -> 404
code=$(hit PATCH "/api/courses/00000000-0000-0000-0000-000000000000" \
  "{\"code\":\"GHOST_${TS}\",\"name\":\"Ghost\"}")
assert_status "PATCH /api/courses/:id (not found) -> 404" 404 "$code"

# 3.6 Duplicate code on update (create the dup first, then try to rename)
DUP_CODE="E2E_DUP_${TS}_X"
hit POST /api/courses \
  "{\"code\":\"$DUP_CODE\",\"name\":\"Dup Target\"}" > /dev/null
code=$(hit PATCH "/api/courses/$course_id" \
  "{\"code\":\"$DUP_CODE\",\"name\":\"Trying to steal code\"}")
assert_status "PATCH /api/courses/:id (duplicate code) -> 409" 409 "$code"

# ---------------------------------------------------------------------------
# 4. DELETE (DELETE /api/courses/:courseId) -- LECTURER or ADMIN
# ---------------------------------------------------------------------------
bold "[4/4] DELETE /api/courses/:courseId (delete)"

# 4.1 Delete the dup target first (it has no documents)
dup_id=$(body GET /api/courses | jq -r ".courses[] | select(.code==\"$DUP_CODE\") | .id")
if [[ -n "$dup_id" && "$dup_id" != "null" ]]; then
  code=$(hit DELETE "/api/courses/$dup_id")
  assert_status "DELETE /api/courses/:id (clean course)" 200 "$code"
else
  yel "  Could not find dup course $DUP_CODE -- cleanup step skipped"
  skipped=$((skipped+1))
fi

# 4.2 Delete the main test course
code=$(hit DELETE "/api/courses/$course_id")
assert_status "DELETE /api/courses/:id" 200 "$code"

# 4.3 Idempotent? Original controller returns 404 for already-gone; we
#     preserve that via the service ValidationError path.
code=$(hit DELETE "/api/courses/$course_id")
assert_status "DELETE /api/courses/:id (already gone) -> 404" 404 "$code"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
bold ""
bold "=== Summary ==="
green "Passed   : $pass"
if [[ $fail -gt 0 ]]; then red "Failed   : $fail"; else green "Failed   : $fail"; fi
if [[ $skipped -gt 0 ]]; then yel "Skipped  : $skipped"; else green "Skipped  : 0"; fi

exit $(( fail > 0 ? 1 : 0 ))
