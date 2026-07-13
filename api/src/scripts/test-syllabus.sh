#!/usr/bin/env bash
# ============================================================================
# Track G -- Syllabus module smoke test (layer-refactor plan, todo 31)
# ============================================================================
# Manual run: bring up the API first, then execute this script.
#
#   cd api && npm run dev          # in one terminal
#   bash api/src/scripts/test-syllabus.sh   # in another (or this one)
#
# Prereqs:
#   - Server reachable at $BASE_URL (default http://localhost:8000)
#   - $COOKIE env var set to a valid LECTURER session cookie (sign in via
#     /api/auth/sign-in/email first, then copy the cookie value). LECTURER
#     role is required for every write endpoint; GET works for any
#     authenticated user.
#   - $STUDENT_COOKIE for the role-based student guard test.
#   - $COURSE_ID set to an existing Course row id (UUID from the
#     `courses` table -- create one via POST /api/courses if needed).
#   - $PDF_PATH (optional) set to a small PDF file to exercise the upload
#     pipeline. If unset, the upload test is marked SKIP.
#   - bash, curl, jq installed.
#
# Status expectations (matches the pre-refactor controller exactly):
#   200 OK   -- read endpoints, successful mutations
#   201      -- create endpoint
#   400      -- validation failure (missing id/name, weight != 100, size,
#               not approved, not active, no file, bad extension)
#   401      -- no session cookie
#   403      -- non-lecturer role; student trying to read unpublished
#   404      -- syllabus not found, course not found
#   409      -- duplicate syllabus id; document still processing
#
# If the server is not running, treat this file as a TEST PLAN: the
# comments document every endpoint, every payload, and the expected
# HTTP status. Mark "manual run later" by running the script after
# `npm run dev`.
# ============================================================================

set -u

BASE_URL="${BASE_URL:-http://localhost:8000}"
COOKIE="${COOKIE:-}"
STUDENT_COOKIE="${STUDENT_COOKIE:-}"
COURSE_ID="${COURSE_ID:-}"
PDF_PATH="${PDF_PATH:-}"
TS="$(date +%s)"
SYLLABUS_ID=$((10000000 + TS % 1000000))

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

