<script setup lang="ts">
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { computed } from 'vue'
import type { LocalGame } from '../composables/useLocalGame'
import { elementName, teamElement } from '../rules/strength'
import GameCard from './GameCard.vue'
import ScoreLine from './ScoreLine.vue'

const props = defineProps<{ game: LocalGame }>()
const state = computed(() => props.game.state)
const last = computed(() => props.game.lastRound.value)
const matchOver = computed(() => props.game.matchOver.value)

const sides = computed(() => [
  { key: 'me', calc: props.game.meCalc.value, player: state.value.me, opponent: state.value.op },
  { key: 'op', calc: props.game.opCalc.value, player: state.value.op, opponent: state.value.me },
])
const roundTag = computed(() => {
  if (last.value.winner === 'me') return { value: 'Раунд ваш', severity: 'success' }
  if (last.value.winner === 'op') return { value: 'Раунд за соперником', severity: 'danger' }
  return { value: 'Ничья в раунде', severity: 'warn' }
})
const fmt = (n: number) => (n > 0 ? '+' : '') + n
</script>

<template>
  <div class="table" style="grid-template-rows: auto auto auto">
    <div class="scorebar">
      <Tag :value="`Итог раунда ${last.round}`" severity="secondary" />
      <ScoreLine :my-name="state.me.name" :opponent-name="state.op.name" :my-wins="state.me.wins" :opponent-wins="state.op.wins" />
      <Tag :value="roundTag.value" :severity="roundTag.severity" />
    </div>
    <div class="reveal-grid">
      <div v-for="side in sides" :key="side.key" class="side" :class="{ win: last.winner === side.key }">
        <div class="head">
          <div class="who-line">
            <Avatar :label="side.player.name[0]?.toUpperCase()" shape="circle" />
            <span class="name">{{ side.player.name }}</span>
          </div>
          <Tag :value="'Стихия: ' + elementName(side.calc.el)" severity="secondary" />
        </div>
        <div class="row">
          <GameCard v-for="card in side.player.table" :key="card.id" :card="card" small />
        </div>
        <div class="calc">
          <span>Базовая сила</span><span class="v">{{ side.calc.base }}</span><span></span>
          <span>Тренер {{ elementName(side.player.trainer?.el ?? null) }} ×{{ side.player.trainer?.coef }}</span><span class="v">{{ fmt(side.calc.trainer) }}</span><span></span>
          <span>Преимущество {{ elementName(side.calc.el) }} над {{ elementName(teamElement(side.opponent)) }}</span><span class="v">{{ side.calc.adv > 1 ? fmt(side.calc.advPts) : 'нет' }}</span><span></span>
          <span>Свои бафы</span><span class="v" style="color: var(--buff)">{{ fmt(side.calc.buffs) }}</span><span></span>
          <span>Дебафы соперника</span><span class="v" style="color: var(--debuff)">{{ side.calc.debuffs ? '−' + side.calc.debuffs : '0' }}</span><span></span>
          <span class="line"></span>
          <span>Итог</span><span class="v total">{{ side.calc.total }}</span><span></span>
        </div>
        <div v-if="side.player.played.length" class="row">
          <Tag
            v-for="played in side.player.played"
            :key="played.card.id"
            :severity="played.card.kind === 'buff' ? 'success' : 'danger'"
            :value="played.card.name"
          />
        </div>
      </div>
    </div>
    <div class="actions">
      <Button :label="matchOver ? 'К итогам матча' : 'Дальше: добор карт'" @click="game.afterReveal()" />
    </div>
  </div>
</template>
