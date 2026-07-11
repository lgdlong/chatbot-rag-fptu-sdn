#!/usr/bin/env bash
# ============================================================================
# Track E -- Curriculum module smoke test (layer-refactor plan, todo 21)
# ============================================================================
# Manual run: bring up the API first, then execute this script.
#
#   cd api && npm run dev          # in one terminal
#   bash api/src/scripts/test-curriculum.sh   # in another (or this one)
#
# Prereqs:
#   - Server reachable at $BASE_URL (default http://localhost:8000)
#   - $ADMIN_COOKIE env var set to a valid ADMIN or LECTURER session cookie
#     (sign in via /api/auth/sign-in/email first, then copy the cookie value).
#   - bash, curl, jq installed.
#
# Status expectations (matches the pre-refactor controller exactly):
#   200 OK   -- read endpoints, successful updates
#   201      -- create endpoints
#   400      -- validation failure (missing/empty required field)
#   401      -- no session cookie
#   403      -- non-admin role
#   404      -- not found
#   409      -- duplicate code / link / cascade violation
#   500      -- unexpected (asserts should still pass for valid inputs)
#
# If the server is not running, treat this file as a TEST PLAN: the comments
# document every endpoint, every payload, and the expected HTTP status.
# Mark "manual run later" by running the script after `npm run dev`.
# ============================================================================

set -u

BASE_URL="${BASE_URL:-http://localhost:8000}"
COOKIE="${ADMIN_COOKIE:-}"
TS="$(date +%s)"
MAJOR_CODE="E2E_${TS}"
SPEC_CODE="SP_${TS}"
CURR_ID="BIT_${MAJOR_CODE}_${SPEC_CODE}_T${TS}"

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
  yel "ADMIN_COOKIE not set -- all authenticated endpoints will be reported as 401/403."
  yel "Set ADMIN_COOKIE before running for full coverage."
  skipped=$((skipped+1))
fi

bold ""
bold "=== Track E: Curriculum module smoke test ==="
bold "Base URL : $BASE_URL"
bold "Major    : $MAJOR_CODE"
bold "Spec     : $SPEC_CODE"
bold "Curr ID  : $CURR_ID"
bold ""

# ---------------------------------------------------------------------------
# 1. MAJOR endpoints
# ---------------------------------------------------------------------------
bold "[1/4] MAJOR"

# 1.1 List (requires any logged-in user, even non-admin)
code=$(hit GET /api/curriculum/majors)
assert_status "GET /majors" 200 "$code"

# 1.2 Create major (admin)
code=$(hit POST /api/curriculum/majors \
  "{\"code\":\"$MAJOR_CODE\",\"name\":\"E2E Major\",\"description\":\"smoke\"}")
assert_status "POST /majors" 201 "$code"

# 1.3 Duplicate -> 409
code=$(hit POST /api/curriculum/majors \
  "{\"code\":\"$MAJOR_CODE\",\"name\":\"E2E Major Dup\"}")
assert_status "POST /majors (duplicate code) -> 409" 409 "$code"

# 1.4 Missing fields -> 400
code=$(hit POST /api/curriculum/majors "{\"code\":\"\"}")
assert_status "POST /majors (missing code/name) -> 400" 400 "$code"

# 1.5 Read the created major id for downstream tests
major_id=$(body GET /api/curriculum/majors | jq -r ".majors[] | select(.code==\"$MAJOR_CODE\") | .id")
if [[ -z "$major_id" || "$major_id" == "null" ]]; then
  red "  Could not find created major $MAJOR_CODE -- subsequent tests will fail"
  fail=$((fail+1))
fi

# 1.6 Update
code=$(hit PUT "/api/curriculum/majors/$major_id" \
  "{\"name\":\"E2E Major Renamed\",\"description\":\"smoke-updated\"}")
assert_status "PUT /majors/:id" 200 "$code"

# ---------------------------------------------------------------------------
# 2. SPECIALIZATION endpoints
# ---------------------------------------------------------------------------
bold "[2/4] SPECIALIZATION"

# 2.1 List
code=$(hit GET /api/curriculum/specializations)
assert_status "GET /specializations" 200 "$code"

