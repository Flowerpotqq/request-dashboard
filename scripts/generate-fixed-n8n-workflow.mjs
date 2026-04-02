import fs from 'node:fs'
import path from 'node:path'

const sourcePath = String(
  process.argv[2] || 'c:/Users/Param/Downloads/Anand No CRM Integration Receptionist.json',
)
const outputPath = String(
  process.argv[3] || path.resolve(process.cwd(), 'Anand No CRM Integration Receptionist.fixed.json'),
)

const sharedBuildPayloadCode = String.raw`const body = $json || {};
const webhook = $('Webhook').first().json || {};

function normalizeRetellKeys(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const map = {
    requestedDate: 'requested_date',
    requestedDatetime: 'requested_datetime',
    requested_datetime: 'requested_datetime',
    requested_date: 'requested_date',
    timePreference: 'time_preference',
    time_preference: 'time_preference',
    timePrefernce: 'time_preference',
    appointmentDatetime: 'appointment_datetime',
    appointment_datetime: 'appointment_datetime',
    durationMinutes: 'duration_minutes',
    duration_minutes: 'duration_minutes',
    nameOnFile: 'name_on_file',
    name_on_file: 'name_on_file',
    firstName: 'first_name',
    first_name: 'first_name',
    lastName: 'last_name',
    last_name: 'last_name',
    fieldToEdit: 'field_to_edit',
    field_to_edit: 'field_to_edit',
    newValue: 'new_value',
    new_value: 'new_value',
    appointmentDate: 'appointment_date',
    appointment_date: 'appointment_date',
    oldDatetime: 'old_datetime',
    old_datetime: 'old_datetime',
    newDatetime: 'new_datetime',
    new_datetime: 'new_datetime',
  };
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[map[key] || key] = value ?? "";
  }
  return result;
}

function extractRetellParams(webhookJson) {
  const w = webhookJson || {};
  const candidates = [
    w.body?.args,
    w.body?.arguments,
    w.body?.parameters,
    w.arguments,
    w.parameters,
    w.args,
    w.body
  ];
  for (let c of candidates) {
    if (!c) continue;
    if (typeof c === 'string') {
      try { c = JSON.parse(c); } catch (e) { continue; }
    }
    if (c && typeof c === 'object' && Object.keys(c).length > 0) return c;
  }
  return {};
}

function nonEmpty(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function extractLineField(text, label) {
  const match = String(text || "").match(new RegExp(label + ":\\s*(.+)$", "im"));
  return match ? match[1].trim() : "";
}

function extractNameFromSummary(summary) {
  const raw = String(summary || "").trim();
  if (!raw) return "";
  const separators = ["—", "-", "|"];
  for (const separator of separators) {
    if (raw.includes(separator)) {
      return raw.split(separator)[0].trim();
    }
  }
  return raw;
}

function splitFullName(fullName) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: "", last_name: "" };
  if (parts.length === 1) return { first_name: parts[0], last_name: "" };
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" ")
  };
}

function splitDateTime(iso) {
  if (!iso) return { requested_date: "", requested_time: "" };
  const d = new Date(iso);
  if (isNaN(d)) return { requested_date: "", requested_time: "" };
  return {
    requested_date: d.toISOString().slice(0, 10),
    requested_time: d.toLocaleTimeString("en-CA", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Toronto"
    })
  };
}

function inferRequestType() {
  const explicit = nonEmpty(
    body.request_type,
    body.type,
    body.action,
    webhook.body?.name,
    webhook.name,
    webhook.function_name,
    webhook.tool_name
  ).toLowerCase();

  if (explicit.includes("reschedule")) return "reschedule";
  if (explicit.includes("edit")) return "edit";
  if (explicit.includes("cancel")) return "cancel";
  if (explicit.includes("book")) return "book";

  if (body.event_id && body.new_start) return "reschedule";
  if (body.event_id && body.updated_description) return "edit";
  if (body.event_id) return "cancel";
  return "book";
}

const params = normalizeRetellKeys(extractRetellParams(webhook));
const requestType = inferRequestType();
const description = nonEmpty(body.updated_description, body.description);
const summary = nonEmpty(body.summary, body.event_summary);

const fullName = nonEmpty(
  body.full_name,
  params.full_name,
  params.name_on_file,
  extractNameFromSummary(summary),
  [params.first_name, params.last_name].filter(Boolean).join(" ")
);

const nameParts = splitFullName(fullName);
const firstName = nonEmpty(body.first_name, params.first_name, nameParts.first_name);
const lastName = nonEmpty(body.last_name, params.last_name, nameParts.last_name);

const phone = nonEmpty(body.phone, params.phone, extractLineField(description, "Phone"));
const email = nonEmpty(body.email, params.email, extractLineField(description, "Email"));

let reason = nonEmpty(
  body.reason,
  params.reason,
  extractLineField(description, "Reason")
);

if (!reason && summary) {
  const separators = ["—", "-", "|"];
  for (const separator of separators) {
    if (summary.includes(separator)) {
      reason = summary.split(separator).slice(1).join(separator).trim();
      break;
    }
  }
}

if (!reason && requestType === "edit" && nonEmpty(params.field_to_edit, body.field_to_edit) === "reason") {
  reason = nonEmpty(body.new_value, params.new_value);
}

const existingDateTime = nonEmpty(
  body.old_start,
  body.start_time,
  body.existing_appointment_datetime,
  params.old_datetime,
  params.appointment_datetime
);

const requestedDateTime = nonEmpty(
  body.new_start,
  body.appointment_datetime,
  body.requested_datetime,
  body.new_datetime,
  body.start_time,
  body.old_start,
  params.new_datetime,
  params.requested_datetime,
  params.appointment_datetime,
  params.old_datetime
);

const split = splitDateTime(requestedDateTime || existingDateTime);

let notes = nonEmpty(body.notes);

if (!notes && requestType === "edit") {
  const field = nonEmpty(params.field_to_edit, body.field_to_edit);
  const value = nonEmpty(body.new_value, params.new_value);
  if (field && value) notes = "Requested " + field + " change to: " + value;
}

if (!notes && requestType === "cancel" && body.cancelled_label) {
  notes = "Caller requested cancellation for " + body.cancelled_label;
}

const callId =
  webhook.body?.call_id ||
  webhook.call_id ||
  webhook.body?.call?.id ||
  "";

const submittedAt = new Date().toISOString();

const defaultSummary = {
  book: "Booking request submitted for manual review.",
  reschedule: "Reschedule request submitted for manual review.",
  edit: "Edit request submitted for manual review.",
  cancel: "Cancellation request submitted for manual review."
};

return [
  {
    json: {
      clinic_id: "marketplace-dental-centre",
      location_name: "Marketplace Dental Centre",
      request_type: requestType,
      status: "pending",
      patient: {
        first_name: firstName,
        last_name: lastName,
        full_name: [firstName, lastName].filter(Boolean).join(" "),
        phone,
        email
      },
      request_details: {
        reason,
        requested_datetime: requestedDateTime || existingDateTime,
        requested_date: split.requested_date,
        requested_time: split.requested_time,
        duration_minutes: body.duration_minutes || params.duration_minutes || 60,
        existing_appointment_id: body.event_id || "",
        existing_appointment_datetime: existingDateTime
      },
      ai_call_summary: defaultSummary[requestType] || "Manual request submitted for review.",
      submission_info: {
        submitted_at: submittedAt,
        call_id: callId,
        source: "n8n",
        manual_action_required: true
      },
      notes,
      raw_payload: {
        webhook_params: params,
        branch_output: body
      }
    }
  }
];`

