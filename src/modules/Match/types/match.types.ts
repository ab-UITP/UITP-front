export type MatchStatus = 'WAITING' | 'READY' | 'CLOSED'
export type MatchRole = 'host' | 'guest'

export interface MatchState {
  matchId: string
  inviteLink: string
  status: MatchStatus
  closeReason: 'CANCELLED' | 'LEFT' | null
  hostName: string
  guestName: string | null
  youAre: MatchRole | null
  stateVersion: number
}

export type MatchScreen = 'loading' | 'lobby' | 'invite' | 'unavailable' | 'found' | 'closed'
