import { Controller, Get, UseGuards } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import { UseClientRoutes, PrimaryRenderMethod, OverrideView } from 'bwcx-client-vue/server';
import { RenderMethodKind } from 'bwcx-client-vue';
import ViewService from './view.service';
import { HtmlResponse } from '@server/response-handlers/html.response-handler';
import LoginGuard from '@server/guards/login';

@Controller('', { priority: -100 })
@HtmlResponse()
export default class ViewController {
  public constructor(
    @Inject()
    private readonly service: ViewService,
  ) {}

  // 可选重写指定某个前端路由的逻辑
  @OverrideView('DemoDetail')
  public demoDetailView(@PrimaryRenderMethod() renderMethod: RenderMethodKind) {
    console.log('DemoDetail has been overridden. The original render method is:', renderMethod);
    return this.service.render(renderMethod || RenderMethodKind.CSR);
  }

  @OverrideView('AdminView')
  @UseGuards(LoginGuard)
  public adminView(@PrimaryRenderMethod() renderMethod: RenderMethodKind) {
    console.log('AdminView has been overridden. The original render method is:', renderMethod);
    return this.service.render(renderMethod || RenderMethodKind.CSR);
  }

  @UseClientRoutes()
  public autoWiredView(@PrimaryRenderMethod() renderMethod: RenderMethodKind) {
    console.log('autoWiredView renderMethod:', renderMethod);
    return this.service.render(renderMethod || RenderMethodKind.CSR);
  }
}
