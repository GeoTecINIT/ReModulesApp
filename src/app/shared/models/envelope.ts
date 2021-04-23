export class Envelope extends Object {
  constructor(
    public envelopedCode: string,
    public typeConstruction: string,
    public description: string,
    public uValue: string,
    public picture: string,
    public componentType: string
  ) {
    super();
  }
}
