
import { Controller, InjectCtx, RequestContext, UseGuards } from 'bwcx-ljsm';
import { UseClientRoutes } from 'bwcx-client-vue/server';
import { Inject } from 'bwcx-core';
import LoginGuard from '@server/guards/login';
import ViewService from '@server/modules/view/view.service';
import { RenderMethodKind } from 'bwcx-client-vue';
import { HtmlResponse } from '@server/response-handlers/html.response-handler';

@Controller('/admin(/.*)?',{ priority: -90 })
@UseGuards(LoginGuard)
@HtmlResponse()
export default class AdminController {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
    @Inject()
    private readonly service: ViewService
  ) {}

  /** routes */
  @UseClientRoutes()
  public autoWiredView() {
    return this.service.render(RenderMethodKind.CSR);
  }
}

