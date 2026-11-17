<script setup lang="ts">
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import { computed } from 'vue'
import type { LocalGame } from '../composables/useLocalGame'
import { CARD_BACKS, perkText } from '../rules/catalog'
import { beats, elementName } from '../rules/strength'
import GameCard from './GameCard.vue'
import ScoreLine from './ScoreLine.vue'

const props = defineProps<{ game: LocalGame }>()
defineEmits<{ surrender: [] }>()

const state = computed(() => props.game.state)
const meCalc = computed(() => props.game.meCalc.value)
const opCalc = computed(() => props.game.opCalc.value)
const fmt = (n: number) => (n > 0 ? '+' : '') + n

// дебафы, которые вы уже положили на карты соперника
const myDebuffs = computed(() => {
  let total = 0
  for (const played of state.value.me.played) {
    if (played.card.kind !== 'debuff') continue
    const target = state.value.op.table.find((card) => card.id === played.target)
    total += played.card.val * (target && beats(played.card.el, target.el) ? 1.25 : 1)
  }
  return total ? `−${Math.round(total)}` : '0'
})
</script>

<template>
  <div class="table">
    <div class="scorebar">
      <Tag :value="`Раунд ${state.round} из 4`" severity="secondary" />
      <ScoreLine :my-name="state.me.name" :opponent-name="state.op.name" :my-wins="state.me.wins" :opponent-wins="state.op.wins" />
      <div style="display: flex; gap: 8px; align-items: center">
        <Tag :value="state.waiting ? 'Ждём соперника' : 'Бафы · 0:42'" :severity="state.waiting ? 'warn' : 'success'" />
        <Button label="Сдаться" severity="danger" variant="outlined" size="small" @click="$emit('surrender')" />
      </div>
    </div>

    <div class="zone">
      <div>
        <div class="zone-label">Соперник</div>
        <div class="who-line">
          <Avatar :label="state.op.name[0]?.toUpperCase()" shape="circle" />
          <span class="name">{{ state.op.name }}</span>
        </div>
      </div>
      <div v-if="state.op.trainer">
        <div class="zone-label">Тренер</div>
        <GameCard :card="state.op.trainer" small />
      </div>
      <div class="sep"></div>
      <div>
        <div class="zone-label">Игроки на столе · {{ state.op.table.length }}</div>
        <div class="row">
          <GameCard
            v-for="card in state.op.table"
            :key="card.id"
            :card="card"
            small
            interactive
            :target="game.isTarget(false)"
            :disabled="!game.isTarget(false) && !!state.sel"
            @click="game.applyTo(card, false)"
          >
            <span v-for="played in state.me.played.filter((p) => p.target === card.id)" :key="played.card.id" class="mod" style="color: var(--debuff)">−{{ played.card.val }}</span>
          </GameCard>
        </div>
      </div>
      <div>
        <div class="zone-label">Бафы в руке</div>
        <div class="row">
          <div v-for="effect in state.op.handB" :key="effect.id" class="gcard sm back">
            <img class="art" :src="CARD_BACKS.effect" alt="Закрытая карта соперника" draggable="false" />
          </div>
        </div>
      </div>
    </div>

    <div class="mid">
      <div class="calc" role="table" aria-label="Расчёт силы">
        <span class="h">Расчёт силы</span><span class="h v">{{ state.me.name }}</span><span class="h v">{{ state.op.name }}</span>
        <span>Базовая сила</span><span class="v">{{ meCalc.base }}</span><span class="v">{{ opCalc.base }}</span>
        <span>Тренер</span><span class="v">{{ fmt(meCalc.trainer) }}</span><span class="v">{{ fmt(opCalc.trainer) }}</span>
        <span>Стихия команды</span><span class="v" :class="'tx-' + meCalc.el">{{ elementName(meCalc.el) }}</span><span class="v" :class="'tx-' + opCalc.el">{{ elementName(opCalc.el) }}</span>
        <span>Преимущество стихии ×1.25</span><span class="v">{{ meCalc.adv > 1 ? fmt(meCalc.advPts) : '—' }}</span><span class="v">{{ opCalc.adv > 1 ? fmt(opCalc.advPts) : '—' }}</span>
        <span>Ваши бафы / дебафы</span><span class="v" style="color: var(--buff)">{{ fmt(meCalc.buffs) }}</span><span class="v" style="color: var(--debuff)">{{ myDebuffs }}</span>
        <span class="line"></span>
        <span>Прогноз</span><span class="v total">{{ meCalc.total }}</span><span class="v total" style="color: var(--muted)">?</span>
      </div>
      <div class="hint">
        <Message v-if="state.waiting" severity="warn">Вы готовы. Ждём, пока {{ state.op.name }} разыграет бафы…</Message>
        <Message v-else-if="!state.sel" severity="info">Выберите баф или дебаф в руке. Бафы кладутся на свои карты, дебафы на карты соперника. Сыграть можно сколько угодно карт.</Message>
        <Message v-else severity="success">{{ state.sel.name }}: {{ perkText(state.sel) }}. Теперь нажмите на {{ state.sel.kind === 'buff' ? 'свою карту' : 'карту соперника' }}.</Message>
        <div v-if="state.me.played.length" class="row">
          <Tag
            v-for="played in state.me.played"
            :key="played.card.id"
            :severity="played.card.kind === 'buff' ? 'success' : 'danger'"
            :value="played.card.name + ' ✕'"
            style="cursor: pointer"
            :title="'Убрать ' + played.card.name"
            @click="!state.waiting && game.undo(played)"
          />
        </div>
        <Message severity="secondary" size="small" variant="simple">Прогноз считается на клиенте. Итог раунда присылает сервер.</Message>
      </div>
    </div>

    <div class="zone">
      <div>
        <div class="zone-label">Вы</div>
        <div class="who-line">
          <Avatar :label="state.me.name[0]?.toUpperCase()" shape="circle" />
          <span class="name">{{ state.me.name }}</span>
        </div>
      </div>
      <div v-if="state.me.trainer">
        <div class="zone-label">Тренер</div>
        <GameCard :card="state.me.trainer" small />
      </div>
      <div class="sep"></div>
      <div>
        <div class="zone-label">Ваши игроки на столе · {{ state.me.table.length }}</div>
        <div class="row">
          <GameCard
            v-for="card in state.me.table"
            :key="card.id"
            :card="card"
            small
            interactive
            :target="game.isTarget(true)"
            :disabled="!game.isTarget(true) && !!state.sel"
            @click="game.applyTo(card, true)"
          >
            <span v-for="played in state.me.played.filter((p) => p.target === card.id)" :key="played.card.id" class="mod" style="color: var(--buff)">+{{ played.card.val }}</span>
          </GameCard>
        </div>
      </div>
    </div>

    <div class="hand-wrap">
      <div>
        <div class="zone-label">Рука: бафы и дебафы · {{ state.me.handB.length }}</div>
        <div class="row">
          <GameCard
            v-for="effect in state.me.handB"
            :key="effect.id"
            :card="effect"
            interactive
            :selected="state.sel?.id === effect.id"
            :disabled="state.waiting"
            @click="game.selectHand(effect)"
          />
          <GameCard
            v-for="card in state.me.handP"
            :key="card.id"
            :card="card"
            style="opacity: 0.55"
            title="Игрок в руке. Выложить можно в конце раунда"
          />
        </div>
      </div>
      <div class="actions">
        <Button v-if="state.sel" label="Отменить выбор" variant="text" severity="secondary" @click="game.clearSelection()" />
        <Button :label="state.waiting ? 'Ждём соперника…' : 'Готово, вскрываем'" :loading="state.waiting" :disabled="state.waiting" @click="game.ready()" />
      </div>
    </div>
  </div>
</template>
