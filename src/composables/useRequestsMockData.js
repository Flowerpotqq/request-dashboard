/**
 * useRequestsMockData.js
 *
 * Generates seed data for the Receptionist Dashboard.
 *
 * Schema inferred from:
 *   - n8n "Anand Trial Receptionist" workflow:
 *       function names: book_appointment_cal, reschedule_appointment_cal,
 *                       cancel_appointment_cal, edit_appointment_cal
 *       Google Sheets columns: first_name, last_name, reason, phone, appointment_datetime
 *   - Retell AI "Anand Main Product Template" agent:
 *       post_call fields: call_summary, call_successful, user_sentiment
 *       collection nodes: first name, last name, phone, reason, date/time
 *
 * Request types that generate submissions:  book | reschedule | edit | cancel
 * Request types that do NOT:               lookup | check_availability
 *
 * Future n8n integration point:
 *   Replace this mock generator with a real API call to your n8n webhook.
 *   The webhook should POST requests to this dashboard using the schema below.
 *   Status updates (confirm/deny) should PATCH back to n8n for audit logging.
 */

function randomId() {
  return 'req_' + Math.random().toString(36).slice(2, 11)
}

function daysAgo(n, hoursOffset = 0) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(d.getHours() - hoursOffset)
  d.setSeconds(0, 0)
  return d.toISOString()
}

function futureDate(daysFromNow) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}

const CALL_SUMMARIES = [
  'Patient called requesting a cleaning appointment. Verified identity via OTP. Provided name, phone, and preferred date. Request submitted successfully.',
  'Caller wanted to reschedule their upcoming root canal from the original date to a new preferred slot. Identity verified. New date and time captured.',
  'Patient called to cancel their checkup appointment citing a scheduling conflict. Identity confirmed. Cancellation request submitted.',
  'Caller requested an edit to their appointment details — specifically updating the contact phone number on file. Request logged for receptionist review.',
  'Patient called for a tooth pain consultation. Requested earliest available slot. Information collected and submitted for receptionist review.',
  'Caller wanted to move their extraction appointment to a morning slot on a different date. Identity verified. Reschedule request logged.',
  'Patient called to book a new appointment for a broken filling. Expressed some discomfort. Request submitted with urgency note.',
  'Caller requested to cancel their upcoming sensitivity treatment consultation. Reason cited: personal scheduling conflict. Request logged.',
]

const REASONS = [
  'Cleaning', 'Checkup', 'Tooth pain', 'Chipped tooth',
  'Broken filling', 'Root canal', 'Extraction', 'Sensitivity'
]

const TIMES = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM',
               '11:30 AM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
               '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM']

const PATIENTS = [
  { firstName: 'Priya',    lastName: 'Sharma',    phone: '647-705-8185' },
  { firstName: 'James',    lastName: 'Kowalski',  phone: '905-342-1170' },
  { firstName: 'Aisha',    lastName: 'Okonkwo',   phone: '416-882-3344' },
  { firstName: 'Michael',  lastName: 'Tran',      phone: '289-554-9901' },
  { firstName: 'Sofia',    lastName: 'Mendes',    phone: '647-221-6678' },
  { firstName: 'David',    lastName: 'Park',      phone: '905-771-2253' },
  { firstName: 'Fatima',   lastName: 'Al-Hassan', phone: '416-334-5512' },
  { firstName: 'Robert',   lastName: 'Nguyen',    phone: '289-940-1128' },
  { firstName: 'Mei',      lastName: 'Chen',      phone: '647-663-9977' },
  { firstName: 'Carlos',   lastName: 'Rivera',    phone: '905-114-8833' },
  { firstName: 'Amara',    lastName: 'Diallo',    phone: '416-759-3320' },
  { firstName: 'Tyler',    lastName: 'Morrison',  phone: '647-898-2241' },
]

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

