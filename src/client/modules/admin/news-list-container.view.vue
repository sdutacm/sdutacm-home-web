<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import { View, ChildOf, RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';
import { NewsItemVO } from '@common/modules/news/news.dto';

import {
  ElMessage,
  ElMessageBox,
  ElLoading,
  ElIcon,
  ElButton,
  ElTable,
  ElTableColumn,
  ElTag,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElSwitch,
  ElUpload,
  ElImage,
  ElSelect,
  ElOption,
  ElPagination,
  ElSkeleton,
  ElSkeletonItem,
  vLoading,
} from 'element-plus';
import { Head } from '@vueuse/head';
import { Edit, Trash2 as Delete, Plus } from 'lucide-vue-next';
import NewsEditDialog from '@client/components/admin/news-edit-dialog.vue';
import UserAvatar from '@client/components/user-avatar.vue';
import AddButton from '@client/components/admin/add-button.vue';
import TipButton from '@client/components/admin/tip-button.vue';

@View('/admin/news-list')
@ChildOf('AdminView')
@RenderMethod(RenderMethodKind.CSR)
@Options({
  directives: {
    loading: vLoading,
  },
  components: {
    ElIcon,
    ElButton,
    ElTable,
    AddButton,
    ElTableColumn,
    ElTag,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElSwitch,
    ElUpload,
    ElImage,
    Head,
    ElSelect,
    ElOption,
    ElPagination,
    ElSkeleton,
    ElSkeletonItem,
    Edit,
    Delete,
    NewsEditDialog,
    UserAvatar,
    TipButton,
    Plus,
  },
})
export default class NewsListContainer extends Vue {
  newsList: NewsItemVO[] = [];
  dialogVisible = false;
  dialogType: 'create' | 'edit' = 'create';
  isEdit = false;
  currentNewsId: number | null = null;
  filterStatus = 'all'; // 筛选状态: 'all', 'published', 'draft'
  loading: boolean = true;

  // 分页相关
  currentPage = 1;
  pageSize = 25;

  newsForm = {
    title: '',
    summary: '',
    content: '',
    coverImage: '',
    updatedBy: null,
    isPublished: false,
  };

  coverImageFile: any = null;
  uploadingCover = false;

  get filteredNewsList() {
    if (this.filterStatus === 'all') return this.newsList;
    if (this.filterStatus === 'published') return this.newsList.filter((n) => n.isPublished);
    if (this.filterStatus === 'draft') return this.newsList.filter((n) => !n.isPublished);
    return this.newsList;
  }

  get paginatedNewsList() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredNewsList.slice(start, end);
  }

  get totalNews() {
    return this.filteredNewsList.length;
  }

  handlePageChange(page: number) {
    this.currentPage = page;
  }

  handleSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  @Watch('filterStatus')
  onFilterStatusChange() {
    this.currentPage = 1;
  }

  async loadNewsList() {
    try {
      const res = await this.$api.getAllNews({});
      this.newsList = res.rows;
      console.log('新闻列表:', { ...this.newsList });
    } catch (error) {
      console.error('Failed to load news list:', error);
      ElMessage.error('Failed to load news list');
    }
  }

  showCreateDialog() {
    this.dialogType = 'create';
    this.isEdit = false;
    this.currentNewsId = null;
    this.newsForm = {
      title: '',
      summary: '',
      content: '',
      coverImage: '',
      isPublished: false,
      updatedBy: null,
    };
    this.coverImageFile = null;
    this.dialogVisible = true;
  }

  showEditDialog(news: NewsItemVO) {
    this.dialogType = 'edit';
    this.isEdit = true;
    this.currentNewsId = news.id;
    this.newsForm = {
      title: news.title,
      summary: news.summary || '',
      content: news.content,
      coverImage: news.coverImage || '',
      updatedBy: news.updatedBy || null,
      isPublished: news.isPublished,
    };
    this.coverImageFile = null;
    this.dialogVisible = true;
  }

  async handleDelete(news: NewsItemVO) {
    try {
      await ElMessageBox.confirm(`Are you sure you want to delete the news "${news.title}"?`, 'Confirmation', {
        confirmButtonText: 'Yes',
        cancelButtonText: 'Cancel',
        type: 'warning',
      });

      await this.$api.deleteNews({ id: news.id });
      ElMessage.success('Deleted successfully');
      await this.loadNewsList();
    } catch (error) {
      if (error !== 'cancel') {
        console.error('Failed to delete news:', error);
        ElMessage.error('Failed to delete news');
      }
    }
  }

  formatDate(date: Date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('zh-CN');
  }

  resetForm() {
    this.newsForm = {
      title: '',
      summary: '',
      content: '',
      coverImage: '',
      updatedBy: null,
      isPublished: false,
    };
    this.coverImageFile = null;
  }

  async mounted() {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 模拟加载延迟
      await this.loadNewsList();
    } finally {
      this.loading = false;
    }
  }
}
</script>

