import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const TENANT_LINKS_FILE = path.resolve(
  process.cwd(),
  process.env.TENANT_LINKS_FILE || 'data/tenant-links.json',
)

function asString(value) {
  if (value == null) return ''
  return typeof value === 'string' ? value.trim() : String(value).trim()
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

async function ensureTenantFile() {
  await mkdir(path.dirname(TENANT_LINKS_FILE), { recursive: true })

  try {
    await access(TENANT_LINKS_FILE)
  } catch {
    await writeFile(TENANT_LINKS_FILE, '[]\n', 'utf8')
  }
}

async function readTenantEntries() {
  await ensureTenantFile()
  const raw = await readFile(TENANT_LINKS_FILE, 'utf8')
  if (!raw.trim()) return []

  const parsed = JSON.parse(raw)
  return Array.isArray(parsed) ? parsed : []
}

function normalizeTenant(entry) {
  const tenant = asObject(entry)

  return {
    accessToken: asString(
      tenant.access_token || tenant.accessToken || tenant.token || tenant.share_token,
    ),
    clientId: asString(tenant.client_id || tenant.clientId),
    clinicId: asString(tenant.clinic_id || tenant.clinicId),
    clinicName: asString(tenant.clinic_name || tenant.clinicName || tenant.location_name),
    receptionistName: asString(
      tenant.receptionist_name || tenant.receptionistName || tenant.user_name,
    ),
    linkLabel: asString(tenant.link_label || tenant.linkLabel),
  }
}

export async function findTenantByAccessToken(accessToken) {
  const token = asString(accessToken)
  if (!token) return null

  const entries = await readTenantEntries()

  for (const entry of entries) {
    const tenant = normalizeTenant(entry)
    if (tenant.accessToken && tenant.accessToken === token) {
      return tenant
    }
  }

  return null
}

export function toPublicTenant(tenant) {
  const normalized = normalizeTenant(tenant)

  return {
    clientId: normalized.clientId,
    clinicId: normalized.clinicId,
    clinicName: normalized.clinicName,
    receptionistName: normalized.receptionistName,
    linkLabel: normalized.linkLabel,
  }
}
