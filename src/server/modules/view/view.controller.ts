import { Controller, Get, UseGuards, Param } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import { UseClientRoutes, PrimaryRenderMethod, OverrideView } from 'bwcx-client-vue/server';
import { RenderMethodKind } from 'bwcx-client-vue';
import ViewService from './view.service';
import { HtmlResponse } from '@server/response-handlers/html.response-handler';
import LoginGuard from '@server/guards/login';
import StatsService from '@server/modules/stats/stats.service';

@Controller('', { priority: -100 })
@HtmlResponse()
export default class ViewController {
  public constructor(
    @Inject()
    private readonly service: ViewService,
    @Inject()
    private readonly statsService: StatsService,
  ) {}

  // 可选重写指定某个前端路由的逻辑
  @OverrideView('DemoDetail')
  public demoDetailView(@PrimaryRenderMethod() renderMethod: RenderMethodKind) {
    console.log('DemoDetail has been overridden. The original render method is:', renderMethod);
    return this.service.render(renderMethod || RenderMethodKind.CSR);
  }

  @OverrideView('HomeView')
  public async homeView(@PrimaryRenderMethod() renderMethod: RenderMethodKind) {
    this.statsService.incrementPageViewCount('home').catch(err => {
      console.error('Failed to increment home page view count:', err);
    });
    return this.service.render(renderMethod || RenderMethodKind.SSR);
  }

  @UseClientRoutes()
  public autoWiredView(@PrimaryRenderMethod() renderMethod: RenderMethodKind) {
    console.log('autoWiredView renderMethod:', renderMethod);
    return this.service.render(renderMethod || RenderMethodKind.CSR);
  }
}
