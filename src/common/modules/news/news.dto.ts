import { UpdatedAdmin } from './../admin/admin.dto';
import { FromBody } from "bwcx-common";
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsDateString } from "class-validator";

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
  categoryId?: number;
  categoryName?: string;
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

  @FromBody()
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @FromBody()
  @IsOptional()
  @IsDateString()
  publishedAt?: string;
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

  @FromBody()
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @FromBody()
  @IsOptional()
  @IsDateString()
  publishedAt?: string;
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
  categoryId?: number;
  categoryName?: string;
}

// 获取新闻列表
export class GetNewsListResDTO {
  rows: GetNewsDetailResDTO[];
}

// 获取所有新闻请求（管理员用，支持分页）
export class GetAllNewsReqDTO {
  @FromBody()
  @IsOptional()
  @IsNumber()
  page?: number;

  @FromBody()
  @IsOptional()
  @IsNumber()
  pageSize?: number;
}

// 获取所有新闻响应（管理员用，支持分页）
export class GetAllNewsResDTO {
  rows: GetNewsDetailResDTO[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
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

// ==================== 栏目相关 DTO ====================

// 栏目项 VO
export interface NewsCategoryVO {
  id: number;
  name: string;
  description?: string;
  coverImage?: string;
  order: number;
  isVisible: boolean;
  newsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// 创建栏目请求
export class CreateNewsCategoryReqDTO {
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
  coverImage?: string;

  @FromBody()
  @IsOptional()
  @IsNumber()
  order?: number;

  @FromBody()
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}

// 更新栏目请求
export class UpdateNewsCategoryReqDTO {
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
  coverImage?: string;

  @FromBody()
  @IsOptional()
  @IsNumber()
  order?: number;

  @FromBody()
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}

// 删除栏目请求
export class DeleteNewsCategoryReqDTO {
  @FromBody()
  @IsNotEmpty()
  @IsNumber()
  id: number;
}

// 获取单个栏目请求
export class GetNewsCategoryReqDTO {
  @FromBody()
  @IsNotEmpty()
  @IsNumber()
  id: number;
}

// 获取单个栏目响应
export class GetNewsCategoryResDTO implements NewsCategoryVO {
  id: number;
  name: string;
  description?: string;
  coverImage?: string;
  order: number;
  isVisible: boolean;
  newsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// 获取所有栏目列表响应
export class GetAllNewsCategoriesResDTO {
  rows: NewsCategoryVO[];
}

// 获取可见栏目列表响应（前台用）
export class GetVisibleNewsCategoriesResDTO {
  rows: NewsCategoryVO[];
}

// 设置新闻栏目请求
export class SetNewsCategoryReqDTO {
  @FromBody()
  @IsNotEmpty()
  @IsNumber()
  newsId: number;

  @FromBody()
  @IsOptional()
  @IsNumber()
  categoryId?: number; // null 表示移除栏目
}

// 批量设置新闻栏目请求
export class BatchSetNewsCategoryReqDTO {
  @FromBody()
  @IsNotEmpty()
  newsIds: number[];

  @FromBody()
  @IsOptional()
  @IsNumber()
  categoryId?: number; // null 表示移除栏目
}

// 按栏目获取新闻列表请求
export class GetNewsByCategoryReqDTO {
  @FromBody()
  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  @FromBody()
  @IsOptional()
  @IsNumber()
  page?: number;

  @FromBody()
  @IsOptional()
  @IsNumber()
  pageSize?: number;
}

// 按栏目获取新闻列表响应
export class GetNewsByCategoryResDTO {
  category: NewsCategoryVO;
  rows: GetNewsDetailResDTO[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// 获取栏目预览数据（前台大卡片用）
export class GetCategoryPreviewReqDTO {
  @FromBody()
  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  @FromBody()
  @IsOptional()
  @IsNumber()
  cardNewsCount?: number; // 卡片展示的新闻数量，默认3

  @FromBody()
  @IsOptional()
  @IsNumber()
  listNewsCount?: number; // 列表展示的新闻数量，默认5
}

// 获取栏目预览数据响应
export class GetCategoryPreviewResDTO {
  category: NewsCategoryVO;
  cardNews: GetNewsDetailResDTO[]; // 左侧卡片新闻
  listNews: GetNewsDetailResDTO[]; // 右侧列表新闻
  totalNewsCount: number; // 该栏目总新闻数
}

// 获取所有栏目预览数据响应（首页用）
export class GetAllCategoriesPreviewResDTO {
  categories: GetCategoryPreviewResDTO[];
}
