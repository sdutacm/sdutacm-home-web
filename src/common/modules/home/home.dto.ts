import { IsString } from 'class-validator';
import { GetProjectPreviewResDTO } from '../project/project.dto';
import { GetNewsPreviewResDTO } from '../news/news.dto';
import { GetLogoResDTO } from '../logo/logo.dto';

export class GetHomeDataResDTO {
  title: string;

  slogan: string;

  description: string;

  logo: GetLogoResDTO;

  newsPreview: GetNewsPreviewResDTO[];

  projectsPreview: GetProjectPreviewResDTO[];
}
