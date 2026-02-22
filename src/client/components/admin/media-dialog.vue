<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { MediaTypeEnum } from '@common/enums/media-type.enum';
import { GetMediaListResDTO, MediaDetailResDTO } from '@common/modules/media/media.dto';
import {
  getAcceptTypes,
  getMediaTypeLabel,
  isAllowedMimeType,
  MEDIA_TYPE_CONFIG,
} from '@common/config/media-type-config';

import {
  ElDialog,
  ElButton,
  UploadFile,
  ElUpload,
  ElInput,
  ElMessage,
  ElForm,
  ElFormItem,
  ElIcon,
  ElImage,
  ElDescriptions,
  ElDescriptionsItem,
  ElLoading,
  ElProgress,
} from 'element-plus';
import { Upload, FileMusic, FileVideoCamera } from 'lucide-vue-next';

export type MediaDialogMode = 'upload' | 'edit';

// 分片大小: 2MB（与服务端一致）
const CHUNK_SIZE = 2 * 1024 * 1024;
// 普通文件大小限制: 10MB
const NORMAL_FILE_SIZE_LIMIT = 10 * 1024 * 1024;
// 大文件大小限制: 500MB（音视频）
const LARGE_FILE_SIZE_LIMIT = 500 * 1024 * 1024;

@Options({
  components: {
    ElDialog,
    ElButton,
    ElUpload,
    ElInput,
    ElForm,
    ElFormItem,
    ElIcon,
    ElImage,
    ElDescriptions,
    ElDescriptionsItem,
    Upload,
    FileMusic,
    FileVideoCamera,
    ElProgress,
  },
  directives: {
    loading: ElLoading.directive,
  },
})
export default class MediaDialog extends Vue {
  @Prop({ required: true, default: false })
  visible!: boolean;

  @Prop({ required: true, default: 'upload' })
  mode!: MediaDialogMode;

  @Prop({ required: true })
  mediaType!: MediaTypeEnum;

  @Prop({ required: false, default: null })
  mediaId?: number | null;

  @Prop({ required: true })
  updateMediaList!: (newMediaList?: GetMediaListResDTO) => void;

  // 上传模式相关
  uploadFormData = {
    files: [] as UploadFile[],
    type: MediaTypeEnum.IMAGE,
    alt: '',
  };

  // 编辑模式相关
  mediaDetail: MediaDetailResDTO | null = null;
  editFormData = {
    alt: '',
  };

  loading = false;
  // 分片上传进度
  uploadProgress = 0;
  isChunkUploading = false;

  @Watch('visible')
  async onVisibleChange(val: boolean) {
    if (val) {
      if (this.mode === 'upload') {
        this.resetUploadForm();
        this.uploadFormData.type = this.mediaType;
      } else if (this.mode === 'edit' && this.mediaId) {
        await this.fetchMediaDetail();
      }
    } else {
      this.resetAll();
    }
  }

  @Watch('mediaType')
  onMediaTypeChange(val: MediaTypeEnum) {
    this.uploadFormData.type = val;
  }

  resetUploadForm() {
    this.uploadFormData = {
      files: [],
      type: this.mediaType,
      alt: '',
    };
  }

  resetEditForm() {
    this.mediaDetail = null;
    this.editFormData.alt = '';
  }

  resetAll() {
    this.resetUploadForm();
    this.resetEditForm();
    this.uploadProgress = 0;
    this.isChunkUploading = false;
  }

  handleClose() {
    this.$emit('update:visible', false);
    this.resetAll();
  }

  // ==================== 上传模式方法 ====================

  /** 检查是否为大文件类型（音视频） */
  get isLargeFileType() {
    return this.mediaType === MediaTypeEnum.AUDIO || this.mediaType === MediaTypeEnum.VIDEO;
  }

  /** 获取文件大小限制 */
  get fileSizeLimit() {
    return this.isLargeFileType ? LARGE_FILE_SIZE_LIMIT : NORMAL_FILE_SIZE_LIMIT;
  }

  /** 格式化文件大小限制显示 */
  get fileSizeLimitText() {
    return this.isLargeFileType ? '500MB' : '10MB';
  }

  handleFileChange(file: File, fileList: UploadFile[]) {
    this.uploadFormData.files = fileList;
  }

  handleRemove(file: File, fileList: UploadFile[]) {
    this.uploadFormData.files = fileList;
  }

