import { describe, expect, it } from 'vitest'
import { ApiError } from '@/common/utilities/http'
import type { MatchState } from '../types/match.types'
import { closedMessage, resolveMatchScreen } from './matchScreen'

function state(patch: Partial<MatchState>): MatchState {
  return {
    matchId: 'ABC234',
    inviteLink: 'http://localhost/match/ABC234',
    status: 'WAITING',
    closeReason: null,
    hostName: 'Алиса',
    guestName: null,
    youAre: null,
    stateVersion: 0,
    ...patch,
  }
}

describe('resolveMatchScreen', () => {
  it('shows loading until the first state arrives', () => {
    expect(resolveMatchScreen(undefined, null)).toBe('loading')
  })

  it('treats a missing match as closed', () => {
    expect(resolveMatchScreen(undefined, new ApiError(404, 'MATCH_NOT_FOUND', ''))).toBe('closed')
  })

  it('keeps the last state on a network error', () => {
    expect(resolveMatchScreen(state({ youAre: 'host' }), new TypeError('Failed to fetch'))).toBe('lobby')
  })

  it.each([
    [{ youAre: 'host', status: 'WAITING' }, 'lobby'],
    [{ youAre: 'host', status: 'READY' }, 'found'],
    [{ youAre: 'guest', status: 'READY' }, 'found'],
    [{ youAre: null, status: 'WAITING' }, 'invite'],
    [{ youAre: null, status: 'READY' }, 'unavailable'],
    [{ youAre: 'host', status: 'CLOSED' }, 'closed'],
    [{ youAre: null, status: 'CLOSED' }, 'closed'],
  ] as const)('maps %j to %s', (patch, screen) => {
    expect(resolveMatchScreen(state(patch), null)).toBe(screen)
  })
})

describe('closedMessage', () => {
  it('tells the host the opponent left', () => {
    expect(closedMessage(state({ youAre: 'host', closeReason: 'LEFT' }))).toBe('Соперник вышел из матча.')
  })

  it('tells the guest the match is cancelled', () => {
    expect(closedMessage(state({ youAre: 'guest', closeReason: 'LEFT' }))).toBe('Матч отменён. Попросите новую ссылку.')
  })

  it('explains a dead link when there is no state', () => {
    expect(closedMessage(undefined)).toContain('Ссылка больше не работает')
  })
})
