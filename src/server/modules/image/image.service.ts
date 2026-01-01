import { Service, InjectCtx, RequestContext } from 'bwcx-ljsm';
import appDataSource from '@server/db';
import { UploadImageReqDTO } from '@common/modules/image/image.dto';
import { Image } from '@server/db/entity/image';

@Service()
export default class ImageService  {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
  ) {}

  /** methods */
  public async uploadImage(data: UploadImageReqDTO): Promise<void> {
    const imageRepo = appDataSource.getRepository(Image);
    
  }
}

