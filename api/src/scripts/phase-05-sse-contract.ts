import { strict as assert } from "node:assert";

async function main() {
  const baseUrl = process.env.API_BASE_URL || "http://localhost:8000";

  const loginResponse = await fetch(`${baseUrl}/api/chat/dev-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "student" }),
  });

  assert.ok(loginResponse.ok, `/api/chat/dev-login failed: ${loginResponse.status}`);
  const cookie = loginResponse.headers.get("set-cookie");
  assert.ok(cookie, "missing session cookie");

  const createSessionResponse = await fetch(`${baseUrl}/api/chat/sessions`, {
    method: "POST",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ scopeMode: "ALL_COURSES" }),
  });

  assert.ok(createSessionResponse.ok, `/api/chat/sessions failed: ${createSessionResponse.status}`);
  const createSessionJson = (await createSessionResponse.json()) as { session?: { id?: string } };
  const sessionId = createSessionJson.session?.id;
  assert.ok(sessionId, "missing chat session id");

  const sendResponse = await fetch(`${baseUrl}/api/chat/send`, {
    method: "POST",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessionId, message: "ping" }),
  });

  assert.ok(sendResponse.ok, `/api/chat/send failed: ${sendResponse.status}`);
  const streamText = await sendResponse.text();
  assert.ok(streamText.includes("event:"), "SSE stream missing event frames");
  assert.ok(
    streamText.includes("event: error") || streamText.includes("event: message"),
    "SSE stream missing message/error event",
  );

  console.log("phase-05 sse contract ok");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
