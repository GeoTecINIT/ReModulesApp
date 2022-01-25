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
  SummaryChart: typeof Highcharts = Highcharts;
  chartOptionsSummary: Highcharts.Options;
  totalFinalEnergy: { today: number, standard: number, advanced: number};
  DemandChartActual: typeof Highcharts = Highcharts;
  chartOptionsDemandActual: Highcharts.Options;
  DemandChartStd: typeof Highcharts = Highcharts;
  chartOptionsDemandStd: Highcharts.Options;
  DemandChartAdv: typeof Highcharts = Highcharts;
  chartOptionsDemandAdv: Highcharts.Options;
  demandData: { total: number, other: number, heating: number, recovered: number};
  demandDataStd: { total: number, other: number, heating: number, recovered: number};
  demandDataAdv: { total: number, other: number, heating: number, recovered: number};
  textTotalDemandStd: string;
  textOtherDemandStd: string;
  textHeatingDemandStd: string;
  textRecoveredDemandStd: string;
  textTotalDemandAdv: string;
  textOtherDemandAdv: string;
  textHeatingDemandAdv: string;
  textRecoveredDemandAdv: string;

  FinalEnergyChartActual: typeof Highcharts = Highcharts;
  chartOptionsFinalEnergyActual: Highcharts.Options;
  FinalEnergyChartStd: typeof Highcharts = Highcharts;
  chartOptionsFinalEnergyStd: Highcharts.Options;
  FinalEnergyChartAdv: typeof Highcharts = Highcharts;
  chartOptionsFinalEnergyAdv: Highcharts.Options;
  finalEnergyData: { total: number, fossils: number, biomass: number, electricity: number, district: number, other: number, produced: number};
  finalEnergyDataStd: { total: number, fossils: number, biomass: number, electricity: number, district: number, other: number, produced: number};
  finalEnergyDataAdv: { total: number, fossils: number, biomass: number, electricity: number, district: number, other: number, produced: number};
  textTotalStd: string;
  textFossilStd: string;
  textBiomassStd: string;
  textElectricityStd: string;
  textDistrictStd: string;
  textOtherStd: string;
  textProducedStd: string;
  textTotalAdv: string;
  textFossilAdv: string;
  textBiomassAdv: string;
  textElectricityAdv: string;
  textDistrictAdv: string;
  textOtherAdv: string;
  textProducedAdv: string;

  co2EmissionsActual: { co2: { value: number, text: string }, nre: { value: number, text: string }};
  co2EmissionsStd: { co2: { value: number, text: string }, nre: { value: number, text: string }};
  co2EmissionsAdv: { co2: { value: number, text: string }, nre: { value: number, text: string }};

  energyCost: number;
  energyCostStd: { value: number, text: string };
  energyCostAdv: { value: number, text: string };

  ResChartAdv: typeof Highcharts = Highcharts;
  chartOptionsResAdv: Highcharts.Options;
  ResChartActual: typeof Highcharts = Highcharts;
  chartOptionsResActual: Highcharts.Options;
  ResChartStd: typeof Highcharts = Highcharts;
  chartOptionsResStd: Highcharts.Options;
  textResActual: { res: string, other: string};
  textResStd: string;
  textResAdv: string;
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
    this.initChartVariables();
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
      console.log('Building!!! ', this.building);
    }
  }

  initChartVariables(): void {
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
    this.finalEnergyDataStd = { total: 0, fossils: 0, biomass: 0, electricity: 0, district: 0, other: 0, produced: 0};
    this.finalEnergyDataAdv = { total: 0, fossils: 0, biomass: 0, electricity: 0, district: 0, other: 0, produced: 0};
    this.textTotalStd = '';
    this.textFossilStd = '';
    this.textBiomassStd = '';
    this.textElectricityStd = '';
    this.textDistrictStd = '';
    this.textOtherStd = '';
    this.textProducedStd = '';
    this.co2EmissionsActual = { co2: { value: 0, text: '' }, nre: { value: 0, text: '' }};
    this.co2EmissionsStd = { co2: { value: 0, text: '' }, nre: { value: 0, text: '' }};
    this.co2EmissionsAdv = { co2: { value: 0, text: '' }, nre: { value: 0, text: '' }};
    this.energyCost = 0;
    this.energyCostStd = { value: 0, text: '' };
    this.energyCostAdv = { value: 0, text: '' };
    this.textResActual = { res: '', other: ''};
    this.textResStd = '';
    this.textResAdv = '';
    this.textTotalDemandStd = '';
    this.textOtherDemandStd = '';
    this.textHeatingDemandStd = '';
    this.textRecoveredDemandStd = '';
    this.textTotalDemandAdv = '';
    this.textOtherDemandAdv = '';
    this.textHeatingDemandAdv = '';
    this.textRecoveredDemandAdv = '';
    this.totalFinalEnergy = { today: 0, standard: 0, advanced: 0};
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
      this.dataDemandPerYear(this.building.efficiency);
      this.dataFinalEnergy(this.building.efficiency);
      this.dataCO2Emissions(this.building.efficiency);
      this.dataEnergyCost(this.building.efficiency);
      this.dataResPercentage(this.building.efficiency);
      this.summaryChart();
  }

  dataDemandPerYear(efficiency: Efficiency[]): void {
    let totalAct = 0;
    let otherAct = 0;
    let heatingAct = 0;
    let recoverAct = 0;
    let label = '';
    efficiency.forEach( eff => {
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
      }
    });
    efficiency.forEach( eff => {
      if ( eff.level_improvement === 'Standard') {
        const data = [];
        label = 'Standard';
        const totalStd = eff.total_p_energy ;
        const otherStd = ( Math.round(( eff.total_p_energy - eff.energy_demand) * 100) ) / 100;
        const heatingStd = ( Math.round( eff.energy_demand * 100) ) / 100;
        const recoveredStd = ( Math.round(eff.recovered_heat_ventilation * 100) ) / 100;
        this.demandDataStd.total = Math.abs(( 1 - ( totalStd / totalAct)) * 100);
        this.demandDataStd.other = Math.abs(( 1 - ( otherStd / otherAct)) * 100);
        this.demandDataStd.heating = Math.abs(( 1 - ( heatingStd / heatingAct)) * 100);
        this.demandDataStd.recovered = Math.abs(( 1 - ( recoveredStd / recoverAct)) * 100);

        this.textTotalDemandStd = this.demandDataStd.total > 0 ? ( totalStd > totalAct ? '% Increase' : '% Reduction ') : 'No changes';
        this.textOtherDemandStd = this.demandDataStd.other > 0 ? ( otherStd > otherAct ? '% Increase in Other system demand' : '% Reduction in Other system demand') : 'No changes';
        this.textHeatingDemandStd = this.demandDataStd.heating > 0 ? ( heatingStd > heatingAct ? '% Increase in Heating demand' : '% Reduction in Heating demand') : 'No changes';
        this.textRecoveredDemandStd = this.demandDataStd.recovered > 0 ? ( recoveredStd > recoverAct ? '% Increase in Recovered Heating' : '% Reduction in Recovered Heating') : 'No changes';
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
        this.demandDataAdv.total = Math.abs(( 1 - ( totalAdv / totalAct )) * 100 );
        this.demandDataAdv.other = Math.abs(( 1 - ( otherAdv / otherAct)) * 100);
        this.demandDataAdv.heating = Math.abs(( 1 - ( heatingAdv / heatingAct)) * 100);
        this.demandDataAdv.recovered = Math.abs(( 1 - ( recoveredAdv / recoverAct)) * 100);
        this.textTotalDemandAdv = this.demandDataAdv.total > 0 ? ( totalAdv > totalAct ? '% Increase' : '% Reduction' ) : 'No changes';
        this.textOtherDemandAdv = this.demandDataAdv.other > 0 ? ( otherAdv > otherAct ? '% Increase in Other system demand' : '% Reduction in Other system demand' ) : 'No changes';
        this.textHeatingDemandAdv = this.demandDataAdv.heating > 0 ? ( heatingAdv > heatingAct ? '% Increase in Heating demand' : '% Reduction in Heating demand' ) : 'No changes';
        this.textRecoveredDemandAdv = this.demandDataAdv.recovered > 0 ? ( recoveredAdv > recoverAct ? '% Increase in Recovered Heating' : '% Reduction in Recovered Heating' ) : 'No changes';
        data.push({name: 'Other system demand', type: 'column', data: [otherAdv]});
        data.push({name: 'Heating demand', type: 'column', data: [heatingAdv]});
        data.push({name: 'Recovered Heat', type: 'column', data: [recoveredAdv]});
        this.chartOptionsDemandAdv = this.buildStackedChartPerYear(data, label);
      }
    });
  }

  dataFinalEnergy(efficiency: Efficiency[]): void {
    let totalAct = 0;
    let fossilFuels = 0;
    let biomass = 0;
    let electricity = 0;
    let district = 0;
    let other = 0;
    let produced = 0;
    let label = '';
    efficiency.forEach( eff => {
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
        this.totalFinalEnergy.today = totalAct;
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
      }
    });
    efficiency.forEach( eff => {
      if ( eff.level_improvement === 'Standard') {
        const data = [];
        label = 'Standard';
        const fossilFuelsStd =  ( Math.round( eff.fossil_fuels * 100) ) / 100 ;
        const biomassStd = ( Math.round(eff.biomass * 100) ) / 100 ;
        const electricityStd = ( Math.round(eff.electricity * 100) ) / 100 ;
        const districtStd = ( Math.round(eff.district_heating * 100) ) / 100 ;
        const otherStd = ( Math.round(eff.other * 100) ) / 100 ;
        const producedStd =  ( Math.round(eff.produced_electricity * 100) ) / 100 ;
        const totalStd = fossilFuelsStd + biomassStd + electricityStd + districtStd + otherStd + producedStd;
        this.totalFinalEnergy.standard = totalStd;

        this.finalEnergyDataStd.total = Math.abs(( 1 - ( totalStd / totalAct ) ) * 100) ;
        this.finalEnergyDataStd.fossils = Math.abs(( 1 - ( fossilFuelsStd / fossilFuels ) ) * 100);
        this.finalEnergyDataStd.biomass = Math.abs(( 1 - (biomassStd / biomass ) ) * 100);
        this.finalEnergyDataStd.electricity = Math.abs((  1 - ( electricityStd / electricity ) ) * 100);
        this.finalEnergyDataStd.district = Math.abs((  1 - ( districtStd / district)) * 100);
        this.finalEnergyDataStd.other = Math.abs((  1 - (otherStd / other ) ) * 100);
        this.finalEnergyDataStd.produced = Math.abs((  1 - (producedStd / produced )) * 100);

        this.textTotalStd = this.finalEnergyDataStd.total > 0 ? ( totalStd > totalAct ? '% Increase' : '% Reduction' ) : 'No changes';
        this.textFossilStd = this.finalEnergyDataStd.fossils > 0 ? (fossilFuelsStd > fossilFuels ?  '% Increase in Fossils' : '% Reduction in Fossils' ) : 'No changes';
        this.textBiomassStd = this.finalEnergyDataStd.biomass > 0 ? (biomassStd > biomass ? '% Increase in Biomass' : '% Reduction in Biomass' ) : 'No changes';
        this.textElectricityStd = this.finalEnergyDataStd.electricity > 0 ? (electricityStd > electricity ? '% Increase in Electricity' : '% Reduction in Electricity' ) : 'No changes';
        this.textDistrictStd = this.finalEnergyDataStd.district > 0 ? (districtStd > district ? '% Increase in District Heating' : '% Reduction in District Heating' ) : 'No changes';
        this.textOtherStd = this.finalEnergyDataStd.other > 0 ? (otherStd > other ? '% Increase in Other' : '% Reduction in Other' ) : 'No changes';
        this.textProducedStd = this.finalEnergyDataStd.produced > 0 ? (producedStd > produced ? '% Increase in Produced electricit' : '% Reduction in Produced electricit' ) : 'No changes';

        data.push({name: 'Fossils', type: 'column', data: [fossilFuelsStd]});
        data.push({name: 'Biomass', type: 'column', data: [biomassStd]});
        data.push({name: 'Electricity', type: 'column', data: [electricityStd]});
        data.push({name: 'District heating', type: 'column', data: [districtStd]});
        data.push({name: 'Other', type: 'column', data: [otherStd]});
        data.push({name: 'Produced electricity', type: 'column', data: [producedStd]});
        this.chartOptionsFinalEnergyStd = this.buildStackedChartPerYear(data, label);
      } else if ( eff.level_improvement === 'Advanced') {
        const data = [];
        label = 'Advanced';
        const fossilFuelsAdv = ( Math.round( eff.fossil_fuels * 100) ) / 100 ;
        const biomassAdv = ( Math.round(eff.biomass * 100) ) / 100 ;
        const electricityAdv = ( Math.round(eff.electricity * 100) ) / 100 ;
        const districtAdv =  ( Math.round(eff.district_heating * 100) ) / 100 ;
        const otherAdv = ( Math.round(eff.other * 100) ) / 100 ;
        const producedAdv =  ( Math.round(eff.produced_electricity * 100) ) / 100 ;
        const totalAdv = fossilFuelsAdv + biomassAdv + electricityAdv + districtAdv + otherAdv + producedAdv;
        this.totalFinalEnergy.advanced = totalAdv;


        this.finalEnergyDataAdv.total = Math.abs(( 1 - ( totalAdv / totalAct)) * 100) ;
        this.finalEnergyDataAdv.fossils = Math.abs(( 1 - ( fossilFuelsAdv / fossilFuels ) ) * 100);
        this.finalEnergyDataAdv.biomass = Math.abs(( 1 - (biomassAdv / biomass) )  * 100);
        this.finalEnergyDataAdv.electricity = Math.abs((  1 - ( electricityAdv / electricity ) ) * 100);
        this.finalEnergyDataAdv.district = Math.abs((  1 - ( districtAdv / district  )) * 100);
        this.finalEnergyDataAdv.other = Math.abs((  1 - (otherAdv / other ) )  * 100);
        this.finalEnergyDataAdv.produced = Math.abs((  1 - ( producedAdv / produced )) * 100);

        this.textTotalAdv = this.finalEnergyDataAdv.total > 0 ? ( totalAdv > totalAct ? '% Increase' : '% Reduction') : 'No changes';
        this.textFossilAdv = this.finalEnergyDataAdv.fossils > 0 ? ( fossilFuelsAdv > fossilFuels ? '% Increase in Fossils' : '% Reduction in Fossils') : 'No changes';
        this.textBiomassAdv = this.finalEnergyDataAdv.biomass > 0 ? ( biomassAdv > biomass ? '% Increase in Biomass' : '% Reduction in Biomass') : 'No changes';
        this.textElectricityAdv = this.finalEnergyDataAdv.electricity > 0 ? ( electricityAdv > electricity ? '% Increase in Electricity' : '% Reduction in Electricity') : 'No changes';
        this.textDistrictAdv = this.finalEnergyDataAdv.district > 0 ? ( districtAdv > district ? '% Increase in District Heating' : '% Reduction in District Heating') : 'No changes';
        this.textOtherAdv = this.finalEnergyDataAdv.other > 0 ? ( otherAdv > other ? '% Increase in Other' : '% Reduction in Other') : 'No changes';
        this.textProducedAdv = this.finalEnergyDataAdv.produced > 0 ? ( producedAdv > produced ? '% Increase in Produced electricit' : '% Reduction in Produced electricit') : 'No changes';

        data.push({name: 'Fossils', type: 'column', data: [fossilFuelsAdv]});
        data.push({name: 'Biomass', type: 'column', data: [biomassAdv]});
        data.push({name: 'Electricity', type: 'column', data: [electricityAdv]});
        data.push({name: 'District heating', type: 'column', data: [districtAdv]});
        data.push({name: 'Other', type: 'column', data: [otherAdv]});
        data.push({name: 'Produced electricity', type: 'column', data: [producedAdv]});
        this.chartOptionsFinalEnergyAdv = this.buildStackedChartPerYear(data, label);
      }
    });
  }

  dataCO2Emissions( efficiency: Efficiency[]): void {
    let actualCO2 = 0;
    let actualNre = 0;
    efficiency.forEach( eff => {
      if ( eff.level_improvement === 'Actual conditions') {
        actualCO2 = eff.CO2_emissions;
        actualNre = eff.renewable_p_energy;
        this.co2EmissionsActual.co2.value = eff.CO2_emissions;
        this.co2EmissionsActual.co2.text = 'CO2 emissions';
        this.co2EmissionsActual.nre.value = eff.renewable_p_energy;
        this.co2EmissionsActual.nre.text = 'nRE PE';
      }
    });
    efficiency.forEach( eff => {
      if ( eff.level_improvement === 'Standard') {
        this.co2EmissionsStd.co2.value = Math.abs(( 1 - ( eff.CO2_emissions / actualCO2 )) * 100);
        this.co2EmissionsStd.co2.text = eff.CO2_emissions > actualCO2 ? 'Increase in CO2 emissions ' : ' Reduction in CO2 emissions';
        this.co2EmissionsStd.nre.value = Math.abs(( 1 - ( eff.renewable_p_energy / actualNre)) * 100);
        this.co2EmissionsStd.nre.text = eff.renewable_p_energy > actualNre ? 'Increase in nRE PE' : ' Reduction in nRE PE';
      } else if ( eff.level_improvement === 'Advanced') {
        this.co2EmissionsAdv.co2.value = Math.abs(( 1 - ( eff.CO2_emissions / actualCO2)) * 100);
        this.co2EmissionsAdv.co2.text = eff.CO2_emissions > actualCO2 ? 'Increase in CO2 emissions ' : ' Reduction in CO2 emissions';
        this.co2EmissionsAdv.nre.value = Math.abs(( 1 - ( eff.renewable_p_energy / actualNre )) * 100);
        this.co2EmissionsAdv.nre.text = eff.renewable_p_energy > actualNre ? 'Increase in nRE PE' : ' Reduction in nRE PE';
      }
    });
  }

  dataResPercentage( efficiency: Efficiency[]): void {
    let data = [];
    let resActual = 0;
    let offerActual = 0;
    efficiency.forEach( eff => {
      if ( eff.level_improvement === 'Actual conditions') {
        data = [];
        resActual = eff.renewable_pe_demand;
        offerActual = eff.non_renewable_pe;
        const percentageRES = ( Math.round(((resActual / eff.total_p_energy ) * 100) * 100 )) / 100;
        const percentageOthers = ( Math.round(((offerActual / eff.total_p_energy ) * 100) * 100 )) / 100;
        this.textResActual.res = percentageRES + '% RES';
        this.textResActual.other = percentageOthers + '% others';
        data.push( {name: 'RES', y: resActual, color: '#f5a9a9'});
        data.push( {name: 'others', y: offerActual, color: '#b3b0b0'});
        this.chartOptionsResActual = this.buildPieChart(data);
      }
    });
    efficiency.forEach( eff => {
      data = [];
      if ( eff.level_improvement === 'Standard') {
        const resStd = eff.renewable_pe_demand;
        const offerStd = eff.non_renewable_pe;
        let percentage = Math.abs(( 1 - ( resStd / resActual ) ) * 100);
        percentage = ( Math.round(percentage * 100)) / 100;
        if ( percentage > 0 ) {
          this.textResStd = resStd > resActual ?  percentage + '% Increase' : percentage + '% Reduction';
        } else {
          this.energyCostStd.text = 'No changes';
        }
        data.push( {name: 'RES', y: resStd, color: '#ffbd04'});
        data.push( {name: 'others', y: offerStd, color: '#b3b0b0'});
        this.chartOptionsResStd = this.buildPieChart(data);
      } else if ( eff.level_improvement === 'Advanced') {
        const resAdv = eff.renewable_pe_demand;
        const offerAdv = eff.non_renewable_pe;
        let percentage = Math.abs(( 1 - ( resAdv / resActual ) ) * 100);
        percentage = ( Math.round(percentage * 100)) / 100;
        if ( percentage > 0 ) {
          this.textResAdv = resAdv > resActual ?  percentage + '% Increase' : percentage + '% Reduction';
        } else {
          this.energyCostStd.text = 'No changes';
        }
        data.push( {name: 'RES', y: resAdv, color: '#bce39e'});
        data.push( {name: 'others', y: offerAdv, color: '#b3b0b0'});
        this.chartOptionsResAdv = this.buildPieChart(data);
      }
    });
  }

  dataEnergyCost( efficiency: Efficiency[]): void {
    let actualEnergyCost = 0;
    efficiency.forEach( eff => {
      if ( eff.level_improvement === 'Actual conditions') {
       this.energyCost = eff.energy_costs;
       actualEnergyCost = eff.energy_costs;
      }
    });
    efficiency.forEach( eff => {
      if ( eff.level_improvement === 'Standard') {
        this.energyCostStd.value = eff.energy_costs;
        let percentageStd = Math.abs((1 - (eff.energy_costs / actualEnergyCost)) * 100);
        percentageStd = Math.round(percentageStd * 100) / 100;
        if ( percentageStd > 0) {
          this.energyCostStd.text = eff.energy_costs > actualEnergyCost ? percentageStd + '% Increase ' : percentageStd + '% Reduction';
        } else {
          this.energyCostStd.text = 'No changes';
        }
      } else if ( eff.level_improvement === 'Advanced') {
        this.energyCostAdv.value = eff.energy_costs;
        let percentageAdv = Math.abs((1 - (eff.energy_costs / actualEnergyCost)) * 100);
        percentageAdv = Math.round(percentageAdv * 100) / 100;
        if ( percentageAdv > 0 ) {
          this.energyCostAdv.text = eff.energy_costs > actualEnergyCost ? percentageAdv + '% Increase ' : percentageAdv + '% Reduction';
        } else {
          this.energyCostStd.text = 'No changes';
        }
      }
    });
  }

  summaryChart( ): void {
    this.chartOptionsSummary = this.buildSummaryChart();
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

  buildSummaryChart( ): any {
    return {
      chart: {
        type: 'column',
        height: 250,
        width: 300
      },
      title: {
        text: 'Total Final Energy'
      },
      xAxis: {
        type: 'category'
      },
      legend: {
        enabled: false
      },
      plotOptions: {
        series: {
          borderWidth: 0,
          dataLabels: {
            enabled: true,
            format: '{point.y:.1f}'
          }
        }
      },

      tooltip: {
        headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
        pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y:.2f}</b><br/>'
      },

      series: [
        {
          name: 'Levels',
          colorByPoint: true,
          data: [
            {
              name: 'Today',
              y: this.totalFinalEnergy.today,
              color: '#f5a9a9'
            },
            {
              name: 'Standard',
              y: this.totalFinalEnergy.standard,
              color: '#ffbd04'
            },
            {
              name: 'Advanced',
              y: this.totalFinalEnergy.advanced,
              color: '#bce39e'
            }
          ]
        }
      ]
    };
  }

  buildPieChart( data): any {
    return {
      chart: {
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false,
        type: 'pie',
        width: 250
      },
      title: {
        text: ' '
      },
      tooltip: {
        pointFormat: '{point.name}: <b>{point.y:.1f}</b>'
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.y:.1f} '
          }
        }
      },
      series: [{
        name: ' ',
        colorByPoint: true,
        data
      }]
    };
  }

}
