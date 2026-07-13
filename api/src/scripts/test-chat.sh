#!/usr/bin/env bash
# ============================================================================
# Track F -- Chat module smoke test (layer-refactor plan, todo 26)
# ============================================================================
# Manual run: bring up the API first, then execute this script.
#
#   cd api && npm run dev          # in one terminal
#   bash api/src/scripts/test-chat.sh   # in another (or this one)
#
# Prereqs:
#   - Server reachable at $BASE_URL (default http://localhost:8000).
#   - bash, curl, jq installed.
#   - DEV_LOGIN_ACCOUNTS must have at least one role to dev-login with.
#     Default test uses "student" (see api/src/config/dev-login.ts).
#
# Status expectations (matches the pre-refactor controller exactly):
#   200 OK   -- successful read / dev-login (200 with Set-Cookie)
#   201      -- session created
#   400      -- missing required field (sessionId / message / title)
#   401      -- no session cookie on a protected route
#   403      -- session owned by another user
#   404      -- session / course not found
#   500      -- unexpected (asserts should still pass for valid inputs)
#
# The router is mounted at /api/chat (see api/src/index.ts).
#
# If the server is not running, treat this file as a TEST PLAN: the
# comments document every endpoint, every payload, and the expected
# HTTP status. Mark "manual run later" by running the script after
# `npm run dev`.
# ============================================================================

set -u

BASE_URL="${BASE_URL:-http://localhost:8000}"
TS="$(date +%s)"
ROLE="${ROLE:-student}"

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

# Cookie jar -- we re-use it across requests so the same dev-login
# session drives both /sessions and /send.
JAR="$(mktemp)"
trap 'rm -f "$JAR"' EXIT

# Run a request with the cookie jar, echo only the HTTP status code.
hit() {
  local method="$1" path="$2" body="${3:-}" extra="${4:-}"
  if [[ -n "$body" ]]; then
    curl -s -o /dev/null -w "%{http_code}" \
      -X "$method" "$BASE_URL$path" \
      -H "Content-Type: application/json" \
      -b "$JAR" -c "$JAR" \
      $extra \
      --data-raw "$body"
  else
    curl -s -o /dev/null -w "%{http_code}" \
      -X "$method" "$BASE_URL$path" \
      -b "$JAR" -c "$JAR" \
      $extra
  fi
}

# Full body of a JSON response (stdout).
body() {
  local method="$1" path="$2" body="${3:-}" extra="${4:-}"
  if [[ -n "$body" ]]; then
    curl -s -X "$method" "$BASE_URL$path" \
      -H "Content-Type: application/json" \
      -b "$JAR" -c "$JAR" \
      $extra \
      --data-raw "$body"
  else
    curl -s -X "$method" "$BASE_URL$path" \
      -b "$JAR" -c "$JAR" \
      $extra
  fi
}

# Body that ignores the cookie jar -- used for negative cases that
# must NOT carry a session.
hit_noauth() {
  local method="$1" path="$2" body="${3:-}"
  if [[ -n "$body" ]]; then
    curl -s -o /dev/null -w "%{http_code}" \
      -X "$method" "$BASE_URL$path" \
      -H "Content-Type: application/json" \
      --data-raw "$body"
  else
    curl -s -o /dev/null -w "%{http_code}" \
      -X "$method" "$BASE_URL$path"
  fi
}

bold ""
bold "=== Track F: Chat module smoke test ==="
bold "Base URL : $BASE_URL"
bold "Role     : $ROLE"
bold "Jar      : $JAR"
bold ""

# ============================================================================
# 1. dev-login
# ============================================================================
bold "[1/7] POST /api/chat/dev-login (student)"
code=$(hit POST /api/chat/dev-login "{\"role\":\"$ROLE\"}")
assert_status "POST /api/chat/dev-login" 200 "$code"

# Inspect the Set-Cookie that landed in the jar
if [[ -s "$JAR" ]]; then
  green "  PASS  Set-Cookie populated"
  pass=$((pass+1))
else
  red   "  FAIL  Set-Cookie NOT set on dev-login"
  fail=$((fail+1))
fi

# ============================================================================
# 2. GET /api/chat/courses (any logged-in user)
# ============================================================================
bold "[2/7] GET /api/chat/courses"
code=$(hit GET /api/chat/courses)
assert_status "GET /api/chat/courses" 200 "$code"

code=$(hit_noauth GET /api/chat/courses)
assert_status "GET /api/chat/courses (no auth) -> 401" 401 "$code"

# ============================================================================
# 3. GET /api/chat/document-catalog
# ============================================================================
bold "[3/7] GET /api/chat/document-catalog"
code=$(hit GET /api/chat/document-catalog)
assert_status "GET /api/chat/document-catalog" 200 "$code"

# Validate response shape: groups array + totals
catalog=$(body GET /api/chat/document-catalog)
total_courses=$(echo "$catalog" | jq -r '.totalCourses // "missing"')
total_docs=$(echo "$catalog" | jq -r '.totalDocuments // "missing"')
if [[ "$total_courses" != "missing" && "$total_docs" != "missing" ]]; then
  green "  PASS  catalog response carries totalCourses / totalDocuments"
  pass=$((pass+1))
else
  red   "  FAIL  catalog response missing totalCourses / totalDocuments"
  fail=$((fail+1))
fi

# ============================================================================
# 4. POST /api/chat/sessions (create)
# ============================================================================
bold "[4/7] POST /api/chat/sessions (create)"

