<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { View, RenderMethod, RenderMethodKind, ChildOf } from 'bwcx-client-vue3';

import { ElCarousel, ElCarouselItem, ElImage, ElSkeleton, ElSkeletonItem, ElEmpty, ElIcon } from 'element-plus';
import { ArrowRight, TextAlignEnd, TextAlignStart, Eye } from 'lucide-vue-next';
import { GetHomeNewsResDTO } from '@common/modules/home/home.dto';
import { GetCategoryPreviewResDTO } from '@common/modules/news/news.dto';

@View('/news/overview')
@RenderMethod(RenderMethodKind.SSR)
@ChildOf('NewsView')
@Options({
  name: 'NewsListView',
  components: {
    ElImage,
    Eye,
    ElCarousel,
    ElCarouselItem,
    ElSkeleton,
    ElSkeletonItem,
    ElEmpty,
    ArrowRight,
    TextAlignEnd,
    TextAlignStart,
    ElIcon,
  },
})
export default class NewsListView extends Vue {
  latestNewsList: GetHomeNewsResDTO = {
    rows: [],
  };
  isMobile: boolean = false;

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
    if (window.innerWidth < 768) {
      this.isMobile = true;
    }
    try {
      this.loading = true;
      const [homeNews, categoriesPreview] = await Promise.all([
        this.$api.getHomeNews(),
        this.$api.getAllCategoriesPreview(),
      ]);
      this.latestNewsList = homeNews;
      this.categoryPreviews = categoriesPreview.categories.filter((c) => c.totalNewsCount >= 1);
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
      <el-icon><text-align-end /></el-icon>
      <span>动态精选</span>
      <el-icon><TextAlignStart /></el-icon>
    </h2>

    <!-- 轮播图骨架屏 -->
    <template v-if="loading">
      <div class="carousel-skeleton" :class="isMobile ? 'carousel-skeleton-small' : 'carousel-skeleton-card'">
        <el-skeleton :rows="0" animated>
          <template #template>
            <div class="skeleton-carousel-wrapper">
              <el-skeleton-item variant="image" class="skeleton-carousel-image" />
              <div class="skeleton-carousel-content">
                <el-skeleton-item variant="h3" style="width: 60%" />
                <el-skeleton-item variant="text" style="width: 100%" />
                <el-skeleton-item variant="text" style="width: 40%" />
              </div>
            </div>
          </template>
        </el-skeleton>
      </div>
    </template>

    <div v-else :class="isMobile ? 'news-latest-carousel-small' : 'news-latest-carousel'">
      <el-carousel
        trigger="click"
        class="my-carousel"
        indicator-position="outside"
        :type="isMobile ? 'default' : 'card'"
      >
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
      <div v-for="preview in categoryPreviews" :key="preview.category.id" class="category-section">
        <h2 class="news-divide-title">
          <span>{{ preview.category.name }}</span>
        </h2>

        <div class="category-card">
          <div class="category-card-left">
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
                <div class="news-card-date">
                  <span>{{ parseDate(preview.cardNews[0].publishedAt) }}</span>
                  <div class="view-icon-wrapper">
                    <el-icon class="view-count-icon"><Eye /></el-icon>
                    <span>{{ preview.cardNews[0].viewCount }}</span>
                  </div>
                </div>
              </div>
            </div>
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
                  <div class="news-card-date">
                    <span>{{ parseDate(preview.cardNews[1].publishedAt) }}</span>
                    <div class="view-icon-wrapper">
                      <el-icon class="view-count-icon"><Eye /></el-icon>
                      <span>{{ preview.cardNews[1].viewCount }}</span>
                    </div>
                  </div>
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
                  <div class="news-card-date">
                    <span>{{ parseDate(preview.cardNews[2].publishedAt) }}</span>
                    <div class="view-icon-wrapper">
                      <el-icon class="view-count-icon"><Eye /></el-icon>
                      <span>{{ preview.cardNews[2].viewCount }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
              <span>查看更多</span>
              <ArrowRight class="arrow-right" :size="16" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="less">
.carousel-skeleton {
  width: 95%;
  min-width: 350px;
  padding: 0.5rem 0;

  &.carousel-skeleton-small {
    width: 100%;
  }

  .skeleton-carousel-wrapper {
    height: 450px;
    background: var(--ah-c-background-header);
    border-radius: 0.3rem;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .skeleton-carousel-image {
      width: 100%;
      height: 70%;
    }

    .skeleton-carousel-content {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
  }
}

.news-latest-carousel-small {
  width: 100%;
  height: fit-content;
  min-width: 350px;
  padding: 0.5rem 0;
  position: relative;

  & .carousel-item {
    cursor: pointer;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .carousel-image {
    width: 100%;
    height: 100%;
    display: block;
  }
}

.news-list-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding-top: 2rem;
  min-height: 100vh;

  .news-latest-carousel {
    width: 95%;
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

      @media screen and (max-width: 768px) {
        border-radius: 0;
      }
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

  .category-section {
    width: 85%;
    margin-bottom: 2rem;
    max-width: 1400px;
  }

  .category-card {
    width: 100%;
    display: flex;
    gap: 0.5rem;
    background: var(--ah-c-background-header);
    border-radius: 0.3rem;
    padding: 1rem;
    --card-height: 450px;

    @media screen and (max-width: 768px) {
      flex-direction: column;
      padding: 0.5rem;
    }

    .category-card-left {
      flex: 8;
      display: flex;
      gap: 0.5rem;
      height: var(--card-height);

      .news-card-large {
        flex: 6;
        height: var(--card-height);

        .news-card-cover {
          width: 100%;
          position: relative;
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

      @media screen and (max-width: 768px) {
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
          width: 100%;
          cursor: pointer;
          transition: background-color 0.2s;
          position: relative;
          padding: 0.1rem;
          border-radius: 0.05rem;

          &:hover {
            background-color: rgba(0, 0, 0, 0.05);
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
        justify-content: start;
        gap: 0.1rem;
        margin-top: 0.5rem;
        margin-left: 0.2rem;
        border-radius: 0.15rem;
        cursor: pointer;
        width: fit-content;
        color: var(--ah-c-brand);
        font-size: 0.32rem;
        transition: background-color 0.2s;
        flex-shrink: 0;
        position: relative;

        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 0.04rem;
          background-color: var(--ah-c-text2);
          transition: width var(--ah-t-short), left var(--ah-t-short);
        }

        &:hover::after {
          left: 0;
          width: 100%;
        }

        & .arrow-right {
          transition: transform 0.3s ease;
        }

        &:hover {
          background-color: var(--ah-c-background-soft);

          & .arrow-right {
            transform: translateX(0.1rem);
          }
        }
      }

      @media (max-width: 768px) {
        .news-list-simple {
          display: none;
        }

        .view-more {
          margin-top: 0;
          justify-content: center;
        }
      }
    }

    @media (max-width: 768px) {
      flex-direction: column;

      .category-card-left {
        flex-direction: column;
        height: auto;

        .news-card-large,
        .news-card-small-group .news-card-small {
          flex: none;
          height: auto;
          min-height: auto;

          .news-card-cover {
            height: 3.6rem;
          }

          .news-card-content {
            height: auto;
            padding: 0.25rem;

            .news-card-title {
              font-size: 0.32rem;
              -webkit-line-clamp: 2;
            }

            .news-card-summary {
              display: none;
            }
          }
        }

        .news-card-small-group {
          flex-direction: column;
          height: auto;
          gap: 0.5rem;
        }
      }

      .category-card-right {
        flex-direction: column;
        height: auto;
      }
    }
  }

  .news-card {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: .2rem;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    background-color: var(--ah-c-background);

    &:hover {
      box-shadow: 0 0 20px  rgba(0, 0, 0, 0.2);
      // transform: translateY(-4px);

      .news-card-cover {
        transform: scale(1.05);
      }
    }

    .news-card-cover {
      width: 100%;
      height: 160px;
      overflow: hidden;
      transition: transform 0.3s ease;

      .cover-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
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
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }
  }
}

.latest-news-descs {
  position: absolute;
  width: 100%;
  height: 3rem;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: flex-start;
  padding: 0.3rem 0.5rem;
  color: #fff;
  border-bottom-left-radius: 0.3rem;
  border-bottom-right-radius: 0.3rem;
  isolation: isolate;

  // 渐变模糊层
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    mask-image: linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.6) 40%, rgba(0, 0, 0, 0) 100%);
    -webkit-mask-image: linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.6) 40%, rgba(0, 0, 0, 0) 100%);
    border-radius: inherit;
    z-index: -1;
  }

  // 背景渐变层
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.3) 50%, transparent 100%);
    border-radius: inherit;
    z-index: -1;
  }

  @media screen and (max-width: 768px) {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    height: 2rem;
    padding: 0.2rem 0.4rem;
  }

  & .title {
    font-size: 0.48rem;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  }

  & p {
    font-size: 0.3rem;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);

  }

  & .date {
    font-size: 0.24rem;
    color: rgba(255, 255, 255, 0.7);
    text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);

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

  @media screen and (max-width: 768px) {
    font-size: 0.64rem;
    margin: 0.1rem 0;
  }

  & span {
    font-weight: 700;
  }
}

.my-carousel {
  :deep(.el-carousel__container) {
  height: 450px;

  @media screen and (max-width: 768px) {
    height: 200px;
  }
  }

}

.view-icon-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.24rem;
  gap: 0.08rem;
  color: var(--ah-c-text3);
}

.news-card-border {
  outline: .4px solid gray;

  &:hover {
    box-shadow: 0 0 15px rgba(0, 0, 0, .5);
  }
}
</style>
