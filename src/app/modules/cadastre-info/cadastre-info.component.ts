import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Property} from '../../shared/models/property';
import {CadastreService} from '../../core/cadastre/cadastre.service';
import {DomSanitizer} from '@angular/platform-browser';
import {UserService} from '../../core/authentication/user.service';
import {User} from '../../shared/models/user';
import {AngularFireAuth} from '@angular/fire/auth';
import {Router} from '@angular/router';
import {PropertySaved} from '../../shared/models/PropertySaved';

@Component({
  selector: 'app-cadastre-info',
  templateUrl: './cadastre-info.component.html',
  styleUrls: ['./cadastre-info.component.scss']
})
export class CadastreInfoComponent implements OnInit, OnChanges {
  propSelected: Property;
  propIsSelected: boolean;
  facadeImage: any;
  hasError: boolean;
  error: string;
  currentUser: User = new User();
  isAFavProperty: boolean;
  isUserLogged: boolean;
  searchFromHistory: boolean;
  modelFilters = {filtBl: '', filtEs: '', filtPt: '', filtPu: ''};
  propertiesFilter: Property[];
  RURAL_TYPE = 'rural';
  URBAN_TYPE = 'urban';
  @Input() propSelectFromMap: string;
  @Input() history: PropertySaved[];
  @Input() itemSelectedFromHistory: string;
  @Input() properties: Property[];
  @Output() calculateTypologyEmitter = new EventEmitter<any>();
  constructor(public cadastreService: CadastreService, private sanitizer: DomSanitizer,
              public afAuth: AngularFireAuth, public userService: UserService, private router: Router) {
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.currentUser = new User(user);
        this.isUserLogged = true;
      }
    });
    this.propertiesFilter = this.properties;
  }

  ngOnInit(){
  }

  ngOnChanges(changes: SimpleChanges) {
    if ( changes.properties ) {
      if ( changes.properties.currentValue.length > 0 && ( changes.properties.currentValue[0].error ||
        changes.properties.currentValue[0].error_service )) {
        this.hasError = true;
        this.error = changes.properties.currentValue[0].error_service ? changes.properties.currentValue[0].error_service : 'Cadastre Service is not available' ;
      } else {
        this.propertiesFilter = changes.properties.currentValue;
        this.hasError = false;
        if ( !changes.properties.firstChange ) {
          this.propSelected = null;
          this.propIsSelected = false;
        }
      }
    }
    if (changes.history && changes.history.currentValue &&
      (changes.history.currentValue.length > this.history.length)){
      this.propSelected = null;
      this.history = changes.history.currentValue;
    }
    if (changes.itemSelectedFromHistory && changes.itemSelectedFromHistory.currentValue &&
      (changes.itemSelectedFromHistory.currentValue !== changes.itemSelectedFromHistory.previousValue)){
      this.itemSelectedFromHistory = changes.itemSelectedFromHistory.currentValue;
      this.searchFromHistory = true;
      this.getDetailFromRC(this.itemSelectedFromHistory);
    }
    if (changes.propSelectFromMap && changes.propSelectFromMap.currentValue &&
      changes.propSelectFromMap.currentValue !== changes.propSelectFromMap.previousValue){
      this.searchFromHistory = true;
      this.propSelectFromMap = changes.propSelectFromMap.currentValue;
      this.getDetailFromRC(this.propSelectFromMap);
    }
  }

  initialData(): void{
    this.propSelected = null;
    this.propIsSelected = true;
    this.isAFavProperty = false;
  }

  /**
   * Assign to property selected the entire information from Cadastre service
   * @param rc: Property selected from the list
   */
  getDetailFromRC(rc: any): void{
    this.initialData();
    this.cadastreService.getBuildingDetailsByRC(rc).subscribe(( pro) => {
      const parser2 = new DOMParser();
      const dataXML = parser2.parseFromString(pro, 'text/xml');
      const data = dataXML.getElementsByTagName('bico')[0];
      this.propSelected  = this.convertToProperty(data, rc);
      this.isAFavoriteProperty(this.propSelected);
    });
  }

  /**
   * Convert from xml format to Property object
   * @param info: xml information
   * @param rc: cadastre reference
   */
  convertToProperty(info: any, rc: string): Property {
    const address = info.getElementsByTagName('ldt')[0].textContent;
    const use = info.getElementsByTagName('luso')[0].textContent;
    const surfaceCons = info.getElementsByTagName('sfc').length > 0 ? info.getElementsByTagName('sfc')[0].textContent : '';
    const year = info.getElementsByTagName('ant').length > 0 ? info.getElementsByTagName('ant')[0].textContent : '';
    const surfaceGraph = info.getElementsByTagName('sfc')[0].textContent;
    const participation = info.getElementsByTagName('cpt').length > 0 ? info.getElementsByTagName('cpt')[0].textContent : '';
    this.cadastreService.getFacadeImage(rc).subscribe( (baseImage: any) => {
      const urlCreator = window.URL;
      this.facadeImage = this.sanitizer.bypassSecurityTrustUrl(urlCreator.createObjectURL(baseImage));
    });
    return new Property(rc, '', '', '', surfaceCons, '', '', '', year, '', address, use, surfaceGraph, participation, this.facadeImage, [], '', '', '');
  }

  /**
   *  Added the property selected as a favorite in user history
   * @param propSelected: Property object selected
   */
  addToFavorites( propSelected: Property ): void{
    const propToSave = {
      rc: propSelected.rc,
      address: propSelected.completeAddress,
      uid: this.currentUser.uid,
      lat: this.properties[0].latlng['lat'],
      lng: this.properties[0].latlng['lng'],
      year: propSelected.yearConstruction,
      use: propSelected.use,
      surface: propSelected.surfaceCons
    };
    this.userService.addPropertyToHistory(propToSave).subscribe( res => {
      this.history.push( new PropertySaved(propToSave.address, propToSave.lat, propToSave.lng,
        propToSave.rc, propToSave.surface, propToSave.use, propToSave.year, null));
      this.isAFavProperty = true;
    });
  }

  removeFromFavorites( propSelected: Property ): void{
    this.userService.removePropertyFromHistory( propSelected.rc,  this.currentUser.uid).subscribe( res => {
      this.history.forEach( prop => {
        if ( prop.rc === propSelected.rc ) {
          const index = this.history.indexOf(prop, 0);
          this.history.splice(index, 1);
          this.isAFavProperty = false;
          return;
        }
      });
    });
  }

  isAFavoriteProperty(property: Property): void {
    if ( this.history ) {
      this.history.forEach(prop => {
        this.isAFavProperty = prop.rc === property.rc;
      });
    }
  }

  filterBuilding(): void {
    if ( this.modelFilters.filtBl !== '' ||  this.modelFilters.filtEs !== '' ||
      this.modelFilters.filtPt !== '' ||  this.modelFilters.filtPu !== '' ) {
      let propTempToFilter = this.properties;
      Object.entries(this.modelFilters).forEach( ([key, value]) => {
        if ( key === 'filtBl' && value.length > 0) {
          propTempToFilter = propTempToFilter.filter(
            it => it.block.toLowerCase().includes(value.toLowerCase())
          );
        } else if ( key === 'filtEs' && value.length > 0) {
          propTempToFilter = propTempToFilter.filter(
            it => it.stair.toLowerCase().includes(value.toLowerCase())
          );
        } else if ( key === 'filtPt' && value.length > 0) {
          propTempToFilter = propTempToFilter.filter(
            it => it.floor.toLowerCase().includes(value.toLowerCase())
          );
        } else if ( key === 'filtPu' && value.length > 0) {
          propTempToFilter = propTempToFilter.filter(
            it => it.door.toLowerCase().includes(value.toLowerCase())
          );
        }
      });
      this.propertiesFilter = propTempToFilter;
    } else {
      this.propertiesFilter = this.properties;
    }
  }

  calculateTypology(): void{
    this.calculateTypologyEmitter.emit(this.propSelected);
  }

  clearFilters(): void {
    this.modelFilters = {filtBl: '', filtEs: '', filtPt: '', filtPu: ''};
    this.filterBuilding();
  }
}
