<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { ElAutocomplete, ElIcon, ElButton } from 'element-plus';
import { Search } from 'lucide-vue-next';
import Fuse from 'fuse.js';
import { GetNewsDetailResDTO } from '@common/modules/news/news.dto';

interface SuggestionItem {
  value: string;
  id: number;
}

@Options({
  components: {
    ElAutocomplete,
    ElIcon,
    Search,
    ElButton,
  },
})
export default class NewsNav extends Vue {
  searchQuery = '';
  allNews: GetNewsDetailResDTO[] = [];
  fuse: Fuse<GetNewsDetailResDTO> | null = null;
    isMobile: boolean = false;

  async mounted() {
    if (window.innerWidth <= 1100) {
      this.isMobile = true;
    }
    await this.loadAllNews();
    this.initFuse();
  }

  async loadAllNews() {
    try {
      const res = await this.$api.getPublishedNewsList({
        page: 1,
        pageSize: 1000,
      });
      this.allNews = res.rows;
    } catch (error) {
      console.error('Failed to load news for search:', error);
    }
  }

  initFuse() {
    const options = {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'summary', weight: 0.3 },
        { name: 'content', weight: 0.3 },
      ],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 1,
    };
    this.fuse = new Fuse(this.allNews, options);
  }

  querySearch(queryString: string, cb: (suggestions: SuggestionItem[]) => void) {
    if (!queryString.trim() || !this.fuse) {
      cb([]);
      return;
    }

    const results = this.fuse.search(queryString);
    const suggestions: SuggestionItem[] = results.slice(0, 8).map((result) => ({
      value: result.item.title,
      id: result.item.id,
    }));
    cb(suggestions);
  }

  handleSelect(item: SuggestionItem) {
    this.$router.push(`/news/${item.id}`);
    this.searchQuery = '';
  }

  goNewsOverView() {
    this.$router.push('/news/overview');
  }
}
</script>

<template>
  <div class="news-nav">
    <div class="news-nav-container">
      <div class="news-nav-title" @click="goNewsOverView">
        <img src="../../assets/images/sdutacm_logo_colorful.svg" alt="" />
        <h1>SDUTACM News</h1>
      </div>
      <div class="news-nav-tools">
        <client-only>
          <el-autocomplete
            v-model="searchQuery"
            :fetch-suggestions="querySearch"
            placeholder="搜索新闻..."
            clearable
            :style="{ width: isMobile ? '100px' : '250px', display: 'flex', alignItems: 'center' }"
            @select="handleSelect"
            class="search-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-autocomplete>
        </client-only>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.news-nav {
  position: fixed;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 1.6rem;
  background-color: var(--ah-c-background-header);
  box-shadow: var(--ah-s-shadow-2);

  .news-nav-container {
    width: 60%;
    height: 100%;
    min-width: var(--ah-breakpoint-xs);
    display: flex;
    justify-content: space-between;
    align-items: center;

    @media screen and (max-width: 1000px) {
      width: 90%;
    }
    & .news-nav-title {
      display: flex;
      align-items: center;
      gap: 0.2rem;
      user-select: none;

      &:hover {
        cursor: pointer;
      }

      & img {
        width: 1rem;
        height: 1rem;
      }

      & h1 {
        font-size: 0.64rem;

        font-weight: 700;
      }

      @media screen and (max-width: 1100px) {
        & h1 {
          font-size: 0.48rem;
        }

        & img {
          width: 0.75rem;
          // height: 0.8rem;
        }
      }
    }

    & .search-input {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
}
</style>
