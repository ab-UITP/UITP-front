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
const helpOpen = ref(false)
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

  <div class="game-help-bar">
    <Button label="Как играть" icon="pi pi-question-circle" variant="outlined" size="small" aria-haspopup="dialog" @click="helpOpen = true" />
  </div>

  <Dialog v-model:visible="helpOpen" modal header="Как играть" :style="{ width: 'min(620px, 94vw)' }">
    <div class="game-help">
      <section v-if="state.screen === 'trainer'">
        <h3>Сейчас: выберите тренера</h3>
        <p>Тренер усиливает игроков своей стихии. Посмотрите на их стихии и силу на столе, затем выберите подходящего тренера.</p>
      </section>
      <section v-else-if="state.screen === 'round'">
        <h3>Сейчас: разыграйте эффекты</h3>
        <p>Выберите карту в руке, затем цель: баф применяется к своему игроку, дебаф — к игроку соперника. Можно сыграть несколько карт. До нажатия «Готово, вскрываем» эффект можно отменить нажатием на его название.</p>
        <p>Прогноз учитывает ваши действия; действия соперника станут известны после вскрытия.</p>
      </section>
      <section v-else-if="state.screen === 'refill'">
        <h3>Сейчас: обновите команду</h3>
        <p>Выберите одного игрока на столе, которого уберёте, затем двух игроков из руки для выкладки. Остальные карты игроков останутся в руке.</p>
      </section>
      <section v-else-if="state.screen === 'reveal'">
        <h3>Сейчас: итог раунда</h3>
        <p>Сравните силу команд и посмотрите, как на неё повлияли тренеры, стихии и эффекты. Затем переходите к добору или итогам матча.</p>
      </section>
      <section v-else>
        <h3>Итоги матча</h3>
        <p>Здесь показаны результаты раундов. Можно начать новую партию или вернуться в меню.</p>
      </section>
      <section>
        <h3>Стихии и сила</h3>
        <p>Мораль сильнее Эрудиции, Эрудиция — Удачи, Удача — Морали. Преимущество стихии увеличивает силу команды после применения тренера в 1,25 раза.</p>
        <p>Стихия команды определяется по наибольшей средней силе игроков одной стихии с учётом тренера. Затем к силе добавляются бафы и вычитаются дебафы. Условия усиления указаны на картах эффектов.</p>
      </section>
      <section>
        <h3>Как проходит матч</h3>
        <p>Побеждает команда с большей силой в раунде. Матч завершается после трёх побед одной из сторон или четырёх раундов.</p>
      </section>
    </div>
    <template #footer>
      <Button label="Понятно" @click="helpOpen = false" />
    </template>
  </Dialog>

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

<style scoped>
.game-help-bar { display: flex; justify-content: flex-end; padding: 12px 20px; }
.game-help { display: grid; gap: 1rem; line-height: 1.5; }
.game-help h3 { margin: 0 0 .35rem; font-size: 1rem; }
.game-help p { margin: 0 0 .5rem; }
.game-help p:last-child { margin-bottom: 0; }
</style>
