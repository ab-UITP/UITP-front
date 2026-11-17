<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import Button from 'primevue/button'
import InputGroup from 'primevue/inputgroup'
import InputText from 'primevue/inputtext'
import ProgressSpinner from 'primevue/progressspinner'
import { computed } from 'vue'

const props = defineProps<{ inviteLink: string }>()
defineEmits<{ cancel: [] }>()

const shownLink = computed(() => props.inviteLink.replace(/^https?:\/\//, ''))
const { copy, copied } = useClipboard({ source: () => props.inviteLink, legacy: true, copiedDuring: 1800 })
</script>

<template>
  <div class="panel">
    <h1>Матч создан</h1>
    <p class="sub">Отправьте ссылку второму игроку. Он попадёт в матч сразу.</p>
    <div class="field">
      <label for="invite">Ссылка-приглашение</label>
      <InputGroup>
        <InputText id="invite" :model-value="shownLink" readonly />
        <Button :label="copied ? 'Скопировано' : 'Скопировать'" :severity="copied ? 'success' : undefined" @click="copy()" />
      </InputGroup>
    </div>
    <div class="status-row">
      <ProgressSpinner style="width: 18px; height: 18px" stroke-width="6" />
      Ждём второго игрока…
    </div>
    <Button label="Отменить матч" variant="text" severity="secondary" @click="$emit('cancel')" />
  </div>
</template>
