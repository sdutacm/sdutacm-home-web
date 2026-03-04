<script lang="ts">
import { Vue, Options, prop } from 'vue-class-component';
import { View, RenderMethod, RenderMethodKind, ChildOf } from 'bwcx-client-vue3';

import { ElTimeline, ElTimelineItem, ElImage, ElSkeleton, ElSkeletonItem, ElEmpty, ElPagination } from 'element-plus';
import { ArrowLeft } from 'lucide-vue-next';
import { GetNewsByCategoryResDTO, NewsCategoryVO, GetNewsDetailResDTO } from '@common/modules/news/news.dto';
import { Head } from '@vueuse/head';

interface NewsGroup {
  year: number;
  month: number;
  news: GetNewsDetailResDTO[];
}

@View('/news/category/:id')
@RenderMethod(RenderMethodKind.SSR)
@ChildOf('NewsView')
@Options({
  components: {
    ElImage,
    ElTimeline,
    Head,
    ElTimelineItem,
    ElSkeleton,
    ElSkeletonItem,
    ElEmpty,
    ElPagination,
    ArrowLeft,
  },
})
export default class NewsCategoryView extends Vue {
  category: NewsCategoryVO | null = null;
  newsList: GetNewsDetailResDTO[] = [];
  loading = true;
  totalCount = 0;
  currentPage = 1;
  pageSize = 20;

  // 每张图片的加载状态
  imageLoaded: Record<number, boolean> = {};

  onImageLoad(newsId: number) {
    this.imageLoaded = { ...this.imageLoaded, [newsId]: true };
  }

  isImageLoaded(newsId: number): boolean {
    return !!this.imageLoaded[newsId];
  }

  get categoryId(): number {
    return Number(this.$route.params.id);
  }

  // 按年月分组新闻
  get groupedNews(): NewsGroup[] {
    const groups: Map<string, NewsGroup> = new Map();

    for (const news of this.newsList) {
      const date = new Date(news.publishedAt || news.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;

      if (!groups.has(key)) {
        groups.set(key, { year, month, news: [] });
      }
      groups.get(key)!.news.push(news);
    }

    // 按时间倒序排列
    return Array.from(groups.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }

  formatMonthLabel(year: number, month: number): string {
    return `${year}年${month}月`;
  }

  formatDate(dateStr: string | Date): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
    });
  }

  async loadCategory() {
    this.loading = true;
    try {
      const data = await this.$api.getNewsByCategory({
        categoryId: this.categoryId,
        page: this.currentPage,
        pageSize: this.pageSize,
      });
      this.category = data.category;
      this.newsList = data.rows;
      this.totalCount = data.total;
    } catch (e) {
      console.error('Failed to load category:', e);
    } finally {
      this.loading = false;
    }
  }

  handlePageChange(page: number) {
    this.currentPage = page;
    this.loadCategory();
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToNews(newsId: number) {
    this.$router.push(`/news/${newsId}`);
  }

  goBack() {
    this.$router.push('/news/overview');
  }

  async created() {
    window.scrollTo({ top: 0});
    await this.loadCategory();
  }
}
</script>

