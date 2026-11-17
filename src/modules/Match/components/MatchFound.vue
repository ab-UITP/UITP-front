<script setup lang="ts">
import Avatar from 'primevue/avatar'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'

defineProps<{ myName: string; opponentName: string }>()
</script>

<template>
  <div class="panel center-wide">
    <Tag value="Соперник найден" severity="success" style="align-self: center" />
    <div class="vs">
      <div class="who">
        <Avatar :label="myName[0]?.toUpperCase()" size="xlarge" shape="circle" />
        {{ myName }}
      </div>
      <span class="x">VS</span>
      <div class="who">
        <Avatar :label="opponentName[0]?.toUpperCase()" size="xlarge" shape="circle" />
        {{ opponentName }}
      </div>
    </div>
    <div class="status-row">
      <ProgressSpinner style="width: 18px; height: 18px" stroke-width="6" />
      Тасуем колоды…
    </div>
  </div>
</template>
