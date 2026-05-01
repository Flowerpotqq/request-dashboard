import dotenv from 'dotenv'
import cors from 'cors'
import express from 'express'
import { existsSync } from 'node:fs'
import path from 'node:path'

import { createRequest, listRequests, markGcalHoldDeleted, updateRequestStatus } from './requestStore.js'
import { toDashboardRequest } from './requestShape.js'
import { findTenantByAccessToken, toPublicTenant } from './tenantStore.js'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env', override: false })

const app = express()
const port = Number(process.env.API_PORT || 3000)
const dashboardApiKey = String(process.env.DASHBOARD_API_KEY || '').trim()
const deleteGcalHoldWebhookUrl = String(
  process.env.DELETE_GCAL_HOLD_WEBHOOK_URL
  || 'https://n8n.getnapsolutions.com/webhook/recoup-health-delete-gcal-hold',
).trim()
const distDir = path.resolve(process.cwd(), 'dist')
const distIndex = path.join(distDir, 'index.html')

app.use(cors({ origin: true }))
app.use(express.json({ limit: '1mb' }))

function createError(statusCode, message, details = []) {
  const error = new Error(message)
  error.statusCode = statusCode
  error.details = details
  return error
}

function getScope(req) {
  return {
    clientId: req.params.clientId || '',
    clinicId: req.params.clinicId || '',
  }
}

function getPayload(req) {
  const candidate = req.body?.request && typeof req.body.request === 'object'
    ? req.body.request
    : req.body

  if (Array.isArray(candidate)) {
    return candidate[0] && typeof candidate[0] === 'object' ? candidate[0] : {}
  }

  return candidate
}

function sendRequestCollection(res, records) {
  res.json({
    requests: records.map(toDashboardRequest),
    count: records.length,
  })
}

function sendTenantRequestCollection(res, tenant, records) {
  res.json({
    tenant: toPublicTenant(tenant),
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

function validateDeleteHoldBody(body) {
  const calendarEventId = String(body?.calendar_event_id || '').trim()
  const calendarId = String(body?.calendar_id || '').trim()
  const practitioner = String(body?.practitioner || '').trim()
  const details = []

  if (!calendarEventId) details.push('calendar_event_id is required.')
  if (!calendarId) details.push('calendar_id is required.')
  if (!practitioner) details.push('practitioner is required.')

  if (details.length) {
    throw createError(422, 'Delete hold payload is invalid.', details)
  }

  return { calendarEventId, calendarId, practitioner }
}

async function callDeleteGcalHoldWebhook(id, payload) {
  const response = await fetch(deleteGcalHoldWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request_id: id,
      calendar_event_id: payload.calendarEventId,
      calendar_id: payload.calendarId,
      practitioner: payload.practitioner,
    }),
  })

  let body = null
  try {
    body = await response.json()
  } catch {
    body = null
  }

  if (!response.ok || !body?.success || !body?.deleted) {
    throw createError(502, 'Failed to remove Google Calendar hold via automation.')
  }
}

function extractApiKey(req) {
  const headerKey = String(req.get('x-dashboard-api-key') || '').trim()
  if (headerKey) return headerKey

  const authHeader = String(req.get('authorization') || '').trim()
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim()
  }

  return ''
}

function requireApiKey(req, _res, next) {
  if (!dashboardApiKey) return next()

  if (extractApiKey(req) !== dashboardApiKey) {
    return next(createError(401, 'Missing or invalid dashboard API key.'))
  }

  return next()
}

async function resolveTenant(req, _res, next) {
  try {
    const tenant = await findTenantByAccessToken(req.params.accessToken)
    if (!tenant) {
      throw createError(404, 'The shared dashboard link is invalid or inactive.')
    }

    req.tenant = tenant
    return next()
  } catch (error) {
    return next(error)
  }
}

