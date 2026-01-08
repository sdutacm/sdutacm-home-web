import { FromBody } from "bwcx-common";
import { IsNotEmpty, IsOptional, IsNumber, IsArray, ArrayMaxSize } from "class-validator";

export class GetGlobalConfigResDTO {
  title: string;

  slogan: string;

  description: string;

  logoUrl: string;

  homeNewsPreviewIds: number[];

  homeProjectsPreviewIds: number[];

  createdAt: Date;

  updatedAt: Date;
}

export class UpdateGlobalConfigReqDTO {
  @FromBody()
  @IsNotEmpty()
  title: string;

  @FromBody()
  @IsNotEmpty()
  slogan: string;

  @FromBody()
  @IsNotEmpty()
  description: string;

  @FromBody()
  @IsOptional()
  @IsNumber()
  logoId?: number;  // 可选字段，如果不传则保持原有 logo 不变

  @FromBody()
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  homeNewsPreviewIds?: number[];  // 首页新闻预览ID列表，最多5条

  @FromBody()
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  homeProjectsPreviewIds?: number[];  // 首页项目预览ID列表，最多3条
}
