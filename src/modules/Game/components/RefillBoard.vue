<script setup lang="ts">
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import { computed } from 'vue'
import type { LocalGame } from '../composables/useLocalGame'
import GameCard from './GameCard.vue'
import ScoreLine from './ScoreLine.vue'

const props = defineProps<{ game: LocalGame }>()
const state = computed(() => props.game.state)
const isPlaced = (id: number) => state.value.placed.some((card) => card.id === id)
</script>

<template>
  <div class="table" style="grid-template-rows: auto auto auto auto auto">
    <div class="scorebar">
      <Tag :value="`Конец раунда ${state.round}`" severity="secondary" />
      <ScoreLine :my-name="state.me.name" :opponent-name="state.op.name" :my-wins="state.me.wins" :opponent-wins="state.op.wins" />
      <div class="steps">
        <span class="step" :class="{ on: state.refillStep === 1, done: state.refillStep > 1 }">1. Сбросить 1</span>
        <span class="step" :class="{ on: state.refillStep === 2 }">2. Выложить 2</span>
      </div>
    </div>
    <Message severity="info">
      Вы добрали 3 игроков и 2 бафа. {{ state.refillStep === 1 ? 'Выберите игрока, которого уберёте со стола.' : 'Выберите двух игроков из руки. Остальные останутся в руке на следующий раунд.' }}
    </Message>
    <div>
      <div class="zone-label">Стол · после раунда будет {{ state.me.table.length + 1 }} игроков</div>
      <div class="row">
        <GameCard
          v-for="card in state.me.table"
          :key="card.id"
          :card="card"
          interactive
          :selected="state.discarded?.id === card.id"
          :style="state.discarded?.id === card.id ? 'opacity: .5; box-shadow: 0 0 0 2px var(--danger)' : ''"
          :disabled="state.refillStep !== 1"
          @click="game.discard(card)"
        >
          <span v-if="state.discarded?.id === card.id" class="flag" style="color: var(--danger); left: auto; right: 6px">Сброс</span>
        </GameCard>
      </div>
    </div>
    <div>
      <div class="zone-label">Рука · игроки</div>
      <div class="row">
        <GameCard
          v-for="card in state.me.handP"
          :key="card.id"
          :card="card"
          interactive
          :selected="isPlaced(card.id)"
          :disabled="state.refillStep !== 2"
          @click="game.place(card)"
        >
          <span v-if="isPlaced(card.id)" class="flag" style="color: var(--primary); left: auto; right: 6px">На стол</span>
        </GameCard>
      </div>
    </div>
    <div class="actions">
      <Button v-if="state.refillStep === 2" label="Назад" variant="text" severity="secondary" @click="game.refillBack()" />
      <Button v-if="state.refillStep === 1" label="Сбросить и дальше" :disabled="!state.discarded" @click="game.refillForward()" />
      <Button v-else :label="`Начать раунд ${state.round + 1}`" :disabled="state.placed.length < 2" @click="game.nextRound()" />
    </div>
  </div>
</template>
