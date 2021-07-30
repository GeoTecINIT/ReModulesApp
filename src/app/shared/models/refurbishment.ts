import {Envelope} from './envelope';
import {System} from './system';
import {SystemType} from './systemType';

export class Refurbishment extends Object {
  constructor(
    public envelopedStandard: Envelope[],
    public envelopedAdvanced: Envelope[],
    public systemStandard: SystemType,
    public systemAdvanced: SystemType
  ) {
    super();
  }
}
