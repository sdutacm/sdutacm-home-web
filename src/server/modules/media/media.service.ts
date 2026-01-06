import { Service, InjectCtx, RequestContext } from 'bwcx-ljsm';
import appDataSource from '@server/db';
import { UploadMediaReqDTO, MediaResDTO } from '@common/modules/media/media.dto';
import { Media } from '@server/db/entity/media';

@Service()
export default class MediaService {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
  ) {}

  /** methods */
  public async uploadMedia(data: UploadMediaReqDTO): Promise<MediaResDTO> {
    const mediaRepo = appDataSource.getRepository(Media);

    // TODO: 实现文件上传逻辑，保存文件到服务器
    // const filePath = await this.saveFile(data.file, data.fileName);

    const media = mediaRepo.create({
      path: data.fileName, // 这里应该是上传后的实际路径
      type: data.type,
      alt: data.alt,
      active: true,
    });

    await mediaRepo.save(media);

    return {
      id: media.id,
      path: media.path,
      type: media.type,
      alt: media.alt,
      active: media.active,
      createdAt: media.createdAt,
    };
  }

  public async getMediaList(type?: string): Promise<MediaResDTO[]> {
    const mediaRepo = appDataSource.getRepository(Media);

    const query = mediaRepo.createQueryBuilder('media');

    if (type) {
      query.where('media.type = :type', { type });
    }

    query.orderBy('media.createdAt', 'DESC');

    const medias = await query.getMany();

    return medias.map(media => ({
      id: media.id,
      path: media.path,
      type: media.type,
      alt: media.alt,
      active: media.active,
      createdAt: media.createdAt,
    }));
  }

  public async getMediaById(id: number): Promise<MediaResDTO | null> {
    const mediaRepo = appDataSource.getRepository(Media);
    const media = await mediaRepo.findOneBy({ id });

    if (!media) {
      return null;
    }

    return {
      id: media.id,
      path: media.path,
      type: media.type,
      alt: media.alt,
      active: media.active,
      createdAt: media.createdAt,
    };
  }

  public async deleteMedia(id: number): Promise<void> {
    const mediaRepo = appDataSource.getRepository(Media);
    await mediaRepo.delete(id);
  }
}
