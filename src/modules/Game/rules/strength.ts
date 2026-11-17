// Расчёт силы команды из прототипа: база → тренер → стихия команды → преимущество ×1.25 → бафы/дебафы.
import type { Element, Side, Strength } from '../types/game.types'

export const EL: Record<Element, { name: string; beats: Element }> = {
  morality: { name: 'Мораль', beats: 'erudition' },
  erudition: { name: 'Эрудиция', beats: 'luck' },
  luck: { name: 'Удача', beats: 'morality' },
}
export const ELS: Element[] = ['morality', 'erudition', 'luck']

export function beats(a: Element | null, b: Element | null): boolean {
  return !!a && !!b && EL[a].beats === b
}

export function elementName(el: Element | null): string {
  return el ? EL[el].name : 'Без стихии'
}

export function teamElement(side: Side): Element | null {
  const perElement = new Map<Element, number[]>()
  for (const card of side.table) {
    const strength = card.str * (side.trainer && card.el === side.trainer.el ? side.trainer.coef : 1)
    perElement.set(card.el, [...(perElement.get(card.el) ?? []), strength])
  }
  const averages = [...perElement].map(([el, values]) => [el, values.reduce((a, b) => a + b, 0) / values.length] as const)
  if (!averages.length) return null
  return averages.sort((a, b) => b[1] - a[1])[0][0]
}

export function calcStrength(me: Side, opponent: Side): Strength {
  const trainer = me.trainer
  const base = me.table.reduce((sum, card) => sum + card.str, 0)
  const withTrainer = me.table.reduce((sum, card) => sum + card.str * (trainer && card.el === trainer.el ? trainer.coef : 1), 0)
  const el = teamElement(me)
  const adv = beats(el, teamElement(opponent)) ? 1.25 : 1
  let buffs = 0
  let debuffs = 0
  for (const played of me.played) {
    if (played.card.kind !== 'buff') continue
    const target = me.table.find((card) => card.id === played.target)
    if (target) buffs += played.card.val * (played.card.el && played.card.el === target.el ? 1.25 : 1)
  }
  for (const played of opponent.played) {
    if (played.card.kind !== 'debuff') continue
    const target = me.table.find((card) => card.id === played.target)
    if (target) debuffs += played.card.val * (beats(played.card.el, target.el) ? 1.25 : 1)
  }
  return {
    base,
    trainer: Math.round(withTrainer - base),
    el,
    adv,
    advPts: Math.round(withTrainer * (adv - 1)),
    buffs: Math.round(buffs),
    debuffs: Math.round(debuffs),
    total: Math.round(withTrainer * adv + buffs - debuffs),
  }
}
