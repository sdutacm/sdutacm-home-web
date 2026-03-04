import { FromBody } from 'bwcx-common';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

// 每日浏览数据项
export interface DailyViewItem {
  date: string;
  viewCount: number;
}

// 页面浏览统计项
export interface PageViewItem {
  pageKey: string;
  viewCount: number;
}

// 获取概览统计响应
export class GetOverviewStatsResDTO {
  // 访问统计
  totalHomeViews: number;
  todayHomeViews: number;
  // 新闻统计
  totalNewsCount: number;
  publishedNewsCount: number;
  draftNewsCount: number;
  totalNewsViews: number;
  // 项目统计
  totalProjectCount: number;
  featuredProjectCount: number;
  // 媒体统计
  totalMediaCount: number;
  activeMediaCount: number;
  totalMediaSize: number;
  // 媒体类型统计
  logoCount: number;
  imageCount: number;
  audioCount: number;
  videoCount: number;
  // 管理员统计
  totalAdminCount: number;
  activeAdminCount: number;
}

// 获取每日浏览统计请求
export class GetDailyViewStatsReqDTO {
  @FromBody()
  @IsNotEmpty()
  @IsString()
  pageKey: string;

  @FromBody()
  @IsOptional()
  @IsNumber()
  days?: number;
}

// 获取每日浏览统计响应
export class GetDailyViewStatsResDTO {
  rows: DailyViewItem[];
}

// 获取所有页面浏览统计响应
export class GetAllPageViewStatsResDTO {
  rows: PageViewItem[];
}

// 记录页面访问请求
export class RecordPageViewReqDTO {
  @FromBody()
  @IsNotEmpty()
  @IsString()
  pageKey: string;
}
