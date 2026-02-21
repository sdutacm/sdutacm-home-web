import { Controller, InjectCtx, RequestContext, Post, Data, Contract } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import { ApiController } from '@server/decorators';
import { Api } from 'bwcx-api';
import MediaService from './media.service';
import {
  GetMediaListReqDTO,
  GetMediaListResDTO,
  UploadMediaReqDTO,
  DeleteMediaReqDTO,
  GetMediaByIdReqDTO,
  MediaDetailResDTO,
  UpdateMediaReqDTO,
  InitChunkUploadReqDTO,
  InitChunkUploadResDTO,
  UploadChunkReqDTO,
  UploadChunkResDTO,
  CompleteChunkUploadReqDTO,
  CompleteChunkUploadResDTO,
} from '@common/modules/media/media.dto';

@ApiController()
export default class MediaController {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
    @Inject()
    private readonly mediaService: MediaService,
  ) {}

  /** routes */
  @Api.Summary('获取媒体列表')
  @Post('/getMediaList')
  @Contract(GetMediaListReqDTO, GetMediaListResDTO)
  public async getMediaList(@Data() data: GetMediaListReqDTO): Promise<GetMediaListResDTO> {
    return await this.mediaService.getMediaList(data.type, data.page, data.pageSize);
  }

  @Api.Summary('上传媒体文件')
  @Post('/uploadMedia')
  @Contract(UploadMediaReqDTO, MediaDetailResDTO)
  public async uploadMedia(@Data() data: UploadMediaReqDTO): Promise<MediaDetailResDTO> {
    return await this.mediaService.uploadMedia(data);
  }

  @Api.Summary('获取媒体详情')
  @Post('/getMediaById')
  @Contract(GetMediaByIdReqDTO, MediaDetailResDTO)
  public async getMediaById(@Data() data: GetMediaByIdReqDTO): Promise<MediaDetailResDTO> {
    return await this.mediaService.getMediaById(data.id);
  }

  @Api.Summary('更新媒体信息')
  @Post('/updateMedia')
  @Contract(UpdateMediaReqDTO, null)
  public async updateMedia(@Data() data: UpdateMediaReqDTO): Promise<void> {
    await this.mediaService.updateMedia(data.id, data.alt);
  }

  @Api.Summary('删除媒体文件')
  @Post('/deleteMedia')
  @Contract(DeleteMediaReqDTO, null)
  public async deleteMedia(@Data() data: DeleteMediaReqDTO): Promise<void> {
    await this.mediaService.deleteMedia(data.id);
  }

  // ==================== 分片上传接口 ====================

  @Api.Summary('初始化分片上传')
  @Post('/initChunkUpload')
  @Contract(InitChunkUploadReqDTO, InitChunkUploadResDTO)
  public async initChunkUpload(@Data() data: InitChunkUploadReqDTO): Promise<InitChunkUploadResDTO> {
    return await this.mediaService.initChunkUpload(data);
  }

  @Api.Summary('上传分片')
  @Post('/uploadChunk')
  @Contract(UploadChunkReqDTO, UploadChunkResDTO)
  public async uploadChunk(@Data() data: UploadChunkReqDTO): Promise<UploadChunkResDTO> {
    return await this.mediaService.uploadChunk(data);
  }

  @Api.Summary('完成分片上传')
  @Post('/completeChunkUpload')
  @Contract(CompleteChunkUploadReqDTO, CompleteChunkUploadResDTO)
  public async completeChunkUpload(@Data() data: CompleteChunkUploadReqDTO): Promise<CompleteChunkUploadResDTO> {
    return await this.mediaService.completeChunkUpload(data);
  }
}
