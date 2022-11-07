import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

import { AngularFireAuth } from '@angular/fire/auth';
import {UserService} from '../../core/authentication/user.service';
import { Router } from '@angular/router';
import {Building} from '../../shared/models/building';
import {Envelope} from '../../shared/models/envelope';
import {System} from '../../shared/models/system';
import {SystemType} from '../../shared/models/systemType';
import {Efficiency} from '../../shared/models/eficiency';
import {Typology} from '../../shared/models/typology';
import { Tools } from 'src/app/shared/models/tools';

import {User} from '../../shared/models/user';
import { ToolsService } from 'src/app/core/tools/tools.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ToolsModalComponent } from 'src/app/components/tools-modal/tools-modal.component';
import { BuildingModalComponent } from 'src/app/components/building-modal/building-modal.component';

@Component({
  selector: 'app-user-account',
  templateUrl: './user-account.component.html',
  styleUrls: ['./user-account.component.scss']
})

export class UserAccountComponent implements OnInit {

  isUserLogged: boolean;
  tools: Tools[] = [];
  tmpTools: Tools[] = [];
  userHistory: Building[];
  userTools: Tools[];
  stopSelectd: string;
  deletedBuilding: boolean;
  deletedTool: boolean;
  modalRef: BsModalRef;
  countryOneClick: string;
  filterCountries: string[];
  filterTypologies: { code: string, name: string}[];
  filters = {countries: [], typologies: [], profiles: [], solutions: [], steps: [], stops: []};
  filterYears: string[];
  tmpUserHistory: Building[];
  tmpUserTools: Tools[];

  countryControl: boolean;
  countrySelected: string;

  yearControl: boolean;
  yearSelectedMin: any;
  yearSelectedMax: any;

  typologyControl: boolean;
  typologySelected: string;
  searchText: any;
  filterApplied: string[];
  filterApplied2: string[];
  @Input() optionSelected: number;
  @Output() historyEmitter = new EventEmitter<any>();
  @Output() historyEmitter2 = new EventEmitter<any>();
  @Output() buildingSelectedEmitter = new EventEmitter<any>();
  @Output() buildingToBeUpdatedEmitter = new EventEmitter<any>();

