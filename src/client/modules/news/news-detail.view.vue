<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { View, RenderMethod, RenderMethodKind, ChildOf } from 'bwcx-client-vue3';
import NewsContainer from '@client/components/news-container.vue';
import { GetNewsDetailResDTO } from '@common/modules/news/news.dto';
import { Share } from 'lucide-vue-next';
import { ElIcon } from 'element-plus';
import { AsyncDataOptions } from '@client/typings';

interface NewsDetailState {
  newsInfo: GetNewsDetailResDTO;
}

@View('/news/:id')
@RenderMethod(RenderMethodKind.SSR)
@ChildOf('NewsView')
@Options({
  components: {
    NewsContainer,
    ElIcon,
    Share,
  },
})
export default class NewsDetailView extends Vue {
  @Prop()
  newsDetailState?: NewsDetailState;

  id: number = 0;
  showLoading: boolean = true;
  newsLoadedFailed: boolean = false;
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

  async asyncData({ apiClient, to }: AsyncDataOptions): Promise<{ newsDetailState: NewsDetailState }> {
    const id = parseInt(to.params.id as string);
    const newsInfo = await apiClient.getPublishedNews({ id });
    return {
      newsDetailState: {
        newsInfo,
      },
    };
  }

  copyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => {},
      (err) => {
        console.error('Failed to copy link:', err);
      },
    );
  }

  async mounted() {
    this.id = parseInt(this.$route.params.id as string);

    // 如果 SSR 已经预取了数据，直接使用
    if (this.newsDetailState) {
      this.newsInfo = this.newsDetailState.newsInfo;
      this.showLoading = false;
    } else {
      // 客户端导航时需要重新获取数据
      await this.fetchData();
    }

    // 增加阅览数（客户端路由跳转时触发）
    this.$api.incrementNewsViewCount({ id: this.id }).catch((err) => {
      console.error('Failed to increment news view count:', err);
    });
  }

  async fetchData() {
    try {
      this.newsInfo = await this.$api.getPublishedNews({ id: this.id });
    } catch (error) {
      console.error('Failed to fetch news detail:', error);
      this.newsLoadedFailed = true;
    } finally {
      this.showLoading = false;
    }
  }
}
</script>

<template>
  <Head>
    <title>SDUTACM News | {{ newsInfo.title }}</title>
    <meta name="description" content="{{ newsInfo.summary }}" />
  </Head>
  <div class="news-detail">
    <NewsContainer :newsInfo="newsInfo" :showLoading="showLoading" :newsLoadedFailed="newsLoadedFailed" />
  </div>
</template>

<style scoped lang="less">
.news-detail {
  width: 100%;
  padding-top: 1.6rem;
}

.share-button {
  position: fixed;
  top: 2rem;
  right: 5rem;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 0.1rem;
  background-color: var(--ah-c-background-header);
  padding: 0.2rem;
  box-shadow: var(--ah-s-shadow-2);
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.9);
  }
  &:active {
    transform: scale(0.9);
  }
}
</style>
