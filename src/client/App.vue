<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import HomeView from './modules/home/home.view.vue';

@Options({
  components: {
    HomeView,
  },
})
export default class App extends Vue {}
</script>

<template>
  <home-view />
</template>
