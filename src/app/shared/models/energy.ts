import {ScoreSystem} from './scoreSystem';

export class Energy extends Object {
  constructor(
    public energyScoreCode: string,
    public emissionRanking: string,
    public consumptionRanking: string,
    public scoreSystem: ScoreSystem[]
  ) {
    super();
  }
}
