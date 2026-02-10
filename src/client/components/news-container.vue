<!-- News 容器组件 -->
<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { GetNewsDetailResDTO } from '@common/modules/news/news.dto';

import UserAvatar from './user-avatar.vue';
import { ElDivider, ElIcon, ElImage, ElButton, vLoading } from 'element-plus';
import { Undo2, TextAlignEnd, CalendarDays } from 'lucide-vue-next';

@Options({
  components: {
    UserAvatar,
    ElDivider,
    ElIcon,
    Undo2,
    TextAlignEnd,
    CalendarDays,
    ElImage,
    ElButton,
  },
  directives: {
    loading: vLoading,
  },
})
export default class NewsContainer extends Vue {
  @Prop() newsInfo!: GetNewsDetailResDTO;
  @Prop({ required: true }) showLoading!: boolean;

  private parseDate(str: Date): string {
    if (!str) return '';
    const date = new Date(str);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
</script>

<template>
  <div class="news-preview-container" v-loading="showLoading">
    <header class="news-preview-header">
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
        <div class="admin-info">
          <div class="admin-avatar-container">
            <user-avatar
              :src="newsInfo.updatedBy.avatar"
              v-if="newsInfo.updatedBy.id"
              style="width: 2rem; height: 2rem; border: 2px solid #fff"
            />
          </div>
          <div class="admin-details" v-if="newsInfo.updatedBy.username">
            <span>Editor: {{ newsInfo.updatedBy.username }}</span>
          </div>
        </div>
      </div>
    </header>
    <div class="divider-container">
      <el-divider border-style="dashed" v-if="newsInfo.id" />
    </div>
    <main class="news-preview-main" v-html="newsInfo?.content"></main>
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
      background-color: #eee;
      position: relative;
    }

    & .news-preview-dexc-group {
      width: 60%;
      min-width: 300px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      background-color: #fff;
      padding: 0 1rem;
      padding-top: .5rem;
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
          align-items: flex-end;
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
    padding: 0 1rem;
    background-color: #fff;
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
  background-color: #fff;
  padding: 0 1rem;
}
</style>
