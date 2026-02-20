<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { MediaTypeEnum } from '@common/enums/media-type.enum';
import { GetMediaListResDTO, MediaDetailResDTO } from '@common/modules/media/media.dto';
import { getAcceptTypes, getMediaTypeLabel, isAllowedMimeType, MEDIA_TYPE_CONFIG } from '@common/config/media-type-config';
import { UploadFile } from 'element-plus';

import {
  ElDialog,
  ElButton,
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
} from 'element-plus';
import { Upload } from '@element-plus/icons-vue';

export type MediaDialogMode = 'upload' | 'edit';

@Options({
  components: {
    ElDialog,
    ElButton,
    ElUpload,
    ElInput,
    ElForm,
    ElFormItem,
    Upload,
    ElIcon,
    ElImage,
    ElDescriptions,
    ElDescriptionsItem,
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
  }

  handleClose() {
    this.$emit('update:visible', false);
    this.resetAll();
  }

  // ==================== 上传模式方法 ====================

  handleFileChange(file: File, fileList: UploadFile[]) {
    this.uploadFormData.files = fileList;
  }

  handleRemove(file: File, fileList: UploadFile[]) {
    this.uploadFormData.files = fileList;
  }

  async handleUpload() {
    if (!this.uploadFormData.files.length) {
      ElMessage.warning('请选择要上传的文件');
      return;
    }
    this.loading = true;
    try {
      const uploadPromises = this.uploadFormData.files.map(async (file: UploadFile) => {
        return await this.$api.uploadMedia({
          file: file.raw,
          type: this.uploadFormData.type,
          alt: this.uploadFormData.alt,
        });
      });

      await Promise.all(uploadPromises);

      ElMessage.success('上传成功');
      this.handleClose();
      const newMediaList = await this.$api.getMediaList({ type: this.mediaType });
      this.updateMediaList(newMediaList);
    } catch (error: any) {
      console.error('Upload failed:', error);
      ElMessage.error(error.message || 'Upload failed, please try again');
    } finally {
      this.loading = false;
    }
  }

  beforeUpload(rawFile: File) {
    if (!isAllowedMimeType(this.mediaType, rawFile.type)) {
      ElMessage.error(`不支持的文件类型: ${rawFile.type}。请选择正确的${this.mediaTypeLabel}文件`);
      return false;
    }
    if (rawFile.size > 10 * 1024 * 1024) {
      ElMessage.error('File size cannot exceed 10MB');
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
      ElMessage.error('加载失败，请重试');
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
      ElMessage.error('Update failed, please try again');
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
    return config.extensions.map(ext => `.${ext}`).join(', ');
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
    return this.mode === 'upload' ? 'Confirm Upload' : 'Save';
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    :width="mode === 'upload' ? '500px' : '10rem'"
    @close="handleClose"
  >
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
              <el-icon class="el-icon--upload"><upload /></el-icon>
              <div class="el-upload__text">Drag files here, or <em>click to upload</em></div>
              <template #tip>
                <div class="el-upload__tip">支持 {{ allowedExtensions }} 格式，文件大小不超过 10MB</div>
              </template>
            </el-upload>
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
            <el-image style="width: 100px" :src="mediaDetail.path" fit="cover" class="preview-image" />
          </div>

          <el-descriptions :column="1" border>
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

.media-detail {
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
