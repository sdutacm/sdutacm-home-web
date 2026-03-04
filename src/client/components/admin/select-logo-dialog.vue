<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { MediaTypeEnum } from '@common/enums/media-type.enum';
import {
  ElDialog,
  ElButton,
  ElImage,
  ElMessage,
  ElEmpty,
  vLoading,
  ElCard,
  ElTabs,
  ElTabPane,
  ElIcon,
  ElUpload,
  ElInput,
} from 'element-plus';
import { Upload, FolderOpen, Search } from 'lucide-vue-next';
import { resolveMediaUrl } from '@client/utils';

// 媒体类型的显示配置
const MEDIA_TYPE_CONFIG: Record<MediaTypeEnum, { title: string; emptyText: string }> = {
  [MediaTypeEnum.LOGO]: { title: 'Select Logo', emptyText: 'No logo resources available' },
  [MediaTypeEnum.IMAGE]: { title: 'Select Image', emptyText: 'No image resources available' },
  [MediaTypeEnum.AUDIO]: { title: 'Select Audio', emptyText: 'No audio resources available' },
  [MediaTypeEnum.VIDEO]: { title: 'Select Video', emptyText: 'No video resources available' },
  [MediaTypeEnum.ADMIN_AVATAR]: { title: 'Select Avatar', emptyText: 'No avatar resources available' },
  [MediaTypeEnum.NEWS_COVER]: { title: 'Select News Cover', emptyText: 'No news cover resources available' },
  [MediaTypeEnum.PROJECT_COVER]: { title: 'Select Project Cover', emptyText: 'No project cover resources available' },
};

@Options({
  components: {
    ElDialog,
    ElButton,
    ElImage,
    ElEmpty,
    ElCard,
    ElTabs,
    ElTabPane,
    ElIcon,
    ElUpload,
    ElInput,
    Upload,
    FolderOpen,
    Search,
  },
  directives: {
    loading: vLoading,
  },
  emits: ['update:visible', 'select'],
})
export default class SelectMediaDialog extends Vue {
  @Prop({ required: true, default: false })
  visible!: boolean;

  resolveMediaUrl = resolveMediaUrl;

  // 媒体类型，默认为 LOGO
  @Prop({ default: MediaTypeEnum.LOGO })
  mediaType!: MediaTypeEnum;

  // 当前选中的媒体 URL（用于预选）
  @Prop({ default: '' })
  currentMediaUrl!: string;

  // 是否显示上传标签页
  @Prop({ default: true })
  showUploadTab!: boolean;

  // 是否允许多选
  @Prop({ default: false })
  multiple!: boolean;

  mediaList: any[] = [];
  loading = false;
  selectedMedia: any = null;
  activeTab = 'library'; // 'library' | 'upload'
  uploading = false;
  searchKeyword = '';

  get dialogTitle() {
    return MEDIA_TYPE_CONFIG[this.mediaType]?.title || 'Select Media';
  }

  get emptyText() {
    return MEDIA_TYPE_CONFIG[this.mediaType]?.emptyText || 'No resources available';
  }

  // 过滤后的媒体列表
  get filteredMediaList() {
    if (!this.searchKeyword.trim()) {
      return this.mediaList;
    }
    const keyword = this.searchKeyword.toLowerCase().trim();
    return this.mediaList.filter((item) => {
      const alt = (item.alt || '').toLowerCase();
      const path = (item.path || '').toLowerCase();
      return alt.includes(keyword) || path.includes(keyword);
    });
  }

  @Watch('visible')
  async onVisibleChange(val: boolean) {
    if (val) {
      await this.loadMediaList();
    } else {
      this.selectedMedia = null;
      this.activeTab = 'library';
      this.searchKeyword = '';
    }
  }

  @Watch('mediaType')
  async onMediaTypeChange() {
    if (this.visible) {
      await this.loadMediaList();
    }
  }

  async loadMediaList() {
    this.loading = true;
    try {
      const result = await this.$api.getMediaList({
        type: this.mediaType,
        page: 1,
        pageSize: 1000,
      });
      this.mediaList = result.rows || [];

      // 如果有当前选中的媒体，找到并预选
      if (this.currentMediaUrl) {
        const current = this.mediaList.find((item) => item.path === this.currentMediaUrl);
        if (current) {
          this.selectedMedia = current;
        }
      }
    } catch (error: any) {
      console.error('加载媒体列表失败:', error);
      ElMessage.error('Failed to load media list');
    } finally {
      this.loading = false;
    }
  }

  handleClose() {
    this.$emit('update:visible', false);
    this.selectedMedia = null;
  }

  selectMedia(item: any) {
    this.selectedMedia = item;
  }

  handleConfirm() {
    if (!this.selectedMedia) {
      ElMessage.warning('Please select a media item before confirming');
      return;
    }
    this.$emit('select', this.selectedMedia);
    this.handleClose();
  }

  isSelected(item: any) {
    return this.selectedMedia?.id === item.id;
  }

