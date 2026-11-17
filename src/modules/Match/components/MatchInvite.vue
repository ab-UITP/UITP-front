<script setup lang="ts">
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { computed } from 'vue'

const props = defineProps<{ inviteLink: string; hostName: string; unavailable: boolean; joining: boolean }>()
defineEmits<{ join: []; exit: [] }>()

const shownLink = computed(() => props.inviteLink.replace(/^https?:\/\//, ''))
</script>

<template>
  <div class="panel">
    <Avatar :label="hostName[0]?.toUpperCase()" size="xlarge" shape="circle" style="align-self: center" />
    <h1>{{ hostName }} зовёт вас в матч</h1>
    <p class="sub">Вы открыли ссылку-приглашение {{ shownLink }}</p>
    <Message v-if="unavailable" severity="error">Ссылка больше не работает: матч отменён или в нём уже два игрока. Попросите новую ссылку.</Message>
    <Button v-else label="Присоединиться" :loading="joining" @click="$emit('join')" />
    <Button label="В меню" variant="text" severity="secondary" @click="$emit('exit')" />
  </div>
</template>
