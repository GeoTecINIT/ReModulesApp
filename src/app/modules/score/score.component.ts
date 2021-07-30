import {AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Building} from '../../shared/models/building';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import {GlobalConstants} from '../../shared/GlobalConstants';
import {AngularFireAuth} from '@angular/fire/auth';
import {User} from '../../shared/models/user';
import {UserService} from '../../core/authentication/user.service';
import {Envelope} from '../../shared/models/envelope';
import {SystemType} from '../../shared/models/systemType';
import {TypologyService} from '../../core/typology/typology.service';
import {System} from '../../shared/models/system';

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

  // options
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = true;
  showXAxisLabel = true;
  showYAxisLabel = true;
  yAxisLabel = 'Scale';
  animations = true;
  legendTitle = 'System';

  colorScheme = 'cool';

  dataChart: any[];
  informationSelection = 1;
  stateSelection = 1;
  lowRefurbishment = [];
  highRefurbishment = [];
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
  }

  ngOnInit(): void {
    this.dataChart = [
      {
        name: 'Demand',
        series: []
      },
      {
        name: 'Final Energy',
        series: []
      },
      {
        name: 'Primary Energy',
        series: []
      },
      {
        name: 'Emissions',
        series: []
      },
    ];
    if ( this.building.typology.energy && this.building.typology.energy.energyScoreCode) {
      this.prepareDataForChart();
    }
    this.getRefurbishment();
    this.getSystemRefurbishment();
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
    /*if ( changes.building && changes.building.currentValue && changes.building.currentValue.typology &&
      changes.building.currentValue.typology.categoryCode ) {
      console.log('Entre al score!!! ', changes.building.currentValue);
      this.building = changes.building.currentValue;
    }*/
  }

  /**
   *  Added the property selected as a favorite in user history
   * @param building
   */
  addToFavorites( building: Building ): void{
    const enveloped = [];
    let i = 0;
    building.typology.enveloped.forEach( env => {
      enveloped[i] = env.envelopedCode;
      i++;
    });
    /*const system = [];
    building.typology.system.forEach( sys => {
      system.push(sys.codeSystemMeasure);
    });*/
    const scoreChart = [];
    building.typology.energy.scoreSystem.forEach( sc => {
      scoreChart.push(sc.scoreChartCode);
    });
    const propToSave = {
      rc: building.rc ? building.rc : '-',
      address: building.address,
      uid: this.currentUser.uid,
      lat: +building.coordinates.lat,
      lng: +building.coordinates.lng,
      year: building.year,
      use: building.use,
      surface: building.surface,
      country: building.country,
      climate_zone: building.climateZone,
      climate_sub_zone: building.climateSubZone,
      region: building.region,
      province_code: building.provinceCode,
      province_name: building.region,
      altitude_code: building.altitudeCode,
      x: building.point.x,
      y: building.point.y,
      year_code: building.typology.yearCode,
      typology_code: building.typology.categoryCode,
      typology_name: building.typology.categoryName,
      building_code: building.typology.buildingCode,
      enveloped,
      //system,
      score_chart: scoreChart,
      energy_score_code: building.typology.energy.energyScoreCode
    };
    if ( this.isUserLogged ) {
      this.userService.addPropertyToHistory(propToSave).subscribe( res => {
        if ( res['id'] ) {
          if ( !this.history ) {
            this.history = [];
          }
          this.history.push( building );
          this.building.favorite = true;
        }
      });
    }
  }

  removeFromFavorites( building: Building): void{
    if ( this.isUserLogged ) {
      this.userService.removePropertyFromHistory( building.rc,  this.currentUser.uid).subscribe( res => {
        this.history.forEach( prop => {
          if ( prop.rc === building.rc ) {
            const index = this.history.indexOf(prop, 0);
            this.history.splice(index, 1);
            return;
          }
        });
      });
    }
  }
  prepareDataForChart(): void {
    this.building.typology.energy.scoreSystem.forEach( system => {
      if ( system.system !== 'Total' ) {
        Object.keys(this.dataChart).forEach(key => {
          if ( this.dataChart[key].name === 'Demand') {
            this.dataChart[key].series.push({
              name: system.system,
              value: system.demand
            });
          } else if ( this.dataChart[key].name === 'Final Energy') {
            this.dataChart[key].series.push({
              name: system.system,
              value: system.finalEnergy
            });
          } else if ( this.dataChart[key].name === 'Primary Energy') {
            this.dataChart[key].series.push({
              name: system.system,
              value: system.primaryEnergy
            });
          } else if ( this.dataChart[key].name === 'Emissions') {
            this.dataChart[key].series.push({
              name: system.system,
              value: system.emissions
            });
          }
        });
      }
    });
  }
  getRefurbishment(): void {
    this.typologyService.getRefurbishment(this.building.typology.categoryPicCode).subscribe( refurbishments => {
      Object.values(refurbishments).forEach( ref => {
        if ( ref.improving_building.level_improvement === 'Standard') {
          this.building.refurbishment.envelopedStandard.push( new Envelope(ref.component_code, ref.measure.component_type.name,
            ref.measure.description_measure_type,
            ref.measure.u_value, ref.measure.picture, ref.measure.component_type.name));
        } else if (ref.improving_building.level_improvement === 'Advanced' ) {
          this.building.refurbishment.envelopedAdvanced.push(new Envelope(ref.component_code, ref.measure.component_type.name,
            ref.measure.description_measure_type,
            ref.measure.u_value, ref.measure.picture, ref.measure.component_type.name));
        }
      });
    });
  }

  getSystemRefurbishment(): void {
    this.typologyService.getSystemRefurbishment(this.building.typology.categoryPicCode,
      this.building.typology.system.codeSystemMeasure).subscribe( systemRe => {
      Object.values(systemRe).forEach( ref => {
        console.log('CAda systema', ref);
        if ( ref.level_improvement === 'Standard') {
          this.building.refurbishment.systemStandard = new SystemType(
            ref.code_system_measure, ref.system_measure.description_actual_conditions,
            ref.system_measure.original_description_aconditions, []);
          this.building.refurbishment.systemStandard.systems.push(new System( 'Heating',
            ref.heating.system_code, ref.heating.system_description,
            ref.heating.system_description_original, ref.heating.picture));
          this.building.refurbishment.systemStandard.systems.push(new System( 'Water',
            ref.water.system_code, ref.water.system_description,
            ref.water.system_description_original, ref.water.picture));
          this.building.refurbishment.systemStandard.systems.push(new System( 'Ventilation',
            ref.ventilation.system_code, ref.ventilation.system_description,
            ref.ventilation.system_description_original, ref.ventilation.picture));
        } else if (ref.level_improvement === 'Advanced' ) {
          this.building.refurbishment.systemAdvanced = new SystemType(
            ref.code_system_measure, ref.system_measure.description_actual_conditions,
            ref.system_measure.original_description_aconditions, []);
          this.building.refurbishment.systemAdvanced.systems.push(new System( 'Heating',
            ref.heating.system_code, ref.heating.system_description,
            ref.heating.system_description_original, ref.heating.picture));
          this.building.refurbishment.systemAdvanced.systems.push(new System( 'Water',
            ref.water.system_code, ref.water.system_description,
            ref.water.system_description_original, ref.water.picture));
          this.building.refurbishment.systemAdvanced.systems.push(new System( 'Ventilation',
            ref.ventilation.system_code, ref.ventilation.system_description,
            ref.ventilation.system_description_original, ref.ventilation.picture));
        }
      });
    });
  }
}
