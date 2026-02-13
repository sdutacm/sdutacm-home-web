<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { MediaTypeEnum } from '@common/enums/media-type.enum';
import { ElDialog, ElButton, ElImage, ElMessage, ElLoading, ElEmpty, vLoading, ElCard } from 'element-plus';

@Options({
  components: {
    ElDialog,
    ElButton,
    ElImage,
    ElEmpty,
    ElCard,
  },
  directives: {
    loading: vLoading,
  },
  emits: ['update:visible', 'select'],
})
export default class SelectLogoDialog extends Vue {
  @Prop({ required: true, default: false })
  visible!: boolean;

  @Prop({ default: '' })
  currentLogoUrl!: string;

  logoList: any[] = [];
  loading = false;
  selectedLogo: any = null;

  @Watch('visible')
  async onVisibleChange(val: boolean) {
    if (val) {
      await this.loadLogoList();
    }
  }

  async loadLogoList() {
    this.loading = true;
    try {
      const result = await this.$api.getMediaList({
        type: MediaTypeEnum.LOGO,
      });
      this.logoList = result.rows || [];

      // 如果有当前 logo，找到并预选
      if (this.currentLogoUrl) {
        const current = this.logoList.find((logo) => logo.path === this.currentLogoUrl);
        if (current) {
          this.selectedLogo = current;
        }
      }
    } catch (error: any) {
      console.error('加载 Logo 列表失败:', error);
      ElMessage.error('加载 Logo 列表失败');
    } finally {
      this.loading = false;
    }
  }

  handleClose() {
    this.$emit('update:visible', false);
    this.selectedLogo = null;
  }

  selectLogo(logo: any) {
    this.selectedLogo = logo;
  }

  handleConfirm() {
    if (!this.selectedLogo) {
      ElMessage.warning('请选择一个 Logo');
      return;
    }
    this.$emit('select', this.selectedLogo);
    this.handleClose();
  }

  isSelected(logo: any) {
    return this.selectedLogo?.id === logo.id;
  }
}
</script>

<template>
  <el-dialog :model-value="visible" title="Select Logo" width="800px" @close="handleClose">
    <div v-loading="loading" class="logo-list-container">
      <div v-if="logoList.length === 0 && !loading" class="empty-container">
        <el-empty description="No logo resources available, please upload first" />
      </div>
      <div v-else class="logo-grid">
        <el-card
          v-for="logo in logoList"
          :key="logo.id"
          :class="['logo-item', { selected: isSelected(logo) }]"
          @click="selectLogo(logo)"
          :body-style="{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }"
          style="display: flex; flex-direction: column; align-items: center; justify-content: center"
        >
          <div class="logo-image-wrapper">
            <el-image :src="logo.path" fit="contain" class="logo-image" />
          </div>
          <div class="logo-info">
            <div class="logo-id">ID: {{ logo.id }}</div>
            <div v-if="logo.alt" class="logo-alt">{{ logo.alt }}</div>
          </div>
          <div v-if="isSelected(logo)" class="selected-badge">Selected</div>
        </el-card>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">Cancel</el-button>
        <el-button type="primary" :disabled="!selectedLogo" @click="handleConfirm"> Confirm </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped lang="less">
.logo-list-container {
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;

  .empty-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 400px;
  }

  .logo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
    padding: 16px;
  }

  .logo-item {
    position: relative;
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    &:hover {
      border-color: #409eff;
      box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
    }

    &.selected {
      border-color: #409eff;
      box-shadow: 0 2px 12px rgba(64, 158, 255, 0.3);
    }

    .logo-image-wrapper {
      width: 50%;
      aspect-ratio: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 4px;
      margin-bottom: 8px;

      .logo-image {
        max-width: 100%;
        max-height: 100%;
      }
    }

    .logo-info {
      text-align: center;

      .logo-id {
        font-size: 12px;
        margin-bottom: 4px;
      }

      .logo-alt {
        font-size: 12px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
      font-size: 12px;
      font-weight: bold;
    }
  }
}
</style>