# Pull a course id we can use for SELECTED_COURSES scope if we want a
# second variant. Default scope is ALL_COURSES so no course required.
code=$(hit POST /api/chat/sessions "{\"scopeMode\":\"ALL_COURSES\"}")
assert_status "POST /api/chat/sessions (ALL_COURSES)" 201 "$code"

# Capture the new session id for the rest of the script
session_id=$(body GET /api/chat/sessions | jq -r '.sessions[0].id')
if [[ -z "$session_id" || "$session_id" == "null" ]]; then
  red "  Could not find newly created session id -- downstream tests will fail"
  fail=$((fail+1))
fi

# SELECTED_COURSES with no ids -> 400
code=$(hit POST /api/chat/sessions "{\"scopeMode\":\"SELECTED_COURSES\",\"courseIds\":[]}")
assert_status "POST /api/chat/sessions (SELECTED_COURSES, empty) -> 400" 400 "$code"

# SELECTED_DOCUMENTS with no ids -> 400
code=$(hit POST /api/chat/sessions "{\"scopeMode\":\"SELECTED_DOCUMENTS\",\"documentIds\":[]}")
assert_status "POST /api/chat/sessions (SELECTED_DOCUMENTS, empty) -> 400" 400 "$code"

# ============================================================================
# 5. GET /api/chat/sessions and GET /api/chat/sessions/:id
# ============================================================================
bold "[5/7] GET /api/chat/sessions[/...]"

code=$(hit GET /api/chat/sessions)
assert_status "GET /api/chat/sessions" 200 "$code"

code=$(hit GET "/api/chat/sessions/$session_id")
assert_status "GET /api/chat/sessions/:id" 200 "$code"

# Random session id -> 404
code=$(hit GET "/api/chat/sessions/00000000-0000-0000-0000-000000000000")
assert_status "GET /api/chat/sessions/:id (not found) -> 404" 404 "$code"

# ============================================================================
# 6. PATCH /api/chat/sessions/:id (rename)
# ============================================================================
bold "[6/7] PATCH /api/chat/sessions/:id (rename)"

code=$(hit PATCH "/api/chat/sessions/$session_id" "{\"title\":\"Smoke $TS\"}")
assert_status "PATCH /api/chat/sessions/:id" 200 "$code"

# Missing title -> 400
code=$(hit PATCH "/api/chat/sessions/$session_id" "{\"title\":\"\"}")
assert_status "PATCH /api/chat/sessions/:id (empty title) -> 400" 400 "$code"

# ============================================================================
# 7. POST /api/chat/send (SSE)
# ============================================================================
bold "[7/7] POST /api/chat/send (SSE)"

# We cannot easily assert HTTP status because SSE returns 200 even on
# RAG-side errors. Instead we capture the event stream and grep for
# the canonical `event: message` frame.
sse_out="$(mktemp)"
curl -s -N -X POST "$BASE_URL/api/chat/send" \
  -H "Content-Type: application/json" \
  -b "$JAR" -c "$JAR" \
  --max-time 30 \
  --data-raw "{\"sessionId\":\"$session_id\",\"message\":\"Xin chào, bạn là ai?\"}" \
  > "$sse_out" 2>/dev/null || true

if grep -q "^event: message" "$sse_out"; then
  green "  PASS  SSE stream emitted event:message"
  pass=$((pass+1))
else
  red   "  FAIL  SSE stream did NOT emit event:message"
  fail=$((fail+1))
fi

if grep -q "^event: citations" "$sse_out"; then
  green "  PASS  SSE stream emitted event:citations"
  pass=$((pass+1))
else
  yel   "  SKIP  SSE stream did not emit event:citations (likely RAG backend down)"
  skipped=$((skipped+1))
fi

# Missing sessionId / message -> 400 (sent as a regular JSON response,
# not SSE, because validation runs before streamSSE opens).
code=$(hit POST /api/chat/send "{\"message\":\"hi\"}")
assert_status "POST /api/chat/send (no sessionId) -> 400" 400 "$code"

code=$(hit POST /api/chat/send "{\"sessionId\":\"$session_id\"}")
assert_status "POST /api/chat/send (no message) -> 400" 400 "$code"

# Random session id -> 404
code=$(hit POST /api/chat/send "{\"sessionId\":\"00000000-0000-0000-0000-000000000000\",\"message\":\"hi\"}")
assert_status "POST /api/chat/send (unknown session) -> 404" 404 "$code"

rm -f "$sse_out"

# ============================================================================
# Cleanup
# ============================================================================
bold ""
bold "[cleanup] DELETE /api/chat/sessions/:id"
code=$(hit DELETE "/api/chat/sessions/$session_id")
assert_status "DELETE /api/chat/sessions/:id" 200 "$code"

code=$(hit DELETE "/api/chat/sessions/$session_id")
assert_status "DELETE /api/chat/sessions/:id (already gone) -> 404" 404 "$code"

# ============================================================================
# Summary
# ============================================================================
bold ""
bold "=== Summary ==="
green "Passed   : $pass"
if [[ $fail -gt 0 ]]; then red "Failed   : $fail"; else green "Failed   : $fail"; fi
if [[ $skipped -gt 0 ]]; then yel "Skipped  : $skipped"; else green "Skipped  : 0"; fi

exit $(( fail > 0 ? 1 : 0 ))
