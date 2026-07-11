import { IngestionJobStatus, type DocumentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../auth/services/db.service.js";
import { IngestionJobRepository } from "../../syllabus/repositories/ingestion-job.repository.js";
import { DocumentRepository } from "../repositories/document.repository.js";
import { CallbackEventRepository } from "../repositories/callback-event.repository.js";

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
    ? await IngestionJobRepository.findById(input.jobId)
    : await IngestionJobRepository.findByDocumentId(input.documentId);

  const document = await DocumentRepository.findById(input.documentId);

  if (!document) {
    throw new Error(`Document ${input.documentId} not found`);
  }

  const callbackPayload = input.payload ?? Prisma.JsonNull;
  const eventName = `INGESTION_${input.status}`;

  await prisma.$transaction(async (tx) => {
    await CallbackEventRepository.create(
      {
        document: { connect: { id: input.documentId } },
        ...(job ? { job: { connect: { id: job.id } } } : {}),
        eventName,
        status: input.status === "COMPLETED" ? "PROCESSED" : "FAILED",
        payload: callbackPayload,
        errorMessage: input.error ?? null,
        processedAt: new Date(),
      },
      { tx },
    );

    await DocumentRepository.update(
      input.documentId,
      { status: input.status },
      { tx },
    );

    if (job) {
      await IngestionJobRepository.update(
        job.id,
        {
          status: mapJobStatus(input.status),
          callbackPayload: callbackPayload,
          errorMessage: input.error ?? null,
          completedAt: new Date(),
          ...(input.sourceLocation ? { sourceLocation: input.sourceLocation } : {}),
        },
        { tx },
      );
    }
  });
}