<template>
  <Head>
    <title>{{ category ? `SDUTACM News | ${category.name}` : 'SDUTACM News' }}</title>
    <meta v-if="category" name="description" :content="category.description || ''" />
  </Head>

  <div class="news-category-container">
    <!-- 返回按钮和标题 -->
    <div class="category-header">
      <div class="back-button" @click="goBack">
        <ArrowLeft :size="20" />
        <span>返回</span>
      </div>
      <div class="category-info" v-if="category">
        <h1 class="category-title">{{ category.name }}</h1>
        <p class="category-description" v-if="category.description">{{ category.description }}</p>
      </div>
    </div>

    <!-- 加载骨架屏 -->
    <div class="timeline-skeleton" v-if="loading">
      <ElSkeleton :rows="5" animated>
        <template #template>
          <div class="skeleton-group" v-for="i in 3" :key="i">
            <ElSkeletonItem variant="text" style="width: 120px; height: 28px; margin-bottom: 16px" />
            <div class="skeleton-item" v-for="j in 3" :key="j">
              <ElSkeletonItem variant="text" style="width: 60px" />
              <ElSkeletonItem variant="text" style="width: 80%" />
            </div>
          </div>
        </template>
      </ElSkeleton>
    </div>

    <!-- 空状态 -->
    <ElEmpty v-else-if="!loading && newsList.length === 0" description="暂无新闻" />

    <!-- 时间轴 -->
    <div class="timeline-wrapper" v-else>
      <ElTimeline>
        <template v-for="group in groupedNews" :key="`${group.year}-${group.month}`">
          <!-- 年月标记 -->
          <ElTimelineItem
            :timestamp="formatMonthLabel(group.year, group.month)"
            placement="top"
            type="primary"
            :hollow="true"
            size="large"
          >
            <div class="month-news-list">
              <div
                v-for="news in group.news"
                :key="news.id"
                class="news-item"
                @click="goToNews(news.id)"
              >
                <div class="news-item-date">{{ formatDate(news.publishedAt || news.createdAt) }}</div>
                <div class="news-item-content">
                  <div class="news-item-cover" v-if="news.coverImage">
                    <ElSkeleton v-if="!isImageLoaded(news.id)" :rows="0" animated class="image-skeleton-overlay">
                      <template #template>
                        <ElSkeletonItem variant="image" style="width: 100%; height: 100%" />
                      </template>
                    </ElSkeleton>
                    <ElImage :src="news.coverImage" fit="cover" lazy @load="onImageLoad(news.id)" />
                  </div>
                  <div class="news-item-info">
                    <h3 class="news-item-title">{{ news.title }}</h3>
                    <p class="news-item-summary" v-if="news.summary">{{ news.summary }}</p>
                  </div>
                </div>
              </div>
            </div>
          </ElTimelineItem>
        </template>
      </ElTimeline>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="totalCount > pageSize">
        <ElPagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="totalCount"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.news-category-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 2rem 0;
  min-height: 100vh;

  .category-header {
    width: 80%;
    max-width: 1000px;
    margin-bottom: 2rem;

    .back-button {
      display: inline-flex;
      align-items: center;
      gap: 0.15rem;
      padding: 0.2rem 0.4rem;
      border-radius: 0.15rem;
      cursor: pointer;
      color: var(--ah-c-text2);
      font-size: 0.32rem;
      transition: background-color 0.2s, color 0.2s;
      margin-bottom: 0.5rem;

      &:hover {
        background-color: var(--ah-c-background-soft);
        color: var(--ah-c-brand);
      }
    }

    .category-info {
      .category-title {
        width: 100%;
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--ah-c-text1);
        margin: 0 0 0.3rem 0;
      }

      .category-description {
        font-size: 0.36rem;
        color: var(--ah-c-text2);
        margin: 0;
        line-height: 1.6;
      }
    }
  }

  .timeline-skeleton {
    width: 80%;
    max-width: 1000px;

    .skeleton-group {
      margin-bottom: 1.5rem;

      .skeleton-item {
        display: flex;
        gap: 1rem;
        margin-bottom: 0.5rem;
        padding-left: 1rem;
      }
    }
  }

  .timeline-wrapper {
    width: 80%;
    max-width: 1000px;

    :deep(.el-timeline) {
      padding-left: 0;
    }

    :deep(.el-timeline-item__timestamp) {
      font-size: 0.4rem;
      font-weight: 600;
      color: var(--ah-c-brand);
    }

    :deep(.el-timeline-item__node--large) {
      width: 16px;
      height: 16px;
      left: -2px;
    }

    .month-news-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.3rem;
    }

    .news-item {
      display: flex;
      gap: 0.5rem;
      padding: 0.4rem;
      border-radius: 0.2rem;
      cursor: pointer;
      transition: background-color 0.2s, transform 0.2s;
      background-color: var(--ah-c-background-header);

      &:hover {
        background-color: var(--ah-c-background-soft);
        transform: translateX(4px);
      }

      .news-item-date {
        flex-shrink: 0;
        width: 60px;
        font-size: 0.28rem;
        color: var(--ah-c-text3);
        padding-top: 0.1rem;
      }

      .news-item-content {
        flex: 1;
        display: flex;
        gap: 0.5rem;
        min-width: 0;

        .news-item-cover {
          flex-shrink: 0;
          width: 120px;
          height: 80px;
          border-radius: 0.15rem;
          overflow: hidden;
          position: relative;

          .image-skeleton-overlay {
            position: absolute;
            inset: 0;
            z-index: 1;
          }

          :deep(.el-image) {
            width: 100%;
            height: 100%;
          }

          @media (max-width: 640px) {
            display: none;
          }
        }

        .news-item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-width: 0;

          .news-item-title {
            width: 100%;
            font-size: 0.36rem;
            font-weight: 600;
            color: var(--ah-c-text1);
            margin: 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .news-item-summary {
            font-size: 0.28rem;
            color: var(--ah-c-text2);
            margin: 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.5;
          }
        }
      }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 2rem;
  }
}
</style>
