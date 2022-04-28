import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Envelope} from '../../shared/models/envelope';
import {System} from '../../shared/models/system';
import {SystemType} from '../../shared/models/systemType';
import {Efficiency} from '../../shared/models/eficiency';
import {Building} from '../../shared/models/building';
import {Typology} from '../../shared/models/typology';
import {AngularFireAuth} from '@angular/fire/auth';
import {UserService} from '../../core/authentication/user.service';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-data-map',
  templateUrl: './data-map.component.html',
  styleUrls: ['./data-map.component.scss']
})
export class DataMapComponent implements OnInit {

  userHistory: Building[];
  typologyChart: typeof Highcharts = Highcharts;
  chartOptionsTypology: Highcharts.Options;
  @Input() optionSelected: number;
  @Output() historyEmitter = new EventEmitter<any>();
  constructor(
    public afAuth: AngularFireAuth,
    private userService: UserService
  ) {
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.buildHistory();
      }
    });
  }

  ngOnInit(): void {
  }


  buildHistory() {
    this.userService.getUserHistory(localStorage.getItem('auth-token')).subscribe( hist => {
      this.userHistory = [];
      for (const histKey in hist) {
        this.parseHistory(hist[histKey]);
      }
      this.historyEmitter.emit(this.userHistory);
      this.buildCharts();
    });
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
  buildCharts() {
    const typologies = [];
    const categories = [];
    const data = [];
    this.userHistory.forEach( ( hist) => {
      if (categories.length === 0 || !categories.find(item => item === hist.typology.categoryCode)) {
        categories.push(hist.typology.categoryCode);
        typologies[hist.typology.categoryCode] = 1;
      } else if (categories.find(item => item === hist.typology.categoryCode)) {
        typologies[hist.typology.categoryCode] = typologies[hist.typology.categoryCode] + 1;
      }
    });
    Object.entries(typologies).forEach(([key, value]) => {
      data.push(value);
    });
    this.chartOptionsTypology = this.buildTypologyChart(categories, data);
  }
  buildTypologyChart(categories, data): any {
    return {
      chart: {
        type: 'column',
        height: 250,
        width: 300
      },
      xAxis: {
        title: 'Typologies',
        categories

      },
      yAxis: {
        min: 0,
        title: {
          text: 'Number of buildings'
        }
      },
      legend: {
        enabled: false
      },
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0
        }
      },
      title: {
        text: ''
      },
      tooltip: {
        headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
        pointFormat: '<tr><td style="color:{series.color};padding:0">{point.key} </td>' +
          '<td style="padding:0"><b>{point.y}</b></td></tr>',
        footerFormat: '</table>',
        shared: true,
        useHTML: true
      },
      series: [
        {
          colorByPoint: true,
          data
        }
      ]
    };
  }
}
