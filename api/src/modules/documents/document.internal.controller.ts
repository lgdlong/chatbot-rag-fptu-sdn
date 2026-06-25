import { Hono } from 'hono'
import { ENV } from '../../config/env.js'
import { applyIngestionCallback } from './services/ingestion-callback.service.js'

export const internalRouter = new Hono()

internalRouter.patch('/documents/:id', async (c) => {
  const authHeader = c.req.header('Authorization')
  const internalKey = ENV.INTERNAL_API_KEY

  if (!internalKey || authHeader !== `Bearer ${internalKey}`) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const docId = c.req.param('id')
  const { status, error, jobId, payload, sourceLocation } = await c.req.json()

  const normalizedStatus = status === 'SUCCESS' ? 'COMPLETED' : status
  if (normalizedStatus !== 'COMPLETED' && normalizedStatus !== 'FAILED') {
    return c.json({ error: 'Invalid ingestion status' }, 400)
  }

  try {
    await applyIngestionCallback({
      documentId: docId,
      jobId: typeof jobId === 'string' ? jobId : null,
      status: normalizedStatus,
      error: typeof error === 'string' ? error : null,
      payload: payload ?? undefined,
      sourceLocation: typeof sourceLocation === 'string' ? sourceLocation : null,
    })
    return c.json({ success: true })
  } catch (err: any) {
    console.error(`[InternalWebhook] Failed to update document status:`, err)
    return c.json({ error: err.message || 'Failed to update document status' }, 500)
  }
})
