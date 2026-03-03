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
  ElMessageBox,
  ElIcon,
  ElCard,
  ElTag,
  ElPagination,
  ElEmpty,
  ElImage,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElSkeleton,
  ElSkeletonItem,
  vLoading,
} from 'element-plus';
import AuditLogContainer from '@client/components/admin/audit-log.vue';
import { Upload, MoreVertical } from 'lucide-vue-next';

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
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    ElSkeleton,
    ElSkeletonItem,
    Upload,
    AuditLogContainer,
    MoreVertical,
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

  // 重置密码对话框
  resetPasswordDialogVisible = false;
  resetPasswordForm = {
    adminId: 0,
    adminName: '',
    newPassword: '',
  };
  resetPasswordFormRules = {
    newPassword: [
      { required: true, message: 'Please enter new password', trigger: 'blur' },
      { min: 6, message: 'Password must be at least 6 characters long', trigger: 'blur' },
    ],
  };
  resettingPassword = false;

  adminList: GetAllAdminsResDTO[] = [];
  adminPage = 1;
  adminPageSize = 6;
  loadingState = {
    adminList: true,
    adminNews: true,
  };

  roleOptions = [
    { label: 'Admin', value: AdminRoleEnum.ADMIN },
    { label: 'Super Admin', value: AdminRoleEnum.SUPER_ADMIN },
  ];

  // 管理员编辑的新闻列表
  myNewsList: GetNewsDetailResDTO[] = [];
  newsPage = 1;
  newsPageSize = 6;

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
      ElMessage.warning('Please select an image file');
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
    this.loadingState.adminList = true;
    try {
      const result = await this.$api.getAllAdmins();
      this.adminList = result.rows;
    } catch (error) {
      console.error('Failed to load admin list:', error);
      ElMessage.error('Failed to load admin list');
    } finally {
      this.loadingState.adminList = false;
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

  // 打开重置密码对话框
  openResetPasswordDialog(admin: GetAllAdminsResDTO) {
    this.resetPasswordForm = {
      adminId: admin.id,
      adminName: admin.username,
      newPassword: '',
    };
    this.resetPasswordDialogVisible = true;
  }

  // 重置密码
  async handleResetPassword() {
    const formRef = this.$refs.resetPasswordFormRef as any;
    if (!formRef) return;

    try {
      await formRef.validate();
    } catch (error) {
      return;
    }

    this.resettingPassword = true;
    try {
      await this.$api.resetAdminPassword({
        adminId: this.resetPasswordForm.adminId,
        newPassword: this.resetPasswordForm.newPassword,
      });
      ElMessage.success('Password reset successfully');
      this.resetPasswordDialogVisible = false;
    } catch (error: any) {
      console.error('Failed to reset password:', error);
      ElMessage.error(error?.message || 'Failed to reset password');
    } finally {
      this.resettingPassword = false;
    }
  }

  // 删除管理员
  async handleDeleteAdmin(admin: GetAllAdminsResDTO) {
    if (admin.id === this.userInfo.id) {
      ElMessage.warning('Cannot delete yourself');
      return;
    }

    try {
      await ElMessageBox.confirm(
        `Are you sure you want to delete admin "${admin.username}"? This action cannot be undone.`,
        'Delete Admin',
        {
          confirmButtonText: 'Delete',
          cancelButtonText: 'Cancel',
          type: 'warning',
        },
      );

      await this.$api.deleteAdmin({ adminId: admin.id });
      ElMessage.success('Admin deleted successfully');
      await this.loadAdminList();
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('Failed to delete admin:', error);
        ElMessage.error(error?.message || 'Failed to delete admin');
      }
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
    return role === AdminRoleEnum.SUPER_ADMIN ? 'Super Admin' : 'Admin';
  }

  // 分页后的管理员列表
  get paginatedAdminList() {
    const start = (this.adminPage - 1) * this.adminPageSize;
    return this.adminList.slice(start, start + this.adminPageSize);
  }

  // 管理员分页变化
  handleAdminPageChange(page: number) {
    this.adminPage = page;
  }

  // 获取当前管理员编辑的新闻列表
  get filteredNewsList() {
    return this.myNewsList.filter((news) => news.updatedBy?.id === this.userInfo?.id);
  }

  get paginatedNewsList() {
    const start = (this.newsPage - 1) * this.newsPageSize;
    return this.filteredNewsList.slice(start, start + this.newsPageSize);
  }

  // 加载新闻列表
  async loadMyNews() {
    this.loadingState.adminNews = true;
    try {
      const result = await this.$api.getAllNews({});
      this.myNewsList = result.rows;
    } catch (error) {
      console.error('Failed to load news list:', error);
    } finally {
      this.loadingState.adminNews = false;
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

  async mounted() {
    this.userInfo = await this.$api.getSession();
    if (this.isSuperAdmin) {
      await this.loadAdminList();
    }

    await Promise.all([this.loadMyNews()]);
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
            <div class="user-item">
              <el-button plain @click="logout" class="logout-btn">Logout</el-button>
            </div>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="Admin List" v-if="isSuperAdmin">
        <div class="user-management-content">
          <el-button plain @click="openCreateUserDialog" style="padding: 0 1rem;" round> Add New Admin </el-button>

          <!-- 所有用户列表 -->
          <div class="admin-cards-container">
            <!-- 骨架屏 -->
            <template v-if="loadingState.adminList">
              <el-card v-for="i in adminPageSize" :key="'skeleton-admin-' + i" class="admin-card admin-skeleton-card" shadow="hover">
                <el-skeleton :rows="0" animated>
                  <template #template>
                    <div class="admin-card-content">
                      <el-skeleton-item variant="circle" style="width: 40px; height: 40px; flex-shrink: 0;" />
                      <div class="admin-info">
                        <el-skeleton-item variant="text" style="width: 70%; height: 14px; margin-bottom: 6px;" />
                        <el-skeleton-item variant="button" style="width: 60px; height: 22px; border-radius: 4px;" />
                      </div>
                      <el-skeleton-item variant="circle" style="width: 24px; height: 24px; flex-shrink: 0;" />
                    </div>
                    <el-skeleton-item variant="rect" style="width: 100%; height: 28px; margin-top: 8px; border-radius: 4px;" />
                  </template>
                </el-skeleton>
              </el-card>
            </template>
            <!-- 实际内容 -->
            <template v-else>
              <el-empty v-if="adminList.length === 0" description="No admins available" />
              <el-card v-for="admin in paginatedAdminList" :key="admin.id" class="admin-card" shadow="hover">
                <div class="admin-card-content">
                  <el-avatar :src="getUserAvatar(admin.avatar)" :size="40" />
                  <div class="admin-info">
                    <div class="admin-name">{{ admin.username }}</div>
                    <el-tag :type="getRoleTagType(admin.role)" size="small">
                      {{ getRoleLabel(admin.role) }}
                    </el-tag>
                  </div>
                  <!-- 操作下拉菜单 -->
                  <el-dropdown v-if="admin.id !== userInfo.id" trigger="click" class="admin-actions-dropdown">
                    <el-button text circle size="small">
                      <el-icon :size="16"><MoreVertical /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item @click="openResetPasswordDialog(admin)"> Reset Password </el-dropdown-item>
                        <el-dropdown-item @click="handleDeleteAdmin(admin)" divided>
                          <span style="color: var(--el-color-danger)">Delete Admin</span>
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
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
            </template>
          </div>
          <!-- 分页器骨架屏 -->
          <div v-if="loadingState.adminList" class="pagination pagination-skeleton">
            <el-skeleton :rows="0" animated style="display: flex; gap: 8px; justify-content: center;">
              <template #template>
                <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px;" />
                <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px;" />
                <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px;" />
                <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px;" />
              </template>
            </el-skeleton>
          </div>
          <el-pagination
            v-else
            class="pagination"
            :current-page="adminPage"
            :page-size="adminPageSize"
            :total="adminList.length"
            layout="total, prev, pager, next"
            @current-change="handleAdminPageChange"
          />
        </div>
      </el-form-item>

      <el-form-item label="My News">
        <div class="content-cards-container">
          <!-- 骨架屏 -->
          <template v-if="loadingState.adminNews">
            <div class="preview-cards-grid">
              <el-card v-for="i in newsPageSize" :key="'skeleton-news-' + i" class="preview-card news-skeleton-card" shadow="hover">
                <el-skeleton :rows="0" animated>
                  <template #template>
                    <div class="card-cover">
                      <el-skeleton-item variant="image" style="width: 100%; height: 120px;" />
                    </div>
                    <div class="card-content">
                      <el-skeleton-item variant="h3" style="width: 85%; height: 16px; margin-bottom: 8px;" />
                      <el-skeleton-item variant="text" style="width: 60%; height: 12px; margin-bottom: 10px;" />
                      <div class="card-meta">
                        <el-skeleton-item variant="button" style="width: 58px; height: 22px; border-radius: 4px;" />
                        <el-skeleton-item variant="text" style="width: 70px; height: 14px;" />
                      </div>
                    </div>
                  </template>
                </el-skeleton>
              </el-card>
            </div>
            <!-- 分页器骨架屏 -->
            <div class="pagination pagination-skeleton">
              <el-skeleton :rows="0" animated style="display: flex; gap: 8px; justify-content: center;">
                <template #template>
                  <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px;" />
                  <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px;" />
                  <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px;" />
                  <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px;" />
                </template>
              </el-skeleton>
            </div>
          </template>
          <!-- 实际内容 -->
          <template v-else>
            <el-empty v-if="filteredNewsList.length === 0" description="No edited news available" />
            <template v-else>
              <div class="preview-cards-grid">
                <el-card v-for="news in paginatedNewsList" :key="news.id" class="preview-card" shadow="hover">
                  <div class="card-cover">
                    <el-image v-if="news.coverImage" :src="news.coverImage" fit="cover" class="cover-image" />
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
                class="pagination"
                :current-page="newsPage"
                :page-size="newsPageSize"
                :total="filteredNewsList.length"
                layout="total, prev, pager, next"
                @current-change="handleNewsPageChange"
              />
            </template>
          </template>
        </div>
      </el-form-item>

      <el-form-item label="Audit Log">
        <audit-log-container />
      </el-form-item>
    </el-form>

    <!-- 创建用户对话框 -->
    <el-dialog v-model="createUserDialogVisible" title="Add New Admin" width="500px" :close-on-click-modal="false">
      <template #header="{ titleId, titleClass }">
        <h4 :id="titleId" :class="titleClass" style="line-height: normal;">Add New Admin</h4>
      </template>
      <el-form ref="createUserFormRef" :model="createUserForm" :rules="createUserFormRules" label-width="80px">
        <el-form-item label="Username" prop="username">
          <el-input v-model="createUserForm.username"> </el-input>
        </el-form-item>

        <el-form-item label="Password" prop="password">
          <el-input v-model="createUserForm.password" type="password" show-password />
        </el-form-item>

        <el-form-item label="Role" prop="role">
          <el-select v-model="createUserForm.role">
            <el-option v-for="option in roleOptions" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="createUserDialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="creatingUser" @click="handleCreateUser"> Create </el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog v-model="resetPasswordDialogVisible" title="Reset Password" width="400px" :close-on-click-modal="false">
      <template #header="{ titleId, titleClass }">
        <h4 :id="titleId" :class="titleClass" style="line-height: normal;">
          Reset Password for "{{ resetPasswordForm.adminName }}"
        </h4>
      </template>
      <el-form
        ref="resetPasswordFormRef"
        :model="resetPasswordForm"
        :rules="resetPasswordFormRules"
        label-width="120px"
      >
        <el-form-item label="New Password" prop="newPassword">
          <el-input
            v-model="resetPasswordForm.newPassword"
            type="password"
            show-password
            placeholder="Enter new password"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="resetPasswordDialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="resettingPassword" @click="handleResetPassword"> Reset </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="less">
.admin-operate-container {
  padding: 20px;
  user-select: none;

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
  }

  .user-management-content {
    width: 100%;

    .admin-cards-container {
      width: 100%;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 12px;
      min-height: 200px;

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

          .admin-actions-dropdown {
            flex-shrink: 0;
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

      .admin-skeleton-card {
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
          }
        }
      }
    }
  }

  .content-cards-container {
    min-height: 200px;
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

  .news-skeleton-card {
    :deep(.el-card__body) {
      padding: 0;
    }

    .card-cover {
      height: 120px;
      overflow: hidden;
    }

    .card-content {
      padding: 12px;

      .card-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
    }
  }

  .pagination {
    margin-top: 16px;
    justify-content: center;
    margin-bottom: 1.5rem;
  }
}
</style>
