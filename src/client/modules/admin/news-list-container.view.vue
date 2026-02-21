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
  vLoading,
} from 'element-plus';
import { Head } from '@vueuse/head';
import { Edit, Trash2 as Delete } from 'lucide-vue-next';
import NewsEditDialog from '@client/components/admin/news-edit-dialog.vue';
import UserAvatar from '@client/components/user-avatar.vue';

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
    Edit,
    Delete,
    NewsEditDialog,
    UserAvatar,
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
  pageSize = 35;

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

  <div class="news-list-container" v-loading="loading">
    <div class="toolbar">
      <el-button  plain @click="showCreateDialog" style="padding: 0 1rem;"> Add News </el-button>
      <el-select v-model="filterStatus" placeholder="Select State" style="width: 120px; margin-left: 12px">
        <el-option label="Total" value="all" />
        <el-option label="Published" value="published" />
        <el-option label="Draft" value="draft" />
      </el-select>
    </div>

    <el-table :data="paginatedNewsList" style="width: 100%; margin-top: 16px" stripe v-show="!loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="title" label="Title" min-width="200" show-overflow-tooltip />
      <el-table-column prop="summary" label="Summary" min-width="150" show-overflow-tooltip />
      <el-table-column label="Status">
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
      <el-table-column label="Updated By">
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

    <!-- 分页 -->
    <div class="pagination-wrapper" v-show="!loading && totalNews > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[35]"
        :total="totalNews"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 编辑新闻对话框 -->
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
  justify-content: start;
  overflow-x: auto;

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
    padding: 12px 0;
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
</style>
