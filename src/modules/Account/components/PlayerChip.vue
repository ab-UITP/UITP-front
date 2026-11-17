<script setup lang="ts">
import Avatar from 'primevue/avatar'
import { computed } from 'vue'
import { useAccount } from '../composables/useAccount'

const { account } = useAccount()
const name = computed(() => account.value?.name ?? '')
</script>

<template>
  <div class="me-chip">
    <Avatar :label="name[0]?.toUpperCase() ?? '?'" shape="circle" />
    {{ name }}
  </div>
</template>
