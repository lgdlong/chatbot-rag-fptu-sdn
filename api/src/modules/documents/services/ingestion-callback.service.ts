import { IngestionJobStatus, type DocumentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../auth/services/db.service.js";

type IngestionCallbackStatus = DocumentStatus;

type IngestionCallbackInput = {
  documentId: string;
  jobId?: string | null;
  status: IngestionCallbackStatus;
  error?: string | null;
  payload?: Prisma.InputJsonValue;
  sourceLocation?: string | null;
};

function mapJobStatus(status: IngestionCallbackStatus) {
  return status === "COMPLETED" ? IngestionJobStatus.SUCCESS : IngestionJobStatus.FAILED;
}

export async function applyIngestionCallback(input: IngestionCallbackInput) {
  const job = input.jobId
    ? await prisma.ingestionJob.findUnique({ where: { id: input.jobId } })
    : await prisma.ingestionJob.findUnique({ where: { documentId: input.documentId } });

  const document = await prisma.document.findUnique({
    where: { id: input.documentId },
    select: { id: true },
  });

  if (!document) {
    throw new Error(`Document ${input.documentId} not found`);
  }

  const callbackPayload = input.payload ?? Prisma.JsonNull;
  const eventName = `INGESTION_${input.status}`;

  await prisma.$transaction(async (tx) => {
    await tx.callbackEvent.create({
      data: {
        document: { connect: { id: input.documentId } },
        ...(job ? { job: { connect: { id: job.id } } } : {}),
        eventName,
        status: input.status === "COMPLETED" ? "PROCESSED" : "FAILED",
        payload: callbackPayload,
        errorMessage: input.error ?? null,
        processedAt: new Date(),
      },
    });

    await tx.document.update({
      where: { id: input.documentId },
      data: { status: input.status },
    });

    if (job) {
      await tx.ingestionJob.update({
        where: { id: job.id },
        data: {
          status: mapJobStatus(input.status),
          callbackPayload: callbackPayload,
          errorMessage: input.error ?? null,
          completedAt: new Date(),
          ...(input.sourceLocation ? { sourceLocation: input.sourceLocation } : {}),
        },
      });
    }
  });
}