<template>
  <Head>
    <title>SDUTACM Admin | News Management</title>
    <meta name="description" content="SDUTACM 管理后台新闻管理" />
  </Head>

  <div class="news-list-container">
    <div class="toolbar">
      <add-button content="News" @click="showCreateDialog"></add-button>
      <div style="display: flex; align-items: center; gap: .2rem;">
        <el-select v-model="filterStatus" placeholder="Select State" style="width: 120px; margin-left: 12px">
          <el-option label="All" value="all" />
          <el-option label="Published" value="published" />
          <el-option label="Draft" value="draft" />
        </el-select>
        <tip-button :content="[
          'Filter news by status: All, Published, or Draft.',
          'Click 「Add News」 to create a new news item.',
          'Use the Edit and Delete buttons to manage existing news items.',
        ]"></tip-button>
      </div>
    </div>

    <div class="table-wrapper">
      <!-- 骨架屏 -->
      <div v-if="loading" class="table-skeleton">
        <el-skeleton :rows="0" animated>
        <template #template>
          <!-- 表头骨架 -->
          <div class="skeleton-table-header">
            <el-skeleton-item variant="text" style="width: 40px; height: 16px;" />
            <el-skeleton-item variant="text" style="width: 150px; height: 16px;" />
            <el-skeleton-item variant="text" style="width: 100px; height: 16px;" />
            <el-skeleton-item variant="text" style="width: 70px; height: 16px;" />
            <el-skeleton-item variant="text" style="width: 120px; height: 16px;" />
            <el-skeleton-item variant="text" style="width: 120px; height: 16px;" />
            <el-skeleton-item variant="text" style="width: 120px; height: 16px;" />
            <el-skeleton-item variant="text" style="width: 100px; height: 16px;" />
            <el-skeleton-item variant="text" style="width: 100px; height: 16px;" />
          </div>
          <!-- 表格行骨架 -->
          <div v-for="i in 10" :key="'skeleton-row-' + i" class="skeleton-table-row">
            <el-skeleton-item variant="text" style="width: 30px; height: 14px;" />
            <el-skeleton-item variant="text" style="width: 140px; height: 14px;" />
            <el-skeleton-item variant="text" style="width: 90px; height: 14px;" />
            <el-skeleton-item variant="button" style="width: 60px; height: 22px; border-radius: 4px;" />
            <el-skeleton-item variant="text" style="width: 110px; height: 14px;" />
            <el-skeleton-item variant="text" style="width: 110px; height: 14px;" />
            <el-skeleton-item variant="text" style="width: 110px; height: 14px;" />
            <div style="display: flex; align-items: center; gap: 6px;">
              <el-skeleton-item variant="circle" style="width: 24px; height: 24px;" />
              <el-skeleton-item variant="text" style="width: 60px; height: 14px;" />
            </div>
            <div style="display: flex; gap: 8px;">
              <el-skeleton-item variant="text" style="width: 40px; height: 14px;" />
              <el-skeleton-item variant="text" style="width: 50px; height: 14px;" />
            </div>
          </div>
        </template>
        </el-skeleton>
      </div>
      <!-- 实际表格 -->
      <el-table
        v-else
        :data="paginatedNewsList"
        style="width: 100%; user-select: none"
        stripe
      >
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="title" label="Title" min-width="200" show-overflow-tooltip />
      <el-table-column prop="summary" label="Summary" min-width="150" show-overflow-tooltip />
      <el-table-column label="Status" width="120">
        <template #default="{ row }">
          <el-tag :type="row.isPublished ? 'success' : 'info'">
            {{ row.isPublished ? 'Published' : 'Draft' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="PublishedAt" width="180">
        <template #default="{ row }">
          {{ formatDate(row.publishedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="CreatedAt" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="UpdatedAt" width="180">
        <template #default="{ row }">
          {{ formatDate(row.updatedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="Updated By" width="150">
        <template #default="{ row }">
          <div v-if="row.updatedBy" class="editor-container">
            <user-avatar :avatarUrl="row.updatedBy.avatar" />
            <span>{{ row.updatedBy.username }}</span>
          </div>
          <div v-else>-</div>
        </template>
      </el-table-column>
      <el-table-column label="Operate" width="150" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="showEditDialog(row)" link>
            <el-icon><Edit /></el-icon>
            <span>Edit</span>
          </el-button>
          <el-button type="danger" size="small" @click="handleDelete(row)" link>
            <el-icon><Delete /></el-icon>
            <span>Delete</span>
          </el-button>
        </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页器骨架屏 -->
    <div v-if="loading" class="pagination-wrapper">
      <el-skeleton :rows="0" animated style="display: flex; gap: 8px; justify-content: flex-end;">
        <template #template>
          <el-skeleton-item variant="text" style="width: 60px; height: 28px;" />
          <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px;" />
          <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px;" />
          <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px;" />
          <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px;" />
        </template>
      </el-skeleton>
    </div>
    <div class="pagination-wrapper" v-else>
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[25]"
        :total="totalNews"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <news-edit-dialog
      :visible="dialogVisible"
      :closeDialog="
        () => {
          dialogVisible = false;
          resetForm();
        }
      "
      :newsForm="newsForm"
      :newsId="currentNewsId"
      :dialogType="dialogType"
      :fetchNewsList="loadNewsList"
    />
  </div>
</template>

<style lang="less" scoped>
.news-list-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  .toolbar {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    padding: 12px 0;
    flex-shrink: 0;
  }

  .table-wrapper {
    flex: 1;
    overflow: auto;
    min-height: 0;
    margin-top: 16px;
  }

  .table-skeleton {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;

    .skeleton-table-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
      background: var(--el-fill-color-light);
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    .skeleton-table-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      &:last-child {
        border-bottom: none;
      }

      &:nth-child(odd) {
        background: var(--el-fill-color-lighter);
      }
    }
  }

  .cover-upload-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    .cover-preview {
      border: 1px dashed #dcdfe6;
      border-radius: 4px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: border-color 0.3s;

      &:hover {
        border-color: #409eff;
      }

      .upload-placeholder {
        width: 200px;
        height: 120px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #8c939d;
        font-size: 14px;
      }
    }

    .upload-tip {
      margin-top: 8px;
      font-size: 12px;
      color: #999;
    }
  }
}

.editor-container {
  display: flex;
  align-items: center;
  gap: 0.1rem;
}

.loading-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
}
</style>
