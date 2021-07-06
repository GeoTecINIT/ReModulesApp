export class System extends Object {
  constructor(
    public name: string,
    public systemCode: string,
    public description: string,
    public descriptionOriginal: string,
    public picture: string
  ) {
    super();
  }
}
