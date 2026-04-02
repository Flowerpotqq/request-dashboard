import dotenv from 'dotenv'
import cors from 'cors'
import express from 'express'

import { createRequest, listRequests, updateRequestStatus } from './requestStore.js'
import { toDashboardRequest } from './requestShape.js'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env', override: false })

const app = express()
const port = Number(process.env.API_PORT || 3000)

app.use(cors({ origin: true }))
app.use(express.json({ limit: '1mb' }))

function getScope(req) {
  return {
    clientId: req.params.clientId || '',
    clinicId: req.params.clinicId || '',
  }
}

function getPayload(req) {
  return req.body?.request && typeof req.body.request === 'object'
    ? req.body.request
    : req.body
}

function sendRequestCollection(res, records) {
  res.json({
    requests: records.map(toDashboardRequest),
    count: records.length,
  })
}

function sendSingleRequest(res, record, statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    request: toDashboardRequest(record),
    stored_request: record,
  })
}

function registerRoutes(basePath) {
  app.get(`${basePath}/requests`, async (req, res, next) => {
    try {
      const records = await listRequests(getScope(req))
      sendRequestCollection(res, records)
    } catch (error) {
      next(error)
    }
  })

  app.post(`${basePath}/requests`, async (req, res, next) => {
    try {
      const record = await createRequest(getPayload(req), getScope(req))
      sendSingleRequest(res, record, 201)
    } catch (error) {
      next(error)
    }
  })

  const patchHandler = async (req, res, next) => {
    try {
      const record = await updateRequestStatus(
        req.params.id,
        req.body?.status,
        getScope(req),
      )
      sendSingleRequest(res, record)
    } catch (error) {
      next(error)
    }
  }

  app.patch(`${basePath}/requests/:id`, patchHandler)
  app.patch(`${basePath}/requests/:id/status`, patchHandler)
}

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

registerRoutes('/api')
registerRoutes('/api/:clientId/:clinicId')

app.use((error, _req, res, _next) => {
  const statusCode = error.statusCode || 500
  res.status(statusCode).json({
    success: false,
    error: error.message || 'Unexpected server error.',
    details: Array.isArray(error.details) ? error.details : [],
  })
})

app.listen(port, () => {
  console.log(`NAP dashboard API listening on http://localhost:${port}`)
})
