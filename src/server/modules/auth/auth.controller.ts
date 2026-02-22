import {Data, Controller, InjectCtx, RequestContext, Post, Contract } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import { Api } from 'bwcx-api';
import { ApiController } from '@server/decorators';
import AuthService from './auth.service';
import { RegisterAdminReqDTO, LoginAdminWithUserNameReqDTO, GetSessionResDTO, UpdateAdminAvatarReqDTO, GetAllAdminsListResDTO, UpdateAdminRoleReqDTO, ResetAdminPasswordReqDTO, DeleteAdminReqDTO } from '@common/modules/admin/admin.dto';

@ApiController()
export default class AuthController {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
    @Inject()
    private readonly authService: AuthService
  ) {}

  /** routes */
  @Api.Summary('管理员注册')
  @Post('/register')
  @Contract(RegisterAdminReqDTO, null)
  public async register(@Data() data: RegisterAdminReqDTO): Promise<void> {
    // 注册逻辑
    await this.authService.register(data);
  }

  @Api.Summary('管理员登录')
  @Post('/login')
  @Contract(LoginAdminWithUserNameReqDTO, null)
  public async login(@Data() data: LoginAdminWithUserNameReqDTO): Promise<void> {
    await this.authService.login(data);
  }

  @Api.Summary('管理员登出')
  @Post('/logout')
  @Contract(null, null)
  public async logout(): Promise<void> {
    this.ctx.session.admin = null;
  }

  @Api.Summary('获取管理员会话信息')
  @Post('/getSession')
  @Contract(null, GetSessionResDTO)
  public async getSession(): Promise<GetSessionResDTO> {
    return await this.authService.getSession();
  }

  @Api.Summary('更新管理员头像')
  @Post('/updateAdminAvatar')
  @Contract(UpdateAdminAvatarReqDTO, null)
  public async updateAdminAvatar(@Data() data: UpdateAdminAvatarReqDTO): Promise<void> {
    await this.authService.updateAdminAvatar(data);
  }

  @Api.Summary('获取所有管理员')
  @Post('/getAllAdmins')
  @Contract(null, GetAllAdminsListResDTO)
  public async getAllAdmins(): Promise<GetAllAdminsListResDTO> {
    return await this.authService.getAllAdmins();
  }

  @Api.Summary('更新管理员角色')
  @Post('/updateAdminRole')
  @Contract(UpdateAdminRoleReqDTO, null)
  public async updateAdminRole(@Data() data: UpdateAdminRoleReqDTO): Promise<void> {
    await this.authService.updateAdminRole(data);
  }

  @Api.Summary('重置管理员密码')
  @Post('/resetAdminPassword')
  @Contract(ResetAdminPasswordReqDTO, null)
  public async resetAdminPassword(@Data() data: ResetAdminPasswordReqDTO): Promise<void> {
    await this.authService.resetAdminPassword(data);
  }

  @Api.Summary('删除管理员')
  @Post('/deleteAdmin')
  @Contract(DeleteAdminReqDTO, null)
  public async deleteAdmin(@Data() data: DeleteAdminReqDTO): Promise<void> {
    await this.authService.deleteAdmin(data);
  }
}