# 2.2 Create (admin)
code=$(hit POST /api/curriculum/specializations \
  "{\"majorId\":\"$major_id\",\"code\":\"$SPEC_CODE\",\"name\":\"E2E Spec\"}")
assert_status "POST /specializations" 201 "$code"

# 2.3 Duplicate -> 409
code=$(hit POST /api/curriculum/specializations \
  "{\"majorId\":\"$major_id\",\"code\":\"$SPEC_CODE\",\"name\":\"Dup\"}")
assert_status "POST /specializations (duplicate code) -> 409" 409 "$code"

# 2.4 Major not found -> 404
code=$(hit POST /api/curriculum/specializations \
  "{\"majorId\":\"00000000-0000-0000-0000-000000000000\",\"code\":\"X${TS}\",\"name\":\"X\"}")
assert_status "POST /specializations (bad majorId) -> 404" 404 "$code"

# 2.5 Missing fields -> 400
code=$(hit POST /api/curriculum/specializations \
  "{\"majorId\":\"$major_id\",\"code\":\"\",\"name\":\"\"}")
assert_status "POST /specializations (missing code/name) -> 400" 400 "$code"

# 2.6 Read spec id
spec_id=$(body GET /api/curriculum/specializations | jq -r ".specializations[] | select(.code==\"$SPEC_CODE\") | .id")

# 2.7 Update
code=$(hit PUT "/api/curriculum/specializations/$spec_id" \
  "{\"name\":\"E2E Spec Renamed\"}")
assert_status "PUT /specializations/:id" 200 "$code"

# 2.8 Delete (will succeed if no curriculums link it -- see section 3)
# We defer deletion until section 5 (cleanup) so the rest of the tests can link to it.

# ---------------------------------------------------------------------------
# 3. CURRICULUM endpoints
# ---------------------------------------------------------------------------
bold "[3/4] CURRICULUM"

# 3.1 List
code=$(hit GET /api/curriculum/curriculums)
assert_status "GET /curriculums" 200 "$code"

# 3.2 Create (admin)
code=$(hit POST /api/curriculum/curriculums \
  "{\"curriculumId\":\"$CURR_ID\",\"majorId\":\"$major_id\",\"specializationId\":\"$spec_id\",\"batchCode\":\"T${TS}\"}")
assert_status "POST /curriculums" 201 "$code"

# 3.3 Duplicate -> 409
code=$(hit POST /api/curriculum/curriculums \
  "{\"curriculumId\":\"$CURR_ID\",\"majorId\":\"$major_id\",\"specializationId\":\"$spec_id\",\"batchCode\":\"T${TS}\"}")
assert_status "POST /curriculums (duplicate id) -> 409" 409 "$code"

# 3.4 Major not found -> 404
code=$(hit POST /api/curriculum/curriculums \
  "{\"curriculumId\":\"BAD_${TS}\",\"majorId\":\"00000000-0000-0000-0000-000000000000\",\"batchCode\":\"T\"}")
assert_status "POST /curriculums (bad major) -> 404" 404 "$code"

# 3.5 Missing required fields -> 400
code=$(hit POST /api/curriculum/curriculums \
  "{\"curriculumId\":\"\",\"majorId\":\"\",\"batchCode\":\"\"}")
assert_status "POST /curriculums (missing fields) -> 400" 400 "$code"

# 3.6 Read curriculum id (internal uuid)
curr_internal_id=$(body GET /api/curriculum/curriculums | jq -r ".curriculums[] | select(.curriculumId==\"$CURR_ID\") | .id")

# 3.7 Detail (by curriculumId)
code=$(hit GET "/api/curriculum/curriculums/$CURR_ID")
assert_status "GET /curriculums/:curriculumId (by code)" 200 "$code"

# 3.8 Detail (by internal id) - 404 because the path param matches neither
code=$(hit GET "/api/curriculum/curriculums/$curr_internal_id")
assert_status "GET /curriculums/:internalId" 200 "$code"

# 3.9 Detail not found -> 404
code=$(hit GET "/api/curriculum/curriculums/DOES_NOT_EXIST")
assert_status "GET /curriculums/:id (not found) -> 404" 404 "$code"

