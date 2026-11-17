import { ApiError } from '@/common/utilities/http'
import type { MatchScreen, MatchState } from '../types/match.types'

export function resolveMatchScreen(state: MatchState | undefined, error: unknown): MatchScreen {
  if (error instanceof ApiError && error.status === 404) return 'closed'
  if (!state) return 'loading'
  if (state.status === 'CLOSED') return 'closed'
  if (state.youAre === 'host') return state.status === 'WAITING' ? 'lobby' : 'found'
  if (state.youAre === 'guest') return 'found'
  return state.status === 'WAITING' ? 'invite' : 'unavailable'
}

export function closedMessage(state: MatchState | undefined): string {
  if (!state) return 'Ссылка больше не работает: матч отменён или не существует. Попросите новую ссылку.'
  if (state.closeReason === 'LEFT' && state.youAre === 'host') return 'Соперник вышел из матча.'
  return 'Матч отменён. Попросите новую ссылку.'
}