export function generateMockRequests() {
  const types = ['book', 'book', 'book', 'reschedule', 'reschedule', 'edit', 'cancel']
  const statuses = ['pending', 'pending', 'pending', 'pending', 'completed', 'completed', 'denied']
  const sentiments = ['Positive', 'Positive', 'Neutral', 'Neutral', 'Negative']

  // Build 18 varied requests — mix of types, statuses, and dates
  const raw = [
    // --- Today / very recent (all pending) ---
    { patient: PATIENTS[0],  type: 'book',        submittedHoursAgo: 0.5,  futureDays: 3,  timeIdx: 2,  status: 'pending',   sentiment: 'Positive' },
    { patient: PATIENTS[4],  type: 'reschedule',  submittedHoursAgo: 1,    futureDays: 5,  timeIdx: 8,  status: 'pending',   sentiment: 'Neutral'  },
    { patient: PATIENTS[7],  type: 'book',        submittedHoursAgo: 1.5,  futureDays: 4,  timeIdx: 5,  status: 'pending',   sentiment: 'Positive' },
    { patient: PATIENTS[10], type: 'cancel',      submittedHoursAgo: 2,    futureDays: 6,  timeIdx: 11, status: 'pending',   sentiment: 'Neutral'  },
    { patient: PATIENTS[2],  type: 'edit',        submittedHoursAgo: 3,    futureDays: 7,  timeIdx: 1,  status: 'pending',   sentiment: 'Positive' },
    { patient: PATIENTS[9],  type: 'book',        submittedHoursAgo: 4,    futureDays: 2,  timeIdx: 13, status: 'pending',   sentiment: 'Negative' },
    // --- Yesterday ---
    { patient: PATIENTS[1],  type: 'book',        submittedHoursAgo: 22,   futureDays: 10, timeIdx: 4,  status: 'pending',   sentiment: 'Positive' },
    { patient: PATIENTS[6],  type: 'reschedule',  submittedHoursAgo: 26,   futureDays: 8,  timeIdx: 7,  status: 'pending',   sentiment: 'Neutral'  },
    // --- Completed (recent) ---
    { patient: PATIENTS[3],  type: 'book',        submittedHoursAgo: 6,    futureDays: 1,  timeIdx: 3,  status: 'completed', sentiment: 'Positive' },
    { patient: PATIENTS[5],  type: 'reschedule',  submittedHoursAgo: 14,   futureDays: 9,  timeIdx: 9,  status: 'completed', sentiment: 'Positive' },
    { patient: PATIENTS[11], type: 'cancel',      submittedHoursAgo: 30,   futureDays: 4,  timeIdx: 6,  status: 'completed', sentiment: 'Neutral'  },
    { patient: PATIENTS[8],  type: 'book',        submittedHoursAgo: 48,   futureDays: 12, timeIdx: 0,  status: 'completed', sentiment: 'Positive' },
    { patient: PATIENTS[0],  type: 'edit',        submittedHoursAgo: 50,   futureDays: 14, timeIdx: 12, status: 'completed', sentiment: 'Positive' },
    // --- Denied ---
    { patient: PATIENTS[2],  type: 'book',        submittedHoursAgo: 18,   futureDays: 2,  timeIdx: 10, status: 'denied',    sentiment: 'Negative' },
    { patient: PATIENTS[7],  type: 'reschedule',  submittedHoursAgo: 36,   futureDays: 3,  timeIdx: 2,  status: 'denied',    sentiment: 'Neutral'  },
    { patient: PATIENTS[4],  type: 'cancel',      submittedHoursAgo: 72,   futureDays: 5,  timeIdx: 8,  status: 'denied',    sentiment: 'Negative' },
  ]

  return raw.map((item, index) => {
    const { patient, type, submittedHoursAgo, futureDays, timeIdx, status, sentiment } = item

    const submittedAt = (() => {
      const d = new Date()
      d.setMinutes(d.getMinutes() - Math.round(submittedHoursAgo * 60))
      d.setSeconds(0, 0)
      return d.toISOString()
    })()

    const requestedDate = futureDate(futureDays)
    const requestedTime = TIMES[timeIdx % TIMES.length]
    const reason = REASONS[(index * 3 + timeIdx) % REASONS.length]
    const summaryIdx = (index * 7 + timeIdx) % CALL_SUMMARIES.length
    const callSummary = CALL_SUMMARIES[summaryIdx]

    // For reschedule/edit, add existing appointment context
    const existingDate = (type === 'reschedule' || type === 'edit')
      ? futureDate(futureDays - 2)
      : undefined

    const notes = type === 'cancel'
      ? 'Patient called to cancel due to personal scheduling conflict. Will follow up to rebook.'
      : type === 'edit'
      ? 'Patient requested to update contact details on file.'
      : undefined

    return {
      id: randomId(),
      type,
      firstName: patient.firstName,
      lastName: patient.lastName,
      fullName: `${patient.firstName} ${patient.lastName}`,
      phone: patient.phone,
      reason,
      requestedDate,
      requestedTime,
      submittedAt,
      status,
      notes,
      existingDate,
      callSummary,
      sentiment,
      callId: `call_${Math.random().toString(36).slice(2, 14)}`,
      // rawPayload mirrors what n8n would send (for future integration)
      rawPayload: {
        function_name: `${type}_appointment_cal`,
        first_name: patient.firstName,
        last_name: patient.lastName,
        phone: patient.phone,
        reason,
        appointment_datetime: `${requestedDate}T${TIMES[timeIdx].replace(' AM', '').replace(' PM', '')}:00`,
      }
    }
  })
}
