import { IsString } from 'class-validator';
import { GetProjectPreviewResDTO } from '../project/project.dto';
import { GetNewsPreviewResDTO } from '../news/news.dto';
import { MediaResDTO } from '../media/media.dto';

export class GetHomeDataResDTO {
  title: string;

  slogan: string;

  description: string;

  logo: MediaResDTO;

  newsPreview: GetNewsPreviewResDTO[];

  projectsPreview: GetProjectPreviewResDTO[];
}
