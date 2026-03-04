<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { MediaTypeEnum } from '@common/enums/media-type.enum';
import { GetMediaListResDTO } from '@common/modules/media/media.dto';
import { View, RenderMethod, RenderMethodKind, ChildOf } from 'bwcx-client-vue3';
import { MEDIA_TYPE_CONFIG } from '@common/config/media-type-config';
import { resolveMediaUrl } from '@client/utils';

import {
  ElButton,
  ElImage,
  ElUpload,
  ElCard,
  ElIcon,
  ElMessage,
  ElMessageBox,
  ElEmpty,
  ElPagination,
  ElLoading,
  ElSkeleton,
  ElSkeletonItem,
} from 'element-plus';
import { Copy, Download, Trash2 as Trash, FilePenLine, CirclePlus, FileVideoCamera, FileMusic } from 'lucide-vue-next';
import MediaDialog, { MediaDialogMode } from '@client/components/admin/media-dialog.vue';
import { Head } from '@vueuse/head';
import AddButton from '@client/components/admin/add-button.vue';
import TipButton from '@client/components/admin/tip-button.vue';

@View('/admin/media-list/:id')
@ChildOf('AdminView')
@RenderMethod(RenderMethodKind.CSR)
@Options({
  components: {
    ElButton,
    ElImage,
    ElUpload,
    ElCard,
    ElIcon,
    Head,
    ElEmpty,
    ElPagination,
    ElSkeleton,
    ElSkeletonItem,
    Trash,
    MediaDialog,
    FilePenLine,
    CirclePlus,
    Copy,
    Download,
    FileVideoCamera,
    FileMusic,
    AddButton,
    TipButton,
  },
  directives: {
    loading: ElLoading.directive,
  },
  watch: {
    '$route.params.id': {
      handler(newType: MediaTypeEnum, oldType: MediaTypeEnum) {
        if (newType && newType !== oldType) {
          this.handleMediaTypeChange(newType);
        }
      },
      immediate: false,
    },
  },
})
export default class MediaListContainer extends Vue {
  mediaType: MediaTypeEnum = MediaTypeEnum.IMAGE;

  resolveMediaUrl = resolveMediaUrl;

  get mediaTypeConfig() {
    return MEDIA_TYPE_CONFIG[this.mediaType];
  }

  mediaList: GetMediaListResDTO = {
    rows: [],
    total: 0,
  };

  currentPage = 1;
  pageSize = 40;

  mediaDialogVisible = false;
  mediaDialogMode: MediaDialogMode = 'upload';
  selectedMediaId: number | null = null;

  // 请求竞态控制
  reqId = 0;
  loading = false;

  showUploadDialog() {
    this.mediaDialogMode = 'upload';
    this.selectedMediaId = null;
    this.mediaDialogVisible = true;
  }

  handleEdit(media: any) {
    this.mediaDialogMode = 'edit';
    this.selectedMediaId = media.id;
    this.mediaDialogVisible = true;
  }

  async handleDelete(id: number) {
    try {
      await ElMessageBox.confirm(`Are you sure you want to delete this ${this.mediaType}?`, 'Warning', {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning',
      });

      await this.$api.deleteMedia({ id });
      ElMessage.primary('Deleted successfully');
      await this.fetchMediaList();
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error('Delete failed, please try again');
      }
    }
  }

  async handlePageChange(page: number) {
    console.log('Page change:', { from: this.currentPage, to: page });
    this.currentPage = page;
    await this.fetchMediaList();
  }

  async fetchMediaList() {
    const currentReqId = ++this.reqId;

    try {
      this.loading = true;

      const result = await this.$api.getMediaList({
        type: this.mediaType,
        page: this.currentPage,
        pageSize: this.pageSize,
      });

      if (currentReqId !== this.reqId) {
        return;
      }

      this.mediaList = result;
    } catch (error) {
      if (currentReqId !== this.reqId) {
        return;
      }

      console.error('获取媒体列表失败:', error);
      ElMessage.error('加载失败，请重试');
    } finally {
      if (currentReqId === this.reqId) {
        this.loading = false;
      }
    }
  }

  async handleMediaTypeChange(newType: MediaTypeEnum) {
    this.mediaType = newType;
    this.currentPage = 1;
    this.mediaList = { rows: [], total: 0 };
    this.reqId++;

    await this.fetchMediaList();
  }

  async updateFileList(newMediaList: GetMediaListResDTO) {
    await this.fetchMediaList();
  }

  async mounted(): Promise<void> {
    const type = this.$route.params.id as MediaTypeEnum;
    this.mediaType = type;

    await this.fetchMediaList();
  }

  handleCopyMediaURL(path: string) {
    const fullURL = resolveMediaUrl(path);
    navigator.clipboard.writeText(fullURL).then(
      () => {
        ElMessage.primary('Media URL copied to clipboard');
      },
      (err) => {
        console.error('Failed to copy media URL:', err);
        ElMessage.error('Failed to copy URL, please try again');
      },
    );
  }

  async handleDownload(path: string) {
    const fullURL = resolveMediaUrl(path);
    const fileName = fullURL.split('/').pop() || 'download';
    try {
      const res = await fetch(fullURL);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      ElMessage.error('下载失败，请重试');
    }
  }

}
</script>

