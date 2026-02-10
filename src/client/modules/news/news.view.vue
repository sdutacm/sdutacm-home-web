<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { View, RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';
import NewsNav from '@client/components/news/news-nav.vue';

@View('/news')
@RenderMethod(RenderMethodKind.SSR)
@Options({
  components: {
    NewsNav,
  },
})
export default class NewsView extends Vue {}
</script>

<template>
  <NewsNav />
  <router-view v-slot="{ Component }">
    <component :is="Component" />
  </router-view>
</template>
