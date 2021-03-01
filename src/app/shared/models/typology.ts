import {Envelope} from './envelope';

export class Typology extends Object {
  constructor(
    public categoryCode: string,
    public categoryName: string,
    public yearCode: string,
    public picName: string,
    public zone: string,
    public country: string,
    public enveloped: Envelope[]
  ) {
    super();
  }
}
