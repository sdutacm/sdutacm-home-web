import { Service, InjectCtx, RequestContext } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import { RegisterAdminReqDTO, LoginAdminWithUserNameReqDTO, GetSessionResDTO, UpdateAdminAvatarReqDTO, GetAllAdminsListResDTO, UpdateAdminRoleReqDTO, ResetAdminPasswordReqDTO, DeleteAdminReqDTO } from '@common/modules/admin/admin.dto';
import bcrypt from 'bcrypt';
import appDataSource from '@server/db';
import { Admin } from '@server/db/entity/admin';
import { AdminRoleEnum } from '@common/enums/admin-role';
import AuditService from '@server/modules/audit/audit.service';
import { AuditActionType } from '@common/modules/audit/audit.dto';

@Service()
export default class AuthService {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
    @Inject()
    private readonly auditService: AuditService,
  ) {}

  /** methods */
  public async register(data: RegisterAdminReqDTO): Promise<void> {
    const { username, password } = data;
    const adminRepo = appDataSource.getRepository(Admin);
    const existingAdmin = await adminRepo.findOne({
      where: {
        username,
      },
    });
    if (existingAdmin) {
      throw new Error('管理员已存在');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = adminRepo.create({
      username,
      password: hashedPassword,
    });
    const savedAdmin = await adminRepo.save(newAdmin);

    // 记录创建管理员审计日志并创建版本
    await this.auditService.logCreate('admin', savedAdmin.id, savedAdmin.username, {
      username: savedAdmin.username,
      role: savedAdmin.role,
      avatar: savedAdmin.avatar,
    });
  }

  public async login(data: LoginAdminWithUserNameReqDTO): Promise<void> {
    const { username, password } = data;
    const adminRepo = appDataSource.getRepository(Admin);
    const admin = await adminRepo.findOne({
      where: {
        username,
      },
    });
    if (!admin) {
      throw new Error('管理员不存在');
    }
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new Error('密码错误');
    }
    // 登录成功，设置会话等逻辑
    this.ctx.session.admin = {
      id: admin.id,
      username: admin.username,
      role: admin.role,
      avatar: admin.avatar ? admin.avatar : undefined,
    };

    // 记录登录审计日志
    await this.auditService.logLogin(admin);
  }

  public async getSession(): Promise<GetSessionResDTO> {
    console.log('获取当前管理员会话信息:', this.ctx.session.admin);
    return this.ctx.session.admin;
  }

  public async updateAdminAvatar(data: UpdateAdminAvatarReqDTO): Promise<void> {
    const { avatar } = data;
    const adminId = this.ctx.session.admin?.id;
    if (!adminId) {
      throw new Error('未登录');
    }
    const adminRepo = appDataSource.getRepository(Admin);
    const admin = await adminRepo.findOne({
      where: {
        id: adminId,
      },
    });
    if (!admin) {
      throw new Error('管理员不存在');
    }

    // 保存旧数据
    const oldData = {
      username: admin.username,
      role: admin.role,
      avatar: admin.avatar,
    };

    admin.avatar = avatar;
    await adminRepo.save(admin);

    // 更新 session
    this.ctx.session.admin.avatar = avatar;

    // 记录审计日志并创建版本
    const newData = {
      username: admin.username,
      role: admin.role,
      avatar: admin.avatar,
    };
    await this.auditService.logUpdate('admin', admin.id, admin.username, oldData, newData);
  }

  public async getAllAdmins(): Promise<GetAllAdminsListResDTO> {
    const adminRepo = appDataSource.getRepository(Admin);
    const admins = await adminRepo.find({
      select: ['id', 'username', 'role', 'avatar', 'createdAt'],
      order: {
        createdAt: 'DESC',
      },
    });
    return { rows: admins };
  }

  public async updateAdminRole(data: UpdateAdminRoleReqDTO): Promise<void> {
    const { adminId, role } = data;
    const currentAdminId = this.ctx.session.admin?.id;
    const currentAdminRole = this.ctx.session.admin?.role;

    // 检查是否登录
    if (!currentAdminId) {
      throw new Error('未登录');
    }

    // 检查是否为超级管理员
    if (currentAdminRole !== AdminRoleEnum.SUPER_ADMIN) {
      throw new Error('只有超级管理员才能修改用户权限');
    }

    // 不能修改自己的权限
    if (currentAdminId === adminId) {
      throw new Error('不能修改自己的权限');
    }

    const adminRepo = appDataSource.getRepository(Admin);
    const admin = await adminRepo.findOne({
      where: {
        id: adminId,
      },
    });

    if (!admin) {
      throw new Error('管理员不存在');
    }

    // 保存旧数据
    const oldData = {
      username: admin.username,
      role: admin.role,
      avatar: admin.avatar,
    };

    const oldRole = admin.role;
    admin.role = role;
    await adminRepo.save(admin);

    // 记录审计日志并创建版本
    const newData = {
      username: admin.username,
      role: admin.role,
      avatar: admin.avatar,
    };
    await this.auditService.logUpdate('admin', admin.id, admin.username, oldData, newData);
  }

  public async resetAdminPassword(data: ResetAdminPasswordReqDTO): Promise<void> {
    const { adminId, newPassword } = data;
    const currentAdminId = this.ctx.session.admin?.id;
    const currentAdminRole = this.ctx.session.admin?.role;

    // 检查是否登录
    if (!currentAdminId) {
      throw new Error('未登录');
    }

    // 检查是否为超级管理员
    if (currentAdminRole !== AdminRoleEnum.SUPER_ADMIN) {
      throw new Error('只有超级管理员才能重置用户密码');
    }

    // 不能重置自己的密码（应通过其他方式修改）
    if (currentAdminId === adminId) {
      throw new Error('不能通过此方式重置自己的密码');
    }

    const adminRepo = appDataSource.getRepository(Admin);
    const admin = await adminRepo.findOne({
      where: {
        id: adminId,
      },
    });

    if (!admin) {
      throw new Error('管理员不存在');
    }

    // 密码长度验证
    if (newPassword.length < 6) {
      throw new Error('密码长度不能少于6位');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await adminRepo.save(admin);

    // 密码重置不存储版本（密码为敏感数据），仅记录日志
    await this.auditService.logAction({
      actionType: AuditActionType.UPDATE,
      entityType: 'admin',
      entityId: admin.id,
      entityName: admin.username,
      description: `重置管理员密码: ${admin.username}`,
    });
  }

  public async deleteAdmin(data: DeleteAdminReqDTO): Promise<void> {
    const { adminId } = data;
    const currentAdminId = this.ctx.session.admin?.id;
    const currentAdminRole = this.ctx.session.admin?.role;

    // 检查是否登录
    if (!currentAdminId) {
      throw new Error('未登录');
    }

    // 检查是否为超级管理员
    if (currentAdminRole !== AdminRoleEnum.SUPER_ADMIN) {
      throw new Error('只有超级管理员才能删除管理员');
    }

    // 不能删除自己
    if (currentAdminId === adminId) {
      throw new Error('不能删除自己');
    }

    const adminRepo = appDataSource.getRepository(Admin);
    const admin = await adminRepo.findOne({
      where: {
        id: adminId,
      },
    });

    if (!admin) {
      throw new Error('管理员不存在');
    }

    // 记录删除审计日志并标记版本已删除
    const oldData = {
      username: admin.username,
      role: admin.role,
      avatar: admin.avatar,
    };
    await this.auditService.logDelete('admin', admin.id, admin.username, oldData);

    await adminRepo.remove(admin);
  }
}
