<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import AppTopbar from '@/common/ui/AppTopbar.vue'
import { fetchHealth } from '../api/healthApi'

const health = useQuery({
  queryKey: ['health'],
  queryFn: fetchHealth,
  retry: false,
  staleTime: Infinity,
})
</script>

<template>
  <slot v-if="health.isSuccess.value" />
  <template v-else>
    <AppTopbar />
    <div v-if="health.isFetching.value" class="center-screen">
      <div class="panel" style="align-items: center">
        <ProgressSpinner style="width: 56px; height: 56px" stroke-width="4" />
        <h1>Подключение к серверу…</h1>
        <p class="sub">Это займёт пару секунд</p>
      </div>
    </div>
    <div v-else class="center-screen">
      <div class="panel">
        <h1>Нет соединения</h1>
        <Message severity="error">Сервер игры не отвечает. Проверьте интернет и попробуйте ещё раз.</Message>
        <Button label="Повторить" @click="health.refetch()" />
      </div>
    </div>
  </template>
</template>
