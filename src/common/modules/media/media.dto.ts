import { UpdatedAdmin } from './../admin/admin.dto';
import { FromBody, IsFile } from 'bwcx-common';
import { MediaTypeEnum } from '../../enums/media-type.enum';
import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';

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
  file: any;

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
  updatedBy?: UpdatedAdmin;
}

export class GetMediaListResDTO {
  rows: MediaDetailResDTO[];
  total: number;
}

// ==================== 分片上传相关 ====================

// 初始化分片上传
export class InitChunkUploadReqDTO {
  @FromBody()
  @IsString()
  filename: string;

  @FromBody()
  @IsNumber()
  fileSize: number;

  @FromBody()
  @IsEnum(MediaTypeEnum)
  type: MediaTypeEnum;

  @FromBody()
  @IsOptional()
  @IsString()
  alt?: string;

  @FromBody()
  @IsNumber()
  totalChunks: number;
}

export class InitChunkUploadResDTO {
  uploadId: string;
  chunkSize: number;
}

// 上传分片
export class UploadChunkReqDTO {
  @FromBody()
  @IsString()
  uploadId: string;

  @FromBody()
  @IsString()
  chunkIndex: string;

  @FromBody()
  @IsFile()
  chunk: any;
}

export class UploadChunkResDTO {
  chunkIndex: number;
  received: boolean;
}

// 完成分片上传
export class CompleteChunkUploadReqDTO {
  @FromBody()
  @IsString()
  uploadId: string;
}

export class CompleteChunkUploadResDTO extends MediaDetailResDTO {}

