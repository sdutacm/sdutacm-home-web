<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { View, RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';
import NewsNav from '@client/components/news/news-nav.vue';
import HomeFooter from '@client/components/home-footer.vue';

@View('/news')
@RenderMethod(RenderMethodKind.SSR)
@Options({
  components: {
    NewsNav,
    HomeFooter,
  },
})
export default class NewsView extends Vue {}
</script>

<template>
  <NewsNav />
  <router-view v-slot="{ Component }">
    <client-only>
      <keep-alive include="NewsListView">
        <component :is="Component" />
      </keep-alive>
      <template #placeholder>
        <component :is="Component" />
      </template>
    </client-only>
  </router-view>
  <HomeFooter />
</template>
