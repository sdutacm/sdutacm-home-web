import { Service, InjectCtx, RequestContext } from 'bwcx-ljsm';
import { RegisterAdminReqDTO, LoginAdminWithUserNameReqDTO, GetSessionResDTO, UpdateAdminAvatarReqDTO, GetAllAdminsListResDTO, UpdateAdminRoleReqDTO } from '@common/modules/admin/admin.dto';
import bcrypt from 'bcrypt';
import appDataSource from '@server/db';
import { Admin } from '@server/db/entity/admin';
import { AdminRoleEnum } from '@common/enums/admin-role';

@Service()
export default class AuthService {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
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
    await adminRepo.save(newAdmin);
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
    admin.avatar = avatar;
    await adminRepo.save(admin);

    // 更新 session
    this.ctx.session.admin.avatar = avatar;
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

    admin.role = role;
    await adminRepo.save(admin);
  }
}
