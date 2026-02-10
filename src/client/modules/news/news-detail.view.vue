<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { View, RenderMethod, RenderMethodKind, ChildOf } from 'bwcx-client-vue3';
import NewsContainer from '@client/components/news-container.vue';
import { GetNewsDetailResDTO } from '@common/modules/news/news.dto';

@View('/news/:id')
@RenderMethod(RenderMethodKind.SSR)
@ChildOf('NewsView')
@Options({
  components: {
    NewsContainer,
  },
})
export default class NewsDetailView extends Vue {
  id: number = 0;
  showLoading: boolean = true;
  newsInfo: GetNewsDetailResDTO = {
    id: 0,
    title: '',
    summary: '',
    content: '',
    coverImage: '',
    publishedAt: null,
    isPublished: false,
    createdAt: null,
    updatedAt: null,
    updatedBy: {
      id: 0,
      username: '',
      avatar: '',
    },
  };

  async mounted() {
    this.id = parseInt(this.$route.params.id as string);
    console.log('NewsPreviewView mounted with id:', this.id);
    try {
      this.newsInfo = await this.$api.getNews({ id: this.id });
    } catch (error) {
      console.error('Failed to fetch news detail:', error);
    } finally {
      this.showLoading = false;
    }
  }
}
</script>

<template>
  <NewsContainer :newsInfo="newsInfo" :showLoading="showLoading" />
</template>

<style scoped lang="less"></style>
