<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { GetSessionResDTO } from '@common/modules/admin/admin.dto';
import { AdminToolSectionEnum } from '@common/enums/admin-tool-section.enum';
import localForge from 'localforage';

import { ElRow, ElCol, ElMenu, ElMenuItem, ElMenuItemGroup, ElSubMenu, ElIcon, ElButton, ElAvatar } from 'element-plus';
import { Smile, House, Tv, Newspaper, Package, Image, Activity, Video, ChartColumnIncreasing } from 'lucide-vue-next';

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
    Smile,
    Tv,
    Newspaper,
    Package,
    Image,
    Activity,
    Video,
    ChartColumnIncreasing,
    House,
  },
})
export default class AdminTools extends Vue {
  @Prop({ required: true })
  userInfo!: GetSessionResDTO;

  currentPath: string = '';

  defaultAvatarUrl = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

  adminToolSectionEnum = AdminToolSectionEnum;
  adminToolSectionToRouterMap: Record<string, string> = {
    [this.adminToolSectionEnum.OVERVIEW]: '/admin/overview',
    [this.adminToolSectionEnum.MEDIA_LOGO]: '/admin/media-list/logo',
    [this.adminToolSectionEnum.MEDIA_IMAGE]: '/admin/media-list/image',
    [this.adminToolSectionEnum.MEDIA_AUDIO]: '/admin/media-list/audio',
    [this.adminToolSectionEnum.MEDIA_VIDEO]: '/admin/media-list/video',
    [this.adminToolSectionEnum.GLOBAL_CONFIG]: '/admin/global-config',
    [this.adminToolSectionEnum.NEWS_MANAGEMENT]: '/admin/news-list',
    [this.adminToolSectionEnum.MEDIA_MANAGEMENT]: '/admin/media-list/logo',
    [this.adminToolSectionEnum.PROJECT_MANAGEMENT]: '/admin/project-list',
    [this.adminToolSectionEnum.USERS]: '/admin/users',
  };

  handleSelect(index: string) {
    this.$router.push(this.adminToolSectionToRouterMap[index] );
  }

  goHome() {
    return this.$router.push('/');
  }

  mounted() {
    this.currentPath = this.$route.path;
    console.log(this.currentPath)
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
          <span class="title">Tars 🌻</span>
          <el-button size="small" @click="goHome">Go Home</el-button>
        </div>
        <el-menu
          mode="vertical"
          router
          :default-active="currentPath"
          :default-openeds="[adminToolSectionToRouterMap[adminToolSectionEnum.MEDIA_MANAGEMENT]]"
        >
          <el-menu-item :index="adminToolSectionToRouterMap[adminToolSectionEnum.OVERVIEW]">
            <el-icon><chart-column-increasing /></el-icon>
            <span>Overview</span>
          </el-menu-item>
          <el-menu-item :index="adminToolSectionToRouterMap[adminToolSectionEnum.GLOBAL_CONFIG]">
            <el-icon><house /></el-icon>
            <span>HomePage</span>
          </el-menu-item>
          <el-sub-menu :index="adminToolSectionToRouterMap[adminToolSectionEnum.MEDIA_MANAGEMENT]">
            <template #title>
              <el-icon><Tv /></el-icon>
              <span>Media</span>
            </template>
            <el-menu-item-group>
              <el-menu-item :index="adminToolSectionToRouterMap[adminToolSectionEnum.MEDIA_LOGO]">
                <el-icon><Smile /></el-icon>
                <span>Logo</span>
              </el-menu-item>
              <el-menu-item :index="adminToolSectionToRouterMap[adminToolSectionEnum.MEDIA_IMAGE]">
                <el-icon><Image /></el-icon>
                <span>Image</span>
              </el-menu-item>
              <el-menu-item :index="adminToolSectionToRouterMap[adminToolSectionEnum.MEDIA_AUDIO]">
                <el-icon><Activity /></el-icon>
                <span>Audio</span>
              </el-menu-item>
              <el-menu-item :index="adminToolSectionToRouterMap[adminToolSectionEnum.MEDIA_VIDEO]">
                <el-icon><Video /></el-icon>
                <span>Video</span>
              </el-menu-item>
            </el-menu-item-group>
          </el-sub-menu>

          <el-menu-item :index="adminToolSectionToRouterMap[adminToolSectionEnum.NEWS_MANAGEMENT]">
            <el-icon><Newspaper /></el-icon>
            <span>News</span>
          </el-menu-item>
          <el-menu-item :index="adminToolSectionToRouterMap[adminToolSectionEnum.PROJECT_MANAGEMENT]">
            <el-icon><Package /></el-icon>
            <span>Projects</span>
          </el-menu-item>
        </el-menu>
      </el-col>
      <el-col class="user-dis">
        <div
          class="user-info"
          @click="
            () => {
              this.handleSelect(adminToolSectionEnum.USERS);
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
  user-select: none;

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
