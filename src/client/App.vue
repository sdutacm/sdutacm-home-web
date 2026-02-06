<script lang="ts">
import { Vue, Options } from 'vue-class-component';

@Options({})
export default class App extends Vue {}
</script>

<template>
  <router-view v-slot="{ Component }">
    <Suspense>
      <component :is="Component" />
    </Suspense>
  </router-view>
</template>
