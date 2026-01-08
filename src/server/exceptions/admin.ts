import { Exception } from "bwcx-ljsm";

export default class AdminGuardNotPassException extends Exception {
  public constructor() {
    super("LoginException: Admin not logged in");
    this.name = "LoginException";
  }
}
