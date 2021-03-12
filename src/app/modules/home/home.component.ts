import {Component, ElementRef, EventEmitter, OnInit, Output} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {Property} from '../../shared/models/property';
import {User} from '../../shared/models/user';
import {UserService} from '../../core/authentication/user.service';
import {TypologyService} from '../../core/typology/typology.service';
import {Typology} from '../../shared/models/typology';
import {GeodataService} from '../../core/wfs/geodata.service';
import {Building} from '../../shared/models/building';
import {$e} from 'codelyzer/angular/styles/chars';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  // general variables
  history: Building[];
  itemSelectedFromHistory: Building;
  building: Building;

  // map variables
  historyFilteredFromList: any;

  // cadastre-info variables
  properties: Property[];
  propertySelectedFormMap: Building;

  // typology variables
  typologies: Typology[];

  // control variables
  active: number;
  isUserLogged: boolean;
  currentUser: User = new User();
  showTypology: boolean;
  showMap = true;

  constructor( public afAuth: AngularFireAuth,
               private userService: UserService,
               private typologyService: TypologyService,
               private geodataService: GeodataService) {
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.isUserLogged = true;
        this.currentUser = new User(user);
        this.userService.getHistoryByUser(user.uid).subscribe( (hist: Building) => {
          this.history = [];
          Object.entries(hist).forEach( ([key, value]) => {
            this.history.push(new Building(value.country, value.climate_zone, value.year, value.region,
              value.address, { lat: value.lat, lng: value.lng}, [], value.rc, value.use, value.surface));
          });
        });
      } else {
        this.isUserLogged = false;
        this.history = [];
      }
    });
  }

  ngOnInit(): void {
    this.cleanVariables();
  }

  refreshFavorites(): void {
    this.history = null;
    this.showTypology = false;
    this.userService.getHistoryByUser(this.currentUser.uid).subscribe( (hist: Building ) => {
      this.history = [];
      Object.entries(hist).forEach( ([key, value]) => {
        this.history.push(new Building(value.country, value.climate_zone, value.year, value.region,
          value.address, { lat: value.lat, lng: value.lng}, [], value.rc, value.use, value.surface));
      });
      this.itemSelectedFromHistory = null;
      this.propertySelectedFormMap = null;
    });
  }
  receivePoint($event): void {
    this.properties = $event;
    if (this.properties.length > 0 ){
      this.building.year = this.properties[0].yearConstruction;
      this.building.address = this.properties[0].address;
      this.building.region = this.properties[0].province;
    }
    this.building.properties = this.properties;
    this.active = 1;
    this.showTypology = false;
  }
  receivePropSelected($event): void {
    this.propertySelectedFormMap = $event;
    this.showTypology = false;
    this.active = 1;
  }
  receivePropFromHistory($event): void{
    this.itemSelectedFromHistory = $event;
    this.showTypology = false;
    this.active = 1;
  }
  receiveHistoryFiltered($event): void{
    this.historyFilteredFromList = $event;
  }
  receiveCoordinates($event): void {
    this.building = new Building('', '', '', '', '', $event, [], '', '', '');
    this.calculateGeoData($event);
  }
  calculateTypology($event: Building): void{
    this.showTypology = true;
    this.building = $event;
    this.typologies = [];
    this.typologyService.getTypologyPics(this.building.year, this.building.country, this.building.climateZone).subscribe( res => {
      Object.values(res).forEach( cat => {
        const category = new Typology(cat.category.category_code, cat.category.name,
          cat.year.year_code, cat.name,  this.building.climateZone,  this.building.country, cat.category.building_code, null, null);
        this.typologies.push(category);
      });
    });
  }
  cleanVariables(): void {
    this.properties = [];
    this.building = null;
    this.itemSelectedFromHistory = null;
    this.propertySelectedFormMap = null;
    this.active = 1;
    this.showTypology = false;
  }
  calculateGeoData(coordinates: any[]): void {
    this.geodataService.getCountries(coordinates['lat'], coordinates['lng']).subscribe(resCountry => {
      this.geodataService.getClimateZones(coordinates['lat'], coordinates['lng']).subscribe(resClimate => {
        if (resCountry.features.length === 1 &&  resClimate.features.length === 1) {
          this.building.country = resCountry.features[0].properties.iso_2digit;
          this.building.climateZone = resClimate.features[0].properties.code;
        }
        console.log('respuesta servicio!!! ', this.building);
      });
    });
  }
  showMapControl($event: boolean): void{
    this.showMap = $event;
  }
}
