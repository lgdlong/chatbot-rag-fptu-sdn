import { strict as assert } from "node:assert";

type HealthResponse = {
  status: string;
  services?: {
    database?: { status?: string };
    anythingllm?: { status?: string };
  };
};

async function main() {
  const baseUrl = process.env.API_BASE_URL || "http://localhost:8000";

  const healthResponse = await fetch(`${baseUrl}/api/health`);
  assert.ok(healthResponse.ok, `/api/health failed: ${healthResponse.status}`);

  const health = (await healthResponse.json()) as HealthResponse;
  assert.equal(health.status, "UP");
  assert.equal(health.services?.database?.status, "UP");
  assert.equal(health.services?.anythingllm?.status, "UP");

  const openApiResponse = await fetch(`${baseUrl}/api/doc`);
  assert.ok(openApiResponse.ok, `/api/doc failed: ${openApiResponse.status}`);

  const openApi = (await openApiResponse.json()) as { paths?: Record<string, unknown> };
  assert.ok(openApi.paths?.["/api/internal/documents/{id}"]);

  console.log("phase-05 smoke ok");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
