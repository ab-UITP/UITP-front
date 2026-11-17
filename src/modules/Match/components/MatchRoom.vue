<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query'
import ProgressSpinner from 'primevue/progressspinner'
import { computed, ref, watch } from 'vue'
import AppTopbar from '@/common/ui/AppTopbar.vue'
import { joinMatch, leaveMatch } from '../api/matchApi'
import { closedMessage, resolveMatchScreen } from '../composables/matchScreen'
import { useMatchStateQuery } from '../composables/useMatchStateQuery'
import MatchClosed from './MatchClosed.vue'
import MatchFound from './MatchFound.vue'
import MatchInvite from './MatchInvite.vue'
import MatchLobby from './MatchLobby.vue'

const FOUND_SCREEN_MS = 1800

const props = defineProps<{ matchId: string }>()
const emit = defineEmits<{ exit: [] }>()

const query = useMatchStateQuery(() => props.matchId)
const state = computed(() => query.data.value)
const screen = computed(() => resolveMatchScreen(state.value, query.error.value))
const gameStarted = ref(false)

watch(screen, (value) => {
  if (value === 'found') setTimeout(() => { gameStarted.value = true }, FOUND_SCREEN_MS)
}, { immediate: true })

const myName = computed(() => (state.value?.youAre === 'host' ? state.value.hostName : state.value?.guestName) ?? '')
const opponentName = computed(() => (state.value?.youAre === 'host' ? state.value.guestName : state.value?.hostName) ?? '')

const join = useMutation({ mutationFn: () => joinMatch(props.matchId), onSuccess: query.setState })
const inviteUnavailable = computed(() => screen.value === 'unavailable' || join.isError.value)

async function leave() {
  if (state.value?.youAre && state.value.status !== 'CLOSED') await leaveMatch(props.matchId).catch(() => {})
  emit('exit')
}
</script>

<template>
  <slot v-if="gameStarted && state" name="game" :opponent-name="opponentName" :opponent-left="state.status === 'CLOSED'" :leave="leave" />
  <template v-else>
    <AppTopbar>
      <slot v-if="screen === 'lobby' || screen === 'invite' || screen === 'unavailable' || screen === 'closed'" name="player" />
    </AppTopbar>
    <div class="center-screen">
      <ProgressSpinner v-if="screen === 'loading'" style="width: 56px; height: 56px" stroke-width="4" />
      <MatchLobby v-else-if="screen === 'lobby' && state" :invite-link="state.inviteLink" @cancel="leave" />
      <MatchInvite
        v-else-if="(screen === 'invite' || screen === 'unavailable') && state"
        :invite-link="state.inviteLink"
        :host-name="state.hostName"
        :unavailable="inviteUnavailable"
        :joining="join.isPending.value"
        @join="join.mutate()"
        @exit="leave"
      />
      <MatchFound v-else-if="screen === 'found' && state" :my-name="myName" :opponent-name="opponentName" />
      <MatchClosed v-else :message="closedMessage(state)" @exit="leave" />
    </div>
  </template>
</template>