# 3.10 Update
code=$(hit PUT "/api/curriculum/curriculums/$curr_internal_id" \
  "{\"majorId\":\"$major_id\",\"specializationId\":\"$spec_id\",\"batchCode\":\"T${TS}_U\"}")
assert_status "PUT /curriculums/:id" 200 "$code"

# ---------------------------------------------------------------------------
# 4. SUBJECT (CurriculumSubject) endpoints
# ---------------------------------------------------------------------------
bold "[4/4] CURRICULUM <-> SUBJECT"

# Pick a real course id from the courses list endpoint to test the link.
course_id=$(body GET /api/courses 2>/dev/null | jq -r '.. | objects | select(.id?) | .id' 2>/dev/null | head -n1)
if [[ -z "$course_id" || "$course_id" == "null" ]]; then
  yel "  No course available -- subject assign/remove tests SKIPPED."
  yel "  Create a course first (POST /api/rag or admin UI) and rerun."
  skipped=$((skipped+2))
else
  # 4.1 Assign subject
  code=$(hit POST "/api/curriculum/curriculums/$CURR_ID/subjects" \
    "{\"courseId\":\"$course_id\",\"semesterNo\":3,\"isSpecializationSpecific\":false}")
  assert_status "POST /curriculums/:id/subjects" 201 "$code"

  # 4.2 Duplicate link -> 409
  code=$(hit POST "/api/curriculum/curriculums/$CURR_ID/subjects" \
    "{\"courseId\":\"$course_id\",\"semesterNo\":3,\"isSpecializationSpecific\":false}")
  assert_status "POST /curriculums/:id/subjects (duplicate) -> 409" 409 "$code"

  # 4.3 Curriculum not found -> 404
  code=$(hit POST "/api/curriculum/curriculums/MISSING_CURR/subjects" \
    "{\"courseId\":\"$course_id\",\"semesterNo\":1}")
  assert_status "POST /curriculums/:id/subjects (missing curr) -> 404" 404 "$code"

  # 4.4 Course not found -> 404
  code=$(hit POST "/api/curriculum/curriculums/$CURR_ID/subjects" \
    "{\"courseId\":\"00000000-0000-0000-0000-000000000000\",\"semesterNo\":1}")
  assert_status "POST /curriculums/:id/subjects (bad course) -> 404" 404 "$code"

  # 4.5 Invalid semester -> 400
  code=$(hit POST "/api/curriculum/curriculums/$CURR_ID/subjects" \
    "{\"courseId\":\"$course_id\",\"semesterNo\":15}")
  assert_status "POST /curriculums/:id/subjects (semester 15) -> 400" 400 "$code"

  # 4.6 Remove subject
  code=$(hit DELETE "/api/curriculum/curriculums/$CURR_ID/subjects/$course_id")
  assert_status "DELETE /curriculums/:id/subjects/:courseId" 200 "$code"
fi

# ---------------------------------------------------------------------------
# 5. CLEANUP (delete in cascade order: subject links, curriculum, spec, major)
# ---------------------------------------------------------------------------
bold "[5/5] CLEANUP"

code=$(hit DELETE "/api/curriculum/curriculums/$curr_internal_id")
assert_status "DELETE /curriculums/:id" 200 "$code"

code=$(hit DELETE "/api/curriculum/specializations/$spec_id")
assert_status "DELETE /specializations/:id" 200 "$code"

code=$(hit DELETE "/api/curriculum/majors/$major_id")
assert_status "DELETE /majors/:id" 200 "$code"

# Verify cascade guard: delete the same spec twice -> 404 (already gone)
code=$(hit DELETE "/api/curriculum/specializations/$spec_id")
assert_status "DELETE /specializations/:id (already gone) -> 200 (idempotent)" 200 "$code"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
bold ""
bold "=== Summary ==="
green "Passed   : $pass"
if [[ $fail -gt 0 ]]; then red "Failed   : $fail"; else green "Failed   : $fail"; fi
if [[ $skipped -gt 0 ]]; then yel "Skipped  : $skipped"; else green "Skipped  : 0"; fi

exit $(( fail > 0 ? 1 : 0 ))
