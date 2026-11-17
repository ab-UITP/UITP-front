import { computed, reactive } from 'vue'
import { makeEffects, makePlayers, makeTrainers, type CatalogRandom } from '../rules/catalog'
import { calcStrength } from '../rules/strength'
import type { EffectCard, GameScreen, PlayedEffect, PlayerCard, RoundRecord, Side, TrainerCard } from '../types/game.types'

const BOT_DELAY_MS = 1400
const WINS_TO_FINISH = 3
const MAX_ROUNDS = 4

function createRandom(): CatalogRandom {
  let id = 0
  return { next: Math.random, nextId: () => ++id }
}

function newSide(name: string, random: CatalogRandom): Side {
  const side: Side = {
    name,
    deckP: makePlayers(random),
    deckB: makeEffects(random),
    trainers: makeTrainers(random),
    trainer: null,
    table: [],
    handP: [],
    handB: [],
    played: [],
    wins: 0,
  }
  side.table = side.deckP.splice(0, 3)
  side.handB = side.deckB.splice(0, 3)
  return side
}

/** Партия в браузере по логике прототипа: соперник-бот. Заменится сервером, когда он будет готов. */
export function useLocalGame(playerName: string, opponentName: string) {
  const random = createRandom()
  const state = reactive({
    screen: 'trainer' as GameScreen,
    me: newSide(playerName, random),
    op: newSide(opponentName, random),
    round: 1,
    history: [] as RoundRecord[],
    sel: null as EffectCard | null,
    waiting: false,
    refillStep: 1,
    discarded: null as PlayerCard | null,
    placed: [] as PlayerCard[],
    resultReason: '',
    iWon: false,
  })

  const meCalc = computed(() => calcStrength(state.me, state.op))
  const opCalc = computed(() => calcStrength(state.op, state.me))
  const lastRound = computed(() => state.history[state.history.length - 1])
  const matchOver = computed(
    () => state.me.wins >= WINS_TO_FINISH || state.op.wins >= WINS_TO_FINISH || state.history.length >= MAX_ROUNDS,
  )

  function selectTrainer(trainer: TrainerCard) {
    state.me.trainer = trainer
  }

  function startFirstRound() {
    state.op.trainer = state.op.trainers[Math.floor(random.next() * state.op.trainers.length)]
    state.screen = 'round'
  }

  function selectHand(card: EffectCard) {
    state.sel = state.sel?.id === card.id ? null : card
  }

  function clearSelection() {
    state.sel = null
  }

  function isTarget(own: boolean) {
    return !!state.sel && !state.waiting && ((state.sel.kind === 'buff' && own) || (state.sel.kind === 'debuff' && !own))
  }

  function applyTo(card: PlayerCard, own: boolean) {
    if (!isTarget(own) || !state.sel) return
    const effectId = state.sel.id
    state.me.played.push({ card: state.sel, target: card.id })
    state.me.handB = state.me.handB.filter((effect) => effect.id !== effectId)
    state.sel = null
  }

  function undo(played: PlayedEffect) {
    state.me.played = state.me.played.filter((item) => item.card.id !== played.card.id)
    state.me.handB.push(played.card)
  }

  function botPlay() {
    const { op, me } = state
    const picks = op.handB.slice(0, Math.min(op.handB.length, 1 + Math.floor(random.next() * 2)))
    for (const card of picks) {
      const pool = card.kind === 'buff' ? op.table : me.table
      const target = pool.slice().sort((a, z) => z.str - a.str)[0]
      op.played.push({ card, target: target.id })
    }
    op.handB = op.handB.filter((card) => !picks.some((pick) => pick.id === card.id))
  }

  function revealRound() {
    const my = meCalc.value.total
    const their = opCalc.value.total
    const winner = my > their ? 'me' : their > my ? 'op' : null
    if (winner === 'me') state.me.wins++
    else if (winner === 'op') state.op.wins++
    state.history.push({ round: state.round, me: my, op: their, winner })
  }

  function ready() {
    state.waiting = true
    state.sel = null
    setTimeout(() => {
      botPlay()
      revealRound()
      state.waiting = false
      state.screen = 'reveal'
    }, BOT_DELAY_MS)
  }

  function finish(iWon: boolean, reason: string) {
    state.iWon = iWon
    state.resultReason = reason
    state.screen = 'result'
  }

  function afterReveal() {
    if (!matchOver.value) {
      state.me.handP.push(...state.me.deckP.splice(0, 3))
      state.refillStep = 1
      state.discarded = null
      state.placed = []
      state.screen = 'refill'
      return
    }
    const { me, op } = state
    if (me.wins === op.wins) {
      finish(lastRound.value.winner === 'me', 'Счёт 2 : 2, решил четвёртый раунд')
    } else {
      const iWon = me.wins > op.wins
      finish(iWon, `${iWon ? me.name : op.name} первым набрал 3 победы`)
    }
  }

  function discard(card: PlayerCard) {
    if (state.refillStep === 1) state.discarded = state.discarded?.id === card.id ? null : card
  }

  function place(card: PlayerCard) {
    if (state.refillStep !== 2) return
    const index = state.placed.findIndex((item) => item.id === card.id)
    if (index >= 0) state.placed.splice(index, 1)
    else if (state.placed.length < 2) state.placed.push(card)
  }

  function refillForward() {
    state.refillStep = 2
  }

  function refillBack() {
    state.refillStep = 1
    state.placed = []
  }

  function nextRound() {
    const { me, op, discarded, placed } = state
    me.table = me.table.filter((card) => card.id !== discarded?.id).concat(placed)
    me.handP = me.handP.filter((card) => !placed.some((item) => item.id === card.id))
    // бот: добор 3, сброс слабейшего, выкладка 2 сильнейших
    op.handP.push(...op.deckP.splice(0, 3))
    op.table.sort((a, z) => a.str - z.str)
    op.table.shift()
    op.handP.sort((a, z) => z.str - a.str)
    op.table.push(...op.handP.splice(0, 2))
    for (const side of [me, op]) {
      side.handB.push(...side.deckB.splice(0, 2))
      side.played = []
    }
    state.round++
    state.refillStep = 1
    state.screen = 'round'
  }

  function surrender() {
    state.op.wins = Math.max(state.op.wins, WINS_TO_FINISH)
    finish(false, 'Вы сдались')
  }

  function winByOpponentAbsence() {
    state.me.wins = WINS_TO_FINISH
    finish(true, `${state.op.name} не вернулся за 60 секунд`)
  }

  function rematch() {
    state.me = newSide(playerName, random)
    state.op = newSide(opponentName, random)
    state.round = 1
    state.history = []
    state.sel = null
    state.resultReason = ''
    state.screen = 'trainer'
  }

  return {
    state,
    meCalc,
    opCalc,
    lastRound,
    matchOver,
    selectTrainer,
    startFirstRound,
    selectHand,
    clearSelection,
    isTarget,
    applyTo,
    undo,
    ready,
    afterReveal,
    discard,
    place,
    refillForward,
    refillBack,
    nextRound,
    surrender,
    winByOpponentAbsence,
    rematch,
  }
}

export type LocalGame = ReturnType<typeof useLocalGame>