const manualReviewResponseName = 'Respond to Webhook Manual Review'

function getNode(workflow, name) {
  return workflow.nodes.find((node) => node.name === name)
}

function upsertNode(workflow, node) {
  const index = workflow.nodes.findIndex((item) => item.name === node.name)
  if (index === -1) {
    workflow.nodes.push(node)
  } else {
    workflow.nodes[index] = node
  }
}

const workflow = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))

workflow.nodes = workflow.nodes.filter(
  (node) => !['Delete an event', 'Respond to Webhook3'].includes(node.name),
)
delete workflow.connections['Delete an event']
delete workflow.connections['Respond to Webhook3']

for (const name of [
  'Build Payload For Website',
  'Build Payload For Website1',
  'Build Payload For Website2',
  'Build Payload For Website3',
  'Build Payload For Website4',
]) {
  const node = getNode(workflow, name)
  if (node) node.parameters.jsCode = sharedBuildPayloadCode
}

const processInfo = getNode(workflow, 'Process info')
if (processInfo?.parameters?.jsCode) {
  processInfo.parameters.jsCode = processInfo.parameters.jsCode.replace(
    'email: params.email || "mail@example.com",',
    'email: params.email || "",',
  )
}

const cancelLogic = getNode(workflow, 'Cancel Logic')
if (cancelLogic?.parameters?.jsCode) {
  cancelLogic.parameters.jsCode = cancelLogic.parameters.jsCode.replace(
    `return [{
  json: {
    success: true,
    event_id: match.json.id,
    cancelled_label: label,
    message: "I've cancelled your appointment on " + label + ". Would you like to rebook?"
  }
}];`,
    `return [{
  json: {
    success: true,
    event_id: match.json.id,
    summary: match.json.summary || "",
    description: match.json.description || "",
    start_time: startDT,
    phone: rawPhone,
    cancelled_label: label,
    message: "Cancellation request submitted for manual review."
  }
}];`,
  )
}

for (const name of ['HTTP Request', 'HTTP Request1', 'HTTP Request2', 'HTTP Request3', 'HTTP Request4']) {
  const node = getNode(workflow, name)
  if (node) {
    node.parameters.url = 'http://localhost:3000/api/requests'
    node.parameters.jsonBody = '={{ $json }}'
  }
}

const responseUpdates = {
  'Respond to Webhook2': '{ "success": true, "message": "Your reschedule request has been submitted for manual review." }',
  'Respond to Webhook3': '{ "success": true, "message": "Your cancellation request has been submitted for manual review." }',
  'Respond to Webhook7': '{ "success": true, "message": "Your update request has been submitted for manual review." }',
  'Respond to Webhook9': '{ "success": true, "message": "Your update request has been submitted for manual review." }',
  'Respond to Webhook10': '{ "success": true, "message": "Your update request has been submitted for manual review." }',
}

for (const [name, responseBody] of Object.entries(responseUpdates)) {
  const node = getNode(workflow, name)
  if (node) node.parameters.responseBody = responseBody
}

upsertNode(workflow, {
  parameters: {
    respondWith: 'json',
    responseBody: '{ "success": true, "message": "Your request has been submitted for manual review." }',
    options: {},
  },
  id: 'respond-manual-review',
  name: manualReviewResponseName,
  type: 'n8n-nodes-base.respondToWebhook',
  typeVersion: 1.5,
  position: [1568, 1536],
})

workflow.connections['HTTP Request'] = {
  main: [[{ node: manualReviewResponseName, type: 'main', index: 0 }]],
}

workflow.connections['Cancel Logic'] = {
  main: [[{ node: 'Build Payload For Website', type: 'main', index: 0 }]],
}

workflow.versionId = 'manual-dashboard-fixed'

fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2) + '\n', 'utf8')
console.log(`Wrote fixed workflow to ${outputPath}`)
