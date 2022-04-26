import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Building} from '../../shared/models/building';
import {AngularFireAuth} from '@angular/fire/auth';
import {UserService} from '../../core/authentication/user.service';
import {Envelope} from '../../shared/models/envelope';
import {System} from '../../shared/models/system';
import {SystemType} from '../../shared/models/systemType';
import {Efficiency} from '../../shared/models/eficiency';
import {Typology} from '../../shared/models/typology';
import {Options} from '@angular-slider/ngx-slider';

@Component({
  selector: 'app-user-history',
  templateUrl: './user-history.component.html',
  styleUrls: ['./user-history.component.scss']
})
export class UserHistoryComponent implements OnInit {

  userHistory: Building[];
  deletedBuilding: boolean;
  filterCountries: string[];
  filterTypologies: { code: string, name: string}[];
  filterYears: string[];
  tmpUserHistory: Building[];

  countryControl: boolean;
  countrySelected: string;

  yearControl: boolean;
  yearSelectedMin: any;
  yearSelectedMax: any;

  typologyControl: boolean;
  typologySelected: string;

  filterApplied: string[];
  @Input() optionSelected: number;
  @Output() historyEmitter = new EventEmitter<any>();
  @Output() buildingSelectedEmitter = new EventEmitter<any>();
  @Output() buildingToBeUpdatedEmitter = new EventEmitter<any>();
  constructor(
    public afAuth: AngularFireAuth,
    private userService: UserService,
  ) {
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.buildHistory();
      }
    });
  }

  ngOnInit(): void {
    this.filterApplied = [];
  }

  showBuildingResults(building: Building): void {
    this.buildingSelectedEmitter.emit(building);
  }

  updateBuilding(building: Building): void {
    this.buildingToBeUpdatedEmitter.emit(building);
  }

  removeBuildingFromUserHistory(building: Building): void {
    this.userService.deletePropertyFromHistory( building.id, localStorage.getItem('auth-token')).subscribe( () => {
      this.deletedBuilding = true;
      this.buildHistory();
      setTimeout( () => {
        this.deletedBuilding = false;
      }, 80000 );
    });
  }
  buildHistory() {
    this.userService.getUserHistory(localStorage.getItem('auth-token')).subscribe( hist => {
      this.userHistory = [];
      for (const histKey in hist) {
        this.parseHistory(hist[histKey]);
      }
      this.tmpUserHistory = this.userHistory;
      this.buildFilters();
      this.historyEmitter.emit(this.userHistory);
    });
  }
  buildFilters() {
    this.filterCountries = [];
    this.filterTypologies = [];
    this.filterYears = [];
    const currentTime = new Date();
    for ( let i = currentTime.getFullYear(); i > 0; i --) {
      this.filterYears.push(i.toString());
    }
    this.tmpUserHistory.forEach( ( hist) => {
      if ( this.filterCountries.length === 0 || !this.filterCountries.includes(hist.country)) {
        this.filterCountries.push(hist.country);
      }
      if (this.filterTypologies.length === 0 || !this.filterTypologies.find(item => item.code === hist.typology.categoryCode)) {
        const typo = { code: hist.typology.categoryCode, name: hist.typology.categoryName};
        this.filterTypologies.push(typo);
      }
      /*if (this.filterYears.length === 0 || !this.filterYears.includes(hist.year)) {
        this.filterYears.push(hist.year);
      }*/
    });
  }
  filter(type: string): void {
    if ( ( type === 'country' && this.countrySelected !== null ) ||
      ( type === 'yearMin' && this.yearSelectedMin !== null ) ||
      ( type === 'yearMax' && this.yearSelectedMax !== null ) ||
      ( type === 'typology' && this.typologySelected !== null )){

      const indexFilterApplied = this.filterApplied.indexOf(type);
      if (indexFilterApplied < 0) {
        this.filterApplied.push(type);
      }
    } else {
      this.cleanFilter(type);
    }
    let arrayFiltered = [];
    this.userHistory.forEach(el => {
      arrayFiltered.push(el);
    });
    this.filterApplied.forEach( filter => {
      if (filter === 'yearMin') {
        const filterByYear  = [];
        this.userHistory.forEach( hist => {
          if ( hist.year >= this.yearSelectedMin) {
            filterByYear.push(hist);
          }
        });
        arrayFiltered = this.removeElementsFromArray(arrayFiltered, filterByYear);
      }
      if (filter === 'yearMax') {
        const filterByYear  = [];
        this.userHistory.forEach( hist => {
          if ( hist.year <= this.yearSelectedMax) {
            filterByYear.push(hist);
          }
        });
        arrayFiltered = this.removeElementsFromArray(arrayFiltered, filterByYear);
      }
      if (filter === 'country') {
        const filterByUse  = [];
        this.userHistory.forEach( hist => {
          if ( hist.country === this.countrySelected) {
            filterByUse.push(hist);
          }
        });
        arrayFiltered = this.removeElementsFromArray(arrayFiltered, filterByUse);
      }

      if (filter === 'typology') {
        const filterByTypology  = [];
        this.userHistory.forEach( hist => {
          if ( hist.typology.categoryCode === this.typologySelected) {
            filterByTypology.push(hist);
          }
        });
        arrayFiltered = this.removeElementsFromArray(arrayFiltered, filterByTypology);
      }
    });
    this.tmpUserHistory = arrayFiltered;
    this.buildFilters();
    this.historyEmitter.emit(this.tmpUserHistory);
  }

  cleanFilter(type: string) {
    const indexFilterApplied = this.filterApplied.indexOf(type);
    if (indexFilterApplied > -1) {
      this.filterApplied.splice(indexFilterApplied, 1);
    }
  }

  removeElementsFromArray(arrayInit, element) {
    const indexToRemove = [];
    arrayInit.forEach( filtered => {
      const index = element.indexOf(filtered, 0);
      if (index < 0 ) {
        indexToRemove.push(arrayInit.indexOf(filtered, 0));
      }
    });
    for (let i = indexToRemove.length - 1 ; i >= 0; i--){
      arrayInit.splice(indexToRemove[i], 1);
    }
    return arrayInit;
  }
  parseHistory(history: any) {
    const enveloped: Envelope[] = [];
    const systems: System[] = [];
    let systemType: SystemType = null;
    const efficiency: Efficiency[] = [];
    const dataBuilding = history.data_building;
    history.envelope.forEach( env => {
      enveloped.push(new Envelope(env.enveloped.enveloped_code, env.enveloped.type_construction,
        env.enveloped.description, env.u_value, env.enveloped.picture, env.component_type.name));
    });
    history.systems.forEach( sys => {
      if ( sys.level_improvement === 'Actual conditions') {
        systems.push(new System( 'Heating', sys.heating.system_code, sys.heating.system_description,
          sys.heating.system_description_original, sys.heating.picture));
        systems.push(new System( 'Water', sys.water.system_code, sys.water.system_description,
          sys.water.system_description_original, sys.water.picture));
        systems.push(new System( 'Ventilation', sys.ventilation.system_code, sys.ventilation.system_description,
          sys.ventilation.system_description_original, sys.ventilation.picture));
        systemType = new SystemType(history.systems[0].code_system_measure, history.systems[0].system_measure.description_actual_conditions,
          history.systems[0].system_measure.original_description_aconditions, systems);
      }
    });
    history.efficiency.forEach( eff => {
      efficiency.push( new Efficiency(eff.level_improvement, eff.energy_demand, eff.recovered_heat_ventilation,
        eff.fossils_fuels, eff.biomass, eff. electricity, eff.district_heating, eff.other, eff.produced_electricity,
        eff.renewable_p_energy, eff.total_p_energy, eff.non_renewable_pe, eff.renewable_pe_demand, eff.CO2_emissions, eff.energy_costs));
    });
    this.userHistory.push(new Building(dataBuilding.country, dataBuilding.climate_zone, dataBuilding.climate_sub_zone, dataBuilding.year,
      dataBuilding.region, '', dataBuilding.address, dataBuilding.altitude,
      { lng: dataBuilding.coordinates.lng, lat: dataBuilding.coordinates.lat },
      { x: dataBuilding.point.x, y: dataBuilding.point.y }, [], dataBuilding.rc, dataBuilding.use, dataBuilding.surface,
      new Typology(dataBuilding.category_code, dataBuilding.category_name, dataBuilding.category_pic_code, '',
        dataBuilding.year_code, dataBuilding.pic_name,
        dataBuilding.building_code, enveloped, systemType, null), true, null, efficiency, dataBuilding.id));
  }

}
