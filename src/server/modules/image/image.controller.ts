import { InjectCtx, RequestContext, Data, Contract, Post } from 'bwcx-ljsm';
import { ApiController } from '@server/decorators';
import { Api } from 'bwcx-api';
import { Inject } from 'bwcx-core';
import { UploadImageReqDTO } from '@common/modules/image/image.dto';
import ImageService from './image.service';

@ApiController()
export default class ImageController {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
    @Inject()
    private readonly imageService: ImageService,
  ) {}

  /** routes */
  @Api.Summary('图片上传接口')
  @Post('/uploadImage')
  @Contract(UploadImageReqDTO, null)
  public async uploadImage(@Data() data: UploadImageReqDTO): Promise<void> {
    await this.imageService.uploadImage(data);
  }
}
