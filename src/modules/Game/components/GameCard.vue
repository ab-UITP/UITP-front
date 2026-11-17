<script setup lang="ts">
import { computed } from 'vue'
import { elementName } from '../rules/strength'
import type { GameCardData } from '../types/game.types'

const props = defineProps<{
  card: GameCardData
  small?: boolean
  interactive?: boolean
  selected?: boolean
  target?: boolean
  disabled?: boolean
}>()

const TYPE_LABELS = { player: 'Игрок', trainer: 'Тренер', buff: 'Бафф', debuff: 'Дебафф' } as const
const accent = computed(() => (props.card.kind === 'buff' || props.card.kind === 'debuff' ? props.card.kind : props.card.el))
// Крупную цифру силы на макете игрока обводит рукописный мазок, он выходит за правый край карты
const label = computed(() => {
  const { card } = props
  const extra = card.kind === 'player' ? `, сила ${card.str}, ${card.rar}` : card.kind === 'trainer' ? `, ×${card.coef}` : ''
  return `${TYPE_LABELS[card.kind]} ${card.name}, ${elementName(card.el)}${extra}. ${card.perk}`
})
</script>

<template>
  <component
    :is="interactive ? 'button' : 'div'"
    :type="interactive ? 'button' : undefined"
    class="gcard"
    :class="[accent, `k-${card.kind}`, { sm: small, sel: selected, target }]"
    :disabled="interactive ? disabled : undefined"
    :aria-pressed="interactive && selected !== undefined ? selected : undefined"
    :aria-label="label"
    :title="label"
  >
    <img class="art" :src="card.art" :alt="label" draggable="false" />
    <slot />
  </component>
</template>
