import { FromBody, IsFile } from 'bwcx-common';
import { MediaTypeEnum } from '../../enums/media-type.enum';
import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';

export interface UpdatedAdmin {
  id: number;
  username: string;
  avatar: string;
}

// Multer 文件类型定义
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer?: any; // Buffer 类型
  path?: string;
  filename?: string;
}

export class UploadMediaReqDTO {
  @FromBody()
  @IsFile()
  file: UploadedFile;

  @FromBody()
  @IsEnum(MediaTypeEnum)
  type: MediaTypeEnum;

  @FromBody()
  @IsOptional()
  @IsString()
  alt?: string;
}

export class GetMediaListReqDTO {
  @FromBody()
  @IsEnum(MediaTypeEnum)
  type: MediaTypeEnum;

  @FromBody()
  @IsOptional()
  @IsNumber()
  page?: number;

  @FromBody()
  @IsOptional()
  @IsNumber()
  pageSize?: number;
}

export class GetMediaByIdReqDTO {
  @FromBody()
  @IsNumber()
  id: number;
}

export class DeleteMediaReqDTO {
  @FromBody()
  @IsNumber()
  id: number;
}

export class UpdateMediaReqDTO {
  @FromBody()
  @IsNumber()
  id: number;

  @FromBody()
  @IsOptional()
  @IsString()
  alt?: string;
}

export class MediaDetailResDTO {
  id: number;
  path: string;
  type: MediaTypeEnum;
  alt?: string;
  active: boolean;
  size: number;
  createdAt: Date;
  updatedAt: Date;
  uploadedBy?: UpdatedAdmin;
}

export class GetMediaResDTO {
  rows: {
    id: number;
    path: string;
    type: MediaTypeEnum;
    alt?: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    updatedBy: Object;
  }[];
  total: number;
}
