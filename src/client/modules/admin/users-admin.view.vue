<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { GetSessionResDTO, GetAllAdminsResDTO } from '@common/modules/admin/admin.dto';
import { GetNewsDetailResDTO } from '@common/modules/news/news.dto';
import { GetProjectDetailResDTO } from '@common/modules/project/project.dto';
import { AdminRoleEnum } from '@common/enums/admin-role';
import { MediaTypeEnum } from '@common/enums/media-type.enum';
import { View, ChildOf, RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';
import {
  ElAvatar,
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElMessage,
  ElIcon,
  ElCard,
  ElTag,
  ElPagination,
  ElEmpty,
  ElImage,
  vLoading,
} from 'element-plus';
import { Upload } from 'lucide-vue-next';

@View('/admin/users')
@ChildOf('AdminView')
@RenderMethod(RenderMethodKind.CSR)
@Options({
  components: {
    ElAvatar,
    ElButton,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElSelect,
    ElOption,
    ElIcon,
    ElCard,
    ElTag,
    ElPagination,
    ElEmpty,
    ElImage,
    Upload,
  },
  directives: {
    loading: vLoading,
  },
})
export default class UsersAdminView extends Vue {
  userInfo: GetSessionResDTO | null = null;

  defaultAvatarUrl = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

  // 头像上传
  uploadingAvatar = false;

  // 创建用户对话框
  createUserDialogVisible = false;
  createUserForm = {
    username: '',
    password: '',
    role: AdminRoleEnum.ADMIN,
  };
  createUserFormRules = {
    username: [{ required: true, message: 'Please enter username', trigger: 'blur' }],
    password: [
      { required: true, message: 'Please enter password', trigger: 'blur' },
      { min: 6, message: 'Password must be at least 6 characters long', trigger: 'blur' },
    ],
  };
  creatingUser = false;

  // 用户列表
  adminList: GetAllAdminsResDTO[] = [];
  loadingAdminList = false;

  roleOptions = [
    { label: 'Admin', value: AdminRoleEnum.ADMIN },
    { label: 'Super Admin', value: AdminRoleEnum.SUPER_ADMIN },
  ];

  // 管理员编辑的新闻列表
  myNewsList: GetNewsDetailResDTO[] = [];
  loadingNews = false;
  newsPage = 1;
  newsPageSize = 6;

  // 管理员编辑的项目列表
  myProjectsList: GetProjectDetailResDTO[] = [];
  loadingProjects = false;
  projectsPage = 1;
  projectsPageSize = 6;

  get userAvatar() {
    return this.userInfo?.avatar || this.defaultAvatarUrl;
  }

  get isSuperAdmin() {
    return this.userInfo?.role === AdminRoleEnum.SUPER_ADMIN;
  }

  // 触发文件选择
  triggerAvatarUpload() {
    if (this.uploadingAvatar) return;
    const input = this.$refs.avatarInput as HTMLInputElement;
    input?.click();
  }

  // 处理文件选择并上传
  async handleAvatarFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      ElMessage.warning('请选择图片文件');
      return;
    }

    this.uploadingAvatar = true;
    try {
      const uploadResult = await this.$api.uploadMedia({
        file,
        type: MediaTypeEnum.ADMIN_AVATAR,
        alt: `${this.userInfo.username}-avatar`,
      });

      // 更新用户头像
      const avatarPath = uploadResult.path;
      await this.$api.updateAdminAvatar({ avatar: avatarPath });

      // 更新本地头像显示
      this.userInfo.avatar = avatarPath;

      ElMessage.success('Avatar updated successfully');

      // 刷新用户信息
      this.$emit('refresh-user');
    } catch (error) {
      console.error('Failed to update avatar:', error);
      ElMessage.error('Failed to update avatar');
    } finally {
      this.uploadingAvatar = false;
      input.value = '';
    }
  }

  // 打开创建用户对话框
  openCreateUserDialog() {
    if (!this.isSuperAdmin) {
      ElMessage.warning('Only super admin can create new users');
      return;
    }
    this.createUserDialogVisible = true;
    this.resetCreateUserForm();
  }

  // 重置创建用户表单
  resetCreateUserForm() {
    this.createUserForm = {
      username: '',
      password: '',
      role: AdminRoleEnum.ADMIN,
    };
  }

  // 创建用户
  async handleCreateUser() {
    const formRef = this.$refs.createUserFormRef as any;
    if (!formRef) return;

    try {
      await formRef.validate();
    } catch (error) {
      return;
    }

    this.creatingUser = true;
    try {
      await this.$api.register(this.createUserForm);
      ElMessage.success('User created successfully');
      this.createUserDialogVisible = false;
      this.$emit('user-created');
    } catch (error: any) {
      console.error('Failed to create user:', error);
      ElMessage.error(error?.message || 'Failed to create user');
    } finally {
      this.creatingUser = false;
    }
  }

  async logout() {
    try {
      await this.$api.logout();
      this.$router.push('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
      ElMessage.error('Failed to logout, please try again');
    }
  }

  // 加载管理员列表
  async loadAdminList() {
    if (!this.isSuperAdmin) return;

    this.loadingAdminList = true;
    try {
      const result = await this.$api.getAllAdmins();
      this.adminList = result.rows;
    } catch (error) {
      console.error('Failed to load admin list:', error);
      ElMessage.error('Failed to load admin list');
    } finally {
      this.loadingAdminList = false;
    }
  }

  // 修改用户权限
  async handleUpdateRole(admin: GetAllAdminsResDTO, newRole: AdminRoleEnum) {
    if (admin.id === this.userInfo.id) {
      ElMessage.warning('Cannot change your own role');
      return;
    }

    try {
      await this.$api.updateAdminRole({ adminId: admin.id, role: newRole });
      ElMessage.success('Role updated successfully');
      await this.loadAdminList();
    } catch (error: any) {
      console.error('Failed to update role:', error);
      ElMessage.error(error?.message || 'Failed to update role');
    }
  }

  // 获取用户头像
  getUserAvatar(avatar?: string) {
    return avatar || this.defaultAvatarUrl;
  }

  // 获取角色标签类型
  getRoleTagType(role: AdminRoleEnum) {
    return role === AdminRoleEnum.SUPER_ADMIN ? 'danger' : 'primary';
  }

  // 获取角色显示文本
  getRoleLabel(role: AdminRoleEnum) {
    return role === AdminRoleEnum.SUPER_ADMIN ? '超级管理员' : '管理员';
  }

  // 获取当前管理员编辑的新闻列表
  get filteredNewsList() {
    return this.myNewsList.filter(news => news.updatedBy?.id === this.userInfo?.id);
  }

  get paginatedNewsList() {
    const start = (this.newsPage - 1) * this.newsPageSize;
    return this.filteredNewsList.slice(start, start + this.newsPageSize);
  }

  // 获取当前管理员编辑的项目列表
  get filteredProjectsList() {
    return this.myProjectsList.filter(project => project.updatedBy?.id === this.userInfo?.id);
  }

  get paginatedProjectsList() {
    const start = (this.projectsPage - 1) * this.projectsPageSize;
    return this.filteredProjectsList.slice(start, start + this.projectsPageSize);
  }

  // 加载新闻列表
  async loadMyNews() {
    this.loadingNews = true;
    try {
      const result = await this.$api.getAllNews({});
      this.myNewsList = result.rows;
    } catch (error) {
      console.error('Failed to load news list:', error);
    } finally {
      this.loadingNews = false;
    }
  }

  // 加载项目列表
  async loadMyProjects() {
    this.loadingProjects = true;
    try {
      const result = await this.$api.getAllProjects({});
      this.myProjectsList = result.rows;
    } catch (error) {
      console.error('Failed to load projects list:', error);
    } finally {
      this.loadingProjects = false;
    }
  }

  // 格式化日期
  formatDate(date: Date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('zh-CN');
  }

  // 新闻分页变化
  handleNewsPageChange(page: number) {
    this.newsPage = page;
  }

  // 项目分页变化
  handleProjectsPageChange(page: number) {
    this.projectsPage = page;
  }

  async mounted() {
    this.userInfo = await this.$api.getSession();
    if (this.isSuperAdmin) {
      await this.loadAdminList();
    }
    // 加载当前管理员编辑的新闻和项目
    await Promise.all([this.loadMyNews(), this.loadMyProjects()]);
  }
}
</script>