  // 处理文件上传
  async handleFileUpload(file: File) {
    this.uploading = true;
    try {
      const uploadResult = await this.$api.uploadMedia({
        file: file,
        type: this.mediaType,
        alt: file.name,
      });

      // 直接触发 select 事件并关闭对话框
      this.$emit('select', { path: uploadResult.path, alt: file.name });
      this.handleClose();
    } catch (error: any) {
      console.error('上传失败:', error);
      ElMessage.error('Failed to upload file');
    } finally {
      this.uploading = false;
    }
  }

  // 处理文件选择
  handleFileChange(uploadFile: any) {
    const file = uploadFile.raw;
    if (file) {
      this.handleFileUpload(file);
    }
    return false; // 阻止自动上传
  }
}
</script>

<template>
  <el-dialog :model-value="visible" :title="dialogTitle" width="800px" @close="handleClose">
    <template #header="{ titleId, titleClass }">
      <h4 :id="titleId" :class="titleClass" style="line-height: normal">{{ dialogTitle }}</h4>
    </template>

    <el-tabs v-model="activeTab" class="media-tabs">
      <!-- 媒体库标签页 -->
      <el-tab-pane label="媒体库" name="library">
        <template #label>
          <span class="tab-label">
            <el-icon><FolderOpen /></el-icon>
            <span>Library</span>
          </span>
        </template>
        <div class="search-box">
          <el-input
            v-model="searchKeyword"
            :placeholder="'Search by filename or alt text'"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div v-loading="loading" class="media-list-container">
          <div v-if="filteredMediaList.length === 0 && !loading" class="empty-container">
            <el-empty :description="searchKeyword ? 'No matching files found' : emptyText + ', please upload a file first.'" />
          </div>
          <div v-else class="media-grid">
            <el-card
              v-for="item in filteredMediaList"
              :key="item.id"
              :class="['media-item', { selected: isSelected(item) }]"
              @click="selectMedia(item)"
              :body-style="{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '12px',
              }"
            >
              <div class="media-image-wrapper">
                <el-image :src="resolveMediaUrl(item.path)" fit="contain" class="media-image">
                  <template #error>
                    <div class="image-error">Failed to load image</div>
                  </template>
                </el-image>
              </div>
              <div class="media-info">
                <div class="media-id">ID: {{ item.id }}</div>
                <div v-if="item.alt" class="media-alt" :title="item.alt">{{ item.alt }}</div>
              </div>
              <div v-if="isSelected(item)" class="selected-badge">Selected</div>
            </el-card>
          </div>
        </div>
      </el-tab-pane>

      <!-- 上传标签页 -->
      <el-tab-pane v-if="showUploadTab" label="Upload New File" name="upload">
        <template #label>
          <span class="tab-label">
            <el-icon><Upload /></el-icon>
            <span>Upload New File</span>
          </span>
        </template>
        <div class="upload-container" v-loading="uploading">
          <el-upload
            class="upload-dragger"
            drag
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            @change="handleFileChange"
          >
            <el-icon class="upload-icon"><Upload /></el-icon>
            <div class="upload-text">Drag files here or <em>click to upload</em></div>
            <template #tip>
              <div class="upload-tip">Supports JPG, PNG, GIF, WEBP, AVIF image formats</div>
            </template>
          </el-upload>
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">Cancel</el-button>
        <el-button type="primary" :disabled="!selectedMedia" @click="handleConfirm">Confirm</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped lang="less">
.media-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 16px;
  }

  .tab-label {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

.search-box {
  margin-bottom: 12px;

  :deep(.el-input) {
    max-width: 300px;
  }
}

.media-list-container {
  min-height: 400px;
  max-height: 500px;
  overflow-y: auto;

  .empty-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 400px;
  }

  .media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
    padding: 8px;
  }

  .media-item {
    position: relative;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      border-color: #409eff;
      box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
    }

    &.selected {
      border-color: #409eff;
      border-width: 2px;
      box-shadow: 0 2px 12px rgba(64, 158, 255, 0.3);
    }

    .media-image-wrapper {
      width: 100%;
      aspect-ratio: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 4px;
      margin-bottom: 8px;
      overflow: hidden;

      .media-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;

        :deep(img) {
          -webkit-user-drag: none;
        }
      }

      .image-error {
        color: #909399;
        font-size: 12px;
      }
    }

    .media-info {
      text-align: center;
      width: 100%;

      .media-id {
        font-size: 11px;
        color: #909399;
        margin-bottom: 2px;
      }

      .media-alt {
        font-size: 12px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #606266;
      }
    }

    .selected-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background-color: #409eff;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
    }
  }
}

.upload-container {
  min-height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;

  .upload-dragger {
    width: 100%;

    :deep(.el-upload-dragger) {
      width: 100%;
      height: 280px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
  }

  .upload-icon {
    font-size: 48px;
    color: #909399;
    margin-bottom: 16px;
  }

  .upload-text {
    color: #606266;
    font-size: 14px;

    em {
      color: #409eff;
      font-style: normal;
    }
  }

  .upload-tip {
    color: #909399;
    font-size: 12px;
    margin-top: 8px;
    text-align: center;
  }
}
</style>
