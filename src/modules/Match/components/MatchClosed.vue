<script setup lang="ts">
import Button from 'primevue/button'
import Message from 'primevue/message'

defineProps<{ message: string }>()
defineEmits<{ exit: [] }>()
</script>

<template>
  <div class="panel">
    <h1>Матч недоступен</h1>
    <Message severity="warn">{{ message }}</Message>
    <Button label="В меню" @click="$emit('exit')" />
  </div>
</template>
