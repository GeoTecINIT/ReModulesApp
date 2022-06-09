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
import {Refurbishment} from '../../shared/models/refurbishment';

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
  showMap: boolean;
  showBuildingInfo: boolean;
  updateBuilding: boolean;

  optionSelected: number;
  stepSelected: string;

  SPAIN = 'ES';
  constructor( public afAuth: AngularFireAuth,
               private userService: UserService,
               private route: ActivatedRoute,
               private typologyService: TypologyService,
               private geodataService: GeodataService,
               private opendataService: OpendataService,
               private router: Router) {
    this.totalHistory = [];

    this.building =  new Building('', '', '',  null, '', '', '', '',
      {lat: '', lng: ''}, { x: null, y: null}, [], '', '', 0, null, false, null, [], 0);
    this.checkLogin();
  }

  ngOnInit(): void {
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

  receiveLogOut($event) {
    if ( $event ) {
      this.afAuth.signOut();
      this.currentUser = null;
      this.isUserLogged = false;
      this.optionSelected = 1;
      this.router.routeReuseStrategy.shouldReuseRoute = () => {
        return true;
      };
    }
  }
  receivePropFromHistory($event): void{
    this.building = $event;
    this.fromHistory = true;
    //this.showTypology = false;
    this.active = 1;
  }

  receiveCoordinates($event): void {
    this.calculateGeoData($event);
    this.active = 1;
    this.showMap = true;
    this.showBuildingInfo = true;
    this.optionSelected = 2;
    this.updateBuilding = false;
    this.stepSelected = 'infoBuilding';
  }
  calculateTypology($event): void{
    this.typologies = [];
    this.subcategoriesTypo = [];
    //this.showTypology =  !($event.typology && $event.typology.energy && $event.typology.energy.energyScoreCode);
    if ($event.selected) {
      this.showMap = true;
      this.stepSelected = 'typology';
    }
    if ( !$event.building.typology || ( $event.building.typology && !$event.building.typology.categoryCode ) ) {
      this.typologyService.getTypologyPics($event.building.year, $event.building.country, $event.building.climateZone).subscribe(res => {
        this.typologies = [];
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
    console.log('home cleaning variables');
    this.properties = [];
    this.active = 1;
    this.stepSelected = '';
    this.showBuildingInfo = false;
    this.fromHistory = false;
    this.optionSelected = 0;
    this.updateBuilding = false;
  }
  calculateGeoData(elementsFromMap): void {
    const coordinates = elementsFromMap.latlng;
    let buildingTmp = null;
    //buildingTmp = new Building('', '', '',  null, '', '', '', '',
    //  {lat: '', lng: ''}, { x: null, y: null}, [], '', '', 0, null, false,  null, []);
    //buildingTmp.address = elementsFromMap.address;
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
                nameRegion , region, elementsFromMap.address,
                altitude, coordinates, point, [], '',
                '', 0, null, false, null, [], 0);
            });
          });
        } else if ( country === 'NL') {
          point = { x: elementsFromMap.point.ESPG28992.x, y: elementsFromMap.point.ESPG28992.y};
          this.building =  new Building(country, climateZone, '', '',
            nameRegion, region, elementsFromMap.address,
            '', coordinates, point, [], '',
            '', 0, null, false, null, [], 0);
        } else {
          point = { x: elementsFromMap.point.ESPG25830.x, y: elementsFromMap.point.ESPG25830.y};
          this.building =  new Building(country, climateZone, '', '',
            nameRegion, region, elementsFromMap.address,
            '', coordinates, point, [], '',
            '', 0, null, false, null, [], 0);
        }
      });
  }
  showMapControl($event: boolean): void{
    this.showMap = $event;
  }

  receiveCalculateEnergy($event): void {
    this.stepSelected = 'result';
    if ( !$event.climateSubZone ) {
      $event.climateSubZone = 'NA';
    }
  }
  receiveErrorFromTypology($event){
    this.error = $event;
  }

  receiveLogin($event){
    if ($event) {
      this.checkLogin();
      this.optionSelected = 0;
      this.stepSelected = '';
    }
  }
  receiveHistory($event) {
    this.history = null;
    this.history = $event;
  }
  receiveBuilding($event) {
    this.building = $event;
    this.building.refurbishment = new Refurbishment([], [], new SystemType('', '', '', []), new SystemType('', '', '', []));
    this.optionSelected = 2;
    this.active = 1;
    this.stepSelected = 'result';
    this.updateBuilding = false;
    if ( !$event.climateSubZone ) {
      $event.climateSubZone = 'NA';
    }
  }
  receiveBuildingToUpdate($event) {
    this.showMap = true;
    this.showBuildingInfo = true;
    this.stepSelected = 'infoBuilding';
    this.optionSelected = 2;
    this.updateBuilding = true;
    this.resetBuildingByCountry($event);
  }
  resetBuildingByCountry(building: Building) {
    if ( building.country === 'ES') {
      building.typology.system = null;
    } else {
      building.typology = null;
    }
    this.building = building;
  }
  receiveOption($event): void {
    this.stepSelected = $event;
  }
}