  /** 分片上传单个文件 */
  async uploadFileInChunks(file: File, type: MediaTypeEnum, alt?: string): Promise<MediaDetailResDTO> {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    // 1. 初始化分片上传
    const initRes = await this.$api.initChunkUpload({
      filename: file.name,
      fileSize: file.size,
      type,
      alt,
      totalChunks,
    });

    const { uploadId, chunkSize } = initRes;

    // 2. 上传各分片
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      await this.$api.uploadChunk({
        uploadId,
        chunkIndex: i,
        chunk,
      });

      // 更新进度
      this.uploadProgress = Math.round(((i + 1) / totalChunks) * 100);
    }

    // 3. 完成上传
    const result = await this.$api.completeChunkUpload({ uploadId });
    return result;
  }

  async handleUpload() {
    if (!this.uploadFormData.files.length) {
      ElMessage.warning('Please select at least one file to upload');
      return;
    }
    this.loading = true;
    this.uploadProgress = 0;

    try {
      const uploadPromises = this.uploadFormData.files.map(async (file: UploadFile) => {
        const rawFile = file.raw!;
        // 对于音视频大文件（>10MB），使用分片上传
        if (this.isLargeFileType && rawFile.size > NORMAL_FILE_SIZE_LIMIT) {
          this.isChunkUploading = true;
          return await this.uploadFileInChunks(rawFile, this.uploadFormData.type, this.uploadFormData.alt);
        } else {
          // 普通上传
          return await this.$api.uploadMedia({
            file: rawFile,
            type: this.uploadFormData.type,
            alt: this.uploadFormData.alt,
          });
        }
      });

      await Promise.all(uploadPromises);

      ElMessage.success('Upload successful');
      this.handleClose();
      const newMediaList = await this.$api.getMediaList({ type: this.mediaType });
      this.updateMediaList(newMediaList);
    } catch (error: any) {
      console.error('Upload failed:', error);
      ElMessage.error(error.message || 'Upload failed, please try again');
    } finally {
      this.loading = false;
      this.isChunkUploading = false;
    }
  }

  beforeUpload(rawFile: File) {
    if (!isAllowedMimeType(this.mediaType, rawFile.type)) {
      ElMessage.error(`Invalid file type. Please upload a ${getMediaTypeLabel(this.mediaType)} file.`);
      return false;
    }
    if (rawFile.size > this.fileSizeLimit) {
      ElMessage.error(`File size cannot exceed ${this.fileSizeLimitText}`);
      return false;
    }
    return true;
  }

  // ==================== 编辑模式方法 ====================

  async fetchMediaDetail() {
    if (!this.mediaId) return;

    try {
      this.loading = true;
      this.mediaDetail = await this.$api.getMediaById({ id: this.mediaId });
      this.editFormData.alt = this.mediaDetail.alt || '';
    } catch (error) {
      console.error('获取媒体详情失败:', error);
      ElMessage.error('Failed to fetch media details, please try again');
      this.handleClose();
    } finally {
      this.loading = false;
    }
  }

  async handleUpdate() {
    if (!this.mediaId) return;

    try {
      this.loading = true;
      await this.$api.updateMedia({
        id: this.mediaId,
        alt: this.editFormData.alt,
      });
      ElMessage.success('Updated successfully');
      this.updateMediaList();
      this.handleClose();
    } catch (error) {
      ElMessage.error('Failed to update media, please try again');
    } finally {
      this.loading = false;
    }
  }

  // ==================== 计算属性 ====================

  get dialogTitle() {
    if (this.mode === 'upload') {
      return `Upload ${this.mediaTypeLabel}`;
    }
    return 'Update Media';
  }

  get acceptTypes() {
    return getAcceptTypes(this.mediaType);
  }

  get mediaTypeLabel() {
    return getMediaTypeLabel(this.mediaType);
  }

  get allowedExtensions(): string {
    const config = MEDIA_TYPE_CONFIG[this.mediaType];
    if (!config) return '';
    return config.extensions.map((ext) => `.${ext}`).join(', ');
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString('zh-CN');
  }

  handleSubmit() {
    if (this.mode === 'upload') {
      this.handleUpload();
    } else {
      this.handleUpdate();
    }
  }

  get submitDisabled() {
    if (this.mode === 'upload') {
      return !this.uploadFormData.files.length;
    }
    return false;
  }

  get submitText() {
    if (this.loading) {
      return this.mode === 'upload' ? 'Uploading...' : 'Saving...';
    }
    return this.mode === 'upload' ? 'Confirm' : 'Save';
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    :width="mode === 'upload' ? '15rem' : '10rem'"
    @close="handleClose"
  >
    <template #header="{ titleId, titleClass }">
      <h4 :id="titleId" :class="titleClass" style="line-height: normal">{{ dialogTitle }}</h4>
    </template>
    <div v-loading="loading" class="dialog-content">
      <!-- 上传模式 -->
      <template v-if="mode === 'upload'">
        <el-form :model="uploadFormData" label-width="80px">
          <el-form-item label="Files">
            <el-upload
              v-model:file-list="uploadFormData.files"
              :accept="acceptTypes"
              :auto-upload="false"
              :on-change="handleFileChange"
              :on-remove="handleRemove"
              :before-upload="beforeUpload"
              multiple
              drag
            >
              <el-icon class="el-icon--upload" size="20"><upload /></el-icon>
              <div class="el-upload__text">Drag files here, or <em>click to upload</em></div>
              <template #tip>
                <div class="el-upload__tip">{{ allowedExtensions }} files with a size less than {{ fileSizeLimitText }}</div>
              </template>
            </el-upload>

            <!-- 分片上传进度条 -->
            <el-progress
              v-if="isChunkUploading"
              :percentage="uploadProgress"
              :stroke-width="10"
              class="chunk-upload-progress"
            />
          </el-form-item>

          <el-form-item label="Description">
            <el-input
              v-model="uploadFormData.alt"
              :rows="3"
              clearable
              placeholder="Please enter a description (optional)"
            />
          </el-form-item>
        </el-form>
      </template>

      <!-- 编辑模式 -->
      <template v-else-if="mode === 'edit'">
        <div v-if="mediaDetail" class="media-detail">
          <div class="preview-section">
            <el-image v-if="mediaType === 'logo' || mediaType === 'image'" style="width: 2.5rem" :src="mediaDetail.path" fit="cover" class="preview-image" />
            <el-icon v-else-if="mediaType === 'video'" size="48"><FileVideoCamera /></el-icon>
            <el-icon v-else-if="mediaType === 'audio'" size="48"><FileMusic /></el-icon>
          </div>

          <el-descriptions :column="2" title="Media Info" style="width: 100%" size="small" direction="vertical">
            <el-descriptions-item label="Size">
              {{ formatFileSize(mediaDetail.size) }}
            </el-descriptions-item>
            <el-descriptions-item label="Created At">
              {{ formatDate(mediaDetail.createdAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="Updated At">
              {{ formatDate(mediaDetail.updatedAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="Updated By">
              <div v-if="mediaDetail.updatedBy" class="uploader-info">
                <el-image
                  v-if="mediaDetail.updatedBy.avatar"
                  :src="mediaDetail.updatedBy.avatar"
                  class="uploader-avatar"
                  fit="cover"
                />
                <span>{{ mediaDetail.updatedBy.username }}</span>
              </div>
              <span v-else>Unknown</span>
            </el-descriptions-item>
          </el-descriptions>

          <el-form class="update-form" label-width="80px" @submit.prevent="handleUpdate">
            <el-form-item label="Description">
              <el-input v-model="editFormData.alt" placeholder="Enter image description" clearable />
            </el-form-item>
          </el-form>
        </div>
      </template>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose" :disabled="loading">Cancel</el-button>
        <el-button type="primary" :loading="loading" :disabled="submitDisabled" @click="handleSubmit">
          {{ submitText }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped lang="less">
.dialog-content {
  min-height: 200px;
}

.el-icon--upload {
  font-size: 67px;
  color: #8c939d;
  margin: 40px 0 16px;
}

.el-upload__text {
  font-size: 14px;
  text-align: center;

  em {
    color: #409eff;
    font-style: normal;
  }
}

.chunk-upload-progress {
  margin-top: 16px;
}

.media-detail {
  display: flex;
  flex-direction: column;
  .preview-section {
    margin-bottom: 20px;
    text-align: center;
  }

  .uploader-info {
    display: flex;
    align-items: center;
    gap: 8px;

    .uploader-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
    }
  }

  .update-form {
    margin-top: 20px;
  }
}
</style>
