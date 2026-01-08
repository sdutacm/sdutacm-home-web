<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { GetSessionResDTO } from '@common/modules/auth/auth.dto';

import { ElRow, ElCol, ElMenu, ElMenuItem, ElMenuItemGroup, ElSubMenu, ElIcon, ElButton, ElAvatar } from 'element-plus';
import {
  Location,
  Menu as IconMenu,
  Document,
  Setting,
  Box,
  Microphone,
  VideoCamera,
  PictureFilled,
  PictureRounded,
  HomeFilled,
} from '@element-plus/icons-vue';
import { AdminToolSectionEnum } from '@common/enums/admin-tool-section.enum';

@Options({
  components: {
    ElAvatar,
    ElButton,
    ElRow,
    ElCol,
    ElMenu,
    ElMenuItem,
    ElMenuItemGroup,
    ElSubMenu,
    ElIcon,
    Location,
    IconMenu,
    Document,
    Setting,
    Box,
    PictureFilled,
    PictureRounded,
    Microphone,
    VideoCamera,
    HomeFilled,
  },
  emits: ['menu-select'],
})
export default class AdminTools extends Vue {
  @Prop({ required: true })
  userInfo!: GetSessionResDTO;

  adminToolSectionEnum = AdminToolSectionEnum;
  defaultAvatarUrl = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

  handleSelect(index: string) {
    this.$emit('menu-select', index);
  }

  goHome() {
    return this.$router.push('/');
  }

  mounted() {
    console.log('用户信息:', this.userInfo);
  }

  get userAvatar() {
    return this.userInfo?.avatar ? this.userInfo.avatar : this.defaultAvatarUrl;
  }
}
</script>

<template>
  <div class="admin-tools-container">
    <el-row align="top" style="height: 100%; width: 100; position: relative">
      <el-col style="width: 100%">
        <div style="font-size: 0.5rem" class="admin-tools-header">
          <span class="title">Tars</span>
          <el-button size="small" @click="goHome">Go Home</el-button>
        </div>
        <el-menu @select="handleSelect" mode="vertical">
          <el-menu-item :index="adminToolSectionEnum.GLOBAL_CONFIG">
            <el-icon><home-filled /></el-icon>
            <span>首页配置</span>
          </el-menu-item>
          <el-sub-menu :index="adminToolSectionEnum.MEDIA_MANAGEMENT">
            <template #title>
              <el-icon><location /></el-icon>
              <span>线上资产管理</span>
            </template>
            <el-menu-item-group>
              <el-menu-item :index="adminToolSectionEnum.MEDIA_LOGO">
                <el-icon><picture-rounded /></el-icon>
                <span>Logo 管理</span>
              </el-menu-item>
              <el-menu-item :index="adminToolSectionEnum.MEDIA_IMAGE">
                <el-icon><picture-filled /></el-icon>
                <span>图片管理</span>
              </el-menu-item>
              <el-menu-item :index="adminToolSectionEnum.MEDIA_AUDIO">
                <el-icon><microphone /></el-icon>
                <span>音频管理</span>
              </el-menu-item>
              <el-menu-item :index="adminToolSectionEnum.MEDIA_VIDEO">
                <el-icon><video-camera /></el-icon>
                <span>视频管理</span>
              </el-menu-item>
            </el-menu-item-group>
          </el-sub-menu>

          <el-menu-item :index="adminToolSectionEnum.NEWS_MANAGEMENT">
            <el-icon><document /></el-icon>
            <span>新闻管理</span>
          </el-menu-item>
          <el-menu-item :index="adminToolSectionEnum.PROJECT_MANAGEMENT">
            <el-icon><box /></el-icon>
            <span>项目管理</span>
          </el-menu-item>
        </el-menu>
      </el-col>
      <el-col class="user-dis">
        <div
          class="user-info"
          @click="
            () => {
              handleSelect(adminToolSectionEnum.ADMIN_VIEW);
            }
          "
        >
          <el-avatar :src="userAvatar" size="small" fit="contain"></el-avatar>
          <span>{{ userInfo?.username }}</span>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="less">
.admin-tools-container {
  width: 100%;
  height: 100%;
  background-color: var(--el-menu-bg-color);

  & .user-dis {
    position: absolute;
    bottom: 0;
    width: 100%;
    display: flex;
    justify-content: start;
    align-items: center;
    padding: 10px;
    & .user-info {
      width: fit-content;
      user-select: none;
      padding: 0.2rem;
      gap: 0.2rem;
      font-size: 0.3rem;
      padding: 5px;
      // background-color: red;
      border-radius: 0.6rem;
      display: flex;
      justify-content: start;
      align-items: center;
      cursor: pointer;
      transition: background-color 0.3s;
      &:hover {
        background-color: var(--el-menu-hover-bg-color);
      }
    }
  }
  & .admin-tools-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;

    & .title {
      font-size: 01rem;
      font-weight: bold;
      display: block;
      position: relative;
      width: fit-content;
      height: fit-content;
    }
  }
}

:deep(.el-menu) {
  border-right: none;
}
</style>
