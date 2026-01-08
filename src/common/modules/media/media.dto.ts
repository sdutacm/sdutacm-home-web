import { FromBody, IsFile } from 'bwcx-common';
import { MediaTypeEnum } from '../../enums/media-type.enum';
import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';

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

export class GetMediaResDTO {
  rows: {
    id: number;
    path: string;
    type: MediaTypeEnum;
    alt?: string;
    active: boolean;
    createdAt: Date;
  }[];
}
