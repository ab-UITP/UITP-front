<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ROUTES } from '@/common/constants/routes'
import AppTopbar from '@/common/ui/AppTopbar.vue'
import { AuthForm, PlayerChip, useAccount } from '@/modules/Account'
import { GameTable } from '@/modules/Game'
import { MatchRoom } from '@/modules/Match'

const { account, isLoading } = useAccount()
const route = useRoute()
const router = useRouter()
const matchId = computed(() => String(route.params.id).toUpperCase())
</script>

<template>
  <template v-if="!isLoading">
    <template v-if="!account">
      <AppTopbar />
      <div class="center-screen">
        <AuthForm />
      </div>
    </template>
    <MatchRoom v-else :match-id="matchId" @exit="router.push({ name: ROUTES.HOME })">
      <template #player>
        <PlayerChip />
      </template>
      <template #game="{ opponentName, opponentLeft, leave }">
        <GameTable :player-name="account.name" :opponent-name="opponentName" :opponent-left="opponentLeft" @exit="leave">
          <template #player>
            <PlayerChip />
          </template>
        </GameTable>
      </template>
    </MatchRoom>
  </template>
</template>
