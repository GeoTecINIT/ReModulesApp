import {Envelope} from './envelope';
import {SystemType} from './systemType';
import {Energy} from './energy';

export class Typology extends Object {
  constructor(
    public categoryCode: string,
    public categoryName: string,
    public yearCode: string,
    public picName: string,
    public zone: string,
    public country: string,
    public buildingCode: string,
    public enveloped: Envelope[],
    public system: SystemType[],
    public energy: Energy
  ) {
    super();
  }
}
