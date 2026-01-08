import { Controller, Get, UseGuards } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import { UseClientRoutes, PrimaryRenderMethod, OverrideView } from 'bwcx-client-vue/server';
import { RenderMethodKind } from 'bwcx-client-vue';
import ViewService from './view.service';
import { HtmlResponse } from '@server/response-handlers/html.response-handler';
import { clientRoutesMap } from '@common/router/client-routes';
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
    // 可以重写逻辑，如有条件的重定向等。不会进入到下面的 `autoWiredView`
    console.log('DemoDetail has been overridden. The original render method is:', renderMethod);
    return this.service.render(renderMethod || RenderMethodKind.CSR);
  }

  @OverrideView('AdminView')
  @UseGuards(LoginGuard)
  public adminView(@PrimaryRenderMethod() renderMethod: RenderMethodKind) {
    // 可以重写逻辑，如有条件的重定向等。不会进入到下面的 `autoWiredView`
    console.log('AdminView has been overridden. The original render method is:', renderMethod);
    return this.service.render(renderMethod || RenderMethodKind.CSR);
  }


  @UseClientRoutes()
  public autoWiredView(@PrimaryRenderMethod() renderMethod: RenderMethodKind) {
    // 如果装饰器没有注入 renderMethod，从路由映射中查找
    // if (!renderMethod) {
    //   const currentPath = this.service['ctx'].url.split('?')[0]; // 移除查询参数

    //   // 按路径长度降序排序，确保先匹配更具体的路径
    //   const routes = Array.from(clientRoutesMap.values()).sort((a, b) =>
    //     b.path.length - a.path.length
    //   );

    //   const route = routes.find(r => {
    //     if (r.path === '/') {
    //       return currentPath === '/';
    //     }
    //     return currentPath === r.path || currentPath.startsWith(r.path + '/');
    //   });

    //   renderMethod = route?.renderMethod || RenderMethodKind.SSR;
    // }
    console.log('autoWiredView renderMethod:', renderMethod);
    return this.service.render(renderMethod || RenderMethodKind.CSR);
  }
}
