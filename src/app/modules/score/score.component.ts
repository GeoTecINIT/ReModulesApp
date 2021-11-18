import {AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Building} from '../../shared/models/building';
import * as Highcharts from 'highcharts';
import {GlobalConstants} from '../../shared/GlobalConstants';
import {AngularFireAuth} from '@angular/fire/auth';
import {User} from '../../shared/models/user';
import {UserService} from '../../core/authentication/user.service';
import {Envelope} from '../../shared/models/envelope';
import {SystemType} from '../../shared/models/systemType';
import {TypologyService} from '../../core/typology/typology.service';
import {System} from '../../shared/models/system';
import {Efficiency} from '../../shared/models/eficiency';

@Component({
  selector: 'app-score',
  templateUrl: './score.component.html',
  styleUrls: ['./score.component.scss']
})
export class ScoreComponent implements OnInit, AfterViewInit, OnChanges {
  view: any[] = [700, 400];

  isUserLogged: boolean;
  searchFromHistory: boolean;
  currentUser: User = new User();

  // statistics
  DemandChartActual: typeof Highcharts = Highcharts;
  chartOptionsDemandActual: Highcharts.Options;
  DemandChartStd: typeof Highcharts = Highcharts;
  chartOptionsDemandStd: Highcharts.Options;
  DemandChartAdv: typeof Highcharts = Highcharts;
  chartOptionsDemandAdv: Highcharts.Options;
  demandData: { total: number, other: number, heating: number, recovered: number};
  demandDataStd: { total: number, other: number, heating: number, recovered: number};
  demandDataAdv: { total: number, other: number, heating: number, recovered: number};

  FinalEnergyChartActual: typeof Highcharts = Highcharts;
  chartOptionsFinalEnergyActual: Highcharts.Options;
  FinalEnergyChartStd: typeof Highcharts = Highcharts;
  chartOptionsFinalEnergyStd: Highcharts.Options;
  FinalEnergyChartAdv: typeof Highcharts = Highcharts;
  chartOptionsFinalEnergyAdv: Highcharts.Options;
  finalEnergyData: { total: number, fossils: number, biomass: number, electricity: number, district: number, other: number, produced: number};
  finalEnergyDataStd: { total: number, fossils: number, biomass: number, electricity: number, district: number, other: number, produced: number};
  finalEnergyDataAdv: { total: number, fossils: number, biomass: number, electricity: number, district: number, other: number, produced: number};

  // options
  animations = true;
  envelopedToday: {floor: any, roof: any, wall: any, window: any, door: any, celling: any};
  envelopedStandard: {floor: any, roof: any, wall: any, window: any, door: any, celling: any};
  envelopedAdvanced: {floor: any, roof: any, wall: any, window: any, door: any, celling: any};
  systemsToday: {heating: any, water: any, ventilation: any, pv: any};
  systemsStandard: {heating: any, water: any, ventilation: any, pv: any};
  systemsAdvanced: {heating: any, water: any, ventilation: any, pv: any};

