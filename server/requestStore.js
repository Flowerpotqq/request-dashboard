import { randomUUID } from 'node:crypto'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  buildStoredRequest,
  normalizePatchedRequest,
  validateStatusUpdate,
  validateStoredRequest,
} from './requestShape.js'

const DATA_FILE = path.resolve(
  process.cwd(),
  process.env.REQUESTS_DATA_FILE || 'data/requests.json',
)

let writeQueue = Promise.resolve()

function createError(statusCode, message, details = []) {
  const error = new Error(message)
  error.statusCode = statusCode
  error.details = details
  return error
}

function matchesScope(record, scope) {
  if (scope.clientId && record.client_id !== scope.clientId) return false
  if (scope.clinicId && record.clinic_id !== scope.clinicId) return false
  return true
}

async function ensureDataFile() {
  await mkdir(path.dirname(DATA_FILE), { recursive: true })

  try {
    await access(DATA_FILE)
  } catch {
    await writeFile(DATA_FILE, '[]\n', 'utf8')
  }
}

async function readRequests() {
  await ensureDataFile()
  const raw = await readFile(DATA_FILE, 'utf8')

  if (!raw.trim()) return []

  const parsed = JSON.parse(raw)
  return Array.isArray(parsed) ? parsed : []
}

async function writeRequests(records) {
  await ensureDataFile()
  await writeFile(DATA_FILE, `${JSON.stringify(records, null, 2)}\n`, 'utf8')
}

function queueWrite(mutator) {
  writeQueue = writeQueue.then(async () => {
    const records = await readRequests()
    const result = await mutator(records)
    await writeRequests(records)
    return result
  })

  return writeQueue
}

export async function listRequests(scope = {}) {
  const records = await readRequests()

  return records
    .filter((record) => matchesScope(record, scope))
    .sort((a, b) => {
      const left = b?.submission_info?.submitted_at || b?.created_at || ''
      const right = a?.submission_info?.submitted_at || a?.created_at || ''
      return String(left).localeCompare(String(right))
    })
}

export async function createRequest(payload, scope = {}) {
  const now = new Date().toISOString()
  const record = buildStoredRequest(payload, {
    id: randomUUID(),
    clientId: scope.clientId,
    clinicId: scope.clinicId,
    createdAt: now,
    updatedAt: now,
    now,
  })

  const errors = validateStoredRequest(record)
  if (errors.length) {
    throw createError(422, 'Incoming request payload did not match the expected schema.', errors)
  }

  return queueWrite(async (records) => {
    records.push(record)
    return record
  })
}

export async function updateRequestStatus(id, status, scope = {}) {
  const errors = validateStatusUpdate(status)
  if (errors.length) {
    throw createError(422, 'Status update payload is invalid.', errors)
  }

  return queueWrite(async (records) => {
    const index = records.findIndex(
      (record) => record.id === id && matchesScope(record, scope),
    )

    if (index === -1) {
      throw createError(404, `Request ${id} was not found.`)
    }

    const updated = normalizePatchedRequest(records[index], status)
    records[index] = updated
    return updated
  })
}

export async function markGcalHoldDeleted(id, details, scope = {}) {
  const { calendarEventId, calendarId, practitioner } = details || {}
  if (!calendarEventId || !calendarId || !practitioner) {
    throw createError(422, 'Delete hold payload is invalid.', [
      'calendar_event_id, calendar_id, and practitioner are required.',
    ])
  }

  return queueWrite(async (records) => {
    const index = records.findIndex(
      (record) => record.id === id && matchesScope(record, scope),
    )

    if (index === -1) {
      throw createError(404, `Request ${id} was not found.`)
    }

    const current = records[index] || {}
    const rawPayload = current.raw_payload && typeof current.raw_payload === 'object'
      ? { ...current.raw_payload }
      : {}
    const deletePayload = rawPayload.delete_payload && typeof rawPayload.delete_payload === 'object'
      ? { ...rawPayload.delete_payload }
      : {}

    deletePayload.calendar_event_id = null
    rawPayload.delete_payload = deletePayload
    rawPayload.delete_enabled = false

    records[index] = {
      ...current,
      status: 'booked_in_jane',
      gcal_deleted: true,
      calendar_event_id: null,
      raw_payload: rawPayload,
      updated_at: new Date().toISOString(),
    }

    return records[index]
  })
}
