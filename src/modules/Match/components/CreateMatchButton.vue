<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { createMatch } from '../api/matchApi'

const emit = defineEmits<{ created: [matchId: string] }>()

const mutation = useMutation({
  mutationFn: createMatch,
  onSuccess: (state) => emit('created', state.matchId),
})
</script>

<template>
  <Button label="Создать матч" :loading="mutation.isPending.value" @click="mutation.mutate()" />
  <Message v-if="mutation.isError.value" severity="error">Не удалось создать матч. Попробуйте ещё раз.</Message>
</template>
