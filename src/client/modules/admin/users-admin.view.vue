<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { GetSessionResDTO, GetAllAdminsResDTO } from '@common/modules/admin/admin.dto';
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
  ElUpload,
  ElMessage,
  ElIcon,
  ElCard,
  ElTag,
  vLoading,
} from 'element-plus';
import { Upload, Plus, User } from '@element-plus/icons-vue';

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
    ElUpload,
    ElIcon,
    ElCard,
    ElTag,
    Upload,
    Plus,
    User,
  },
  directives: {
    loading: vLoading,
  },
})
export default class UsersAdminView extends Vue {
  userInfo: GetSessionResDTO | null = null;

  defaultAvatarUrl = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

  // 编辑头像对话框
  editAvatarDialogVisible = false;
  avatarFile: any = null;
  avatarFileList: any[] = [];
  uploadingAvatar = false;

  // 创建用户对话框
  createUserDialogVisible = false;
  createUserForm = {
    username: '',
    password: '',
    role: AdminRoleEnum.ADMIN,
  };
  createUserFormRules = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, message: '密码长度至少6位', trigger: 'blur' },
    ],
  };
  creatingUser = false;

  // 用户列表
  adminList: GetAllAdminsResDTO[] = [];
  loadingAdminList = false;

  roleOptions = [
    { label: '管理员', value: AdminRoleEnum.ADMIN },
    { label: '超级管理员', value: AdminRoleEnum.SUPER_ADMIN },
  ];

  get userAvatar() {
    return this.userInfo?.avatar || this.defaultAvatarUrl;
  }

  get isSuperAdmin() {
    return this.userInfo?.role === AdminRoleEnum.SUPER_ADMIN;
  }

  // 打开编辑头像对话框
  openEditAvatarDialog() {
    this.editAvatarDialogVisible = true;
    this.avatarFile = null;
    this.avatarFileList = [];
  }

  // 头像文件变化
  handleAvatarChange(file: any) {
    this.avatarFile = file.raw;
    return false; // 阻止自动上传
  }

  // 移除头像文件
  handleAvatarRemove() {
    this.avatarFile = null;
    this.avatarFileList = [];
  }

  // 上传头像
  async handleUploadAvatar() {
    if (!this.avatarFile) {
      ElMessage.warning('请选择头像图片');
      return;
    }

    this.uploadingAvatar = true;
    try {
      const formData = new FormData();
      formData.append('file', this.avatarFile);
      formData.append('type', MediaTypeEnum.ADMIN_AVATAR);
      formData.append('alt', `${this.userInfo.username}-avatar`);

      const response = await fetch('/api/uploadMedia', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('上传失败');
      }

      const result = await response.json();

      // 更新用户头像 - 注意响应被包装了两层
      const avatarPath = result.data.data.path;
      await this.$api.updateAdminAvatar({ avatar: avatarPath });

      // 更新本地头像显示
      this.userInfo.avatar = avatarPath;

      ElMessage.success('头像更新成功');
      this.editAvatarDialogVisible = false;

      // 刷新用户信息
      this.$emit('refresh-user');
    } catch (error) {
      console.error('上传头像失败:', error);
      ElMessage.error('上传头像失败');
    } finally {
      this.uploadingAvatar = false;
    }
  }

  // 打开创建用户对话框
  openCreateUserDialog() {
    if (!this.isSuperAdmin) {
      ElMessage.warning('只有超级管理员才能创建新用户');
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
      ElMessage.success('创建用户成功');
      this.createUserDialogVisible = false;
      this.$emit('user-created');
    } catch (error: any) {
      console.error('创建用户失败:', error);
      ElMessage.error(error?.message || '创建用户失败');
    } finally {
      this.creatingUser = false;
    }
  }

  async logout() {
    try {
      await this.$api.logout();
      this.$router.push('/login');
    } catch (error) {
      console.error('登出失败:', error);
      ElMessage.error('登出失败，请重试');
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
      console.error('加载管理员列表失败:', error);
      ElMessage.error('加载管理员列表失败');
    } finally {
      this.loadingAdminList = false;
    }
  }

  // 修改用户权限
  async handleUpdateRole(admin: GetAllAdminsResDTO, newRole: AdminRoleEnum) {
    if (admin.id === this.userInfo.id) {
      ElMessage.warning('不能修改自己的权限');
      return;
    }

    try {
      await this.$api.updateAdminRole({ adminId: admin.id, role: newRole });
      ElMessage.success('权限修改成功');
      await this.loadAdminList();
    } catch (error: any) {
      console.error('修改权限失败:', error);
      ElMessage.error(error?.message || '修改权限失败');
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

  async mounted() {
    this.userInfo = await this.$api.getSession();
    if (this.isSuperAdmin) {
      await this.loadAdminList();
    }
  }
}
</script>

<template>
  <div class="admin-operate-container">
    <el-form label-width="100px">
      <el-form-item label="用户信息">
        <div class="user-info-section">
          <div class="avatar-wrapper" @click="openEditAvatarDialog">
            <el-avatar :src="userAvatar" :size="80" />
            <div class="avatar-overlay">
              <el-icon :size="24"><Upload /></el-icon>
            </div>
          </div>
          <div class="user-details">
            <div class="user-item">
              <span class="label">用户名：</span>
              <span class="value">{{ userInfo?.username }}</span>
            </div>
            <div class="user-item">
              <span class="label">角色：</span>
              <span class="value">{{ userInfo?.role === 'SUPER_ADMIN' ? '超级管理员' : '管理员' }}</span>
            </div>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="用户管理" v-if="isSuperAdmin">
        <div class="user-management-content">
          <el-button type="primary" @click="openCreateUserDialog">
            创建新用户
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
                  placeholder="修改权限"
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
                <el-tag type="info" size="small">当前用户</el-tag>
              </div>
            </el-card>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="登出">
        <el-button type="danger" @click="logout">登出当前账号</el-button>
      </el-form-item>
    </el-form>

    <!-- 编辑头像对话框 -->
    <el-dialog
      v-model="editAvatarDialogVisible"
      title="编辑头像"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-upload
        class="avatar-uploader"
        :auto-upload="false"
        :on-change="handleAvatarChange"
        :on-remove="handleAvatarRemove"
        :file-list="avatarFileList"
        list-type="picture-card"
        :limit="1"
        accept="image/*"
      >
        <el-icon><Plus /></el-icon>
      </el-upload>

      <template #footer>
        <el-button @click="editAvatarDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploadingAvatar" @click="handleUploadAvatar">
          上传
        </el-button>
      </template>
    </el-dialog>

    <!-- 创建用户对话框 -->
    <el-dialog
      v-model="createUserDialogVisible"
      title="创建新用户"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="createUserFormRef"
        :model="createUserForm"
        :rules="createUserFormRules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="createUserForm.username" placeholder="请输入用户名">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="createUserForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="角色" prop="role">
          <el-select v-model="createUserForm.role" placeholder="请选择角色">
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
        <el-button @click="createUserDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="creatingUser" @click="handleCreateUser">
          创建
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

  .avatar-uploader {
    display: flex;
    justify-content: center;
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
}
</style>
