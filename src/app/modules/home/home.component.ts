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
import {ActivatedRoute, Params} from '@angular/router';

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
               private route: ActivatedRoute,
               private typologyService: TypologyService,
               private geodataService: GeodataService,
               private opendataService: OpendataService) {
    this.totalHistory = [];
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
    this.building =  new Building('', '', '',  null, '', '', '', '',
      {lat: '', lng: ''}, { x: null, y: null}, [], '', '', 0, null, false);
    this.userService.getAllHistory().subscribe( hist => {
      const totalHistoryTmp = [];
      for (let histKey in hist) {
        totalHistoryTmp.push(this.convertBuildingFromRequest(hist[histKey]));
      }
      this.totalHistory = totalHistoryTmp;
    });
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
        $event.use, null, null, false);
    }
    else if ( $event.typology && $event.favorite) {
      this.building = $event;
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
    this.active = 1;
  }
  calculateTypology($event: Building): void{
    this.showTypology =  !($event.typology && $event.typology.energy && $event.typology.energy.energyScoreCode);
    this.energyScore = !!($event.typology && $event.typology.energy && $event.typology.energy.energyScoreCode);
    if ( !$event.typology || ( $event.typology && !$event.typology.categoryCode ) ) {
      this.typologies = [];
      this.typologyService.getTypologyPics($event.year, $event.country, $event.climateZone).subscribe(res => {
        Object.values(res).forEach( cat => {
          const category = new Typology(cat.category.category_code, cat.category.name,
            cat.year.year_code, cat.name,  cat.category.building_code, null, null, null);
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
    const buildingTmp = this.building;
    buildingTmp.address = elementsFromMap.address;
    Observable.forkJoin([
      this.geodataService.getCountries(coordinates.lat, coordinates.lng) ,
      this.geodataService.getClimateZones(coordinates.lat, coordinates.lng ),
      this.opendataService.getElevation(coordinates.lat, coordinates.lng),
      this.geodataService.getProvinces(coordinates.lat, coordinates.lng)]).subscribe( data => {
        const elevation = +data[2].results[0].elevation > 0 ? data[2].results[0].elevation : 0;
        const country = data[0].features[0].properties.iso_2digit;
        const climateZone = data[1].features.length > 0 ? data[1].features[0].properties.code : '';
        const region = data[3].features.length > 0 ? data[3].features[0].properties.cod_prov : '';
        const nameRegion = data[3].features.length > 0 ? data[3].features[0].properties.nombre : '';
        let point = null;
        switch (country) {
          case 'NL' : {
            point = { x: elementsFromMap.point.ESPG28992.x, y: elementsFromMap.point.ESPG28992.y};
            this.building =  new Building(country, climateZone, buildingTmp.climateSubZone, '',
              buildingTmp.region, region, buildingTmp.address,
              buildingTmp.altitudeCode, coordinates, point, buildingTmp.properties, buildingTmp.rc,
              buildingTmp.use, buildingTmp.surface, buildingTmp.typology, false);
            break;
          }
          case 'ES' : {
            point = { x: elementsFromMap.point.ESPG25830.x, y: elementsFromMap.point.ESPG25830.y};
            this.typologyService.getAltitude(elevation, climateZone, country ).subscribe( resAltitude => {
              const altitude = resAltitude['altitude_code'];
              this.typologyService.getClimateSubZone( altitude, region, climateZone, country ).subscribe( subZone => {
                this.building =  new Building(country, climateZone, subZone['climate_zone'], '',
                  nameRegion , region, buildingTmp.address,
                  altitude, coordinates, point, [], buildingTmp.rc,
                  '', 0, null, false);
              });
            });
            break;
          }
        }
      });
  }
  showMapControl($event: boolean): void{
    this.showMap = $event;
  }
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
      const typology = new Typology( history['typology_code'], history['typology_name'], history['year_code'], history['picture'],
        history['building_code'], envelope, system, energy);
      this.history.push( new Building( buildingData.country, buildingData.climate_zone, buildingData.climate_sub_zone, history['year'],
        buildingData.province_name, buildingData.province_code, buildingData.address, buildingData.altitude_code,
        { lat: buildingData.lat, lng: buildingData.lng}, { x: buildingData.x, y: buildingData.y}, [], buildingData.rc,
        buildingData.use, buildingData.surface, typology, true));
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
          energytmp.push(new ScoreSystem(sys.score_chart_code, +sys.demand,
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
  convertBuildingFromRequest(record: any ){
    const building = new Building(record.building.country, record.building.climate_zone, record.building.climate_sub_zone,
      record.year, record.building.province_name, record.building.province_code, record.building.address,
      record.building.altitude_code, { lng: record.building.lng, lat: record.building.lat}, {x: record.building.x, y: record.building.y },
      [], record.building.rc, record.building.use, record.building.surface, new Typology( record.typology_code,
        record.typology_name, record.year_code, '', record.building_code, [], [], new Energy(record.energy_scores[0].energy_score_code,
          record.energy_scores[0].emission_ranking, record.energy_scores[0].consumption_ranking, [])), true);
    record.envelopeds.forEach( env => {
      const envelopeToAdd = new Envelope(env.enveloped_code, null, env.description, env.u_value, env.picture, '');
      building.typology.enveloped.push(envelopeToAdd);
    });
    record.system_codes.forEach( sys => {
      const systemToAdd = new SystemType(sys.system_type, sys.system_code, sys.description_system, sys.picture);
      building.typology.system.push(systemToAdd);
    });
    record.score_charts.forEach( sco => {
      const scoreToAdd = new ScoreSystem( sco.score_chart_code, sco.demand, sco.final_energy,
        sco.primary_energy, sco.emissions, sco.system);
      building.typology.energy.scoreSystem.push(scoreToAdd);
    });

    return building;
  }
  generalTab() {
    this.active = 1;
  }
}
