import {Envelope} from './envelope';
import {SystemType} from './systemType';
import {Energy} from './energy';

export class Typology extends Object {
  constructor(
    public categoryCode: string,
    public categoryName: string,
    public categoryPicCode: string,
    public addParameterDescription: string,
    public yearCode: string,
    public picName: string,
    public buildingCode: string,
    public enveloped: Envelope[],
    public system: SystemType,
    public energy: Energy
  ) {
    super();
  }
}
