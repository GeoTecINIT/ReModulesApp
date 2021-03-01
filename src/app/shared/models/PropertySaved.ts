export interface PropertySaved  {
     address: string;
     lat: string;
     lng: string;
     rc: string;
     surface: string;
     use: string;
     year: string;
     user: [];
}

export class PropertySaved extends Object {
  constructor(
    public address: string,
    public lat: string,
    public lng: string,
    public rc: string,
    public surface: string,
    public use: string,
    public year: string,
    public user: []
  ) {
    super();
  }
}
