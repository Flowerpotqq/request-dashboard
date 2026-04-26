const ENV_ACCESS_TOKEN = String(import.meta.env.VITE_TENANT_ACCESS_TOKEN ?? '').trim()

function readAccessTokenFromLocation() {
  if (typeof window === 'undefined') return ''

  const url = new URL(window.location.href)
  const queryToken = url.searchParams.get('access') || url.searchParams.get('tenant')
  if (queryToken) return queryToken.trim()

  const pathMatch = url.pathname.match(/^\/(?:t|clinic)\/([^/]+)/)
  if (pathMatch?.[1]) {
    return decodeURIComponent(pathMatch[1]).trim()
  }

  return ''
}

export const TENANT_CONTEXT = Object.freeze({
  accessToken: ENV_ACCESS_TOKEN || readAccessTokenFromLocation(),
})
