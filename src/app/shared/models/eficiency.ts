
export class Efficiency extends Object {
  constructor(
    public level_improvement: string,
    public energy_demand: number,
    public recovered_heat_ventilation: number,
    public fossil_fuels: number,
    public biomass: number,
    public electricity: number,
    public district_heating: number,
    public other: number,
    public produced_electricity: number,
    public renewable_p_energy: number,
    public total_p_energy: number,
    public non_renewable_pe: number,
    public renewable_pe_demand: number,
    public CO2_emissions: number,
    public energy_costs: number
  ) {
    super();
  }
}
