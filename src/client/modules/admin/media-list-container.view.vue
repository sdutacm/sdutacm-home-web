<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { MediaTypeEnum } from '@common/enums/media-type.enum';
import { GetMediaListResDTO } from '@common/modules/media/media.dto';
import { View, RenderMethod, RenderMethodKind, ChildOf } from 'bwcx-client-vue3';

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
} from 'element-plus';
import { Copy, Download, Trash, FilePenLine, CirclePlus } from 'lucide-vue-next';
import UploadMediaDialog from '@client/components/admin/upload-media-dialog.vue';
import UpdateMediaDialog from '@client/components/admin/update-media-dialog.vue';
import { Head } from '@vueuse/head';

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
    Trash,
    UploadMediaDialog,
    UpdateMediaDialog,
    FilePenLine,
    CirclePlus,
    Copy,
    Download,
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

  mediaList: GetMediaListResDTO = {
    rows: [],
    total: 0,
  };

  currentPage = 1;
  pageSize = 10;

  uploadDialogVisible = false;
  updateDialogVisible = false;
  selectedMediaId: number | null = null;

  resizeTimer: number | null = null;

  // 请求竞态控制
  reqId = 0;
  loading = false;

  showUploadDialog() {
    this.uploadDialogVisible = true;
  }

  handleEdit(media: any) {
    this.selectedMediaId = media.id;
    this.updateDialogVisible = true;
  }

  // 1. 计算容器最多能放下多少卡片
  calculatePageSize() {
    const container = this.$refs.mediaListMain as HTMLElement;
    if (!container) {
      console.log('容器未找到');
      return;
    }

    const containerHeight = container.clientHeight;
    const containerWidth = container.clientWidth;

    // 尝试获取实际渲染的卡片
    const grid = container.querySelector('.media-list-grid') as HTMLElement;
    const cards = grid?.querySelectorAll('.media-list-card') as NodeListOf<HTMLElement>;

    let cols: number, cardHeight: number;

    if (cards && cards.length > 0) {
      // 使用实际渲染的列数：检查第一行有多少个卡片
      const firstCardTop = cards[0].offsetTop;
      cols = 0;
      for (let i = 0; i < cards.length; i++) {
        if (cards[i].offsetTop === firstCardTop) {
          cols++;
        } else {
          break;
        }
      }

      // 使用实际渲染的卡片高度 + gap
      cardHeight = cards[0].offsetHeight + 12;
      console.log('使用实际布局:', { cols, cardHeight });
    } else {
      // 使用估算值
      const cardMinWidth = 200 + 12;
      cols = Math.max(Math.floor((containerWidth + 12) / cardMinWidth), 1);
      // 图片180px + 卡片padding约20px + 描述20px + footer约40px + gap 12px
      cardHeight = 180 + 20 + 20 + 40 + 12;
      console.log('使用估算值:', { cols, cardHeight });
    }

    const rows = Math.max(Math.floor(containerHeight / cardHeight), 1);

    // 修改这一页的卡片数量为 n 的倍数
    const newPageSize = cols * rows;

    console.log('计算结果:', { containerHeight, cardHeight, cols, rows, newPageSize, currentPageSize: this.pageSize });

    if (newPageSize > 0) {
      this.pageSize = newPageSize;
    }
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

  // 2. 向服务端发送网络请求获取当前页的数据
  async fetchMediaList(isInitialLoad = false) {
    const currentReqId = ++this.reqId;
    console.log('开始加载媒体列表:', { mediaType: this.mediaType, page: this.currentPage, pageSize: this.pageSize, reqId: currentReqId, isInitialLoad });

    try {
      this.loading = true;

      const result = await this.$api.getMediaList({
        type: this.mediaType,
        page: this.currentPage,
        pageSize: this.pageSize,
      });

      if (currentReqId !== this.reqId) {
        console.log('请求已过期，丢弃结果', { currentReqId, latestReqId: this.reqId });
        return;
      }

      this.mediaList = result;
      console.log('媒体列表加载成功:', { count: result.rows.length, total: result.total });

      // 首次加载后，用实际卡片高度重新计算一次
      if (isInitialLoad && result.rows.length > 0) {
        await this.$nextTick();
        const oldPageSize = this.pageSize;
        this.calculatePageSize();
        // 如果 pageSize 变化了，重新加载
        if (this.pageSize !== oldPageSize) {
          console.log('PageSize 调整:', { from: oldPageSize, to: this.pageSize });
          await this.fetchMediaList();
        }
      }
    } catch (error) {
      if (currentReqId !== this.reqId) {
        console.log('请求已过期，忽略错误', { currentReqId, latestReqId: this.reqId });
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

  // 3. 路由切换时触发计算
  async handleMediaTypeChange(newType: MediaTypeEnum) {
    console.log('切换媒体类型:', { from: this.mediaType, to: newType, oldCurrentPage: this.currentPage });

    // 重置所有状态
    this.mediaType = newType;
    this.currentPage = 1;
    this.mediaList = { rows: [], total: 0 }; // 清空旧数据
    this.reqId++; // 让旧请求失效

    console.log('重置后 currentPage:', this.currentPage);

    // 先计算再获取，并标记为首次加载
    await this.$nextTick();
    this.calculatePageSize();
    console.log('计算后 currentPage:', this.currentPage);
    await this.fetchMediaList(true);
    console.log('加载后 currentPage:', this.currentPage);
  }

  async updateFileList(newMediaList: GetMediaListResDTO) {
    await this.fetchMediaList();
  }

  async mounted(): Promise<void> {
    const type = this.$route.params.id as MediaTypeEnum;
    this.mediaType = type;
    console.log('组件挂载，媒体类型:', type);

    await this.$nextTick();

    // 先计算再获取，并标记为首次加载
    this.calculatePageSize();
    await this.fetchMediaList(true);

    window.addEventListener('resize', this.handleResize);
  }

  // 3. resize 时触发计算
  handleResize() {
    if (!this.$refs.mediaListMain) {
      return;
    }

    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }

    this.resizeTimer = window.setTimeout(() => {
      // 先计算再获取
      this.calculatePageSize();
      this.fetchMediaList();
      this.resizeTimer = null;
    }, 300);
  }

  handleCopyMediaURL(path: string) {
    const host = window.location.origin;
    const fullURL = `${host}${path}`;
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

  handleDownload(path: string) {
    const host = window.location.origin;
    const fullURL = `${host}${path}`;
    const link = document.createElement('a');
    link.href = fullURL;
    link.download = fullURL.split('/').pop() || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  unmounted() {
    window.removeEventListener('resize', this.handleResize);
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }
  }
}
</script>

<template>
  <Head>
    <title>SDUTACM Admin | {{ mediaType }} Management</title>
    <meta name="description" content="SDUTACM 管理后台媒体资源管理">
  </Head>
  <div class="media-list-container">
    <header class="media-list-header">
      <el-button type="primary" @click="showUploadDialog">
        <el-icon><CirclePlus /></el-icon>
        <span>Upload {{ mediaType }}</span>
      </el-button>
    </header>
    <main ref="mediaListMain" class="media-list-main" v-loading="loading">
      <div v-if="mediaList.rows.length === 0" class="media-list-fallback">
        <el-empty :description="`No ${mediaType} resources available, please upload first`" />
      </div>
      <div v-else class="media-list-grid">
        <el-card v-for="media in mediaList.rows" :key="media.id" shadow="hover" class="media-list-card">
          <div class="media-list-image-container">
            <el-image :src="media.path" class="media-list-card-image" fit="contain" style="width: 100%; height: 100%;" />
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

    <upload-media-dialog
      v-model:visible="uploadDialogVisible"
      :media-type="mediaType"
      :updateMediaList="updateFileList"
    />

    <update-media-dialog
      v-model:visible="updateDialogVisible"
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
    overflow: hidden;
    padding: 0 8px 8px 8px;
  }

  .media-list-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }

  .media-list-card {
    .media-list-image-container {
      height: 140px;
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
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
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

  @media (max-width: 768px) {
    .media-list-card {
      .media-list-image-container {
        height: 120px;
      }
    }
  }

  @media (max-width: 480px) {
    .media-list-card {
      .media-list-image-container {
        height: 100px;
      }
    }
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
</style>
