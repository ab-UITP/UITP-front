import { request } from '@/common/utilities/http'

const HEALTH_TIMEOUT_MS = 5000

export function fetchHealth(): Promise<{ ok: boolean }> {
  return request('/health', { signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS) })
}
