<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import ProgressBar from 'primevue/progressbar'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import AppTopbar from '@/common/ui/AppTopbar.vue'
import { useLocalGame } from '../composables/useLocalGame'
import MatchResult from './MatchResult.vue'
import RefillBoard from './RefillBoard.vue'
import RoundBoard from './RoundBoard.vue'
import RoundReveal from './RoundReveal.vue'
import TrainerPick from './TrainerPick.vue'

const RECONNECT_SECONDS = 60

const props = defineProps<{ playerName: string; opponentName: string; opponentLeft: boolean }>()
const emit = defineEmits<{ exit: [] }>()

const game = useLocalGame(props.playerName, props.opponentName)
const { state } = game

const surrenderOpen = ref(false)
const secondsLeft = ref(RECONNECT_SECONDS)
const inPlay = computed(() => ['round', 'reveal', 'refill'].includes(state.screen))
const waitingOpponent = computed(() => props.opponentLeft && state.screen !== 'result')
let timer: ReturnType<typeof setInterval> | undefined

watch(waitingOpponent, (waiting) => {
  clearInterval(timer)
  if (!waiting) return
  secondsLeft.value = RECONNECT_SECONDS
  timer = setInterval(() => {
    secondsLeft.value--
    if (secondsLeft.value <= 0) {
      clearInterval(timer)
      game.winByOpponentAbsence()
    }
  }, 1000)
}, { immediate: true })

onBeforeUnmount(() => clearInterval(timer))

function confirmSurrender() {
  surrenderOpen.value = false
  game.surrender()
}
</script>

<template>
  <AppTopbar v-if="!inPlay">
    <slot name="player" />
  </AppTopbar>

  <TrainerPick v-if="state.screen === 'trainer'" :game="game" />
  <RoundBoard v-else-if="state.screen === 'round'" :game="game" @surrender="surrenderOpen = true" />
  <RoundReveal v-else-if="state.screen === 'reveal'" :game="game" />
  <RefillBoard v-else-if="state.screen === 'refill'" :game="game" />
  <MatchResult v-else :game="game" :opponent-left="opponentLeft" @exit="emit('exit')" />

  <Dialog v-model:visible="surrenderOpen" modal header="Сдаться?" :style="{ width: 'min(420px, 92vw)' }">
    <p style="margin: 0; color: var(--muted)">Матч закончится, победа достанется {{ state.op.name }}. Отменить это нельзя.</p>
    <template #footer>
      <Button label="Продолжить игру" variant="text" severity="secondary" @click="surrenderOpen = false" />
      <Button label="Сдаться" severity="danger" @click="confirmSurrender" />
    </template>
  </Dialog>

  <Dialog :visible="waitingOpponent" modal :closable="false" header="Соперник переподключается" :style="{ width: 'min(440px, 92vw)' }">
    <div style="display: flex; flex-direction: column; gap: 14px">
      <p style="margin: 0; color: var(--muted)">{{ state.op.name }} потерял связь. Если он не вернётся за 60 секунд, победа будет за вами.</p>
      <ProgressBar :value="Math.round((secondsLeft / RECONNECT_SECONDS) * 100)" :show-value="false" style="height: 8px" />
      <span style="font-family: var(--font-display); font-size: 28px; color: var(--primary); font-variant-numeric: tabular-nums">0:{{ String(secondsLeft).padStart(2, '0') }}</span>
    </div>
  </Dialog>
</template>
