// Карты-заглушки из прототипа. Настоящий каталог будет отдавать сервер: GET /catalog.
import type { EffectCard, Element, PlayerCard, TrainerCard } from '../types/game.types'
import { EL, ELS } from './strength'

const PLAYER_NAMES: Record<Element, string[]> = {
  morality: ['Сергей Лотин', 'Мария Волкова', 'Илья Орлов', 'Дарья Ким', 'Артём Белов', 'Полина Седых', 'Глеб Ростов', 'Ника Лаптева', 'Олег Шуров'],
  erudition: ['Анна Зорина', 'Тимур Гаев', 'Вера Ломова', 'Кирилл Тен', 'Ольга Рябова', 'Денис Пак', 'Ева Миронова', 'Лев Котов', 'Яна Фролова'],
  luck: ['Макар Дронов', 'Алиса Ветрова', 'Степан Ильин', 'Зоя Гусева', 'Фёдор Ли', 'Ксения Блинова', 'Рома Чижов', 'Лиза Нестерова', 'Павел Юдин'],
}
const RARITIES: [PlayerCard['rar'], number, number][] = [['R', 40, 75], ['SR', 70, 105], ['SSR', 100, 130]]
const EFFECTS: [EffectCard['kind'], Element | null, string, number][] = [
  ['buff', null, 'Студсовет', 25], ['buff', null, 'Кофе-брейк', 20], ['buff', 'morality', 'Командный дух', 30],
  ['buff', 'erudition', 'Конспект', 30], ['buff', 'luck', 'Счастливый билет', 30], ['buff', null, 'Поддержка зала', 20],
  ['buff', 'morality', 'Наставник', 25], ['buff', 'erudition', 'Олимпиада', 25], ['buff', 'luck', 'Автомат', 25],
  ['debuff', null, 'Сессия', 25], ['debuff', null, 'Дедлайн', 20], ['debuff', 'morality', 'Выговор', 30],
  ['debuff', 'erudition', 'Неуд', 30], ['debuff', 'luck', 'Неявка', 30], ['debuff', null, 'Пара в 8:00', 20],
  ['debuff', 'morality', 'Сплетня', 25], ['debuff', 'erudition', 'Пересдача', 25], ['debuff', 'luck', 'Чёрный кот', 25],
]

export interface CatalogRandom {
  next: () => number
  nextId: () => number
}

export function shuffle<T>(items: T[], random: CatalogRandom): T[] {
  const result = items.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random.next() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function makePlayers(random: CatalogRandom): PlayerCard[] {
  const players: PlayerCard[] = []
  for (const el of ELS) {
    PLAYER_NAMES[el].forEach((name, i) => {
      const [rar, lo, hi] = RARITIES[i < 5 ? 0 : i < 8 ? 1 : 2]
      players.push({ id: random.nextId(), kind: 'player', el, name, str: Math.round((lo + random.next() * (hi - lo)) / 5) * 5, rar })
    })
  }
  return shuffle(players, random)
}

export function makeTrainers(random: CatalogRandom): TrainerCard[] {
  return [
    { id: random.nextId(), kind: 'trainer', el: 'morality', name: 'Анна Петрова', coef: 1.25 },
    { id: random.nextId(), kind: 'trainer', el: 'erudition', name: 'Борис Нечаев', coef: 1.4 },
    { id: random.nextId(), kind: 'trainer', el: 'luck', name: 'Инга Смолина', coef: 1.5 },
  ]
}

export function makeEffects(random: CatalogRandom): EffectCard[] {
  return shuffle(EFFECTS.map(([kind, el, name, val]) => ({ id: random.nextId(), kind, el, name, val })), random)
}

export function perkText(card: EffectCard): string {
  if (card.kind === 'buff') return `+${card.val} силы своей карте${card.el ? ', ×1.25 если ' + EL[card.el].name : ''}`
  return `−${card.val} силы карте соперника${card.el ? ', ×1.25 если она ' + EL[EL[card.el].beats].name : ''}`
}
