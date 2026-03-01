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
  <router-view></router-view>
  <HomeFooter />
</template>
