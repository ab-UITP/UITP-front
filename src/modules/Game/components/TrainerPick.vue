<script setup lang="ts">
import Button from 'primevue/button'
import Message from 'primevue/message'
import { computed } from 'vue'
import type { LocalGame } from '../composables/useLocalGame'
import { elementName } from '../rules/strength'
import GameCard from './GameCard.vue'

const props = defineProps<{ game: LocalGame }>()
const state = computed(() => props.game.state)
const startingPlayers = computed(() =>
  state.value.me.table.map((card) => `${card.name} (${elementName(card.el)}, ${card.str})`).join(', '),
)
</script>

<template>
  <div class="center-screen">
    <div class="panel center-wide">
      <h1>Выберите тренера</h1>
      <p class="sub">Тренер остаётся на всю игру и умножает силу игроков своей стихии</p>
      <div class="trainers">
        <div v-for="trainer in state.me.trainers" :key="trainer.id" class="trainer-pick">
          <GameCard :card="trainer" interactive :selected="state.me.trainer?.id === trainer.id" @click="game.selectTrainer(trainer)" />
          <span style="font-size: 13px; color: var(--muted)">{{ elementName(trainer.el) }} ×{{ trainer.coef }}</span>
        </div>
      </div>
      <Message severity="info">Ваши стартовые игроки: {{ startingPlayers }}</Message>
      <Button label="Взять тренера и начать" :disabled="!state.me.trainer" @click="game.startFirstRound()" />
    </div>
  </div>
</template>
