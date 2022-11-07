import {System} from './system';

export class SystemType extends Object {
  constructor(
    public codeSystemMeasure: string,
    public description: string,
    public originalDescription: string,
    public systems: System[]
  ) {
    super();
  }
}
