<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { MediaTypeEnum } from '@common/enums/media-type.enum';
import { GetMediaResDTO } from '@common/modules/media/media.dto';
import { View, RenderMethod, RenderMethodKind, ChildOf } from 'bwcx-client-vue3';
import { MediaRPO } from '@common/modules/media/media.rtp';

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
} from 'element-plus';
import { Delete, Edit } from '@element-plus/icons-vue';
import UploadMediaDialog from '@client/components/admin/upload-media-dialog.vue';

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
    ElEmpty,
    ElPagination,
    Delete,
    UploadMediaDialog,
    Edit,
  },
})
export default class MediaListContainer extends Vue {
  mediaType: MediaTypeEnum = MediaTypeEnum.IMAGE;

  mediaList: GetMediaResDTO = {
    rows: [],
    total: 0,
  };

  currentPage = 1;
  pageSize = 10; // 初始值设小，避免首次加载过多

  uploadDialogVisible = false;

  isCalculating = false;
  resizeTimer: number | null = null;

  showUploadDialog() {
    this.uploadDialogVisible = true;
  }

  async calculatePageSize() {
    const container = this.$refs.mediaListMain as HTMLElement;
    if (!container) {
      console.log('容器未找到');
      return;
    }

    const containerHeight = container.clientHeight;
    const containerWidth = container.clientWidth;

    console.log('容器尺寸:', { containerHeight, containerWidth });

    // 卡片最小宽度 200px + gap 12px
    const cardMinWidth = 200 + 12;
    const cols = Math.max(Math.floor((containerWidth + 12) / cardMinWidth), 1);

    // 卡片实际高度：图片容器200px + footer约80px + 卡片内边距 + gap 12px
    const cardHeight = 200 + 80 + 24 + 12; // 约316px
    const rows = Math.max(Math.floor(containerHeight / cardHeight), 1);

    const newPageSize = cols * rows;

    console.log('计算结果:', { cols, rows, newPageSize, currentPageSize: this.pageSize });

    if (newPageSize !== this.pageSize && newPageSize > 0) {
      const oldPageSize = this.pageSize;
      this.pageSize = newPageSize;

      // 如果已经加载过数据，重新计算当前页码并刷新
      if (this.mediaList.rows.length > 0) {
        // 保持用户当前查看的第一个元素位置
        const firstItemIndex = (this.currentPage - 1) * oldPageSize;
        this.currentPage = Math.floor(firstItemIndex / newPageSize) + 1;
        await this.fetchMediaList();
      }
    }
  }

  async handleDelete(media: any) {
    try {
      await ElMessageBox.confirm(`确定要删除这个${this.mediaType}吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      });

      await this.$api.deleteMedia({ id: media.id });
      ElMessage.success('删除成功');
      await this.fetchMediaList();
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除失败:', error);
        ElMessage.error('删除失败，请重试');
      }
    }
  }

  async handlePageChange(page: number) {
    this.currentPage = page;
    await this.fetchMediaList();
  }

  async fetchMediaList() {
    this.mediaList = await this.$api.getMediaList({
      type: this.mediaType,
      page: this.currentPage,
      pageSize: this.pageSize,
    });

    // 数据加载完成后，只在首次加载时重新精确计算页面大小
    if (this.currentPage === 1) {
      await this.$nextTick();
      await this.recalculateWithActualHeight();
    }
  }

  async recalculateWithActualHeight() {
    if (this.isCalculating) return;

    const container = this.$refs.mediaListMain as HTMLElement;
    if (!container) return;

    const grid = container.querySelector('.media-list-grid') as HTMLElement;
    const cards = grid?.querySelectorAll('.media-list-card') as NodeListOf<HTMLElement>;

    if (!cards || cards.length === 0) return;

    const containerHeight = container.clientHeight;

    // 获取实际的列数：检查第一行有多少个卡片
    const firstCardTop = cards[0].offsetTop;
    let actualCols = 0;
    for (let i = 0; i < cards.length; i++) {
      if (cards[i].offsetTop === firstCardTop) {
        actualCols++;
      } else {
        break;
      }
    }

    // 获取实际渲染的卡片高度
    const cardActualHeight = cards[0].offsetHeight;

    // 计算能完整显示的行数
    const rows = Math.floor(containerHeight / cardActualHeight);

    const correctPageSize = actualCols * rows;

    // 如果计算出的页面大小与当前不同，更新并重新加载
    if (correctPageSize !== this.pageSize && correctPageSize > 0) {
      this.isCalculating = true;
      this.pageSize = correctPageSize;
      this.currentPage = 1;
      await this.fetchMediaList();
      this.isCalculating = false;
    }
  }

  async beforeRouteUpdate(to, from, next) {
    const type = to.params.id as MediaTypeEnum;
    this.mediaType = type;
    this.currentPage = 1;
    await this.fetchMediaList();
    next();
  }

  async updateFileList(newMediaList: GetMediaResDTO) {
    await this.fetchMediaList();
  }

  async mounted(): Promise<void> {
    const type = this.$route.params.id as MediaTypeEnum;
    this.mediaType = type;
    console.log('媒体类型:', type);

    // 等待 DOM 渲染后计算页面大小
    await this.$nextTick();

    // 使用 setTimeout 确保容器尺寸已经完全计算
    await this.calculatePageSize();
    await this.fetchMediaList();

    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize);
  }

  handleResize() {
    // 检查组件是否还挂载
    if (!this.$refs.mediaListMain) {
      return;
    }

    // 防抖：清除之前的定时器
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }

    // 设置新的定时器，300ms 后执行
    this.resizeTimer = window.setTimeout(() => {
      this.currentPage = 1;
      this.calculatePageSize();
      this.resizeTimer = null;
    }, 300);
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
  <div class="media-list-container">
    <header class="media-list-header">
      <el-button type="primary" size="small" @click="showUploadDialog"> 上传 {{ mediaType }} </el-button>
    </header>
    <main ref="mediaListMain" class="media-list-main">
      <div v-if="mediaList.rows.length === 0" class="media-list-fallback">
        <el-empty :description="`暂无 ${mediaType} 资源，请先上传`" />
      </div>
      <div v-else class="media-list-grid">
        <el-card v-for="media in mediaList.rows" :key="media.id" shadow="hover" class="media-list-card">
          <div class="media-list-image-container">
            <el-image :src="media.path" class="media-list-card-image" fit="cover" />
          </div>
          <template #footer>
            <div class="media-list-card-alt">
              {{ media.alt ? media.alt : '无描述' }}
            </div>
            <footer class="media-list-card-footer">
              <el-button size="small" circle>
                <el-icon><edit /></el-icon>
              </el-button>
              <el-button type="danger" size="small" circle @click="handleDelete(media)" plain>
                <el-icon><delete /></el-icon>
              </el-button>
            </footer>
          </template>
        </el-card>
      </div>
    </main>

    <footer v-if="mediaList.total > pageSize" class="media-list-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="mediaList.total"
        size="small"
        background
        layout="total, prev, pager, next, jumper"
        @current-change="handlePageChange"
      />
    </footer>

    <upload-media-dialog
      v-model:visible="uploadDialogVisible"
      :media-type="mediaType"
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
      height: 180px;
      display: flex;
      justify-content: center;
      align-items: center;

      .media-list-card-image {
        max-width: 100%;
        max-height: 100%;
      }
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
      justify-content: center;
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
}
</style>
