import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {UserService} from '../../core/authentication/user.service';
import {User} from '../../shared/models/user';
import {ChangeContext, Options} from '@angular-slider/ngx-slider';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit, OnChanges {

  isUserLogged: boolean;
  currentUser: User = new User();
  historyFiltered: any;
  usesFilter: any;
  useSelected: any;
  yearsFilter: any;
  yearSelected: any;
  surfaceFilter: Options;
  surfaceSelected: any;
  filterForSurface: any;
  filterApplied: any;
  @Input() history: any;
  @Output() itemSelectedFromHistoryEmitter = new EventEmitter<any>();
  constructor(public afAuth: AngularFireAuth, public userService: UserService) {
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.isUserLogged = true;
        this.currentUser = new User(user);
        this.history = [];
        this.userService.getByUid(user.uid).subscribe(data => {
          this.currentUser.id = data['id'];
        });
      } else {
        this.isUserLogged = false;
      }
    });
  }

  ngOnInit(): void {
    this.surfaceFilter = {
      floor: 0,
      ceil: 1000,
      step: 10,
      showTicks: true
    };
    this.buildFilterByUses();
    this.buildFilterByYear();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ( changes.history.currentValue ) {
      this.history = changes.history.currentValue;
      this.historyFiltered = this.history;
      this.filterApplied = [{ filterType: '', lastArray: this.historyFiltered}];
      this.buildFilterBySurface();
    }
  }

  getInfoByRC(rc: string): void {
    this.itemSelectedFromHistoryEmitter.emit(rc);
  }

  buildFilterByUses(): void {
    this.usesFilter = [''];
    this.userService.getUses().subscribe( uses => {
      const allUses = Object.values(uses);
      allUses.forEach(us => {
        this.usesFilter.push(us.DISTINCT);
      });
    });
  }

  buildFilterByYear(): void {
    this.yearsFilter = [{
        label: '0 - 1900',
        value: 1
      }, {
        label: '1901 - 1936',
        value: 2
      }, {
        label: '1937 - 1959',
        value: 3
      }, {
        label: '1960 - 1979',
        value: 4
      }, {
        label: '1980 - 2006',
        value: 5
      }, {
        label: '2007 - ',
        value: 6
      }
    ];
  }

  buildFilterBySurface(): void {
    const surfaces = [];
    this.history.forEach(data => {
      surfaces.push(data.surface);
    });
    surfaces.sort((a, b) => a - b);
    this.surfaceFilter = {
      floor: surfaces[0],
      ceil: surfaces[surfaces.length - 1 ],
      step: 10,
      showTicks: true
    };
  }

  cleanFilter(type: string) {
    let arrayToFilter = null;
    let index = 0;
    this.filterApplied.forEach( filt => {
      if ( filt.filterType === type ){
        arrayToFilter = filt.lastArray;
        index = this.filterApplied.indexOf(filt);
      }
    });
    this.filterApplied.splice ( index, 1);
    this.historyFiltered = arrayToFilter;
  }

  selectArrayToFilter(type: string) {
    let arrayToFilter = null;
    let found = false;
    let index = 0;
    this.filterApplied.forEach( filt => {
      if ( filt.filterType === type ){
        arrayToFilter = filt.lastArray;
        found = true;
        index = this.filterApplied.indexOf(filt);
      }
    });
    if ( found ) {
      this.filterApplied.splice ( index, 1);
    } else {
      arrayToFilter = this.historyFiltered;
    }
    return arrayToFilter;
  }

  filter(type: string): void{
    const histTemp = [];
    if ( ( type === 'use' && this.useSelected === null ) ||
      ( type === 'year' && this.yearSelected === null ) ||
      ( type === 'surface' && this.surfaceSelected === null )  ){
      this.cleanFilter(type);
    } else {
      const arrayToFilter = this.selectArrayToFilter(type);
      if (type === 'year') {
       this.filterByYear(arrayToFilter, histTemp);
      }
      else if (type === 'use') {
        arrayToFilter.forEach( hist => {
          if ( hist.use === this.useSelected) {
            histTemp.push(hist);
          }
        });
        const lastFilter = {
          filterType: 'use',
          lastArray: arrayToFilter
        };
        this.filterApplied.push(lastFilter);
        this.historyFiltered = histTemp;
      } else if (type === 'surface') {
        arrayToFilter.forEach( hist => {
          if ( hist.surface >= this.surfaceSelected.min && hist.surface <= this.surfaceSelected.max ){
            histTemp.push(hist);
          }
        });
        const lastFilter = {
          filterType: 'surface',
          lastArray: arrayToFilter
        };
        this.filterApplied.push(lastFilter);
        this.historyFiltered = histTemp;
      }
    }
  }

  filterSurface(changeContext: ChangeContext): void{
    this.surfaceSelected = {
      min: changeContext.value,
      max: changeContext.highValue
    };
    this.filter('surface' );
  }

  filterByYear(arrayToFilter, histTemp){
    console.log('El año seleccionado!!! ', this.yearSelected, histTemp);
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
    const lastFilter = {
      filterType: 'year',
      lastArray: arrayToFilter
    };
    this.filterApplied.push(lastFilter);
    this.historyFiltered = histTemp;
  }
}
