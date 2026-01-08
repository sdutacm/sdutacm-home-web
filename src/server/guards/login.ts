import { Guard, IBwcxGuard, RequestContext } from 'bwcx-ljsm';

@Guard()
export default class LoginGuard implements IBwcxGuard {
  public async canPass(ctx: RequestContext) {
    const isLoggedIn = ctx.session?.admin != null;
    return isLoggedIn;
  }
}

