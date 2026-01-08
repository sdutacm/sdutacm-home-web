<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { View } from 'bwcx-client-vue3';
import { RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';
import { AdminToolSectionEnum } from '@common/enums/admin-tool-section.enum';
import { MediaTypeEnum } from '@common/enums/media-type.enum';
import { GetMediaResDTO } from '@common/modules/media/media.dto';

import { ElLoading } from 'element-plus';
import AdminTools from '@client/components/admin/admin-tools.vue';
import GlobalConfigView from '@client/components/admin/global-config.vue';
import MediaListContainer from '@client/components/admin/media-list-container.vue';
import AdminOperate from '@client/components/admin/admin-operate.vue';
import NewsListContainer from '@client/components/admin/news-list-container.vue';
import ProjectListContainer from '@client/components/admin/project-list-container.vue';

@View('/admin')
@RenderMethod(RenderMethodKind.CSR)
@Options({
  components: {
    ProjectListContainer,
    AdminOperate,
    AdminTools,
    GlobalConfigView,
    MediaListContainer,
    NewsListContainer,
  },
})
export default class AdminView extends Vue {
  adminToolSectionEnum = AdminToolSectionEnum;
  currentMenu = this.adminToolSectionEnum.OVERVIEW;
  adminState = {
    globalConfig: null,
    mediaList: null,
    userInfo: undefined,
  };

  // 将 AdminToolSectionEnum 映射到 MediaTypeEnum
  mapToMediaType(section: AdminToolSectionEnum): MediaTypeEnum | null {
    const map: Record<string, MediaTypeEnum> = {
      [AdminToolSectionEnum.MEDIA_LOGO]: MediaTypeEnum.LOGO,
      [AdminToolSectionEnum.MEDIA_IMAGE]: MediaTypeEnum.IMAGE,
      [AdminToolSectionEnum.MEDIA_AUDIO]: MediaTypeEnum.AUDIO,
      [AdminToolSectionEnum.MEDIA_VIDEO]: MediaTypeEnum.VIDEO,
    };
    return map[section] || null;
  }
  menuMap: Record<string, string> = {
    [this.adminToolSectionEnum.OVERVIEW]: '管理总览',
    [this.adminToolSectionEnum.MEDIA_LOGO]: 'Logo 管理',
    [this.adminToolSectionEnum.MEDIA_IMAGE]: '图片管理',
    [this.adminToolSectionEnum.MEDIA_AUDIO]: '音频管理',
    [this.adminToolSectionEnum.MEDIA_VIDEO]: '视频管理',
    [this.adminToolSectionEnum.GLOBAL_CONFIG]: '首页配置',
    [this.adminToolSectionEnum.NEWS_MANAGEMENT]: '新闻管理',
    [this.adminToolSectionEnum.PROJECT_MANAGEMENT]: '项目管理',
  };

  async handleMenuSelect(index: AdminToolSectionEnum) {
    const loading = ElLoading.service({ fullscreen: true, text: '加载中...' });
    try {
      if (index == this.adminToolSectionEnum.GLOBAL_CONFIG) {
        const globalConfig = await this.$api.getGlobalConfig();
        this.adminState.globalConfig = globalConfig;
      } else if (
        index === this.adminToolSectionEnum.MEDIA_LOGO ||
        index === this.adminToolSectionEnum.MEDIA_IMAGE ||
        index === this.adminToolSectionEnum.MEDIA_AUDIO ||
        index === this.adminToolSectionEnum.MEDIA_VIDEO
      ) {
        const mediaType = this.mapToMediaType(index);
        if (mediaType) {
          const mediaList: GetMediaResDTO = await this.$api.getMediaList({
            type: mediaType,
          });
          this.adminState.mediaList = mediaList;
        }
      } else if (index === this.adminToolSectionEnum.ADMIN_VIEW) {

      }
      this.currentMenu = index;
    } catch (e) {
      console.error('菜单选择处理失败:', e);
    } finally {
      loading.close();
    }
  }

  get currentView() {
    return this.menuMap[this.currentMenu] || '未知页面';
  }

  async refreshMediaList() {
    const mediaType = this.mapToMediaType(this.currentMenu);
    if (mediaType) {
      const loading = ElLoading.service({ fullscreen: true, text: '刷新中...' });
      try {
        const mediaList: GetMediaResDTO = await this.$api.getMediaList({
          type: mediaType,
        });
        this.adminState.mediaList = mediaList;
      } catch (e) {
        console.error('刷新媒体列表失败:', e);
      } finally {
        loading.close();
      }
    }
  }

  async mounted() {
    const sess = await this.$api.getSession();
    this.adminState.userInfo = sess;
  }

  async handleRefreshUser() {
    try {
      const sess = await this.$api.getSession();
      this.adminState.userInfo = sess;
    } catch (error) {
      console.error('刷新用户信息失败:', error);
    }
  }
}
</script>

<template>
  <div class="admin-container">
    <div class="admin-tools">
      <AdminTools @menu-select="handleMenuSelect" :userInfo="adminState.userInfo" />
    </div>
    <div class="admin-preview">
      <div class="preview-header">
        <h2>{{ currentView }}</h2>
      </div>
      <div class="preview-content">
        <div v-if="currentMenu === adminToolSectionEnum.OVERVIEW">管理总览界面</div>
        <div
          v-else-if="
            currentMenu === adminToolSectionEnum.MEDIA_LOGO ||
            currentMenu === adminToolSectionEnum.MEDIA_IMAGE ||
            currentMenu === adminToolSectionEnum.MEDIA_AUDIO ||
            currentMenu === adminToolSectionEnum.MEDIA_VIDEO
          "
        >
          <MediaListContainer
            :mediaType="currentMenu"
            :mediaList="adminState.mediaList"
            @refresh="refreshMediaList"
          />
        </div>
        <div v-else-if="currentMenu === adminToolSectionEnum.GLOBAL_CONFIG">
          <GlobalConfigView :globalConfigState="adminState.globalConfig" />
        </div>
        <div v-else-if="currentMenu === adminToolSectionEnum.NEWS_MANAGEMENT">
          <NewsListContainer />
        </div>
        <div v-else-if="currentMenu === adminToolSectionEnum.PROJECT_MANAGEMENT">
          <ProjectListContainer />
        </div>
        <div v-else-if="currentMenu === adminToolSectionEnum.ADMIN_VIEW">
          <AdminOperate :userInfo="adminState.userInfo" @refresh-user="handleRefreshUser" />
        </div>
        <div v-else>请选择一个菜单项</div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.admin-container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;

  & .admin-tools {
    width: 300px;
    height: 100%;
  }

  & .admin-preview {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 20px;

    .preview-header {
      h2 {
        margin: 0;
        font-size: 24px;
      }
    }

    .preview-content {
      flex: 1;
      overflow: auto;
    }
  }
}
</style>