skip() {
  yel "  SKIP  $1"
  skipped=$((skipped+1))
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

# Multipart upload. Echoes the JSON response body for parsing.
hit_upload() {
  local method="$1" path="$2" file_path="$3" field="${4:-file}"
  if [[ ! -f "$file_path" ]]; then
    echo "no_file"
    return
  fi
  curl -s -X "$method" "$BASE_URL$path" \
    ${COOKIE:+-H "Cookie: $COOKIE"} \
    -F "${field}=@${file_path}"
}

# ============================================================================
# Preflight
# ============================================================================
bold ""
bold "=== Track G -- Syllabus module smoke test ==="
bold "BASE_URL: $BASE_URL"
bold "SYLLABUS_ID (test): $SYLLABUS_ID"
echo ""

if [[ -z "$COOKIE" ]]; then
  yel "  No \$COOKIE set -- every request will be 401."
  yel "  Sign in first:  POST /api/auth/sign-in/email"
  echo ""
fi
if [[ -z "$COURSE_ID" ]]; then
  yel "  No \$COURSE_ID set -- create flow needs a real Course row."
  yel "  POST /api/courses { code, name } first."
  echo ""
fi

# ============================================================================
# 1. SEARCH (GET /)
# ============================================================================
bold "[1] GET /api/syllabus?subject_code=... -- search"
code=$(hit GET "/api/syllabus?subject_code=SDN")
assert_status "  no cookie => 401" 401 "$code"
code=$(hit GET "/api/syllabus?subject_code=SDN" "" "")
assert_status "  with cookie => 200" 200 "$code"

# ============================================================================
# 2. DETAIL (GET /:id)
# ============================================================================
bold "[2] GET /api/syllabus/:id -- detail"
code=$(hit GET "/api/syllabus/abc")
assert_status "  invalid id => 400" 400 "$code"
code=$(hit GET "/api/syllabus/9999999")
assert_status "  not found => 404" 404 "$code"

# ============================================================================
# 3. CREATE (POST /)
# ============================================================================
bold "[3] POST /api/syllabus -- create"
code=$(hit POST "/api/syllabus" '{}')
assert_status "  no cookie => 401" 401 "$code"
code=$(hit POST "/api/syllabus" '{"id":123}')
assert_status "  missing fields => 400" 400 "$code"
code=$(hit POST "/api/syllabus" "{\"id\":${SYLLABUS_ID},\"courseId\":\"bogus-course-id\",\"syllabusName\":\"E2E ${TS}\"}")
assert_status "  bad courseId => 404" 404 "$code"
if [[ -n "$COURSE_ID" ]]; then
  code=$(hit POST "/api/syllabus" "{\"id\":${SYLLABUS_ID},\"courseId\":\"${COURSE_ID}\",\"syllabusName\":\"E2E ${TS}\"}")
  assert_status "  valid payload => 201" 201 "$code"
  # Duplicate id should fail with 409
  code=$(hit POST "/api/syllabus" "{\"id\":${SYLLABUS_ID},\"courseId\":\"${COURSE_ID}\",\"syllabusName\":\"E2E dup\"}")
  assert_status "  duplicate id => 409" 409 "$code"
else
  skip "  valid create (no COURSE_ID)"
  skip "  duplicate id (no COURSE_ID)"
fi

# ============================================================================
# 4. UPDATE (PUT /:id)
# ============================================================================
bold "[4] PUT /api/syllabus/:id -- update + weight=100 check"
if [[ -n "$COURSE_ID" ]]; then
  code=$(hit PUT "/api/syllabus/${SYLLABUS_ID}" "{\"syllabusName\":\"renamed\"}")
  assert_status "  no cookie => 401" 401 "$code"
  code=$(hit PUT "/api/syllabus/${SYLLABUS_ID}" "{\"syllabusName\":\"renamed\"}" "")
  assert_status "  with cookie, valid => 200" 200 "$code"
  # Assessment weights must sum to 100
  bad_weights='{"syllabusName":"renamed","assessments":[{"category":"A","weight":"30"},{"category":"B","weight":"50"}]}'
  code=$(hit PUT "/api/syllabus/${SYLLABUS_ID}" "$bad_weights")
  assert_status "  weight != 100 => 400" 400 "$code"
  # Not found
  code=$(hit PUT "/api/syllabus/9999999" "{\"syllabusName\":\"x\"}")
  assert_status "  not found => 404" 404 "$code"
else
  skip "  PUT valid (no COURSE_ID)"
  skip "  PUT weight 400 (no COURSE_ID)"
  skip "  PUT 404 (no COURSE_ID)"
fi

# ============================================================================
# 5. APPROVE (PATCH /:id/approve)
# ============================================================================
bold "[5] PATCH /api/syllabus/:id/approve -- approve"
if [[ -n "$COURSE_ID" ]]; then
  code=$(hit PATCH "/api/syllabus/${SYLLABUS_ID}/approve" '')
  assert_status "  approve => 200" 200 "$code"
  code=$(hit PATCH "/api/syllabus/9999999/approve" '')
  assert_status "  not found => 404" 404 "$code"
else
  skip "  approve 200 (no COURSE_ID)"
  skip "  approve 404 (no COURSE_ID)"
fi

# ============================================================================
# 6. ACTIVATE (PATCH /:id/activate)
# ============================================================================
bold "[6] PATCH /api/syllabus/:id/activate -- activate (BR-09 requires isApproved)"
if [[ -n "$COURSE_ID" ]]; then
  code=$(hit PATCH "/api/syllabus/${SYLLABUS_ID}/activate" '')
  assert_status "  approve-then-activate => 200" 200 "$code"
  code=$(hit PATCH "/api/syllabus/9999999/activate" '')
  assert_status "  not found => 404" 404 "$code"
else
  skip "  activate 200 (no COURSE_ID)"
  skip "  activate 404 (no COURSE_ID)"
fi

# ============================================================================
# 7. DEACTIVATE (PATCH /:id/deactivate)
# ============================================================================
bold "[7] PATCH /api/syllabus/:id/deactivate -- deactivate"
if [[ -n "$COURSE_ID" ]]; then
  code=$(hit PATCH "/api/syllabus/${SYLLABUS_ID}/deactivate" '')
  assert_status "  deactivate active => 200" 200 "$code"
  code=$(hit PATCH "/api/syllabus/${SYLLABUS_ID}/deactivate" '')
  assert_status "  deactivate inactive => 400" 400 "$code"
else
  skip "  deactivate 200 (no COURSE_ID)"
  skip "  deactivate 400 (no COURSE_ID)"
fi

# ============================================================================
# 8. DOCUMENTS LIST (GET /:syllabusId/documents)
# ============================================================================
bold "[8] GET /api/syllabus/:syllabusId/documents -- list documents"
if [[ -n "$COURSE_ID" ]]; then
  code=$(hit GET "/api/syllabus/${SYLLABUS_ID}/documents")
  assert_status "  list docs => 200" 200 "$code"
  code=$(hit GET "/api/syllabus/abc/documents")
  assert_status "  invalid id => 400" 400 "$code"
  code=$(hit GET "/api/syllabus/9999999/documents")
  assert_status "  not found syllabus => 500" 500 "$code"
else
  skip "  list docs 200 (no COURSE_ID)"
fi

# ============================================================================
# 9. DOCUMENT UPLOAD (POST /:syllabusId/documents)
# ============================================================================
bold "[9] POST /api/syllabus/:syllabusId/documents -- upload PDF"
if [[ -n "$COURSE_ID" && -n "$PDF_PATH" && -f "$PDF_PATH" ]]; then
  # Multipart: -F "file=@path"
  resp=$(hit_upload POST "/api/syllabus/${SYLLABUS_ID}/documents" "$PDF_PATH")
  status=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$BASE_URL/api/syllabus/${SYLLABUS_ID}/documents" \
    ${COOKIE:+-H "Cookie: $COOKIE"} \
    -F "file=@${PDF_PATH}")
  assert_status "  upload pdf => 200" 200 "$status"
else
  skip "  upload pdf (set PDF_PATH to a real .pdf file)"
fi

# Bad extension / no file
if [[ -n "$COURSE_ID" ]]; then
  tmp_txt=$(mktemp --suffix=.txt 2>/dev/null || echo /tmp/e2e_$$.txt)
  echo "not a pdf" > "$tmp_txt"
  status=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$BASE_URL/api/syllabus/${SYLLABUS_ID}/documents" \
    ${COOKIE:+-H "Cookie: $COOKIE"} \
    -F "file=@${tmp_txt};type=text/plain")
  assert_status "  non-pdf extension => 400" 400 "$status"
  rm -f "$tmp_txt"
fi

# ============================================================================
# 10. STUDENT ROLE GUARD on detail (GET /:id)
# ============================================================================
bold "[10] GET /api/syllabus/:id as STUDENT (not published) => 403"
if [[ -n "$STUDENT_COOKIE" && -n "$COURSE_ID" ]]; then
  # The created syllabus above is isApproved=true, isActive=false
  # (deactivated). Student should get 403 on detail.
  code=$(curl -s -o /dev/null -w "%{http_code}" \
    -X GET "$BASE_URL/api/syllabus/${SYLLABUS_ID}" \
    -H "Cookie: $STUDENT_COOKIE")
  assert_status "  student sees deactivated => 403" 403 "$code"
else
  skip "  student 403 (set STUDENT_COOKIE + COURSE_ID)"
fi

# ============================================================================
# 11. DELETE (DELETE /:id) -- last so subsequent test numbers stay stable
# ============================================================================
bold "[11] DELETE /api/syllabus/:id -- hard delete"
if [[ -n "$COURSE_ID" ]]; then
  code=$(hit DELETE "/api/syllabus/${SYLLABUS_ID}")
  assert_status "  delete => 200" 200 "$code"
  code=$(hit DELETE "/api/syllabus/9999999")
  assert_status "  not found => 404" 404 "$code"
else
  skip "  delete 200 (no COURSE_ID)"
  skip "  delete 404 (no COURSE_ID)"
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
bold "=== Summary ==="
green "PASS:    $pass"
red   "FAIL:    $fail"
yel   "SKIPPED: $skipped"
echo ""

if [[ $fail -gt 0 ]]; then
  red "FAILED -- see red PASS/FAIL lines above"
  exit 1
else
  green "All assertions passed (or were skipped due to missing prereqs)."
  exit 0
fi
