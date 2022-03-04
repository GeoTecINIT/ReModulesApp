import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Building} from '../../shared/models/building';
import {AngularFireAuth} from '@angular/fire/auth';
import {UserService} from '../../core/authentication/user.service';
import {Envelope} from '../../shared/models/envelope';
import {System} from '../../shared/models/system';
import {SystemType} from '../../shared/models/systemType';
import {Efficiency} from '../../shared/models/eficiency';
import {Typology} from '../../shared/models/typology';

@Component({
  selector: 'app-user-history',
  templateUrl: './user-history.component.html',
  styleUrls: ['./user-history.component.scss']
})
export class UserHistoryComponent implements OnInit {

  userHistory: Building[];
  @Input() optionSelected: number;
  @Output() historyEmitter = new EventEmitter<any>();
  @Output() buildingSelectedEmitter = new EventEmitter<any>();
  constructor(
    public afAuth: AngularFireAuth,
    private userService: UserService,
  ) {
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.userService.getUserHistory(localStorage.getItem('auth-token')).subscribe( hist => {
          this.userHistory = [];
          for(const histKey in hist) {
            this.parseHistory(hist[histKey]);
          }
          this.historyEmitter.emit(this.userHistory);
        });
      }
    });
  }

  ngOnInit(): void {
  }

  showBuildingResults(building: Building): void {
    this.buildingSelectedEmitter.emit(building);
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
      new Typology(dataBuilding.category_code, '', dataBuilding.category_pic_code, '', dataBuilding.year_code, '',
        dataBuilding.building_code, enveloped, systemType, null), true, null, efficiency));
  }

}
