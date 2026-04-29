const VALID_REQUEST_TYPES = new Set(['book', 'reschedule', 'edit', 'cancel'])
const VALID_STATUSES = new Set(['pending', 'completed', 'denied'])

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function stripLeadingEquals(val) {
  if (typeof val === 'string' && val.startsWith('=')) return val.slice(1)
  return val
}

function asString(value) {
  if (value == null) return ''
  const normalized = typeof value === 'string' ? value.trim() : String(value).trim()
  return stripLeadingEquals(normalized).trim()
}

function asBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

function asNumber(value, fallback = 0) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = asString(value)
    if (text) return text
  }
  return ''
}

function normalizeRequestType(value, fallback = 'book') {
  const raw = asString(value).toLowerCase()
  if (!raw) return fallback

  if (VALID_REQUEST_TYPES.has(raw)) return raw

  const cleaned = raw
    .replace(/_appointment(?:_cal)?$/, '')
    .replace(/[^a-z]/g, '')

  if (cleaned === 'book' || cleaned === 'booking') return 'book'
  if (cleaned === 'reschedule') return 'reschedule'
  if (cleaned === 'edit' || cleaned === 'update') return 'edit'
  if (cleaned === 'cancel' || cleaned === 'cancellation') return 'cancel'

  return fallback
}

function normalizeStatus(value, fallback = 'pending') {
  const raw = asString(value).toLowerCase()
  if (!raw) return fallback
  return VALID_STATUSES.has(raw) ? raw : fallback
}

function extractDate(value) {
  const raw = asString(value)
  if (!raw) return ''

  const date = new Date(raw)
  if (!Number.isNaN(date.getTime())) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Toronto',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date)

    const year = parts.find((part) => part.type === 'year')?.value
    const month = parts.find((part) => part.type === 'month')?.value
    const day = parts.find((part) => part.type === 'day')?.value

    if (year && month && day) return `${year}-${month}-${day}`
  }

  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/)
  if (match) return match[1]
  return ''
}

function extractTime(value) {
  const raw = asString(value)
  if (!raw) return ''

  const date = new Date(raw)
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Toronto',
    })
  }

  const match = raw.match(/T(\d{2}):(\d{2})/)
  if (!match) return ''

  const hour = Number(match[1])
  const minute = match[2]
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const twelveHour = hour % 12 || 12
  return `${twelveHour}:${minute} ${suffix}`
}

function deriveRequestType(body, details, rawPayload) {
  const explicit = firstNonEmpty(
    body.request_type,
    body.type,
    body.action,
    rawPayload.request_type,
    rawPayload.type,
    rawPayload.action,
    rawPayload.function_name,
    rawPayload.name,
    rawPayload.tool_name,
  )

  if (explicit) return normalizeRequestType(explicit)

  if (asString(details.existing_appointment_id) && asString(details.requested_datetime)) {
    return 'reschedule'
  }

  if (asString(body.event_id) && (asString(body.new_start) || asString(body.new_datetime))) {
    return 'reschedule'
  }

  if (asString(rawPayload.event_id) && asString(rawPayload.updated_description)) {
    return 'edit'
  }

  if (asString(details.existing_appointment_id) || asString(rawPayload.event_id) || asString(body.event_id)) {
    return 'cancel'
  }

  return 'book'
}