  @Input() currentUser: User = new User();
  @Output() logoutEmitter = new EventEmitter<any>();
  constructor( private afAuth: AngularFireAuth, private userService: UserService, private router: Router, private toolsService: ToolsService, private modalService: BsModalService) {
    this.checkLogin();
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.buildHistory();
        this.buildHistoryTools();
      }
    });
   }

  ngOnInit(): void {
    this.filterApplied = [];
    this.filterApplied2 = [];
    this.getTools();
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

  removeToolFromUserHistory(tool: Tools): void {
    this.userService.deletePropertyToolFromHistory( tool.id, localStorage.getItem('auth-token')).subscribe( () => {
      this.deletedTool = true;
      this.buildHistoryTools();
      setTimeout( () => {
        this.deletedTool = false;
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
      console.log(this.tmpUserHistory);
    });
  }

  buildHistoryTools() {
    this.userService.getUserTools(localStorage.getItem('auth-token')).subscribe( hist => {
      this.userTools = [];
      for (const histKey in hist) {
        this.parseToolHistory(hist[histKey]);
      }
      this.tmpUserTools = this.userTools;
      this.historyEmitter2.emit(this.userTools);
      console.log(this.tmpUserTools);
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

  parseToolHistory(history: any) {
    const dataTool = history;

    this.userTools.push(new Tools(dataTool.tool.tools_application.id, dataTool.tool.tools_application.name, dataTool.tool.tools_application.login_access, dataTool.tool.tools_application.url, dataTool.tool.tools_application.short_description, 
      dataTool.tool.tools_application.long_description,
      dataTool.tool.tools_application.image, dataTool.tool.tools_application.wurl, dataTool.tool.tools_application.countries, dataTool.tool.tools_application.typologies, 
      dataTool.tool.tools_application.profiles, dataTool.tool.tools_application.solutions,
      dataTool.tool.tools_application.steps, dataTool.tool.tools_application.stops));
  }

  getTools() {
    this.toolsService.getTools2().subscribe( data => {
      this.buildToolsInformation(data);
      this.tools.forEach( tool => {
        this.tmpTools.push(tool);
      });
    });
  }

  buildToolsInformation(data) {
    data.forEach( tool => {
      const countries = [];
      const profiles = [];
      const solutions = [];
      const typologies = [];
      const steps = [];
      const stops = [];
      tool.tools_typologies.forEach( typology => {
        typologies.push({id: typology.id, typology: typology.typology});
        if (this.filters.typologies.length === 0 || !this.filters.typologies.find(item => item.id === typology.id)){
          this.filters.typologies.push({id: typology.id, typology: typology.typology});
        }
      });
      tool.tools_profiles.forEach( profile => {
        profiles.push({id: profile.id, profile: profile.profile});
        if (this.filters.profiles.length === 0 || !this.filters.profiles.find(item => item.id === profile.id)){
          this.filters.profiles.push({id: profile.id, profile: profile.profile});
        }
      });
      tool.tools_stops.forEach( stop => {
        stops.push({id: stop.id, stop: stop.stop});
        if (this.filters.stops.length === 0 || !this.filters.stops.find(item => item.id === stop.id)){
          this.filters.stops.push({id: stop.id, stop: stop.stop});
        }
      });
      tool.tools_steps.forEach( step => {
        steps.push({id: step.id, step: step.step});
        if (this.filters.steps.length === 0 || !this.filters.steps.find(item => item.id === step.id)){
          this.filters.steps.push({id: step.id, step: step.step});
        }
      });
      tool.tools_solutions.forEach( solution => {
        solutions.push({id: solution.id, solution: solution.solution});
        if (this.filters.solutions.length === 0 || !this.filters.solutions.find(item => item.id === solution.id)){
          this.filters.solutions.push({id: solution.id, solution: solution.solution});
        }
      });
      const info = new Tools(
        tool.id,
        tool.name,
        tool.login_access,
        tool.url,
        tool.short_description,
        tool.long_description,
        tool.image,
        tool.wurl,
        countries,
        typologies,
        profiles,
        solutions,
        steps,
        stops
      );
      this.tools.push(info);
    });
  }

  applyFilter2(): void {
    let toolsTmp = [];
    this.tools.forEach( tool => {
      toolsTmp.push(tool);
    });
    this.filterApplied.forEach( filter => {
      if (filter === 'stops') {
        const filterByStops  = [];
        this.tools.forEach( tool => {
          const hasStop = tool.stops.find( (item, i) => {
            if (item.id === this.stopSelectd){
              return true;
            }
          });
          if( hasStop ) {
            filterByStops.push(tool);
          }
        });
        toolsTmp = this.removeElementsFromArray2(toolsTmp, filterByStops);
      }
    });
    this.tmpTools = toolsTmp;
  }

  removeElementsFromArray2(arrayInit, element) {
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

  filter2(type: string): void {
    if ( ( type === 'stops' && this.stopSelectd !== null )){
      const indexFilterApplied = this.filterApplied.indexOf(type);
      if (indexFilterApplied < 0) {
        this.filterApplied.push(type);
      }
    } else {
      this.cleanFilter(type);
    }
    this.applyFilter2();
  }

  checkLogin(): void {
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.isUserLogged = true;
        this.currentUser = new User(user);
        console.log('user 2!! ',  new User(user));
        this.userService.getByUid(user.uid).subscribe(userFromDB => {
          if (userFromDB) {
            this.currentUser.name = userFromDB['user'].name;
            this.currentUser.role = userFromDB['role'].name;
          }
        });
      } else {
        this.isUserLogged = false;
      }
    });
  }

  logout(): void {
    this.afAuth.signOut().then( out => {
      this.logoutEmitter.emit(true);
      this.router.navigate(['/', 'home'])
    });
  }

  openModal(tool: Tools) {
    this.modalRef = this.modalService.show(ToolsModalComponent,
      { class: 'modal-dialog-centered modal-lg',
        ignoreBackdropClick: true,
        initialState: { tool}});
    this.modalRef.content.closeBtnName = 'Close';
  }

  openBuildingModal(building: Building) {
    this.modalRef = this.modalService.show(BuildingModalComponent,
      { class: 'modal-dialog-centered modal-lg',
        ignoreBackdropClick: true,
        initialState: { building}});
    this.modalRef.content.closeBtnName = 'Close';
  }

  goToOneClick(): void {
    this.router.navigate(['/oneclick'], {state: {country: this.countryOneClick}});
  }

  dataValues(){
    if(this.tmpUserTools[0].name === 'DRIVE-0 autoevaluation'){
      let elem = (document.getElementById("data-image"));
      elem.innerHTML += "<img class='logo-tool' src='./assets/img/tools/cropped-circular.png' width='50' height='50' alt='Logo tool'>";
    }else{
      let elem = (document.getElementById("data-image"));
      elem.innerHTML += "<img src='./assets/img/tools/camera-icon.jpeg' height='50' width='150' class='card-img-top'>";
    }
  }
}
