<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { MediaTypeEnum } from '@common/enums/media-type.enum';
import { GetMediaResDTO } from '@common/modules/media/media.dto';
import { UploadFile } from 'element-plus';

import { ElDialog, ElButton, ElUpload, ElInput, ElMessage, ElForm, ElFormItem, ElIcon } from 'element-plus';
import { Upload } from '@element-plus/icons-vue';

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
  },
})
export default class UploadMediaDialog extends Vue {
  @Prop({ required: true, default: false })
  visible!: boolean;

  @Prop({ required: true })
  mediaType!: MediaTypeEnum;

  @Prop({ required: true })
  updateMediaList!: (newMediaList: GetMediaResDTO) => void;

  formData = {
    files: [],
    type: MediaTypeEnum.IMAGE,
    alt: '',
  };

  uploading = false;

  @Watch('visible')
  onVisibleChange(val: boolean) {
    if (val) {
      this.resetForm();
      this.formData.type = this.mediaType;
    }
  }

  @Watch('mediaType')
  onMediaTypeChange(val: MediaTypeEnum) {
    this.formData.type = val;
  }

  resetForm() {
    this.formData = {
      files: [],
      type: this.mediaType,
      alt: '',
    };
  }

  handleClose() {
    this.$emit('update:visible', false);
    this.resetForm();
  }

  handleFileChange(file: UploadFile, fileList: UploadFile[]) {
    this.formData.files = fileList;
    console.log('Selected files:', this.formData.files);
  }

  handleRemove(file: UploadFile, fileList: UploadFile[]) {
    this.formData.files = fileList;
  }

  async handleUpload() {
    if (!this.formData.files.length) {
      ElMessage.warning('请选择要上传的文件');
      return;
    }
    this.uploading = true;
    try {
      // 使用 Promise.all 等待所有文件上传完成
      const uploadPromises = this.formData.files.map(async (file) => {
        return await this.$api.uploadMedia({
          file: file.raw,
          type: this.formData.type,
          alt: this.formData.alt,
        });
      });

      await Promise.all(uploadPromises);

      ElMessage.success('上传成功');
      this.handleClose();
      const newMediaList = await this.$api.getMediaList({ type: this.mediaType });
      this.updateMediaList(newMediaList);
    } catch (error) {
      console.error('上传失败:', error);
      ElMessage.error(error.message || '上传失败，请重试');
    } finally {
      this.uploading = false;
    }
  }

  beforeUpload(rawFile: File) {
    const isValidType = this.acceptTypes.includes(rawFile.type);
    if (!isValidType) {
      ElMessage.error(`请选择${this.mediaTypeLabel}文件`);
      return false;
    }
    if (rawFile.size > 10 * 1024 * 1024) {
      ElMessage.error('文件大小不能超过10MB');
      return false;
    }
    return true;
  }

  get acceptTypes() {
    const typeMap: Record<MediaTypeEnum, string> = {
      [MediaTypeEnum.IMAGE]: 'image/*',
      [MediaTypeEnum.LOGO]: 'image/*',
      [MediaTypeEnum.AUDIO]: 'audio/*',
      [MediaTypeEnum.VIDEO]: 'video/*',
      [MediaTypeEnum.ADMIN_AVATAR]: 'image/*',
      [MediaTypeEnum.NEWS_COVER]: 'image/*',
      [MediaTypeEnum.PROJECT_COVER]: 'image/*',
    };
    return typeMap[this.mediaType] || '*';
  }

  get mediaTypeLabel() {
    const labelMap: Record<MediaTypeEnum, string> = {
      [MediaTypeEnum.IMAGE]: '图片',
      [MediaTypeEnum.LOGO]: 'Logo',
      [MediaTypeEnum.AUDIO]: '音频',
      [MediaTypeEnum.VIDEO]: '视频',
      [MediaTypeEnum.ADMIN_AVATAR]: '管理员头像',
      [MediaTypeEnum.NEWS_COVER]: '新闻封面',
      [MediaTypeEnum.PROJECT_COVER]: '项目封面',
    };
    return labelMap[this.mediaType] || '媒体';
  }
}
</script>

<template>
  <el-dialog :model-value="visible" :title="`上传${mediaTypeLabel}`" width="500px" @close="handleClose">
    <el-form :model="formData" label-width="80px">
      <el-form-item label="文件">
        <el-upload
          v-model:file-list="formData.files"
          :accept="acceptTypes"
          :auto-upload="false"
          :on-change="handleFileChange"
          :on-remove="handleRemove"
          :before-upload="beforeUpload"
          multiple
          drag
        >
          <el-icon class="el-icon--upload"><upload /></el-icon>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">jpg/png files with a size less than 10MB.</div>
          </template>
        </el-upload>
      </el-form-item>

      <el-form-item label="描述">
        <el-input v-model="formData.alt" type="textarea" :rows="3" placeholder="请输入描述信息（可选）" />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="uploading" :disabled="!formData.files.length" @click="handleUpload">
          {{ uploading ? '上传中...' : '确认上传' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped lang="less">
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

.el-upload__tip {
  font-size: 12px;
  margin-top: 7px;
}
</style>
