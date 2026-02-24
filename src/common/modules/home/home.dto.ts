import { IsString } from 'class-validator';
import { GetProjectPreviewResDTO } from '../project/project.dto';
import { GetNewsPreviewResDTO } from '../news/news.dto';

export class GetHomeDataResDTO {
  title: string;

  slogan: string;

  description: string;

  logoPath: string;

  newsPreview: GetNewsPreviewResDTO[];

  projectsPreview: GetProjectPreviewResDTO[];
}

export class GetHomeNewsResDTO {
  rows: GetNewsPreviewResDTO[];
}
