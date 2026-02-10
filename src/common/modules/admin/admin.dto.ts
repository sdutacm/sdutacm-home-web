import { FromBody } from "bwcx-common";
import { IsEmail, IsNotEmpty } from "class-validator";
import { AdminRoleEnum } from "../../enums/admin-role";


export interface UpdatedAdmin {
  id: number;
  username: string;
  avatar: string;
}


export class RegisterAdminReqDTO {
  @FromBody()
  @IsNotEmpty()
  username: string;

  @FromBody()
  @IsNotEmpty()
  password: string;
}

export class LoginAdminWithUserNameReqDTO {
  @FromBody()
  @IsNotEmpty()
  username: string;

  @FromBody()
  @IsNotEmpty()
  password: string;
}

export class LogoutAdminReqDTO {

}

export class GetSessionResDTO {
  id: number;
  username: string;
  role: AdminRoleEnum;
  avatar?: string;
}

export class UpdateAdminAvatarReqDTO {
  @FromBody()
  @IsNotEmpty()
  avatar: string;
}

export class GetAllAdminsResDTO {
  id: number;
  username: string;
  role: AdminRoleEnum;
  avatar?: string;
  createdAt: Date;
}

export class GetAllAdminsListResDTO {
  rows: GetAllAdminsResDTO[];
}

export class UpdateAdminRoleReqDTO {
  @FromBody()
  @IsNotEmpty()
  adminId: number;

  @FromBody()
  @IsNotEmpty()
  role: AdminRoleEnum;
}
