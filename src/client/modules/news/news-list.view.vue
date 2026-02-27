<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { View, RenderMethod, RenderMethodKind, ChildOf } from 'bwcx-client-vue3';

import { ElCarousel, ElCarouselItem, ElImage, ElSkeleton, ElSkeletonItem, ElEmpty } from 'element-plus';
import { ArrowRight } from 'lucide-vue-next';
import { GetHomeNewsResDTO } from '@common/modules/home/home.dto';
import { GetCategoryPreviewResDTO } from '@common/modules/news/news.dto';

@View('/news/overview')
@RenderMethod(RenderMethodKind.SSR)
@ChildOf('NewsView')
@Options({
  name: 'NewsListView',
  components: {
    ElImage,
    ElCarousel,
    ElCarouselItem,
    ElSkeleton,
    ElSkeletonItem,
    ElEmpty,
    ArrowRight,
  },
})
export default class NewsListView extends Vue {
  latestNewsList: GetHomeNewsResDTO = {
    rows: [],
  };

  // 栏目预览数据
  categoryPreviews: GetCategoryPreviewResDTO[] = [];
  loading = true;

  parseDate(date: Date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d
      .getDate()
      .toString()
      .padStart(2, '0')}`;
  }

  goToNewsDetail(id: number) {
    this.$router.push(`/news/${id}`);
  }

  goToCategoryDetail(categoryId: number) {
    this.$router.push(`/news/category/${categoryId}`);
  }

  async mounted() {
    try {
      this.loading = true;
      // 并行加载首页精选和栏目预览
      const [homeNews, categoriesPreview] = await Promise.all([
        this.$api.getHomeNews(),
        this.$api.getAllCategoriesPreview(),
      ]);
      this.latestNewsList = homeNews;
      // 过滤掉没有新闻的栏目
      this.categoryPreviews = categoriesPreview.categories.filter(
        (c) => c.totalNewsCount >= 1
      );
    } catch (error) {
      console.error('Failed to load news data:', error);
    } finally {
      this.loading = false;
    }
  }
}
</script>

<template>
  <Head>
    <title>SDUTACM News</title>
    <meta name="description" content="SDUTACM 新闻" />
  </Head>

  <div class="news-list-container">
    <h2 class="news-divide-title">
      <span>动态精选</span>
    </h2>

    <div class="news-latest-carousel">
      <el-carousel trigger="click" height="450px" indicator-position="outside" type="card">
        <el-carousel-item
          v-for="item in latestNewsList.rows"
          :key="item.id"
          class="carousel-item"
          @click="goToNewsDetail(item.id)"
        >
          <el-image :src="item.coverImage" fit="cover" class="carousel-image" />
          <div class="latest-news-descs">
            <h4 class="title">{{ item.title }}</h4>
            <p class="summary">{{ item.summary }}</p>
            <p class="date">{{ parseDate(item.publishedAt) }}</p>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- 栏目列表 -->
    <template v-if="loading">
      <div class="category-skeleton">
        <el-skeleton :rows="0" animated>
          <template #template>
            <div class="skeleton-category-card">
              <div class="skeleton-left">
                <el-skeleton-item variant="image" style="width: 100%; height: 200px" />
                <el-skeleton-item variant="image" style="width: 100%; height: 200px" />
                <el-skeleton-item variant="image" style="width: 100%; height: 200px" />
              </div>
              <div class="skeleton-right">
                <el-skeleton-item variant="h3" style="width: 60%" />
                <el-skeleton-item variant="text" style="width: 100%" />
                <el-skeleton-item variant="text" style="width: 100%" />
                <el-skeleton-item variant="text" style="width: 100%" />
                <el-skeleton-item variant="text" style="width: 80%" />
              </div>
            </div>
          </template>
        </el-skeleton>
      </div>
    </template>

    <template v-else-if="categoryPreviews.length === 0">
      <el-empty description="暂无栏目数据" />
    </template>

    <template v-else>
      <div
        v-for="preview in categoryPreviews"
        :key="preview.category.id"
        class="category-section"
      >
        <h2 class="news-divide-title">
          <span>{{ preview.category.name }}</span>
        </h2>

        <div class="category-card">
          <!-- 左侧 70%：新闻卡片（1大2小布局） -->
          <div class="category-card-left">
            <!-- 左侧大卡片 -->
            <div
              v-if="preview.cardNews[0]"
              class="news-card news-card-large"
              @click="goToNewsDetail(preview.cardNews[0].id)"
            >
              <div class="news-card-cover">
                <el-image :src="preview.cardNews[0].coverImage" fit="cover" class="cover-image" />
              </div>
              <div class="news-card-content">
                <h3 class="news-card-title">{{ preview.cardNews[0].title }}</h3>
                <p class="news-card-summary">{{ preview.cardNews[0].summary }}</p>
                <p class="news-card-date">{{ parseDate(preview.cardNews[0].publishedAt) }}</p>
              </div>
            </div>
            <!-- 右侧2个小卡片 -->
            <div class="news-card-small-group">
              <div
                v-if="preview.cardNews[1]"
                class="news-card news-card-small"
                @click="goToNewsDetail(preview.cardNews[1].id)"
              >
                <div class="news-card-cover">
                  <el-image :src="preview.cardNews[1].coverImage" fit="cover" class="cover-image" />
                </div>
                <div class="news-card-content">
                  <h3 class="news-card-title">{{ preview.cardNews[1].title }}</h3>
                  <p class="news-card-date">{{ parseDate(preview.cardNews[1].publishedAt) }}</p>
                </div>
              </div>
              <div
                v-if="preview.cardNews[2]"
                class="news-card news-card-small"
                @click="goToNewsDetail(preview.cardNews[2].id)"
              >
                <div class="news-card-cover">
                  <el-image :src="preview.cardNews[2].coverImage" fit="cover" class="cover-image" />
                </div>
                <div class="news-card-content">
                  <h3 class="news-card-title">{{ preview.cardNews[2].title }}</h3>
                  <p class="news-card-date">{{ parseDate(preview.cardNews[2].publishedAt) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧 30%：新闻列表 -->
          <div class="category-card-right">
            <div class="news-list-simple">
              <div
                v-for="news in preview.listNews"
                :key="news.id"
                class="news-list-item"
                @click="goToNewsDetail(news.id)"
              >
                <span class="news-date">{{ parseDate(news.publishedAt) }}</span>
                <span class="news-title">{{ news.title }}</span>
              </div>
            </div>
            <div class="view-more" @click="goToCategoryDetail(preview.category.id)">
              <span>查看更多 {{ preview.category.name }}</span>
              <ArrowRight :size="16" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="less">
.news-list-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding-top: 2rem;
  min-height: 100vh;

  .news-latest-carousel {
    width: 90%;
    height: fit-content;
    min-width: 350px;
    padding: 0.5rem 0;
    position: relative;
    overflow-x: clip;
    overflow-y: visible;

    :deep(.el-carousel) {
      overflow: visible;
    }

    :deep(.el-carousel__container) {
      overflow: visible;
    }

    :deep(.el-carousel__mask) {
      display: none;
    }

    :deep(.el-carousel__item) {
      border-radius: 0.3rem;
      overflow: hidden;
      transition: box-shadow 0.3s ease, transform 0.3s ease;

      &.is-active {
        box-shadow: 0 0 24px rgba(0, 0, 0, 0.4);
        z-index: 2;
      }
    }

    .carousel-item {
      cursor: pointer;
      border-radius: 0.3rem;
      overflow: hidden;
    }

    .carousel-image {
      width: 100%;
      height: 100%;
      border-radius: 0.3rem;
      display: block;

      :deep(img) {
        border-radius: 0.3rem;
      }
    }
  }

  // 栏目骨架屏
  .category-skeleton {
    width: 85%;
    margin: 1rem 0;

    .skeleton-category-card {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: var(--ah-c-background-header);
      border-radius: 0.3rem;

      .skeleton-left {
        flex: 7;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
      }

      .skeleton-right {
        flex: 3;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
    }
  }

  // 栏目区块
  .category-section {
    width: 85%;
    margin-bottom: 2rem;
    max-width: 1400px;
  }

  // 栏目大卡片
  .category-card {
    width: 100%;
    display: flex;
    gap: 1rem;
    background: var(--ah-c-background-header);
    border-radius: 0.3rem;
    padding: 1rem;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    --card-height: 450px;

    @media (max-width: 1024px) {
      flex-direction: column;
    }

    // 左侧新闻卡片（1大2小布局）
    .category-card-left {
      flex: 8;
      display: flex;
      gap: .5rem;
      height: var(--card-height);

      // 左侧大卡片
      .news-card-large {
        flex: 6;
        height: var(--card-height);

        .news-card-cover {
          height: 70%;
        }

        .news-card-content {
          height: 30%;
          .news-card-summary {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        }
      }

      // 右侧小卡片容器
      .news-card-small-group {
        flex: 4;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        height: var(--card-height);

        .news-card-small {
          flex: 1;
          display: flex;
          flex-direction: column;

          .news-card-cover {
            width: 100%;
            height: 70%;
          }

          .news-card-content {
            width: 100%;
            height: 40%;
            flex: 1;
            padding: 0.25rem;

            .news-card-title {
              font-size: 0.32rem;
              -webkit-line-clamp: 2;
            }

            .news-card-summary {
              display: none;
            }

            .news-card-date {
              margin-top: auto;
            }
          }
        }
      }

      @media (max-width: 1024px) {
        flex-direction: column;
        min-height: auto;

        .news-card-large {
          min-height: 320px;

          .news-card-cover {
            height: 200px;
          }
        }

        .news-card-small-group {
          flex-direction: row;
          min-height: auto;

          .news-card-small {
            flex-direction: column;
            min-height: 220px;

            .news-card-cover {
              width: 100%;
              height: 140px;
            }
          }
        }
      }

      @media (max-width: 1000px) {
        .category-card-left {
          width: 100%;
        }

        .news-card-large {
          width: 100%;

          .news-card-cover {
            height: 160px;
          }
        }
        .news-card-small-group {
          flex-direction: column;

          .news-card-small {
            flex-direction: column;
            min-height: 200px;

            .news-card-cover {
              width: 100%;
              height: 120px;
            }
          }
        }
      }
    }

    // 右侧新闻列表
    .category-card-right {
      flex: 2;
      display: flex;
      flex-direction: column;
      min-width: 200px;
      height: var(--card-height);

      .news-list-simple {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.1rem;

        .news-list-item {
          display: flex;
          flex-direction: column;
          padding: 0.2rem;
          border-radius: 0.15rem;
          cursor: pointer;
          transition: background-color 0.2s;

          &:hover {
            background-color: var(--ah-c-background-soft);
          }

          .news-date {
            font-size: 0.24rem;
            color: var(--ah-c-text3);
          }

          .news-title {
            font-size: 0.32rem;
            color: var(--ah-c-text2);
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }

      .view-more {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.1rem;
        margin-top: 0.5rem;
        border-radius: 0.15rem;
        cursor: pointer;
        color: var(--ah-c-brand);
        font-size: 0.32rem;
        transition: background-color 0.2s;
        flex-shrink: 0;

        &:hover {
          background-color: var(--ah-c-background-soft);
        }
      }

      @media (max-width: 1024px) {
        min-height: auto;
        flex-direction: row;
      }
    }
  }

  // 新闻卡片样式
  .news-card {
    display: flex;
    flex-direction: column;
    border-radius: 0.2rem;
    overflow: hidden;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    cursor: pointer;
    background-color: var(--ah-c-background);

    &:hover {
      box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
      transform: translateY(-4px);

      .cover-image {
        transform: scale(1.05);
      }
    }

    .news-card-cover {
      width: 100%;
      height: 160px;
      overflow: hidden;

      .cover-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }
    }

    .news-card-content {
      padding: 0.3rem;
      display: flex;
      flex-direction: column;
      user-select: none;
      gap: 0.15rem;
      flex: 1;

      .news-card-title {
        font-size: 0.36rem;
        font-weight: 600;
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.4;
        color: var(--ah-c-text1);
      }

      .news-card-summary {
        font-size: 0.28rem;
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.5;
        color: var(--ah-c-text2);
      }

      .news-card-date {
        font-size: 0.24rem;
        margin: 0;
        margin-top: auto;
        color: var(--ah-c-text3);
      }
    }
  }
}

.latest-news-descs {
  position: absolute;
  width: 100%;
  height: 3rem;
  bottom: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.4), transparent);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: flex-start;
  padding: 0.3rem 0.5rem;
  color: #fff;
  border-bottom-left-radius: 0.3rem;
  border-bottom-right-radius: 0.3rem;

  & .title {
    font-size: 0.48rem;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  & p {
    font-size: 0.3rem;
    color: rgba(255, 255, 255, 0.9);
  }

  & .date {
    font-size: 0.24rem;
    color: rgba(255, 255, 255, 0.7);
  }
}

.news-divide-title {
  width: 100%;
  user-select: none;
  color: var(--ah-c-text2);
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.2rem;
  margin: 0.5rem 0;
  font-size: 0.78rem;

  & span {
    font-weight: 700;
  }
}
</style>
