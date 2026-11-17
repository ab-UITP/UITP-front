import { postJson, request } from '@/common/utilities/http'
import type { MatchState } from '../types/match.types'

export function createMatch(): Promise<MatchState> {
  return postJson('/matches', {})
}

export function joinMatch(matchId: string): Promise<MatchState> {
  return postJson(`/matches/${matchId}/join`, {})
}

export function leaveMatch(matchId: string): Promise<unknown> {
  return postJson(`/matches/${matchId}/leave`, {})
}

/** С `since` сервер отвечает, когда версия вырастет, или через 25 с. */
export function fetchMatchState(matchId: string, since: number | undefined, signal?: AbortSignal): Promise<MatchState> {
  const query = since === undefined ? '' : `?since=${since}`
  return request(`/matches/${matchId}/state${query}`, { signal })
}
