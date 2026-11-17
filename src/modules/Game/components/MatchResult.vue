<script setup lang="ts">
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { computed } from 'vue'
import type { LocalGame } from '../composables/useLocalGame'
import type { RoundWinner } from '../types/game.types'
import ScoreLine from './ScoreLine.vue'

const props = defineProps<{ game: LocalGame; opponentLeft: boolean }>()
defineEmits<{ exit: [] }>()

const state = computed(() => props.game.state)
const winnerLabel = (winner: RoundWinner) => (winner === 'me' ? state.value.me.name : winner === 'op' ? state.value.op.name : 'ничья')
const winnerSeverity = (winner: RoundWinner) => (winner === 'me' ? 'success' : winner === 'op' ? 'danger' : 'warn')
</script>

<template>
  <div class="center-screen">
    <div class="panel center-wide" style="align-items: center">
      <div class="result-title" :class="state.iWon ? 'win' : 'lose'">{{ state.iWon ? 'Победа!' : 'Поражение' }}</div>
      <p class="sub" style="margin: 0">{{ state.resultReason }}</p>
      <ScoreLine :my-name="state.me.name" :opponent-name="state.op.name" :my-wins="state.me.wins" :opponent-wins="state.op.wins" large />
      <div v-if="state.history.length" class="rounds">
        <div v-for="record in state.history" :key="record.round" class="r">
          <span style="color: var(--muted)">Раунд {{ record.round }}</span>
          <span>{{ record.me }} : {{ record.op }}</span>
          <Tag :value="winnerLabel(record.winner)" :severity="winnerSeverity(record.winner)" />
        </div>
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center">
        <Button label="Реванш" :disabled="opponentLeft" @click="game.rematch()" />
        <Button label="В меню" severity="secondary" @click="$emit('exit')" />
      </div>
    </div>
  </div>
</template>