function registerScopedRoutes(basePath) {
  app.get(`${basePath}/requests`, async (req, res, next) => {
    try {
      const records = await listRequests(getScope(req))
      sendRequestCollection(res, records)
    } catch (error) {
      next(error)
    }
  })

  app.post(`${basePath}/requests`, requireApiKey, async (req, res, next) => {
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

  app.patch(`${basePath}/requests/:id`, requireApiKey, patchHandler)
  app.patch(`${basePath}/requests/:id/status`, requireApiKey, patchHandler)
  app.post(`${basePath}/requests/:id/delete-gcal-hold`, requireApiKey, async (req, res, next) => {
    try {
      const payload = validateDeleteHoldBody(req.body)
      await callDeleteGcalHoldWebhook(req.params.id, payload)
      const record = await markGcalHoldDeleted(req.params.id, payload, getScope(req))
      sendSingleRequest(res, record)
    } catch (error) {
      next(error)
    }
  })
}

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

registerScopedRoutes('/api')
registerScopedRoutes('/api/:clientId/:clinicId')

app.get('/api/link/:accessToken/queue/requests', resolveTenant, async (req, res, next) => {
  try {
    const records = await listRequests({
      clientId: req.tenant.clientId,
      clinicId: req.tenant.clinicId,
    })

    sendTenantRequestCollection(res, req.tenant, records)
  } catch (error) {
    next(error)
  }
})

const accessPatchHandler = async (req, res, next) => {
  try {
    const record = await updateRequestStatus(
      req.params.id,
      req.body?.status,
      {
        clientId: req.tenant.clientId,
        clinicId: req.tenant.clinicId,
      },
    )

    res.json({
      success: true,
      tenant: toPublicTenant(req.tenant),
      request: toDashboardRequest(record),
      stored_request: record,
    })
  } catch (error) {
    next(error)
  }
}

app.patch('/api/link/:accessToken/queue/requests/:id', resolveTenant, accessPatchHandler)
app.patch('/api/link/:accessToken/queue/requests/:id/status', resolveTenant, accessPatchHandler)
app.post('/api/link/:accessToken/queue/requests/:id/delete-gcal-hold', resolveTenant, async (req, res, next) => {
  try {
    const payload = validateDeleteHoldBody(req.body)
    await callDeleteGcalHoldWebhook(req.params.id, payload)
    const record = await markGcalHoldDeleted(req.params.id, payload, {
      clientId: req.tenant.clientId,
      clinicId: req.tenant.clinicId,
    })

    res.json({
      success: true,
      tenant: toPublicTenant(req.tenant),
      request: toDashboardRequest(record),
      stored_request: record,
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/link/:accessToken/intake/requests', requireApiKey, resolveTenant, async (req, res, next) => {
  try {
    const record = await createRequest(getPayload(req), {
      clientId: req.tenant.clientId,
      clinicId: req.tenant.clinicId,
    })

    res.status(201).json({
      success: true,
      tenant: toPublicTenant(req.tenant),
      request: toDashboardRequest(record),
      stored_request: record,
    })
  } catch (error) {
    next(error)
  }
})

if (existsSync(distIndex)) {
  app.use(express.static(distDir))

  app.get(['/t/:accessToken', '/clinic/:accessToken'], (_req, res) => {
    res.sendFile(distIndex)
  })

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next()
    }

    return res.sendFile(distIndex)
  })
}

app.use((error, _req, res, _next) => {
  const statusCode = error.statusCode || 500
  res.status(statusCode).json({
    success: false,
    error: error.message || 'Unexpected server error.',
    details: Array.isArray(error.details) ? error.details : [],
  })
})

// ── NAP Analytics Proxy ───────────────────────────────────────────────────────
// Forwards /api/nap/* to n8n server-side, bypassing browser CORS restrictions.
const N8N_WEBHOOK_BASE = 'https://n8n.getnapsolutions.com/webhook'

const napProxyRoutes = [
  { path: '/api/nap/overview',    upstream: `${N8N_WEBHOOK_BASE}/nap/overview` },
  { path: '/api/nap/calls',       upstream: `${N8N_WEBHOOK_BASE}/nap/calls` },
  { path: '/api/nap/transcripts', upstream: `${N8N_WEBHOOK_BASE}/nap/transcripts` },
  { path: '/api/nap/invoices',    upstream: `${N8N_WEBHOOK_BASE}/nap/invoices` },
]

for (const { path, upstream } of napProxyRoutes) {
  app.get(path, async (_req, res) => {
    try {
      const response = await fetch(upstream, { headers: { Accept: 'application/json' } })
      const text = await response.text()
      res.status(response.status).set('Content-Type', 'application/json').send(text)
    } catch (err) {
      res.status(502).json({ error: 'Failed to reach n8n', detail: err.message })
    }
  })
}

app.get('/api/nap/analytics', async (req, res) => {
  try {
    const range = req.query.range ?? '1'
    const response = await fetch(
      `${N8N_WEBHOOK_BASE}/nap/analytics?range=${encodeURIComponent(range)}`,
      { headers: { Accept: 'application/json' } },
    )
    const text = await response.text()
    res.status(response.status).set('Content-Type', 'application/json').send(text)
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach n8n', detail: err.message })
  }
})
// ─────────────────────────────────────────────────────────────────────────────

app.listen(port, () => {
  console.log(`NAP dashboard API listening on http://localhost:${port}`)
})
