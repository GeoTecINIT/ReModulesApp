import {Component, ElementRef, EventEmitter, OnInit, Output} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {Property} from '../../shared/models/property';
import {User} from '../../shared/models/user';
import {UserService} from '../../core/authentication/user.service';
import {TypologyService} from '../../core/typology/typology.service';
import {Typology} from '../../shared/models/typology';
import {GeodataService} from '../../core/wfs/geodata.service';
import {Building} from '../../shared/models/building';
import {OpendataService} from '../../core/opendata/opendata.service';
import {Observable} from 'rxjs';
import 'rxjs/add/observable/forkJoin';
import {Energy} from '../../shared/models/energy';
import {SystemType} from '../../shared/models/systemType';
import {ScoreSystem} from '../../shared/models/scoreSystem';
import {Envelope} from '../../shared/models/envelope';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {$e} from 'codelyzer/angular/styles/chars';
import {LoginComponent} from '../login/login.component';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  // general variables
  history: Building[];
  totalHistory: Building[];
  building: Building;
  error: string;

  // map variables
  historyFilteredFromList: any;

  // cadastre-info variables
  properties: Property[];

  // typology variables
  typologies: Typology[];
  subcategoriesTypo: any[];

  fromHistory: boolean;

  // control variables
  active: number;
  isUserLogged: boolean;
  currentUser: User = new User();
  showTypology: boolean;
  showMap: boolean;
  showBuildingInfo: boolean;
  showEnergy: boolean;
  energyScore: boolean;

  modalRef: BsModalRef;
  optionSelected: number;

  SPAIN = 'ES';
  constructor( public afAuth: AngularFireAuth,
               private userService: UserService,
               private route: ActivatedRoute,
               private typologyService: TypologyService,
               private geodataService: GeodataService,
               private opendataService: OpendataService,
               private modalService: BsModalService,
               private router: Router) {
    this.totalHistory = [];

    this.building =  new Building('', '', '',  null, '', '', '', '',
      {lat: '', lng: ''}, { x: null, y: null}, [], '', '', 0, null, false, null, []);
    // GET the entire history
    /*this.userService.getAllHistory().subscribe( hist => {
      const totalHistoryTmp = [];
      for (let histKey in hist) {
        //totalHistoryTmp.push(this.convertBuildingFromRequest(hist[histKey]));
      }
      this.totalHistory = totalHistoryTmp;
    });*/
  }

  ngOnInit(): void {
    this.modalService.onHide.subscribe((e) => {
      this.checkLogin();
    });
    this.cleanVariables();
  }

  checkLogin(): void {
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.isUserLogged = true;
        this.currentUser = new User(user);
        this.userService.getByUid(user.uid).subscribe(userFromDB => {
          if (userFromDB) {
            this.currentUser.name = userFromDB['user'].name;
            this.currentUser.role = userFromDB['role'].name;
          }
        });
      } else {
        this.isUserLogged = false;
        this.history = [];
      }
    });
  }

  openModal() {
    this.modalRef = this.modalService.show(LoginComponent, { class: 'modal-lg' });
  }
  logOut() {
    this.afAuth.signOut();
    this.router.routeReuseStrategy.shouldReuseRoute = () => {
      return false;
    };
  }

  refreshFavorites(): void {
    this.history = null;
    //this.showMap = true;
    //this.showTypology = false;
    this.energyScore = false;
    this.fromHistory = false;
    this.active = 2;
    this.userService.getHistoryByUser(this.currentUser.uid).
    subscribe( (hist: Building ) => {
      this.fillHistory(hist);
    });
  }
  receiveBuildingFromMap($event): void {
    if ( $event.country !== null && !$event.typology && !$event.favorite) {
      let country = $event.country;
      let climateZone = $event.climateZone;
      let climateSubZone = $event.climateSubZone;
      let provinceCode = $event.provinceCode;
      let altitude = $event.altitude;
      if ( this.building.country && this.building.climateZone  ){
        country = this.building.country;
        climateZone = this.building.climateZone;
        climateSubZone = this.building.climateSubZone;
        provinceCode = this.building.provinceCode;
        altitude = this.building.altitudeCode;
      }
      this.building = null;
      this.building = new Building(country, climateZone, climateSubZone, $event.year,
        $event.region, provinceCode, $event.address, altitude, $event.coordinates, $event.point, $event.properties, $event.rc,
        $event.use, null, null, false, null, []);
    }
    else if ( $event.typology && $event.favorite) {
      this.building = $event;
    }
    this.properties = $event.properties;
    this.active = 1;
    this.showMap = true;
    //this.showTypology = false;
    this.fromHistory = false;
    this.showBuildingInfo = true;
  }
  receivePropFromHistory($event): void{
    this.building = $event;
    this.fromHistory = true;
    //this.showTypology = false;
    this.active = 1;
  }
  receiveHistoryFiltered($event): void{
    this.historyFilteredFromList = $event;
  }
  receiveCoordinates($event): void {
    this.calculateGeoData($event);
    this.active = 1;
    this.showMap = true;
    this.showBuildingInfo = true;
    this.showTypology = false;
  }
  calculateTypology($event): void{
    this.typologies = [];
    this.subcategoriesTypo = [];
    //this.showTypology =  !($event.typology && $event.typology.energy && $event.typology.energy.energyScoreCode);
    if ($event.selected) {
      this.showTypology = true;
      this.showMap = true;
    }
    this.energyScore = !!($event.building.typology && $event.building.typology.energy && $event.building.typology.energy.energyScoreCode);
    /*
    this.showTypology =  !($event.typology && $event.typology.categoryCode);
    this.energyScore = !!($event.typology && $event.typology.categoryCode);*/
    if ( !$event.building.typology || ( $event.building.typology && !$event.building.typology.categoryCode ) ) {
      this.typologyService.getTypologyPics($event.building.year, $event.building.country, $event.building.climateZone).subscribe(res => {
        if ( Object.assign(res).length <= 4 ) {
          Object.values(res).forEach( cat => {
            const category = new Typology(cat.category.category_code, cat.category.name, cat.category_pic_code, cat.d_add_parameter,
              cat.year.year_code, cat.name,  cat.category.building_code, null, null, null);
            this.typologies.push(category);
            this.building.year = $event.building.year;
          });
        } else {
          this.subcategoriesTypo = [];
          const catTmp = [];
          const subCatTmp = [];
          Object.values(res).forEach( cat => {
            const category = new Typology(cat.category.category_code, cat.category.name, cat.category_pic_code, cat.d_add_parameter,
              cat.year.year_code, cat.name,  cat.category.building_code, null, null, null);
            if ( !catTmp || catTmp.length === 0) {
              catTmp.push(category);
              subCatTmp[category.categoryCode] =
                {category_pic_code : category.categoryPicCode, description: category.addParameterDescription, subcats: [] };
              subCatTmp[category.categoryCode].subcats.push(
                { category_pic_code : category.categoryPicCode, description: category.addParameterDescription, info: category});
            } else {
              let added = false;
              catTmp.forEach(typo => {
                if ( typo.categoryCode === category.categoryCode) {
                  added = true;
                }
              });
              if ( !added ) {
                catTmp.push(category);
                subCatTmp[category.categoryCode] =
                  {category_pic_code : category.categoryPicCode, description: category.addParameterDescription, subcats: [] };
                subCatTmp[category.categoryCode].subcats.push(
                  { category_pic_code : category.categoryPicCode, description: category.addParameterDescription, info: category});
              } else {
                subCatTmp[category.categoryCode].subcats.push(
                  { category_pic_code : category.categoryPicCode, description: category.addParameterDescription, info: category});
              }
            }
          });
          this.building.year = $event.building.year;
          this.subcategoriesTypo = subCatTmp;
          this.typologies = catTmp;
        }
      });
    } else {
      //this.getBuildingData();
      //this.calculateEnergyEfficiency(this.building);
    }
  }
  cleanVariables(): void {
    this.properties = [];
    this.active = 1;
    this.showTypology = false;
    this.showBuildingInfo = false;
    this.fromHistory = false;
    this.showMap = false;
    this.optionSelected = 0;
  }
  calculateGeoData(elementsFromMap): void {
    const coordinates = elementsFromMap.latlng;
    let buildingTmp = null;
    if ( this.building ) {
      buildingTmp =  this.building;
    } else {
      buildingTmp = new Building('', '', '',  null, '', '', '', '',
        {lat: '', lng: ''}, { x: null, y: null}, [], '', '', 0, null, false,  null, []);
    }
    buildingTmp.address = elementsFromMap.address;
    Observable.forkJoin([
      this.geodataService.getCountries(coordinates.lat, coordinates.lng) ,
      this.geodataService.getClimateZones(coordinates.lat, coordinates.lng ),
      this.opendataService.getElevation(coordinates.lat, coordinates.lng),
      this.geodataService.getProvinces(coordinates.lat, coordinates.lng)]).subscribe( data => {
        const elevation = +data[2].results[0].elevation > 0 ? data[2].results[0].elevation : 0;
        const country = data[0].features[0].properties.iso_2digit;
        const climateZone = data[1].features.length > 0 ? data[1].features[0].properties.code : '';
        let region = '';
        if ( data[3].features.length > 0  &&  data[3].features[0].properties ){
          region = data[3].features[0].properties.cod_prov;
        } else if ( elementsFromMap.region !== ''){
          region = elementsFromMap.region;
        }
        const nameRegion = data[3].features.length > 0 ? data[3].features[0].properties.nombre : '';
        let point = null;
        if ( country === 'ES') {
          point = { x: elementsFromMap.point.ESPG25830.x, y: elementsFromMap.point.ESPG25830.y};
          this.typologyService.getAltitude(elevation, climateZone, country ).subscribe( resAltitude => {
            const altitude = resAltitude ? resAltitude['altitude_code'] : 0;
            this.typologyService.getClimateSubZone( altitude, region, climateZone, country ).subscribe( subZone => {
              const climateSubZoneRes = subZone ? subZone['climate_zone'] : '';
              this.building =  new Building(country, climateZone, climateSubZoneRes, '',
                nameRegion , region, buildingTmp.address,
                altitude, coordinates, point, [], buildingTmp.rc,
                '', 0, null, false, null, []);
            });
          });
        } else if ( country === 'NL') {
          point = { x: elementsFromMap.point.ESPG28992.x, y: elementsFromMap.point.ESPG28992.y};
          this.building =  new Building(country, climateZone, buildingTmp.climateSubZone, '',
            nameRegion, region, buildingTmp.address,
            buildingTmp.altitudeCode, coordinates, point, [], buildingTmp.rc,
            buildingTmp.use, buildingTmp.surface, buildingTmp.typology, false, null, []);
        } else {
          point = { x: elementsFromMap.point.ESPG25830.x, y: elementsFromMap.point.ESPG25830.y};
          this.building =  new Building(country, climateZone, buildingTmp.climateSubZone, '',
            nameRegion, region, buildingTmp.address,
            buildingTmp.altitudeCode, coordinates, point, [], buildingTmp.rc,
            buildingTmp.use, buildingTmp.surface, buildingTmp.typology, false, null, []);
        }
      });
  }
  showMapControl($event: boolean): void{
    this.showMap = $event;
  }

  /****
   * TODO Get from history category_pic_code
   *
   * ***/
  fillHistory( historyFromService ){
    this.history = [];
    Object.values(historyFromService).forEach( history => {
      const buildingData = history['building'];
      const envelope = [];
      const system = [];
      const scoreChart = [];
      const scoreSystem = history['energy_scores'][0];
      Object.values(history['envelopeds']).forEach( env => {
        envelope.push( new Envelope(env['enveloped_code'], '', env['description'], env['u_value'], env['picture'], ''));
      });
      Object.values(history['system_codes']).forEach( sys => {
        system.push( new SystemType(sys['system_type'], sys['system_code'], sys['description_system'], sys['pictures']));
      });
      Object.values(history['score_charts']).forEach( sch => {
        scoreChart.push( new ScoreSystem(sch['score_chart_code'], sch['demand'], sch['final_energy'],
          sch['primary_energy'], sch['emissions'], sch['system']));
      });
      const energy = new Energy(scoreSystem.energy_score_code, scoreSystem.emission_ranking, scoreSystem.consumption_ranking, scoreChart);
      const typology = new Typology( history['typology_code'], history['typology_name'], '',  '', history['year_code'], history['picture'],
        history['building_code'], envelope, /*system,*/null, energy);
      this.history.push( new Building( buildingData.country, buildingData.climate_zone, buildingData.climate_sub_zone, history['year'],
        buildingData.province_name, buildingData.province_code, buildingData.address, buildingData.altitude_code,
        { lat: buildingData.lat, lng: buildingData.lng}, { x: buildingData.x, y: buildingData.y}, [], buildingData.rc,
        buildingData.use, buildingData.surface, typology, true, null, []));
    });
  }
  receiveCalculateEnergy($event): void {
    this.showEnergy = true;
    this.showTypology = false;
    if ( !$event.climateSubZone ) {
      $event.climateSubZone = 'NA';
    }
  }

  /****
   * TODO Get from history category_pic_code
   *
   * ***/
  convertBuildingFromRequest(record: any ){
    const building = new Building(record.building.country, record.building.climate_zone, record.building.climate_sub_zone,
      record.year, record.building.province_name, record.building.province_code, record.building.address,
      record.building.altitude_code, { lng: record.building.lng, lat: record.building.lat}, {x: record.building.x, y: record.building.y },
      [], record.building.rc, record.building.use, record.building.surface, new Typology( record.typology_code,
        record.typology_name, '', '', record.year_code, '',
        record.building_code, [], null, new Energy(record.energy_scores[0].energy_score_code,
          record.energy_scores[0].emission_ranking, record.energy_scores[0].consumption_ranking, [])), true, null, []);
    record.envelopeds.forEach( env => {
      const envelopeToAdd = new Envelope(env.enveloped_code, null, env.description, env.u_value, env.picture, '');
      building.typology.enveloped.push(envelopeToAdd);
    });
    record.system_codes.forEach( sys => {
      const systemToAdd = new SystemType(sys.system_type, sys.system_code, sys.description_system, sys.picture);
     // building.typology.system.push(systemToAdd);
    });
    record.score_charts.forEach( sco => {
      const scoreToAdd = new ScoreSystem( sco.score_chart_code, sco.demand, sco.final_energy,
        sco.primary_energy, sco.emissions, sco.system);
      building.typology.energy.scoreSystem.push(scoreToAdd);
    });

    return building;
  }

  receiveErrorFromTypology($event){
    this.error = $event;
  }
  generalTab() {
    this.active = 1;
  }
}
