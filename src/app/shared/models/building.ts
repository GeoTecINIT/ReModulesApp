import {Property} from './property';
import {Typology} from './typology';

export interface Building  {
  country: string;
  climateZone: string;
  climateSubZone: string;
  year: string;
  region: string;
  provinceCode: string;
  address: string;
  altitudeCode: string;
  coordinates: { lng: any | number; lat: any };
  properties: Property[];
  rc: string;
  use: string;
  surface: number;
  typology: Typology;
}
export class Building extends Object {
  constructor(
    public country: string,
    public climateZone: string,
    public climateSubZone: string,
    public year: string,
    public region: string,
    public provinceCode: string,
    public address: string,
    public altitudeCode: string,
    public coordinates: { lng: any | number; lat: any },
    public properties: Property[],
    public rc: string,
    public use: string,
    public surface: number,
    public typology: Typology
  ) {
    super();
  }
}
