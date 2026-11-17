import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLocalGame } from './useLocalGame'

function start() {
  const game = useLocalGame('Саша', 'Макс')
  game.selectTrainer(game.state.me.trainers[0])
  game.startFirstRound()
  return game
}

describe('useLocalGame', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('deals three players and three effects to each side', () => {
    const { state } = useLocalGame('Саша', 'Макс')
    expect(state.screen).toBe('trainer')
    expect(state.me.table).toHaveLength(3)
    expect(state.me.handB).toHaveLength(3)
    expect(state.op.table).toHaveLength(3)
  })

  it('lets a buff target only own cards and a debuff only the opponent', () => {
    const game = start()
    const buff = { id: 900, kind: 'buff', el: null, name: 'b', val: 20, art: '', perk: '' } as const
    game.state.me.handB = [buff]
    game.selectHand(buff)
    expect(game.isTarget(true)).toBe(true)
    expect(game.isTarget(false)).toBe(false)

    game.applyTo(game.state.op.table[0], false)
    expect(game.state.me.played).toHaveLength(0)

    game.applyTo(game.state.me.table[0], true)
    expect(game.state.me.played).toHaveLength(1)
    expect(game.state.me.handB).toHaveLength(0)

    game.undo(game.state.me.played[0])
    expect(game.state.me.played).toHaveLength(0)
    expect(game.state.me.handB).toHaveLength(1)
  })

  it('grows the table by one each round as in the charter resource table', () => {
    const game = start()
    for (const [round, tableSize, handSize] of [[1, 3, 0], [2, 4, 1], [3, 5, 2]]) {
      expect(game.state.round).toBe(round)
      expect(game.state.me.table).toHaveLength(tableSize)
      expect(game.state.me.handP).toHaveLength(handSize)
      expect(game.state.op.table).toHaveLength(tableSize)

      // ничьи не дают досрочно закончить матч
      game.state.me.wins = 0
      game.state.op.wins = 0
      game.ready()
      vi.runAllTimers()
      expect(game.state.screen).toBe('reveal')
      game.state.me.wins = 0
      game.state.op.wins = 0

      game.afterReveal()
      expect(game.state.screen).toBe('refill')
      game.discard(game.state.me.table[0])
      game.refillForward()
      game.place(game.state.me.handP[0])
      game.place(game.state.me.handP[1])
      game.nextRound()
    }
    expect(game.state.round).toBe(4)
    expect(game.state.me.table).toHaveLength(6)
    expect(game.state.me.handP).toHaveLength(3)
  })

  it('finishes when a side reaches three wins', () => {
    const game = start()
    game.state.me.wins = 2
    game.state.op.wins = 0
    game.state.op.table = [{ id: 901, kind: 'player', el: 'luck', name: 'o', str: 1, rar: 'R', art: '', perk: '' }]
    game.state.op.handB = []
    game.ready()
    vi.runAllTimers()
    expect(game.matchOver.value).toBe(true)
    game.afterReveal()
    expect(game.state.screen).toBe('result')
    expect(game.state.iWon).toBe(true)
    expect(game.state.resultReason).toBe('Саша первым набрал 3 победы')
  })

  it('counts a tie after four rounds by the fourth round', () => {
    const game = start()
    game.state.me.wins = 2
    game.state.op.wins = 2
    game.state.history = [1, 2, 3, 4].map((round) => ({ round, me: 1, op: 2, winner: 'op' }))
    game.afterReveal()
    expect(game.state.iWon).toBe(false)
    expect(game.state.resultReason).toBe('Счёт 2 : 2, решил четвёртый раунд')
  })

  it('resets everything on rematch', () => {
    const game = start()
    game.surrender()
    expect(game.state.screen).toBe('result')
    game.rematch()
    expect(game.state.screen).toBe('trainer')
    expect(game.state.me.trainer).toBeNull()
    expect(game.state.history).toHaveLength(0)
  })
})
