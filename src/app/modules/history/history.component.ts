import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {User} from '../../shared/models/user';
import {ChangeContext, Options} from '@angular-slider/ngx-slider';
import {Building} from '../../shared/models/building';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit, OnChanges {

  isUserLogged: boolean;
  currentUser: User = new User();
  historyFiltered: Building[];

  useControl: boolean;
  usesFilter: string[];
  useSelected: string;

  yearControl: boolean;
  yearsFilter: [{ label: any,
    value: any}];
  yearSelected: any;

  typologyControl: boolean;
  typologyFilter: [{ value: string,
    name: string}];
  typologySelected: string;

  emissionControl: boolean;
  emissionFilter: string[];
  emissionSelected: string;

  surfaceFilter: Options;
  surfaceSelected: any;

  filterApplied: string[];
  @Input() history: Building[];
  @Output() buildingSelectedFromHistoryEmitter = new EventEmitter<any>();
  @Output() historyFilteredEmitter = new EventEmitter<any>();
  constructor(public afAuth: AngularFireAuth) {
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.isUserLogged = true;
        this.currentUser = new User(user);
        this.history = [];
        this.currentUser.id = user.uid;
      } else {
        this.isUserLogged = false;
      }
    });
  }

  ngOnInit(): void {
    this.filterApplied = [];
    this.surfaceFilter = {
      floor: 0,
      ceil: 1000,
      step: 10,
      showTicks: true
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ( changes.history.currentValue ) {
      this.history = changes.history.currentValue;
      this.historyFiltered =  changes.history.currentValue;
      this.buildFilters();
      this.buildFilterBySurface();
    }
  }

  buildFilters(): void {
    this.buildFilterByUses();
    this.buildFilterByYear();
    this.buildFilterByTypology();
    this.buildFilterByEnergyScore();
  }

  getInfoByRC(buildingToEmit): void {
    this.buildingSelectedFromHistoryEmitter.emit(buildingToEmit);
  }

  buildFilterByUses(): void {
    this.usesFilter = [];
    this.historyFiltered.forEach( (data: Building) => {
      if ( data.use ){
        const index = this.usesFilter.indexOf(data.use);
        if (index < 0) {
          this.usesFilter.push(data.use);
        }
      }
    });
    if ( this.usesFilter && this.usesFilter.length > 0 ) {
      this.useControl = true;
    }
  }

  buildFilterByYear(): void {
    this.yearsFilter = null;
    this.historyFiltered.forEach( data => {
      if ( data.year ) {
        let valueYear = 0;
        let labelYear = '';
        if ( +data.year >= 0 && +data.year <= 1900 ) {
          valueYear = 1;
          labelYear = '0 - 1900';
        } else if ( +data.year >= 1901 && +data.year <= 1936 ) {
          valueYear = 2;
          labelYear = '1901 - 1936';
        } else if ( +data.year >= 1937 && +data.year <= 1959 ) {
          valueYear = 3;
          labelYear = '1937 - 1959';
        } else if ( +data.year >= 1960 && +data.year <= 1979 ) {
          valueYear = 4;
          labelYear = '1960 - 1979';
        } else if ( +data.year >= 1980 && +data.year <= 2006 ) {
          valueYear = 5;
          labelYear = '1980 - 2006';
        } else if ( +data.year >= 2007 ) {
          valueYear = 6;
          labelYear = '2007 - ';
        }
        const valueToAdd = {
          label: labelYear,
          value: valueYear
        };
        if ( this.yearsFilter === null ) {
          this.yearsFilter = [valueToAdd];
        } else {
          const indexYear = this.yearsFilter.findIndex((item, i) => {
            return item.value === valueYear;
          });
          if ( indexYear < 0 ){
            this.yearsFilter.push(valueToAdd);
          }
        }
      }
      });
    if ( this.yearsFilter) {
      this.yearsFilter.sort((a, b) => a.value -  b.value);
      if ( this.yearsFilter.length > 0 ) {
        this.yearControl = true;
      }
    }
  }

  buildFilterBySurface(): void {
    const surfaces = [];
    let disable = true;
    let floor = 0;
    let ceil = 10000;
    this.historyFiltered.forEach(data => {
      if ( data.surface ) {
        surfaces.push(data.surface);
      }
    });
    surfaces.sort((a, b) => a - b);
    if ( surfaces.length > 0 ){
      disable = false;
      floor = surfaces[0];
      ceil = surfaces[surfaces.length - 1 ];
    }
    this.surfaceFilter = {
      floor,
      ceil,
      step: 10,
      showTicks: true,
      disabled: disable,
    };
  }

  buildFilterByTypology(): void {
    this.typologyFilter = null;
    this.historyFiltered.forEach( (data: Building) => {
      const valueToAdd = {
        value: data.typology.categoryCode,
        name: data.typology.categoryName
      };
      if ( this.typologyFilter === null ) {
        this.typologyFilter = [valueToAdd];
      } else {
        const indexYear = this.typologyFilter.findIndex((item, i) => {
          return item.value === data.typology.categoryCode;
        });
        if ( indexYear < 0 ){
          this.typologyFilter.push(valueToAdd);
        }
      }
    });
    if ( this.typologyFilter && this.typologyFilter.length > 0 ) {
      this.typologyControl = true;
    }
  }

  buildFilterByEnergyScore(): void {
    this.emissionFilter = [];
    this.historyFiltered.forEach( (data: Building) => {
      if ( data.typology.energy.emissionRanking ){
        const index = this.emissionFilter.indexOf(data.typology.energy.emissionRanking);
        if (index < 0) {
          this.emissionFilter.push(data.typology.energy.emissionRanking);
        }
      }
    });
    if ( this.usesFilter && this.usesFilter.length > 0 ) {
      this.emissionControl = true;
    }
  }

  cleanFilter(type: string) {
    const indexFilterApplied = this.filterApplied.indexOf(type);
    if (indexFilterApplied > -1) {
      this.filterApplied.splice(indexFilterApplied, 1);
    }
  }

  filter(type: string): void {
    if ( ( type === 'use' && this.useSelected !== null ) ||
      ( type === 'year' && this.yearSelected !== null ) ||
      ( type === 'surface' && this.surfaceSelected !== null ) ||
      ( type === 'typology' && this.typologySelected !== null ) ||
      ( type === 'emission' && this.emissionSelected !== null ) ){

      const indexFilterApplied = this.filterApplied.indexOf(type);
      if (indexFilterApplied < 0) {
        this.filterApplied.push(type);
      }
    } else {
      this.cleanFilter(type);
    }
    let arrayFiltered = [];
    this.history.forEach(el => {
      arrayFiltered.push(el);
    });
    this.filterApplied.forEach( filter => {
      if (filter === 'year') {
        const filterByYear = this.filterByYear(this.history);
        arrayFiltered = this.removeElementsFromArray(arrayFiltered, filterByYear);
      }
      if (filter === 'use') {
        const filterByUse  = [];
        this.history.forEach( hist => {
          if ( hist.use === this.useSelected) {
            filterByUse.push(hist);
          }
        });
        arrayFiltered = this.removeElementsFromArray(arrayFiltered, filterByUse);
      }
      if (filter === 'surface') {
        const filterBySurface  = [];
        this.history.forEach( hist => {
          if ( hist.surface >= this.surfaceSelected.min && hist.surface <= this.surfaceSelected.max ){
            filterBySurface.push(hist);
          }
        });
        arrayFiltered = this.removeElementsFromArray(arrayFiltered, filterBySurface);
      }
      if (filter === 'typology') {
        const filterByTypology  = [];
        this.history.forEach( hist => {
          if ( hist.typology.categoryCode === this.typologySelected) {
            filterByTypology.push(hist);
          }
        });
        arrayFiltered = this.removeElementsFromArray(arrayFiltered, filterByTypology);
      }
      if (filter === 'emission') {
        const filterByEmission  = [];
        this.history.forEach( hist => {
          if ( hist.typology.energy.emissionRanking === this.emissionSelected) {
            filterByEmission.push(hist);
          }
        });
        arrayFiltered = this.removeElementsFromArray(arrayFiltered, filterByEmission);
      }
    });
    this.historyFiltered = arrayFiltered;
    this.buildFilters();
    this.historyFilteredEmitter.emit(arrayFiltered);
  }

  removeElementsFromArray(arrayInit, element){
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

  filterSurface(changeContext: ChangeContext): void{
    this.surfaceSelected = {
      min: changeContext.value,
      max: changeContext.highValue
    };
    this.filter('surface' );
  }

  filterByYear(arrayToFilter){
    const histTemp = [];
    switch (this.yearSelected) {
      case 1: { // 0 - 1900
        arrayToFilter.forEach( hist => {
          if ( hist.year >= 0  && hist.year <= 1900) {
            histTemp.push(hist);
          }
        });
        break;
      }
      case 2: { // 1901 - 1936
        arrayToFilter.forEach( hist => {
          if ( hist.year >= 1901  && hist.year <= 1936) {
            histTemp.push(hist);
          }
        });
        break;
      }
      case 3: { // 1937 - 1959
        arrayToFilter.forEach( hist => {
          if ( hist.year >= 1937  && hist.year <= 1959) {
            histTemp.push(hist);
          }
        });
        break;
      }
      case 4: { // 1960 - 1979
        arrayToFilter.forEach( hist => {
          if ( hist.year >= 1960  && hist.year <= 1979) {
            histTemp.push(hist);
          }
        });
        break;
      }
      case 5: { // 1980 - 2006
        arrayToFilter.forEach( hist => {
          if ( hist.year >= 1980  && hist.year <= 2006) {
            histTemp.push(hist);
          }
        });
        break;
      }
      case 6: { // greater than 2007
        arrayToFilter.forEach( hist => {
          if ( hist.year >= 2007 ) {
            histTemp.push(hist);
          }
        });
        break;
      }
    }
    return histTemp;
  }
}
