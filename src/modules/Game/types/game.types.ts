export type Element = 'morality' | 'erudition' | 'luck'

export interface PlayerCard {
  id: number
  kind: 'player'
  el: Element
  name: string
  str: number
  rar: 'R' | 'SR' | 'SSR'
  /** Путь к макету карты из PDF */
  art: string
  /** Текст способности с макета */
  perk: string
}

export interface TrainerCard {
  id: number
  kind: 'trainer'
  el: Element
  name: string
  coef: number
  art: string
  perk: string
}

export interface EffectCard {
  id: number
  kind: 'buff' | 'debuff'
  el: Element | null
  name: string
  val: number
  art: string
  perk: string
}

export type GameCardData = PlayerCard | TrainerCard | EffectCard

export interface PlayedEffect {
  card: EffectCard
  target: number
}

export interface Side {
  name: string
  deckP: PlayerCard[]
  deckB: EffectCard[]
  trainers: TrainerCard[]
  trainer: TrainerCard | null
  table: PlayerCard[]
  handP: PlayerCard[]
  handB: EffectCard[]
  played: PlayedEffect[]
  wins: number
}

export interface Strength {
  base: number
  trainer: number
  el: Element | null
  adv: number
  advPts: number
  buffs: number
  debuffs: number
  total: number
}

export type RoundWinner = 'me' | 'op' | null

export interface RoundRecord {
  round: number
  me: number
  op: number
  winner: RoundWinner
}

export type GameScreen = 'trainer' | 'round' | 'reveal' | 'refill' | 'result'