  dataChart: any[];
  @Input() building: Building;
  @Input() history: Building[];
  constructor(public afAuth: AngularFireAuth, private userService: UserService, private typologyService: TypologyService) {
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.isUserLogged = true;
        this.currentUser = new User(user);
      }
      else { this.isUserLogged = false; }
    });
    this.envelopedToday = {floor: null, roof: null, wall: null, window: null, door: null, celling: null};
    this.envelopedStandard = {floor: null, roof: null, wall: null, window: null, door: null, celling: null};
    this.envelopedAdvanced =  {floor: null, roof: null, wall: null, window: null, door: null, celling: null};
    this.systemsToday =  {heating: null, water: null, ventilation: null, pv: null};
    this.systemsStandard =  {heating: null, water: null, ventilation: null, pv: null};
    this.systemsAdvanced =  {heating: null, water: null, ventilation: null, pv: null};
    this.demandData = { total: 0, other: 0, heating: 0, recovered: 0};
    this.demandDataStd = { total: 0, other: 0, heating: 0, recovered: 0};
    this.demandDataAdv = { total: 0, other: 0, heating: 0, recovered: 0};
    this.finalEnergyData = { total: 0, fossils: 0, biomass: 0, electricity: 0, district: 0, other: 0, produced: 0};
    this.finalEnergyData = { total: 0, fossils: 0, biomass: 0, electricity: 0, district: 0, other: 0, produced: 0};
    this.finalEnergyData = { total: 0, fossils: 0, biomass: 0, electricity: 0, district: 0, other: 0, produced: 0};
  }

  ngOnInit(): void {

  }
  ngAfterViewInit(): void {
    if ( this.building.typology.energy ) {
      const elemEm: HTMLElement = document.getElementById('emissions');
      const color = this.building.typology.energy && GlobalConstants.colorsEmission[this.building.typology.energy.emissionRanking] ?
        GlobalConstants.colorsEmission[this.building.typology.energy.emissionRanking].color : 'white';
      elemEm.style.setProperty('--check-primary', color);
      elemEm.style.setProperty('--check-secondary', '1.25em solid ' + color);

      const elemCon: HTMLElement = document.getElementById('consumption');
      elemCon.style.setProperty('--check-primary', color);
      elemCon.style.setProperty('--check-secondary', '1.25em solid ' + color);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ( changes.building && changes.building.currentValue && changes.building.currentValue.typology &&
      changes.building.currentValue.typology.categoryCode ) {
      this.building = changes.building.currentValue;
      this.building.typology.enveloped.forEach( env => {
        this.addEnveloped(env.componentType, this.envelopedToday, env);
        this.building.typology.system.systems.forEach( sys => {
          switch (sys.name) {
            case 'Heating':
              this.systemsToday.heating = sys;
              break;
            case 'Water':
              this.systemsToday.water = sys;
              break;
            case 'Ventilation':
              this.systemsToday.ventilation = sys;
              break;
          }
        });
      });
      this.getRefurbishment();
      this.getSystemRefurbishment();
      this.getEfficiency();
    }
  }

  getRefurbishment(): void {
    this.typologyService.getRefurbishment(this.building.typology.categoryPicCode).subscribe( refurbishments => {
      Object.values(refurbishments).forEach( ref => {
        const envToAdd = new Envelope(ref.component_code, ref.measure.description_measure_type,
          ref.measure.description_measure_type,
          ref.measure.u_value, ref.measure.picture, ref.measure.component_type.name);
        if ( ref.improving_building.number_building_variant === '2') {
          this.building.refurbishment.envelopedStandard.push( envToAdd);
          this.addEnveloped(envToAdd.componentType, this.envelopedStandard, envToAdd);
        } else if (ref.improving_building.number_building_variant === '3' ) {
          this.building.refurbishment.envelopedAdvanced.push(envToAdd);
          this.addEnveloped(envToAdd.componentType, this.envelopedAdvanced, envToAdd);
        }
      });
    });
  }

  getSystemRefurbishment(): void {
    this.typologyService.getSystemRefurbishment(this.building.typology.categoryPicCode,
      this.building.typology.system.codeSystemMeasure).subscribe( systemRe => {
      Object.values(systemRe).forEach( ref => {
        const heating = new System( 'Heating',
          ref.heating.system_code, ref.heating.system_description,
          ref.heating.system_description_original, ref.heating.picture);
        const water = new System( 'Water',
          ref.water.system_code, ref.water.system_description,
          ref.water.system_description_original, ref.water.picture);
        const ventilation = new System( 'Ventilation',
          ref.ventilation.system_code, ref.ventilation.system_description,
          ref.ventilation.system_description_original, ref.ventilation.picture);
        if ( ref.level_improvement === 'Standard') {
          this.building.refurbishment.systemStandard = new SystemType(
            ref.code_system_measure, ref.system_measure.description_actual_conditions,
            ref.system_measure.original_description_aconditions, []);
          this.building.refurbishment.systemStandard.systems.push(heating);
          this.building.refurbishment.systemStandard.systems.push(water);
          this.building.refurbishment.systemStandard.systems.push(ventilation);
          this.systemsStandard.heating = heating;
          this.systemsStandard.water = water;
          this.systemsStandard.ventilation = ventilation;
        } else if (ref.level_improvement === 'Advanced' ) {
          this.building.refurbishment.systemAdvanced = new SystemType(
            ref.code_system_measure, ref.system_measure.description_actual_conditions,
            ref.system_measure.original_description_aconditions, []);
          this.building.refurbishment.systemAdvanced.systems.push(heating);
          this.building.refurbishment.systemAdvanced.systems.push(water);
          this.building.refurbishment.systemAdvanced.systems.push(ventilation);
          this.systemsAdvanced.heating = heating;
          this.systemsAdvanced.water = water;
          this.systemsAdvanced.ventilation = ventilation;
        }
      });
    });
  }

  getEfficiency(): void {
    this.typologyService.getEfficiency(this.building.typology.categoryPicCode,
      this.building.typology.system.codeSystemMeasure).subscribe( systemRe => {
      Object.values(systemRe).forEach( ref => {
        this.building.efficiency.push(new Efficiency(ref.level_improvement, +ref.energy_demand, +ref.recovered_heat_ventilation,
          +ref.fossil_fuels, +ref.biomass, +ref.electricity, +ref.district_heating, +ref.other, +ref.produced_electricity,
          +ref.renewable_p_energy, +ref.total_p_energy, +ref.non_renewable_pe,
          +ref.renewable_pe_demand, +ref.CO2_emissions, +ref.energy_costs));
      });
      this.prepareDataCharts();
    });
  }

  addEnveloped(type, enveloped, data): void {
    switch (type) {
      case 'Roof' :
        enveloped.roof = data;
        break;
      case 'Floor' :
        enveloped.floor = data;
        break;
      case 'Wall' :
        enveloped.wall = data;
        break;
      case 'Window' :
        enveloped.window = data;
        break;
      case 'Door' :
        enveloped.door = data;
        break;
      case 'Celling' :
        enveloped.celling = data;
        break;
    }
  }

  prepareDataCharts(): void {
    // { name: , type: 'column', data [];
    this.building.efficiency.forEach( eff => {
      this.dataDemandPerYear(eff);
      this.dataFinalEnergy(eff);
    });
  }

  dataDemandPerYear(eff): void {
    let totalAct = 0;
    let otherAct = 0;
    let heatingAct = 0;
    let recoverAct = 0;
    let label = '';
    if ( eff.level_improvement === 'Actual conditions') {
      const data = [];
      label = 'Actual conditions';
      totalAct = eff.total_p_energy ;
      otherAct = ( Math.round(( eff.total_p_energy - eff.energy_demand) * 100) ) / 100;
      heatingAct = ( Math.round(eff.energy_demand * 100) ) / 100;
      recoverAct = ( Math.round( eff.recovered_heat_ventilation * 100) ) / 100;
      this.demandData.total = eff.total_p_energy;
      this.demandData.other = ( otherAct / totalAct ) * 100;
      this.demandData.heating = ( heatingAct / totalAct ) * 100;
      this.demandData.recovered = ( recoverAct / totalAct ) * 100;
      data.push({name: 'Other system demand', type: 'column', data: [otherAct]});
      data.push({name: 'Heating demand', type: 'column', data: [heatingAct]});
      data.push({name: 'Recovered Heat', type: 'column', data: [recoverAct]});
      this.chartOptionsDemandActual = this.buildStackedChartPerYear(data, label);
    } else if ( eff.level_improvement === 'Standard') {
      const data = [];
      label = 'Standard';
      const totalStd = eff.total_p_energy ;
      const otherStd = ( Math.round(( eff.total_p_energy - eff.energy_demand) * 100) ) / 100;
      const heatingStd = ( Math.round( eff.energy_demand * 100) ) / 100;
      const recoveredStd = ( Math.round(eff.recovered_heat_ventilation * 100) ) / 100;
      this.demandDataStd.total = ( 1 - ( totalAct / totalStd)) * 100;
      this.demandDataStd.heating = ( 1 - ( heatingAct / heatingStd)) * 100;
      this.demandDataStd.recovered = ( 1 - ( recoverAct / recoveredStd)) * 100;
      data.push({name: 'Other system demand', type: 'column', data: [otherStd]});
      data.push({name: 'Heating demand', type: 'column', data: [heatingStd]});
      data.push({name: 'Recovered Heat', type: 'column', data: [recoveredStd]});
      this.chartOptionsDemandStd = this.buildStackedChartPerYear(data, label);
    } else if ( eff.level_improvement === 'Advanced') {
      const data = [];
      label = 'Advanced';
      const totalAdv = eff.total_p_energy ;
      const otherAdv = ( Math.round(( eff.total_p_energy - eff.energy_demand) * 100) ) / 100;
      const heatingAdv = ( Math.round( eff.energy_demand * 100) ) / 100;
      const recoveredAdv = ( Math.round(eff.recovered_heat_ventilation * 100) ) / 100;
      this.demandDataAdv.total = ( 1 - ( totalAct / totalAdv)) * 100;
      this.demandDataAdv.heating = ( 1 - ( heatingAct / heatingAdv)) * 100;
      this.demandDataAdv.recovered = ( 1 - ( recoverAct / recoveredAdv)) * 100;
      data.push({name: 'Other system demand', type: 'column', data: [otherAdv]});
      data.push({name: 'Heating demand', type: 'column', data: [heatingAdv]});
      data.push({name: 'Recovered Heat', type: 'column', data: [recoveredAdv]});
      this.chartOptionsDemandAdv = this.buildStackedChartPerYear(data, label);
    }
  }

  dataFinalEnergy(eff): void {
    let totalAct = 0;
    let fossilFuels = 0;
    let biomass = 0;
    let electricity = 0;
    let district = 0;
    let other = 0;
    let produced = 0;
    let label = '';
    if ( eff.level_improvement === 'Actual conditions') {
      const data = [];
      label = 'Actual conditions';
      fossilFuels = ( Math.round( eff.fossil_fuels * 100) ) / 100 ;
      biomass = ( Math.round(eff.biomass * 100) ) / 100 ;
      electricity = ( Math.round(eff.electricity * 100) ) / 100 ;
      district = ( Math.round(eff.district_heating * 100) ) / 100 ;
      other = ( Math.round(eff.other * 100) ) / 100 ;
      produced = ( Math.round(eff.produced_electricity * 100) ) / 100 ;
      totalAct = fossilFuels + biomass + electricity + district + other + produced;
      this.finalEnergyData.total = totalAct;
      this.finalEnergyData.fossils = ( fossilFuels / totalAct ) * 100;
      this.finalEnergyData.biomass = ( biomass / totalAct ) * 100;
      this.finalEnergyData.electricity = ( electricity / totalAct ) * 100;
      this.finalEnergyData.district = ( district / totalAct ) * 100;
      this.finalEnergyData.other = ( other / totalAct ) * 100;
      this.finalEnergyData.produced = ( produced / totalAct ) * 100;

      data.push({name: 'Fossils', type: 'column', data: [fossilFuels]});
      data.push({name: 'Biomass', type: 'column', data: [biomass]});
      data.push({name: 'Electricity', type: 'column', data: [electricity]});
      data.push({name: 'District heating', type: 'column', data: [district]});
      data.push({name: 'Other', type: 'column', data: [other]});
      data.push({name: 'Produced electricity', type: 'column', data: [produced]});
      this.chartOptionsFinalEnergyActual = this.buildStackedChartPerYear(data, label);
    } else if ( eff.level_improvement === 'Standard') {
      const data = [];
      label = 'Standard';
      fossilFuels = eff.fossil_fuels ;
      biomass = eff.biomass ;
      electricity = eff.electricity ;
      district = eff.district_heating ;
      other = eff.other ;
      produced = eff.produced_electricity ;
      const total = fossilFuels + biomass + electricity + district + other + produced;
      this.finalEnergyDataStd.total = total;
      this.finalEnergyDataStd.fossils = ( fossilFuels / totalAct ) * 100;
      this.finalEnergyDataStd.biomass = ( biomass / totalAct ) * 100;
      this.finalEnergyDataStd.electricity = ( electricity / totalAct ) * 100;
      this.finalEnergyDataStd.district = ( district / totalAct ) * 100;
      this.finalEnergyDataStd.other = ( other / totalAct ) * 100;
      this.finalEnergyDataStd.produced = ( produced / totalAct ) * 100;

      data.push({name: 'Fossils', type: 'column', data: [fossilFuels]});
      data.push({name: 'Biomass', type: 'column', data: [biomass]});
      data.push({name: 'Electricity', type: 'column', data: [electricity]});
      data.push({name: 'District heating', type: 'column', data: [district]});
      data.push({name: 'Other', type: 'column', data: [other]});
      data.push({name: 'Produced electricity', type: 'column', data: [produced]});
      this.chartOptionsFinalEnergyStd = this.buildStackedChartPerYear(data, label);
    } else if ( eff.level_improvement === 'Advanced') {
      const data = [];
      label = 'Advanced';
      fossilFuels = eff.fossil_fuels ;
      biomass = eff.biomass ;
      electricity = eff.electricity ;
      district = eff.district_heating ;
      other = eff.other ;
      produced = eff.produced_electricity ;
      const total = fossilFuels + biomass + electricity + district + other + produced;
      this.finalEnergyDataAdv.total = total;
      this.finalEnergyDataAdv.fossils = ( fossilFuels / totalAct ) * 100;
      this.finalEnergyDataAdv.biomass = ( biomass / totalAct ) * 100;
      this.finalEnergyDataAdv.electricity = ( electricity / totalAct ) * 100;
      this.finalEnergyDataAdv.district = ( district / totalAct ) * 100;
      this.finalEnergyDataAdv.other = ( other / totalAct ) * 100;
      this.finalEnergyDataAdv.produced = ( produced / totalAct ) * 100;

      data.push({name: 'Fossils', type: 'column', data: [fossilFuels]});
      data.push({name: 'Biomass', type: 'column', data: [biomass]});
      data.push({name: 'Electricity', type: 'column', data: [electricity]});
      data.push({name: 'District heating', type: 'column', data: [district]});
      data.push({name: 'Other', type: 'column', data: [other]});
      data.push({name: 'Produced electricity', type: 'column', data: [produced]});
      this.chartOptionsFinalEnergyAdv = this.buildStackedChartPerYear(data, label);
    }
  }

  buildStackedChartPerYear(data, label): any {
    return {
      chart: {
        type: 'column',
        width: 250
      },
      title: {
        text: ' '
      },
      xAxis: {
        categories: [label]
      },
      yAxis: {
        min: 0,
        title: {
          text: ' '
        },
        stackLabels: {
          enabled: true,
          style: {
            fontWeight: 'bold',
            color: ( // theme
              Highcharts.defaultOptions.title.style &&
              Highcharts.defaultOptions.title.style.color
            ) || 'gray'
          }
        }
      },
      tooltip: {
        headerFormat: '<b>{point.x}</b><br/>',
        pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
      },
      plotOptions: {
        column: {
          stacking: 'normal',
          dataLabels: {
            enabled: true
          }
        }
      },
      series: data
    };
}

}