<template>
  <div class="admin-operate-container">
    <el-form label-width="100px">
      <el-form-item label="Admin Info">
        <div class="user-info-section">
          <div class="avatar-wrapper" @click="triggerAvatarUpload" :class="{ uploading: uploadingAvatar }">
            <el-avatar :src="userAvatar" :size="80" />
            <div class="avatar-overlay">
              <el-icon v-if="!uploadingAvatar" :size="24"><Upload /></el-icon>
              <span v-else class="uploading-text">Uploading...</span>
            </div>
          </div>
          <input
            ref="avatarInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleAvatarFileChange"
          />
          <div class="user-details">
            <div class="user-item">
              <span class="label">Username：</span>
              <span class="value">{{ userInfo?.username }}</span>
            </div>
            <div class="user-item">
              <span class="label">Role：</span>
              <span class="value">{{ userInfo?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin' }}</span>
            </div>
          </div>
          <el-button type="danger" size="small" @click="logout" class="logout-btn">Logout</el-button>
        </div>
      </el-form-item>

      <el-form-item label="Admin List" v-if="isSuperAdmin">
        <div class="user-management-content">
          <el-button plain @click="openCreateUserDialog">
            Add New Admin
          </el-button>

          <!-- 所有用户列表 -->
          <div v-loading="loadingAdminList" class="admin-cards-container">
            <el-card
              v-for="admin in adminList"
              :key="admin.id"
              class="admin-card"
              shadow="hover"
            >
              <div class="admin-card-content">
                <el-avatar :src="getUserAvatar(admin.avatar)" :size="40" />
                <div class="admin-info">
                  <div class="admin-name">{{ admin.username }}</div>
                  <el-tag :type="getRoleTagType(admin.role)" size="small">
                    {{ getRoleLabel(admin.role) }}
                  </el-tag>
                </div>
              </div>
              <div class="admin-card-actions" v-if="admin.id !== userInfo.id">
                <el-select
                  :model-value="admin.role"
                  size="small"
                  @change="(val: AdminRoleEnum) => handleUpdateRole(admin, val)"
                  placeholder="Change Role"
                >
                  <el-option
                    v-for="option in roleOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </div>
              <div class="current-user-tag" v-else>
                <el-tag type="info" size="small">Current User</el-tag>
              </div>
            </el-card>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="My News">
        <div v-loading="loadingNews" class="content-cards-container">
        <el-empty v-if="!loadingNews && filteredNewsList.length === 0" description="No edited news available" />
        <template v-else>
          <div class="preview-cards-grid">
            <el-card
              v-for="news in paginatedNewsList"
              :key="news.id"
              class="preview-card"
              shadow="hover"
            >
              <div class="card-cover">
                <el-image
                  v-if="news.coverImage"
                  :src="news.coverImage"
                  fit="cover"
                  class="cover-image"
                />
                <div v-else class="no-cover">
                  <span>No Cover</span>
                </div>
              </div>
              <div class="card-content">
                <div class="card-title">{{ news.title }}</div>
                <div class="card-meta">
                  <el-tag :type="news.isPublished ? 'success' : 'info'" size="small">
                    {{ news.isPublished ? 'Published' : 'Draft' }}
                  </el-tag>
                  <span class="card-date">{{ formatDate(news.updatedAt) }}</span>
                </div>
              </div>
            </el-card>
          </div>
          <el-pagination
            v-if="filteredNewsList.length > newsPageSize"
            class="pagination"
            :current-page="newsPage"
            :page-size="newsPageSize"
            :total="filteredNewsList.length"
            layout="prev, pager, next"
            @current-change="handleNewsPageChange"
          />
        </template>
        </div>
      </el-form-item>

      <el-form-item label="My Projects">
        <div v-loading="loadingProjects" class="content-cards-container">
        <el-empty v-if="!loadingProjects && filteredProjectsList.length === 0" description="No edited projects available" />
        <template v-else>
          <div class="preview-cards-grid">
            <el-card
              v-for="project in paginatedProjectsList"
              :key="project.id"
              class="preview-card"
              shadow="hover"
            >
              <div class="card-cover">
                <el-image
                  v-if="project.coverImage"
                  :src="project.coverImage"
                  fit="cover"
                  class="cover-image"
                />
                <div v-else class="no-cover">
                  <span>No Cover</span>
                </div>
              </div>
              <div class="card-content">
                <div class="card-title">{{ project.name }}</div>
                <div class="card-meta">
                  <el-tag :type="project.isFeatured ? 'warning' : 'info'" size="small">
                    {{ project.isFeatured ? 'Featured' : 'Normal' }}
                  </el-tag>
                  <span class="card-date">{{ formatDate(project.updatedAt) }}</span>
                </div>
              </div>
            </el-card>
          </div>
          <el-pagination
            v-if="filteredProjectsList.length > projectsPageSize"
            class="pagination"
            :current-page="projectsPage"
            :page-size="projectsPageSize"
            :total="filteredProjectsList.length"
            layout="prev, pager, next"
            @current-change="handleProjectsPageChange"
          />
        </template>
        </div>
      </el-form-item>
    </el-form>

    <!-- 创建用户对话框 -->
    <el-dialog
      v-model="createUserDialogVisible"
      title="Add New Admin"
      width="500px"
      :close-on-click-modal="false"
    >
    <template #header="{ titleId, titleClass }">
      <h4 :id="titleId" :class="titleClass" style="line-height: normal;">
        Add New Admin
      </h4>
    </template>
      <el-form
        ref="createUserFormRef"
        :model="createUserForm"
        :rules="createUserFormRules"
        label-width="80px"
      >
        <el-form-item label="Username" prop="username">
          <el-input v-model="createUserForm.username" >
          </el-input>
        </el-form-item>

        <el-form-item label="Password" prop="password">
          <el-input
            v-model="createUserForm.password"
            type="password"
            show-password
          />
        </el-form-item>

        <el-form-item label="Role" prop="role">
          <el-select v-model="createUserForm.role">
            <el-option
              v-for="option in roleOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="createUserDialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="creatingUser" @click="handleCreateUser">
          Create
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="less">
.admin-operate-container {
  padding: 20px;

  .user-info-section {
    display: flex;
    align-items: center;
    gap: 24px;

    .avatar-wrapper {
      position: relative;
      cursor: pointer;
      border-radius: 50%;
      overflow: hidden;
      width: 80px;
      height: 80px;
      flex-shrink: 0;

      &:hover .avatar-overlay {
        opacity: 1;
      }

      &.uploading {
        cursor: wait;
        .avatar-overlay {
          opacity: 1;
        }
      }
    }

    .avatar-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s;
      color: white;

      .uploading-text {
        font-size: 12px;
      }
    }

    .user-details {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .user-item {
        display: flex;
        align-items: center;
        font-size: 14px;

        .label {
          color: var(--el-text-color-secondary);
          min-width: 60px;
        }

        .value {
          color: var(--el-text-color-primary);
          font-weight: 500;
        }
      }
    }

    .logout-btn {
      margin-left: auto;
    }
  }

  .user-management-content {
    width: 100%;

    .admin-cards-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 8px;
      margin-top: 12px;

      .admin-card {
        :deep(.el-card__body) {
          padding: 8px;
        }

        .admin-card-content {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;

          .admin-info {
            flex: 1;
            min-width: 0;

            .admin-name {
              font-size: 13px;
              font-weight: 500;
              color: var(--el-text-color-primary);
              margin-bottom: 4px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }
        }

        .admin-card-actions {
          .el-select {
            width: 100%;
          }
        }

        .current-user-tag {
          display: flex;
          justify-content: center;
        }
      }
    }
  }

  .content-cards-container {
    min-height: 150px;
    width: 100%;
  }

  .preview-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  .preview-card {
    :deep(.el-card__body) {
      padding: 0;
    }

    .card-cover {
      height: 120px;
      overflow: hidden;
      background: var(--el-fill-color-light);

      .cover-image {
        width: 100%;
        height: 100%;
      }

      .no-cover {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--el-text-color-placeholder);
        font-size: 12px;
      }
    }

    .card-content {
      padding: 12px;

      .card-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-primary);
        margin-bottom: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .card-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;

        .card-date {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }

  .pagination {
    margin-top: 16px;
    justify-content: center;
  }
}
</style>
