<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { View, RenderMethod, RenderMethodKind, ChildOf } from 'bwcx-client-vue3';

import { ElCarousel, ElCarouselItem, ElImage } from 'element-plus';
import { GetHomeNewsResDTO } from '@common/modules/home/home.dto';
import { GetNewsListResDTO } from '@common/modules/news/news.dto';

@View('/news/overview')
@RenderMethod(RenderMethodKind.SSR)
@ChildOf('NewsView')
@Options({
  components: {
    ElImage,
    ElCarousel,
    ElCarouselItem,
  },
})
export default class NewsListView extends Vue {
  latestNewsList: GetHomeNewsResDTO = {
    rows: [],
  };

  newsList: GetNewsListResDTO = {
    rows: [],
  };

  parseDate(date: Date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d
      .getDate()
      .toString()
      .padStart(2, '0')}`;
  }

  async mounted() {
    this.latestNewsList = await this.$api.getHomeNews();
  }
}
</script>

<template>
  <div class="news-list-container">
    <div class="news-latest-carousel">
      <el-carousel trigger="click" height="450px" indicator-position="none" type="card">
        <el-carousel-item v-for="item in latestNewsList.rows" :key="item.title" style="overflow: hidden;border-radius: .1rem;">
          <el-image :src="item.coverImage" fit="cover" style="width: 100%; height: 99.9%;" />
          <div class="latest-news-descs">
            <h4 class="title">{{ item.title }}</h4>
            <p class="summary">{{ item.summary }}</p>
            <p class="date">{{ parseDate(item.publishedAt) }}</p>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>
    <main class="news-list">
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
    width: 70%;
    height: fit-content;
    min-width: 350px;
    // background-color: red;
    // background-color: #fff;
    padding: .5rem;
    border-radius: .1rem;
    border-top-left-radius: 0;
    position: relative;
  }

  .news-list {
    width: 70%;
    min-width: 350px;
    display: flex;
    flex-direction: column;
    background-color: #fff;
    border-radius: .1rem;
    border-top-left-radius: 0;
    padding: .5rem;
    gap: 1rem;
    position: relative;
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
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(15px);
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: flex-start;
  padding-left: .5rem;

  & .title {
    font-size: .48rem;
    font-weight: 700;
  }

  & p {
    font-size: .3rem;
  }
}
</style>
