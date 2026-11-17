<script setup lang="ts">
import { RouterView } from 'vue-router'
import { ServerGate } from '@/modules/Connection'
</script>

<template>
  <div class="board">
    <div class="device">
      <ServerGate>
        <RouterView />
      </ServerGate>
    </div>
  </div>
</template>
