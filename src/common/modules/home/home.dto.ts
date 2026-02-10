import { IsString } from 'class-validator';
import { GetProjectPreviewResDTO } from '../project/project.dto';
import { GetNewsPreviewResDTO } from '../news/news.dto';
import { MediaTypeEnum } from '../../enums/media-type.enum';

export class GetHomeDataResDTO {
  title: string;

  slogan: string;

  description: string;

  logo: {
    id: number;
    path: string;
    type: MediaTypeEnum;
    alt?: string;
    active: boolean;
    createdAt: Date;
  } | null;

  newsPreview: GetNewsPreviewResDTO[];

  projectsPreview: GetProjectPreviewResDTO[];
}

export class GetHomeNewsResDTO {
  rows: GetNewsPreviewResDTO[];
}
