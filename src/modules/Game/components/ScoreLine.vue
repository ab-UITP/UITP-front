<script setup lang="ts">
defineProps<{ myName: string; opponentName: string; myWins: number; opponentWins: number; large?: boolean }>()
</script>

<template>
  <div class="score">
    <span>{{ myName }}</span>
    <span class="num" :style="large ? 'font-size: 40px' : undefined">{{ myWins }} : {{ opponentWins }}</span>
    <span>{{ opponentName }}</span>
  </div>
</template>
