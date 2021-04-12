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
import {OpendataService} from '../../core/opendata/opendata.service';
import {Observable} from 'rxjs';
import 'rxjs/add/observable/forkJoin';
import {Energy} from '../../shared/models/energy';
import {SystemType} from '../../shared/models/systemType';
import {ScoreSystem} from '../../shared/models/scoreSystem';
import {CadastreService} from '../../core/cadastre/cadastre.service';
import {DomSanitizer} from '@angular/platform-browser';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  // general variables
  history: Building[];
  building: Building;

  // map variables
  historyFilteredFromList: any;

  // cadastre-info variables
  properties: Property[];

  // typology variables
  typologies: Typology[];

  fromHistory: boolean;

  // control variables
  active: number;
  isUserLogged: boolean;
  currentUser: User = new User();
  showTypology: boolean;
  showMap = true;
  energyScore: boolean;

  SPAIN = 'ES';
  constructor( public afAuth: AngularFireAuth,
               private userService: UserService,
               private typologyService: TypologyService,
               private geodataService: GeodataService,
               private opendataService: OpendataService,
               private cadastreService: CadastreService,
               private sanitizer: DomSanitizer) {
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.isUserLogged = true;
        this.currentUser = new User(user);
        this.userService.getHistoryByUser(user.uid).subscribe( (hist: Building) => {
          this.fillHistory(hist);
        });
      } else {
        this.isUserLogged = false;
        this.history = [];
      }
    });
    this.building =  new Building('', '', '',  null, '', '', '', '', {lat: '', lng: ''}, { x: null, y: null}, [], '', '', 0, null);
  }

  ngOnInit(): void {
    this.cleanVariables();
  }

  refreshFavorites(): void {
    this.history = null;
    this.showMap = true;
    this.showTypology = false;
    this.energyScore = false;
    this.fromHistory = false;
    this.userService.getHistoryByUser(this.currentUser.uid).subscribe( (hist: Building ) => {
      this.fillHistory(hist);
    });
  }
  receivePoint($event): void {
    if ( $event.country !== null ) {
      let country = $event.country;
      let climateZone = $event.climateZone;
      let climateSubZone = $event.climateZone;
      let provinceCode = $event.provinceCode;
      let altitude = $event.altitude;
      if ( this.building.country && this.building.climateZone ){
        country = this.building.country;
        climateZone = this.building.climateZone;
        climateSubZone = this.building.climateSubZone;
        provinceCode = this.building.provinceCode;
        altitude = this.building.altitudeCode;
      }
      this.building = null;
      this.building = new Building(country, climateZone, climateSubZone, $event.year,
        $event.region, provinceCode, $event.address, altitude, $event.coordinates, $event.point, $event.properties, $event.rc,
        $event.use, null, null);
    }
    this.properties = $event.properties;
    this.active = 1;
    this.showTypology = false;
    this.fromHistory = false;
  }
  receivePropFromHistory($event): void{
    this.building = $event;
    this.fromHistory = true;
    this.showTypology = false;
    this.active = 1;
  }
  receiveHistoryFiltered($event): void{
    this.historyFilteredFromList = $event;
  }
  receiveCoordinates($event): void {
    this.calculateGeoData($event);
  }
  calculateTypology($event: Building): void{
    this.showTypology = true;
    this.energyScore = false;
    if ( !$event.typology || ( $event.typology && !$event.typology.categoryCode ) ) {
      this.typologies = [];
      this.typologyService.getTypologyPics($event.year, $event.country, $event.climateZone).subscribe(res => {
        Object.values(res).forEach( cat => {
          const category = new Typology(cat.category.category_code, cat.category.name,
            cat.year.year_code, cat.name,  $event.climateZone,  $event.country, cat.category.building_code, null, null, null);
          this.typologies.push(category);
          this.building.year = $event.year;
        });
      });
    }
  }
  cleanVariables(): void {
    this.properties = [];
    this.active = 1;
    this.showTypology = false;
    this.fromHistory = false;
  }
  calculateGeoData(elementsFromMap): void {
    const coordinates = elementsFromMap.latlng;
    const x = elementsFromMap.x;
    const y = elementsFromMap.y;
    const buildingTmp = this.building;
    buildingTmp.address = elementsFromMap.address;
    Observable.forkJoin([
      this.geodataService.getCountries(coordinates.lat, coordinates.lng) ,
      this.geodataService.getClimateZones(coordinates.lat, coordinates.lng ),
      this.opendataService.getElevation(coordinates.lat, coordinates.lng),
      this.geodataService.getProvinces(coordinates.lat, coordinates.lng)]).subscribe( data => {
        const elevation = +data[2].results[0].elevation > 0 ? data[2].results[0].elevation : 0;
        const country = data[0].features[0].properties.iso_2digit;
        const climateZone = data[1].features[0].properties.code;
        const region = data[3].features.length > 0 ? data[3].features[0].properties.cod_prov : '';
        const nameRegion = data[3].features.length > 0 ? data[3].features[0].properties.nombre : '';
        if (country === this.SPAIN ) {
            this.typologyService.getAltitude(elevation, climateZone, country ).subscribe( resAltitude => {
              const altitude = resAltitude['altitude_code'];
              this.typologyService.getClimateSubZone( altitude, region, climateZone, country ).subscribe( subZone => {
                this.building =  new Building(country, climateZone, subZone['climate_zone'], buildingTmp.year,
                  nameRegion , region, buildingTmp.address,
                  altitude, coordinates, { x, y}, [], buildingTmp.rc,
                  '', 0, null);
              });
            });
        }
        else {
          this.building =  new Building(country, climateZone, buildingTmp.climateSubZone, buildingTmp.year,
            buildingTmp.region, region, buildingTmp.address,
            buildingTmp.altitudeCode, coordinates, { x, y}, buildingTmp.properties, buildingTmp.rc,
            buildingTmp.use, buildingTmp.surface, buildingTmp.typology);
        }
      });
  }
  showMapControl($event: boolean): void{
    this.showMap = $event;
  }
  fillHistory(building: Building){
    this.history = [];
    Object.entries(building).forEach( ([key, value]) => {
      this.history.push(new Building(value.country, value.climate_zone, value.climate_sub_zone, value.year, value.region, value.regionCode,
        value.address, null, { lat: value.lat, lng: value.lng}, null, [], value.rc, value.use, value.surface, null));
    });
  }
  receiveCalculateEnergy($event): void {
    this.typologyService.getEnergyScore($event.country, $event.climateZone,
      $event.climateSubZone, $event.typology.yearCode, $event.typology.categoryCode).subscribe( res => {
      const energyScore = res['energy_score_code'];
      const emissionRanking = res['emission_ranking'];
      const consumptionRanking = res['consumption_ranking'];
      this.typologyService.getScoreChart(energyScore).subscribe( dataScore => {
        const energytmp = [];
        Object.values(dataScore).forEach( sys => {
          energytmp.push(new ScoreSystem(+sys.demand,
            +sys.final_energy, +sys.primary_energy, +sys.emissions, sys.system));
        });
        this.building.typology = $event.typology;
        this.building.typology.energy = new Energy(energyScore, emissionRanking, consumptionRanking, energytmp);
        this.energyScore = true;
        this.showMap = false;
        this.showTypology = false;
      });
    });
  }
}