export function buildStoredRequest(payload, options = {}) {
  const now = asString(options.now) || new Date().toISOString()
  const body = asObject(payload)
  const patient = asObject(body.patient)
  const details = asObject(body.request_details)
  const submission = asObject(body.submission_info)
  const rawPayload = asObject(body.raw_payload)

  const firstName = firstNonEmpty(patient.first_name, body.first_name, body.firstName)
  const lastName = firstNonEmpty(patient.last_name, body.last_name, body.lastName)
  const fullName = firstNonEmpty(
    patient.full_name,
    body.full_name,
    body.fullName,
    [firstName, lastName].filter(Boolean).join(' '),
  )

  const requestedDateTime = firstNonEmpty(
    details.requested_datetime,
    body.requested_datetime,
    body.requestedDateTime,
    rawPayload.requested_datetime,
    rawPayload.appointment_datetime,
    rawPayload.new_datetime,
    rawPayload.new_start,
    body.appointment_datetime,
    body.new_datetime,
    body.new_start,
  )

  const existingAppointmentDateTime = firstNonEmpty(
    details.existing_appointment_datetime,
    body.existing_appointment_datetime,
    body.existingDate,
    rawPayload.old_start,
    rawPayload.start_time,
    rawPayload.old_datetime,
    rawPayload.appointment_date,
  )

  return {
    id: firstNonEmpty(body.id, options.id),
    client_id: firstNonEmpty(body.client_id, body.clientId, options.clientId),
    clinic_id: firstNonEmpty(options.clinicId, body.clinic_id, body.clinicId),
    location_name: firstNonEmpty(body.location_name, body.locationName),
    request_type: deriveRequestType(body, details, rawPayload),
    status: normalizeStatus(body.status, 'pending'),
    patient: {
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      phone: firstNonEmpty(patient.phone, body.phone),
      email: firstNonEmpty(patient.email, body.email),
    },
    request_details: {
      reason: firstNonEmpty(
        details.reason,
        body.reason,
        body.appointment_type,
        body.event_summary,
        rawPayload.reason,
        rawPayload.appointment_type,
      ),
      requested_datetime: requestedDateTime,
      requested_date: firstNonEmpty(details.requested_date, body.requested_date, body.requestedDate, extractDate(requestedDateTime)),
      requested_time: firstNonEmpty(details.requested_time, body.requested_time, body.requestedTime, extractTime(requestedDateTime)),
      duration_minutes: asNumber(
        firstNonEmpty(details.duration_minutes, body.duration_minutes, rawPayload.duration_minutes),
        60,
      ),
      existing_appointment_id: firstNonEmpty(
        details.existing_appointment_id,
        body.existing_appointment_id,
        rawPayload.event_id,
      ),
      existing_appointment_datetime: existingAppointmentDateTime,
    },
    ai_call_summary: firstNonEmpty(
      body.ai_call_summary,
      body.callSummary,
      body.summary,
      body.message,
      body.confirmation_message,
      body.description,
      body.event_summary,
      rawPayload.summary,
      rawPayload.message,
      rawPayload.confirmation_message,
      rawPayload.description,
      rawPayload.event_summary,
      'Request submitted by AI receptionist for manual review.',
    ),
    submission_info: {
      submitted_at: firstNonEmpty(
        submission.submitted_at,
        body.submittedAt,
        body.submitted_at,
        body.created_at,
        rawPayload.submitted_at,
        rawPayload.created_at,
        now,
      ),
      call_id: firstNonEmpty(submission.call_id, body.call_id, body.callId, rawPayload.call_id),
      source: firstNonEmpty(submission.source, body.source, 'n8n'),
      manual_action_required: asBoolean(
        submission.manual_action_required ?? body.manual_action_required,
        true,
      ),
    },
    raw_payload: Object.keys(rawPayload).length ? rawPayload : body,
    notes: firstNonEmpty(body.notes),
    sentiment: firstNonEmpty(body.sentiment, body.user_sentiment),
    created_at: firstNonEmpty(body.created_at, options.createdAt, now),
    updated_at: firstNonEmpty(options.updatedAt, now),
  }
}

export function validateStoredRequest(record) {
  const errors = []

  if (!record.id) errors.push('An id could not be generated for the request.')

  if (!VALID_REQUEST_TYPES.has(record.request_type)) {
    errors.push('request_type must be one of: book, reschedule, edit, cancel.')
  }

  if (!VALID_STATUSES.has(record.status)) {
    errors.push('status must be one of: pending, completed, denied.')
  }

  if (!record.patient.full_name && !record.patient.first_name && !record.patient.last_name) {
    errors.push('patient.full_name or patient first/last name is required.')
  }

  if (!record.patient.phone) {
    errors.push('patient.phone is required.')
  }

  if (!record.submission_info.submitted_at) {
    errors.push('submission_info.submitted_at is required.')
  }

  return errors
}

export function validateStatusUpdate(status) {
  if (!VALID_STATUSES.has(normalizeStatus(status, ''))) {
    return ['status must be one of: pending, completed, denied.']
  }

  return []
}

export function toDashboardRequest(record) {
  const normalized = buildStoredRequest(record, {
    id: asString(record?.id),
    clientId: asString(record?.client_id),
    clinicId: asString(record?.clinic_id),
    createdAt: asString(record?.created_at),
    updatedAt: asString(record?.updated_at),
    now: asString(record?.updated_at || record?.created_at || record?.submission_info?.submitted_at),
  })

  return {
    id: normalized.id,
    type: normalized.request_type,
    firstName: normalized.patient.first_name,
    lastName: normalized.patient.last_name,
    fullName: normalized.patient.full_name,
    phone: normalized.patient.phone,
    email: normalized.patient.email,
    reason: normalized.request_details.reason,
    requestedDate: normalized.request_details.requested_date,
    requestedTime: normalized.request_details.requested_time,
    submittedAt: normalized.submission_info.submitted_at,
    status: normalized.status,
    notes: normalized.notes,
    existingDate: normalized.request_details.existing_appointment_datetime,
    callSummary: normalized.ai_call_summary,
    sentiment: normalized.sentiment,
    callId: normalized.submission_info.call_id,
    clinicId: normalized.clinic_id,
    locationName: normalized.location_name,
    rawPayload: normalized.raw_payload,
    requestDetails: normalized.request_details,
    patient: normalized.patient,
    createdAt: normalized.created_at,
    updatedAt: normalized.updated_at,
  }
}

export function normalizePatchedRequest(record, status) {
  return {
    ...record,
    status: normalizeStatus(status),
    updated_at: new Date().toISOString(),
  }
}
