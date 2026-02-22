<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { View, RenderMethod, RenderMethodKind, ChildOf } from 'bwcx-client-vue3';

import { ElCarousel, ElCarouselItem, ElImage, ElButton, ElIcon } from 'element-plus';
import { GetHomeNewsResDTO } from '@common/modules/home/home.dto';
import { PartyPopper, Newspaper } from 'lucide-vue-next';
import { GetNewsDetailResDTO } from '@common/modules/news/news.dto';

@View('/news/overview')
@RenderMethod(RenderMethodKind.SSR)
@ChildOf('NewsView')
@Options({
  components: {
    ElImage,
    ElCarousel,
    ElCarouselItem,
    ElButton,
    PartyPopper,
    Newspaper,
    ElIcon,
  },
})
export default class NewsListView extends Vue {
  latestNewsList: GetHomeNewsResDTO = {
    rows: [],
  };

  newsList: GetNewsDetailResDTO[] = [];
  page = 1;
  pageSize = 6;
  total = 0;
  hasMore = true;
  loading = false;

  parseDate(date: Date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d
      .getDate()
      .toString()
      .padStart(2, '0')}`;
  }

  async loadMoreNews() {
    if (this.loading || !this.hasMore) return;

    this.loading = true;
    try {
      const res = await this.$api.getPublishedNewsList({
        page: this.page,
        pageSize: this.pageSize,
      });
      this.newsList = [...this.newsList, ...res.rows];
      this.total = res.total;
      this.hasMore = res.hasMore;
      this.page++;
    } catch (error) {
      console.error('Failed to load news:', error);
    } finally {
      this.loading = false;
    }
  }

  goToNewsDetail(id: number) {
    this.$router.push(`/news/${id}`);
  }

  async mounted() {
    this.latestNewsList = await this.$api.getHomeNews();
    await this.loadMoreNews();
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
      <el-icon><PartyPopper /></el-icon>
      <span>动态精选</span>
    </h2>

    <div class="news-latest-carousel">
      <el-carousel trigger="click" height="500px" indicator-position="outside" type="card">
        <el-carousel-item
          v-for="item in latestNewsList.rows"
          :key="item.id"
          style="overflow: hidden; border-radius: 0.1rem; cursor: pointer"
          @click="goToNewsDetail(item.id)"
        >
          <el-image :src="item.coverImage" fit="cover" style="width: 100%; height: 99.9%" />
          <div class="latest-news-descs">
            <h4 class="title">{{ item.title }}</h4>
            <p class="summary">{{ item.summary }}</p>
            <p class="date">{{ parseDate(item.publishedAt) }}</p>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>
    <h2 class="news-divide-title">
      <el-icon><Newspaper /></el-icon>
      <span>往期回顾</span>
    </h2>
    <main class="news-list">
      <div class="news-grid">
        <div v-for="item in newsList" :key="item.id" class="news-card" @click="goToNewsDetail(item.id)">
          <div class="news-card-cover">
            <el-image :src="item.coverImage" fit="cover" class="cover-image" />
          </div>
          <div class="news-card-content">
            <h3 class="news-card-title">{{ item.title }}</h3>
            <p class="news-card-summary">{{ item.summary }}</p>
            <p class="news-card-date">{{ parseDate(item.publishedAt) }}</p>
          </div>
        </div>
      </div>
      <div class="load-more-container">
        <el-button v-if="hasMore" :loading="loading" plain @click="loadMoreNews">
          {{ loading ? '加载中...' : '查看更多' }}
        </el-button>
        <p v-else class="no-more-text">所有新闻都看完啦！休息一下吧 (˶ˆ꒳ˆ˵)</p>
      </div>
    </main>
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
    width: 100%;
    height: fit-content;
    min-width: 350px;
    // background-color: red;
    // background-color: #fff;
    padding: 0.5rem;
    border-radius: 0.1rem;
    border-top-left-radius: 0;
    position: relative;
  }

  .news-list {
    width: 70%;
    min-width: 350px;
    display: flex;
    flex-direction: column;
    // background-color: var(--ah-c-background-header);
    border-radius: 0.1rem;
    border-top-left-radius: 0;
    padding: 0.5rem;
    gap: 1rem;
    position: relative;

    .news-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;

      @media (max-width: 1024px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    .news-card {
      display: flex;
      flex-direction: column;
      border-radius: 0.1rem;
      overflow: hidden;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      cursor: pointer;
      background-color: var(--ah-c-background-header);

      &:hover {
        box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
        .cover-image {
          transform: scale(1.05);
          transition: transform 0.3s ease;
        }
      }

      .news-card-cover {
        width: 100%;
        height: 180px;
        overflow: hidden;

        .cover-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
      }

      .news-card-content {
        padding: 0.2rem;
        display: flex;
        flex-direction: column;
        user-select: none;
        gap: 0.1rem;

        .news-card-title {
          font-size: 0.4rem;
          font-weight: 600;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.4;
        }

        .news-card-summary {
          font-size: 0.3rem;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.5;
        }

        .news-card-date {
          font-size: 0.2rem;
          margin: 0;
          margin-top: auto;
        }
      }
    }

    .load-more-container {
      display: flex;
      justify-content: center;
      padding: 0.5rem 0;

      .no-more-text {
        color: #909399;
        font-size: 0.32rem;
      }
    }
  }
}

.el-carousel__item h3 {
  color: #475669;
  opacity: 0.75;
  line-height: 150px;
  margin: 0;
  text-align: center;
}

.el-carousel__item:nth-child(2n) {
  background-color: #99a9bf;
}

.el-carousel__item:nth-child(2n + 1) {
  background-color: #d3dce6;
}

.latest-news-descs {
  position: absolute;
  width: 100%;
  height: 2rem;
  bottom: 0;
  background-color: var(--ah-c-background-header);
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: flex-start;
  padding-left: 0.5rem;

  & .title {
    font-size: 0.48rem;
    font-weight: 700;
  }

  & p {
    font-size: 0.3rem;
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
