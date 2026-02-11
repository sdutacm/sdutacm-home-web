import { UpdatedAdmin } from './../admin/admin.dto';
import { FromBody } from "bwcx-common";
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean } from "class-validator";

export interface NewsItemVO {
  id: number;
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  isPublished: boolean;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: UpdatedAdmin;
  viewCount?: number;
}

export class GetNewsPreviewResDTO {
  id: number;

  title: string;

  summary: string;

  content: string;

  coverImage: string;

  publishedAt: Date;
}

// 创建新闻
export class CreateNewsReqDTO {
  @FromBody()
  @IsNotEmpty()
  @IsString()
  title: string;

  @FromBody()
  @IsOptional()
  @IsString()
  summary?: string;

  @FromBody()
  @IsNotEmpty()
  @IsString()
  content: string;

  @FromBody()
  @IsOptional()
  @IsString()
  coverImage?: string;

  @FromBody()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

// 更新新闻
export class UpdateNewsReqDTO {
  @FromBody()
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @FromBody()
  @IsOptional()
  @IsString()
  title?: string;

  @FromBody()
  @IsOptional()
  @IsString()
  summary?: string;

  @FromBody()
  @IsOptional()
  @IsString()
  content?: string;

  @FromBody()
  @IsOptional()
  @IsString()
  coverImage?: string;

  @FromBody()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

// 删除新闻
export class DeleteNewsReqDTO {
  @FromBody()
  @IsNotEmpty()
  @IsNumber()
  id: number;
}

// 获取单个新闻详情
export class GetNewsDetailResDTO {
  id: number;
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  isPublished: boolean;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: UpdatedAdmin;
  viewCount?: number;
}

// 获取新闻列表
export class GetNewsListResDTO {
  rows: GetNewsDetailResDTO[];
}

// 获取新闻详情请求
export class GetNewsReqDTO {
  @FromBody()
  @IsNotEmpty()
  @IsNumber()
  id: number;
}

// 分页获取已发布新闻请求
export class GetPublishedNewsListReqDTO {
  @FromBody()
  @IsNotEmpty()
  @IsNumber()
  page: number;

  @FromBody()
  @IsNotEmpty()
  @IsNumber()
  pageSize: number;
}

// 分页获取已发布新闻响应
export class GetPublishedNewsListResDTO {
  rows: GetNewsDetailResDTO[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
