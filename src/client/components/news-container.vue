<!-- News 容器组件 -->
<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { GetNewsDetailResDTO } from '@common/modules/news/news.dto';

import UserAvatar from './user-avatar.vue';
import { ElDivider, ElIcon, ElImage, ElButton, vLoading } from 'element-plus';
import { Undo2, TextAlignEnd, CalendarDays, Share, Eye } from 'lucide-vue-next';
@Options({
  components: {
    UserAvatar,
    Eye,
    ElDivider,
    ElIcon,
    Undo2,
    TextAlignEnd,
    CalendarDays,
    ElImage,
    ElButton,
    Share,
  },
  directives: {
    loading: vLoading,
  },
})
export default class NewsContainer extends Vue {
  @Prop() newsInfo!: GetNewsDetailResDTO;
  @Prop({ required: true }) showLoading!: boolean;
  @Prop() newsLoadedFailed: boolean = false;

  private parseDate(str: Date): string {
    if (!str) return '';
    const date = new Date(str);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private copyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => {},
      (err) => {
        console.error('Failed to copy link:', err);
      },
    );
  }

  mounted() {
    window.scrollTo(0, 0);
  }
}
</script>

<template>
  <div class="news-preview-container" v-loading="showLoading" v-if="!newsLoadedFailed">
    <header class="news-preview-header" v-if="newsInfo.id">
      <div class="news-preview-img-wrapper">
        <el-image v-if="newsInfo.coverImage" :src="newsInfo.coverImage" fit="cover" style="width: 100%; height: 100%" />
      </div>
      <div class="news-preview-dexc-group">
        <h1 class="news-preview-title" v-if="newsInfo.title">{{ newsInfo.title }}</h1>
        <p class="news-preview-desc" v-if="newsInfo.summary">
          <el-icon><TextAlignEnd /></el-icon>
          <span>{{ newsInfo.summary }}</span>
        </p>
        <p class="news-preview-desc" v-if="newsInfo.publishedAt">
          <el-icon><CalendarDays /></el-icon>
          <span>{{ parseDate(newsInfo.publishedAt) }}</span>
        </p>
        <div class="news-preview-desc" v-if="newsInfo.viewCount">
          <el-icon><Eye /></el-icon>
          <span>{{ newsInfo.viewCount }}</span>
        </div>
        <div class="admin-info">
          <div class="admin-avatar-container">
            <user-avatar
              :src="newsInfo.updatedBy.avatar"
              v-if="newsInfo.updatedBy.id"
              style="width: 2rem; height: 2rem; border: 2px solid var(--ah-c-background-header)"
            />
          </div>
          <div class="admin-details" v-if="newsInfo.updatedBy.username">
            <span>编辑 {{ newsInfo.updatedBy.username }}</span>
          </div>
        </div>
      </div>
    </header>
    <div class="share-button" @click="copyLink" v-if="newsInfo.id">
      <el-icon size="medium"><Share /></el-icon>
    </div>
    <div class="divider-container">
      <el-divider border-style="dashed" v-if="newsInfo.id" />
    </div>
    <main class="news-preview-main" v-html="newsInfo?.content" v-if="newsInfo.id"></main>
  </div>
  <div class="news-found-error" v-else>
    <h2>找不到您想要查看的新闻 😢</h2>
    <p>请检查链接是否正确，或返回首页查看更多新闻。</p>
  </div>
</template>

<style scoped lang="less">
.news-preview-container {
  display: flex;
  flex-direction: column;
  justify-content: start;
  width: 100%;
  min-height: 100vh;
  align-items: center;
  & .news-preview-header {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;

    & .news-preview-img-wrapper {
      width: 100%;
      height: 500px;
      position: relative;
    }

    & .news-preview-dexc-group {
      width: 60%;
      min-width: 300px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      background-color: var(--ah-c-background-header);
      padding: 0 1rem;
      padding-top: 0.5rem;
      position: relative;

      & .admin-info {
        position: absolute;
        right: 1rem;
        top: 0rem;
        width: 4rem;
        height: fit-content;
        display: flex;
        flex-direction: column;
        align-items: end;
        // background-color: green;
        transform: translateY(-1rem);
        gap: 0.1rem;
        & .admin-avatar-container {
          width: 2rem;
          height: 2rem;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        & .admin-details {
          width: 100%;
          font-size: 0.3rem;
          color: gray;
          display: flex;
          flex-direction: column;
          align-items: end;
        }
      }

      & .news-preview-title {
        font-size: 0.8rem;
        font-weight: 900;
        margin-bottom: 10px;
      }

      & .news-preview-desc {
        font-size: 0.4rem;
        margin-bottom: 5px;
        display: flex;
        align-items: center;
        gap: 0.1rem;
        color: gray;
      }
    }
  }

  & .news-preview-main {
    width: 60%;
    flex: 1;
    min-width: 300px;
    padding: 1rem;
    padding-top: 0;
    background-color: var(--ah-c-background-header);
    min-height: auto;

    & :deep(*) {
      font-size: 0.4rem;
    }

    & :deep(p) {
      line-height: 1.6;
    }

    & :deep(strong),
    & :deep(b) {
      font-weight: bold;
    }

    & :deep(em),
    & :deep(i) {
      font-style: italic;
    }

    & :deep(u) {
      text-decoration: underline;
    }

    & :deep(img) {
      max-width: 100%;
      height: auto;
      margin: 10px 0;
    }
  }
}

.divider-container {
  width: 60%;
  background-color: var(--ah-c-background-header);
  padding: 0 1rem;
}

.news-found-error {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  & h2 {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--ah-c-text2);
    margin: 0;
    margin-bottom: 0.5rem;
  }

  & p {
    font-size: 0.4rem;
    color: var(--ah-c-text3);
    margin: 0;
  }
}

.share-button {
  position: fixed;
  right: 4rem;
  bottom: 2rem;
  cursor: pointer;
  width: 1rem;
  height: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--ah-c-background-header);
  box-shadow: var(--ah-s-shadow-2);
  border-radius: 0.2rem;
  transition: transform 0.2s ease;
  z-index: 1000;

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
