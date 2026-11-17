<script setup lang="ts">
import Button from 'primevue/button'
import { useRouter } from 'vue-router'
import { ROUTES } from '@/common/constants/routes'
import AppTopbar from '@/common/ui/AppTopbar.vue'
import { AuthForm, PlayerChip, useAccount } from '@/modules/Account'
import { CreateMatchButton } from '@/modules/Match'

const { account, isLoading, logout } = useAccount()
const router = useRouter()

function openMatch(matchId: string) {
  router.push({ name: ROUTES.MATCH, params: { id: matchId } })
}
</script>

<template>
  <template v-if="!isLoading">
    <AppTopbar>
      <PlayerChip v-if="account" />
    </AppTopbar>
    <div class="center-screen">
      <div v-if="account" class="panel">
        <div class="big-logo">ПОЛИКАРТЫ</div>
        <p class="sub" style="margin: 0">Привет, {{ account.name }}! Сыграем?</p>
        <CreateMatchButton @created="openMatch" />
        <Button label="Выйти из аккаунта" variant="text" severity="secondary" @click="logout()" />
      </div>
      <AuthForm v-else />
    </div>
  </template>
</template>
