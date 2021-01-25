export class User extends Object {

  public uid: string;
  public name: string;
  public email: string;
  public organizations: string[];
  public id: string;

  constructor(public user = null) {
    super();
    if (user) {
      this.uid = user.uid != null ? user.uid : user.uid != null ? user.uid : '';
      this.email = user.email != null ? user.email : '';
      this.name = user.displayName != null ? user.displayName : user.name != null ? user.name : '';
    }
  }
}
