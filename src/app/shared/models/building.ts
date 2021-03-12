import {Property} from './property';

export interface Building  {
  country: string;
  climateZone: string;
  year: string;
  region: string;
  address: string;
  coordinates: { lng: any | number; lat: any };
  properties: Property[];
  rc: string;
  use: string;
  surface: string;
}
export class Building extends Object {
  constructor(
    public country: string,
    public climateZone: string,
    public year: string,
    public region: string,
    public address: string,
    public coordinates: { lng: any | number; lat: any },
    public properties: Property[],
    public rc: string,
    public use: string,
    public surface: string,
  ) {
    super();
  }
}
