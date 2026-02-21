import { UpdatedAdmin } from './../admin/admin.dto';
import { FromBody } from 'bwcx-common';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class GetProjectPreviewResDTO {
  name: string;

  description?: string;

  repoUrl?: string;

  websiteUrl?: string;

  coverImage?: string;

  bgColor?: string;
}

// 创建项目
export class CreateProjectReqDTO {
  @FromBody()
  @IsNotEmpty()
  @IsString()
  name: string;

  @FromBody()
  @IsOptional()
  @IsString()
  description?: string;

  @FromBody()
  @IsOptional()
  @IsString()
  repoUrl?: string;

  @FromBody()
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @FromBody()
  @IsOptional()
  @IsString()
  coverImage?: string;

  @FromBody()
  @IsOptional()
  @IsString()
  bgColor?: string;

  @FromBody()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

// 更新项目
export class UpdateProjectReqDTO {
  @FromBody()
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @FromBody()
  @IsOptional()
  @IsString()
  name?: string;

  @FromBody()
  @IsOptional()
  @IsString()
  description?: string;

  @FromBody()
  @IsOptional()
  @IsString()
  repoUrl?: string;

  @FromBody()
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @FromBody()
  @IsOptional()
  @IsString()
  coverImage?: string;

  @FromBody()
  @IsOptional()
  @IsString()
  bgColor?: string;

  @FromBody()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

// 删除项目
export class DeleteProjectReqDTO {
  @FromBody()
  @IsNotEmpty()
  @IsNumber()
  id: number;
}

// 获取单个项目详情
export class GetProjectDetailResDTO {
  id: number;
  name: string;
  description?: string;
  repoUrl?: string;
  websiteUrl?: string;
  coverImage?: string;
  bgColor?: string;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: UpdatedAdmin;
}

// 获取项目列表
export class GetProjectListResDTO {
  rows: GetProjectDetailResDTO[];
}

// 获取所有项目请求（管理员用，支持分页）
export class GetAllProjectsReqDTO {
  @FromBody()
  @IsOptional()
  @IsNumber()
  page?: number;

  @FromBody()
  @IsOptional()
  @IsNumber()
  pageSize?: number;
}

// 获取所有项目响应（管理员用，支持分页）
export class GetAllProjectsResDTO {
  rows: GetProjectDetailResDTO[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// 获取项目详情请求
export class GetProjectReqDTO {
  @FromBody()
  @IsNotEmpty()
  @IsNumber()
  id: number;
}