<template>
  <Head>
    <title>SDUTACM Admin | {{ mediaTypeConfig.label }} Management</title>
    <meta name="description" content="SDUTACM 管理后台媒体资源管理" />
  </Head>

  <div class="media-list-container">
    <header class="media-list-header">
      <add-button :content="mediaTypeConfig.label" @click="showUploadDialog"></add-button>
      <tip-button
        :content="[
          'Media management aims to maintain SDUTACM online assets.',
          'The logo is primarily used to store icons for SDUTACM related products.',
          'Image is mainly used to store historical honor photos.',
          'Audio and Video support large file uploads.',
        ]"
      />
    </header>

    <main ref="mediaListMain" class="media-list-main" v-loading="loading">
      <div v-if="mediaList.rows.length === 0" class="media-list-fallback">
        <el-empty :description="`No ${mediaType} resources available, please upload first`" />
      </div>
      <div v-else class="media-list-grid">
        <el-card v-for="media in mediaList.rows" :key="media.id" shadow="hover" class="media-list-card">
          <div class="media-list-image-container">
            <el-image
              v-if="media.type === 'image' || media.type === 'logo'"
              :src="resolveMediaUrl(media.path)"
              class="media-list-card-image"
              fit="contain"
              style="width: 100%; height: 100%"
            />
            <el-icon v-else-if="media.type === 'video'"><FileVideoCamera /></el-icon>
            <el-icon v-else-if="media.type === 'audio'"><FileMusic /></el-icon>
          </div>
          <template #footer>
            <div class="media-list-card-alt">
              {{ media.alt ? media.alt : 'No description' }}
            </div>
            <footer class="media-list-card-footer">
              <el-button size="small" circle @click="handleEdit(media)">
                <el-icon><FilePenLine /></el-icon>
              </el-button>

              <el-button size="small" circle @click="handleCopyMediaURL(media.path)">
                <el-icon><Copy /></el-icon>
              </el-button>
              <el-button size="small" circle @click="handleDownload(media.path)">
                <el-icon><Download /></el-icon>
              </el-button>
              <el-button type="danger" size="small" circle @click="handleDelete(media.id)" plain>
                <el-icon><Trash /></el-icon>
              </el-button>
            </footer>
          </template>
        </el-card>
      </div>
    </main>

    <footer v-if="mediaList.total > pageSize" class="media-list-pagination">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="mediaList.total"
        size="small"
        background
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
      />
    </footer>

    <media-dialog
      v-model:visible="mediaDialogVisible"
      :mode="mediaDialogMode"
      :media-type="mediaType"
      :media-id="selectedMediaId"
      :updateMediaList="updateFileList"
    />
  </div>
</template>

<style scoped lang="less">
.media-list-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;

  .media-list-main {
    flex: 1;
    overflow-y: auto;
    padding: 0 8px 8px 8px;
  }

  .media-list-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
  }

  .media-list-card {
    user-select: none;
    .media-list-image-container {
      height: 135px;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      overflow: hidden;
    }

    .media-list-card-alt {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: center;
      white-space: nowrap;
      margin-bottom: 8px;
    }

    .media-list-card-footer {
      display: flex;
      justify-content: space-around;
      align-items: center;
    }
  }

  .media-list-fallback {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .media-list-pagination {
    display: flex;
    justify-content: center;
    padding: 12px;
  }
}

.media-save-tools {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 100;

  &-button {
    width: 0.4rem;
    display: flex;
    justify-content: center;
    align-items: center;
    aspect-ratio: 1 / 1;
  }
}

.media-list-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
