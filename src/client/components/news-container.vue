<!-- News 容器组件 -->
<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { GetNewsDetailResDTO } from '@common/modules/news/news.dto';

import UserAvatar from './user-avatar.vue';
import { ElDivider, ElIcon, ElImage, ElButton, ElSkeleton, ElSkeletonItem } from 'element-plus';
import { Undo2, TextAlignEnd, CalendarDays, Share, Eye, Mail, Link } from 'lucide-vue-next';
import IconWechatPure from './homepage/icon/icon-wechat-pure.vue';

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
    ElSkeleton,
    ElSkeletonItem,
    Share,
    Mail,
    IconWechatPure,
    Link,
  },
})
export default class NewsContainer extends Vue {
  @Prop() newsInfo!: GetNewsDetailResDTO;
  @Prop() newsLoadedFailed: boolean = false;
  linkCopied = false;
  coverImageLoaded = false;

  onCoverLoad() {
    this.coverImageLoaded = true;
  }

  get currentUrl() {
    return typeof window !== 'undefined' ? window.location.href : '';
  }

  openWxOfficialLink() {
    if (this.newsInfo.wxOfficialLink) {
      window.open(this.newsInfo.wxOfficialLink, '_blank');
    }
  }

  shareToMail() {
    const subject = encodeURIComponent(this.newsInfo.title || 'SDUTACM 新闻分享');
    const body = encodeURIComponent(`${this.newsInfo.title}\n\n${this.currentUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  shareLink() {
    navigator.clipboard.writeText(this.currentUrl).then(
      () => {
        this.linkCopied = true;
        setTimeout(() => {
          this.linkCopied = false;
        }, 1500);
      },
      (err) => {
        console.error('Failed to copy link:', err);
      },
    );
  }

  private parseDate(str: Date): string {
    if (!str) return '';
    const date = new Date(str);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  mounted() {
    window.scrollTo(0, 0);
  }
}
</script>

<template>
  <div class="news-preview-container" v-if="!newsLoadedFailed">
    <header class="news-preview-header" v-if="newsInfo.id">
      <div class="news-preview-img-wrapper" v-if="newsInfo.coverImage">
        <el-skeleton v-if="!coverImageLoaded" :rows="0" animated class="image-skeleton-overlay">
          <template #template>
            <el-skeleton-item variant="image" style="width: 100%; height: 100%" />
          </template>
        </el-skeleton>
        <el-image v-if="newsInfo.coverImage" :src="newsInfo.coverImage" fit="cover" style="width: 100%; height: 100%" @load="onCoverLoad" />
      </div>
      <div class="news-preview-dexc-group">
        <h1 class="news-preview-title" v-if="newsInfo.title">{{ newsInfo.title }}</h1>
        <h2 class="news-preview-subtitle" v-if="newsInfo.summary">{{ newsInfo.summary }}</h2>
        <p class="news-preview-desc" v-if="newsInfo.publishedAt">
          <el-icon><CalendarDays /></el-icon>
          <span>{{ parseDate(newsInfo.publishedAt) }}</span>
        </p>
        <div class="news-preview-desc" v-if="newsInfo.id">
          <el-icon><Eye /></el-icon>
          <span>{{ newsInfo.viewCount }}</span>
        </div>
        <div class="news-preview-desc news-share-tools" v-if="newsInfo.id">
          <el-icon v-if="newsInfo.wxOfficialLink" size="20" @click="openWxOfficialLink" class="share-icon"><IconWechatPure /></el-icon>
          <el-icon size="18" @click="shareToMail" class="share-icon"><Mail /></el-icon>
          <span class="share-link-wrapper">
            <el-icon size="18" @click="shareLink" class="share-icon"><Link /></el-icon>
            <span class="link-copied-tip" :class="{ show: linkCopied }">Copied!</span>
          </span>
        </div>
      </div>
    </header>
    <div class="divider-container">
      <el-divider border-style="dashed" v-if="newsInfo.id" />
    </div>
    <main class="news-preview-main" v-html="newsInfo?.content" v-if="newsInfo.id"></main>
    <aside v-if="newsInfo.id" class="aside-info">编辑：{{ newsInfo.updatedBy?.username }}</aside>
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
  --news-container-width: 60%;
  @media screen and (max-width: 1024px) {
    --news-container-width: 80%;
  }

  @media screen and (max-width: 768px) {
    --news-container-width: 100%;
  }

  & .news-preview-header {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;

    & .news-preview-img-wrapper {
      width: 100%;
      height: 500px;

      @media screen and (max-width: 768px) {
        height: 300px;
      }

      position: relative;

      .image-skeleton-overlay {
        position: absolute;
        inset: 0;
        z-index: 1;
      }
    }

    & .news-preview-dexc-group {
      width: var(--news-container-width);
      min-width: 300px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      background-color: var(--ah-c-background-header);
      padding: 0 1rem;
      padding-top: 0.5rem;
      position: relative;
      gap: 0.3rem;

      @media screen and (max-width: 768px) {
        padding: 0 0.5rem;
      }

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
      }

      & .news-preview-subtitle {
        font-size: 0.5rem;
        font-weight: 700;
        color: var(--ah-c-text2);
      }

      & .news-preview-desc {
        font-size: 0.4rem;
        margin-bottom: 5px;
        display: flex;
        align-items: center;
        gap: 0.2rem;
        color: gray;
      }
    }
  }

  & .news-preview-main {
    width: var(--news-container-width);
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

      span {
        color: inherit !important;
      }
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
  width: var(--news-container-width);
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

  @media screen and (max-width: 768px) {
    right: 0.5rem;
    top: 2rem;
  }

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

.copy-text {
  position: absolute;
  top: 0;
  left: 50%;
  font-size: 0.3rem;
  transform: translate(-50%, -150%) rotate(-10deg);
  opacity: 0;
}

.copied {
  opacity: 1;
  animation: fadeOut 1s ease forwards;
}

@keyframes fadeOut {
  to {
    opacity: 0;
    transform: translate(-50%, -200%) rotate(-10deg);
  }
}

.aside-info {
  width: var(--news-container-width);
  height: fit-content;
  background-color: var(--ah-c-background-header);
  text-align: left;
  font-size: 0.3rem;
  padding: 1rem;
  color: gray;
  border-bottom-left-radius: 0.3rem;
  border-bottom-right-radius: 0.3rem;
}

.news-share-tools {
  z-index: 10;
  gap: 0.3rem !important;

  .share-icon {
    cursor: pointer;
    transition: transform 0.2s ease, color 0.2s ease;

    &:hover {
      transform: scale(1.2);
      color: var(--ah-c-brand);
    }
  }

  .share-link-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;

    .link-copied-tip {
      position: absolute;
      left: calc(100% + 0.2rem);
      font-size: 0.28rem;
      color: var(--ah-c-brand);
      white-space: nowrap;
      opacity: 0;
      transform: translateX(-0.2rem);
      transition: opacity 0.3s ease, transform 0.3s ease;

      &.show {
        opacity: 1;
        transform: translateX(0);
      }
    }
  }
}
</style>
