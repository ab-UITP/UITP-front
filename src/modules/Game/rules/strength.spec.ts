import { describe, expect, it } from 'vitest'
import type { EffectCard, Element, PlayerCard, Side, TrainerCard } from '../types/game.types'
import { beats, calcStrength, teamElement } from './strength'

let id = 0
const player = (el: Element, str: number): PlayerCard => ({ id: ++id, kind: 'player', el, name: 'p', str, rar: 'R', art: '', perk: '' })
const trainer = (el: Element, coef: number): TrainerCard => ({ id: ++id, kind: 'trainer', el, name: 't', coef, art: '', perk: '' })
const effect = (kind: EffectCard['kind'], el: Element | null, val: number): EffectCard => ({ id: ++id, kind, el, name: 'e', val, art: '', perk: '' })

function side(patch: Partial<Side>): Side {
  return { name: 's', deckP: [], deckB: [], trainers: [], trainer: null, table: [], handP: [], handB: [], played: [], wins: 0, ...patch }
}

describe('beats', () => {
  it('follows the cycle morality > erudition > luck > morality', () => {
    expect(beats('morality', 'erudition')).toBe(true)
    expect(beats('erudition', 'luck')).toBe(true)
    expect(beats('luck', 'morality')).toBe(true)
    expect(beats('erudition', 'morality')).toBe(false)
    expect(beats(null, 'luck')).toBe(false)
  })
})

describe('teamElement', () => {
  it('picks the element with the highest average after the trainer', () => {
    const team = side({ table: [player('luck', 90), player('morality', 80)], trainer: trainer('morality', 1.25) })
    expect(teamElement(team)).toBe('morality')
  })

  it('returns null for an empty table', () => {
    expect(teamElement(side({}))).toBeNull()
  })
})

describe('calcStrength', () => {
  it('applies trainer, element advantage, buffs and debuffs in order', () => {
    const mine = player('morality', 100)
    const theirs = player('erudition', 50)
    const me = side({ table: [mine], trainer: trainer('morality', 1.5), played: [{ card: effect('buff', 'morality', 20), target: mine.id }] })
    const opponent = side({ table: [theirs], played: [{ card: effect('debuff', 'erudition', 20), target: mine.id }] })

    expect(calcStrength(me, opponent)).toEqual({
      base: 100,
      trainer: 50,
      el: 'morality',
      adv: 1.25,
      advPts: 38,
      buffs: 25,
      debuffs: 20,
      total: 193,
    })
  })

  it('ignores effects whose target left the table', () => {
    const me = side({ table: [player('luck', 60)], played: [{ card: effect('buff', null, 30), target: -1 }] })
    expect(calcStrength(me, side({})).total).toBe(60)
  })
})
