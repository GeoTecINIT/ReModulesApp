export class ScoreSystem extends Object {
  constructor(
    public scoreChartCode: string,
    public demand: number,
    public finalEnergy: number,
    public primaryEnergy: number,
    public emissions: number,
    public system: string
  ) {
    super();
  }
}
