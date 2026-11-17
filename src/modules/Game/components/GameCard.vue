<script setup lang="ts">
import { computed } from 'vue'
import { perkText } from '../rules/catalog'
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

const TYPE_LABELS = { player: 'ИГРОК', trainer: 'ТРЕНЕР', buff: 'БАФ', debuff: 'ДЕБАФ' } as const
const isEffect = computed(() => props.card.kind === 'buff' || props.card.kind === 'debuff')
const accent = computed(() => (props.card.kind === 'buff' || props.card.kind === 'debuff' ? props.card.kind : props.card.el))
</script>

<template>
  <component
    :is="interactive ? 'button' : 'div'"
    :type="interactive ? 'button' : undefined"
    class="gcard"
    :class="[accent, { sm: small, sel: selected, target }]"
    :disabled="interactive ? disabled : undefined"
    :aria-pressed="interactive && selected !== undefined ? selected : undefined"
  >
    <div class="photo">
      <span class="type">{{ TYPE_LABELS[card.kind] }}</span>
      <span v-if="card.kind === 'player'" class="rar">{{ card.rar }}</span>
      <svg v-if="isEffect" viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" stroke-linecap="round" /></svg>
      <svg v-else viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" stroke-linecap="round" /></svg>
    </div>
    <div class="body">
      <div class="nm">{{ card.name }}</div>
      <div class="el" :class="'tx-' + (card.el ?? 'neutral')">{{ elementName(card.el) }}</div>
      <div v-if="card.kind === 'player'" class="val">{{ card.str }}</div>
      <div v-else-if="card.kind === 'trainer'" class="val">×{{ card.coef }}</div>
      <div v-else class="perk">{{ perkText(card) }}</div>
    </div>
    <slot />
  </component>
</template>
