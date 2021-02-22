export class Envelope extends Object {
  constructor(
    public typeConstruction: string,
    public description: string,
    public uValue: string,
    public picture: string,
    public componentType: string
  ) {
    super();
  }
}
