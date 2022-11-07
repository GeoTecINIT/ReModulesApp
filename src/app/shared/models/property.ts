export class Property extends Object {
  constructor(
    public rc: string,
    public address: string,
    public floor: string,
    public locInt: string,
    public surfaceCons: string,
    public postalCode: string,
    public province: string,
    public town: string,
    public yearConstruction: string,
    public type: string,
    public completeAddress: string,
    public use: string,
    public surfaceGraph: string,
    public participation: string,
    public image: any,
    public latlng: { lng: any | number; lat: any },
    public block: string,
    public stair: string,
    public door: string,
  ) {
    super();
  }
}
