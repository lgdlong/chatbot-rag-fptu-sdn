import "../config/env.js";
import { prisma } from "../modules/auth/services/db.service.js";

async function main() {
  const rws = await prisma.ragWorkspace.findMany({
    where: { workspaceSlug: { in: ["fer202_12580", "prn232_12588"] } },
    select: { id: true, syllabusId: true, workspaceSlug: true, anythingLlmId: true, syncStatus: true },
  });
  console.log(JSON.stringify(rws, null, 2));

  const count = await prisma.ragWorkspace.count({
    where: { anythingLlmId: { not: null } },
  });
  console.log(`\nRagWorkspace records with anythingLlmId: ${count}`);

  await prisma.$disconnect();
}

main().catch(console.error);
