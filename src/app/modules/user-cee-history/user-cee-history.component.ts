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
import { ceeBuilding } from 'src/app/shared/models/ceeBuilding';

@Component({
  selector: 'app-user-cee-history',
  templateUrl: './user-cee-history.component.html',
  styleUrls: ['./user-cee-history.component.scss']
})
export class UserCeeHistoryComponent implements OnInit {

  userHistory: ceeBuilding[];
  deletedBuilding: boolean;
  filterCountries: string[];
  filterTypologies: { code: string, name: string}[];
  filterYears: string[];
  tmpUserCEEHistory: ceeBuilding[];

  countryControl: boolean;
  countrySelected: string;

  yearControl: boolean;
  yearSelectedMin: any;
  yearSelectedMax: any;

  typologyControl: boolean;
  typologySelected: string;

  filterApplied: string[];
  @Input() optionSelected: number;
  @Output() historyEmitter2 = new EventEmitter<any>();
  @Output() buildingSelectedEmitter = new EventEmitter<any>();
  @Output() buildingToBeUpdatedEmitter = new EventEmitter<any>();
  constructor(
    public afAuth: AngularFireAuth,
    private userService: UserService,
  ) {
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.buildCEEHistory();
      }
    });
  }

  ngOnInit(): void {
    this.filterApplied = [];
  }

  showBuildingResults(building: ceeBuilding): void {
    this.buildingSelectedEmitter.emit(building);
  }

  updateBuilding(building: ceeBuilding): void {
    this.buildingToBeUpdatedEmitter.emit(building);
  }

  removeBuildingFromUserHistory(building: Building): void {
    this.userService.deletePropertyFromHistory( building.id, localStorage.getItem('auth-token')).subscribe( () => {
      this.deletedBuilding = true;
      this.buildCEEHistory();
      setTimeout( () => {
        this.deletedBuilding = false;
      }, 80000 );
    });
  }

  buildCEEHistory() {
    this.userService.getUserCEEHistory(localStorage.getItem('auth-token')).subscribe( hist => {
      this.userHistory = [];
      for (const histKey in hist) {
        this.parseHistory(hist[histKey]);
      }
      this.tmpUserCEEHistory = this.userHistory;
      this.buildFilters();
      this.historyEmitter2.emit(this.userHistory);
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
    this.tmpUserCEEHistory.forEach( ( hist) => {
      if (this.filterYears.length === 0 || !this.filterYears.includes(hist.year)) {
        this.filterYears.push(hist.year);
      }
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

      if (filter === 'typology') {
        const filterByTypology  = [];
        this.userHistory.forEach( hist => {
          if ( hist.typology === this.typologySelected) {
            filterByTypology.push(hist);
          }
        });
        arrayFiltered = this.removeElementsFromArray(arrayFiltered, filterByTypology);
      }
    });
    this.tmpUserCEEHistory = arrayFiltered;
    this.buildFilters();
    this.historyEmitter2.emit(this.tmpUserCEEHistory);
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
    const dataBuilding = history.data_building.cee_building;
    console.log(dataBuilding);

    this.userHistory.push(new ceeBuilding(dataBuilding.address, dataBuilding.map_address, dataBuilding.rc, dataBuilding.typology,
      dataBuilding.case, dataBuilding.year, dataBuilding.year_certificate, dataBuilding.letter_co2, dataBuilding.value_co2, dataBuilding.letter_ep, dataBuilding.value_ep,
      dataBuilding.year_certificate2, dataBuilding.letter_co2_cert2,
        dataBuilding.value_co2_cert2, dataBuilding.letter_ep_cert2,
        dataBuilding.value_ep_cert2, dataBuilding.saving_co2_abs, dataBuilding.saving_co2_perc, dataBuilding.saving_ep_abs, dataBuilding.saving_ep_perc, 
        { lng: dataBuilding.coordinates.lng, lat: dataBuilding.coordinates.lat }, {x: dataBuilding.point.x, y: dataBuilding.point.y}));
  }

}
