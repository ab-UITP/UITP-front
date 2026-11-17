<script setup lang="ts">
import Button from 'primevue/button'
import { useRouter } from 'vue-router'
import { ROUTES } from '@/common/constants/routes'
import AppTopbar from '@/common/ui/AppTopbar.vue'

const router = useRouter()
</script>

<template>
  <AppTopbar />
  <div class="center-screen">
    <div class="panel">
      <h1>Страница не найдена</h1>
      <Button label="В меню" @click="router.push({ name: ROUTES.HOME })" />
    </div>
  </div>
</template>
