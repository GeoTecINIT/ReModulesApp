import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Property} from '../../shared/models/property';
import {CadastreService} from '../../core/cadastre/cadastre.service';
import {DomSanitizer} from '@angular/platform-browser';
import {UserService} from '../../core/authentication/user.service';
import {User} from '../../shared/models/user';
import {AngularFireAuth} from '@angular/fire/auth';
import {Building} from '../../shared/models/building';

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
  mapControl: boolean;
  @Input() propSelectFromMap: Building;
  @Input() history: Building[];
  @Input() itemSelectedFromHistory: Building;
  @Input() properties: Property[];
  @Input() building: Building;
  @Output() showMapEmitter = new EventEmitter<boolean>();
  @Output() calculateTypologyEmitter = new EventEmitter<any>();
  constructor(private cadastreService: CadastreService, private sanitizer: DomSanitizer,
              public afAuth: AngularFireAuth, private userService: UserService) {
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.currentUser = new User(user);
        this.isUserLogged = true;
      }
      else { this.isUserLogged = false; }
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
        this.properties = changes.properties.currentValue;
        this.hasError = false;
        if ( !changes.properties.firstChange ) {
          this.propSelected = null;
          this.propIsSelected = false;
        }
        if ( this.properties.length > 0 ) {
          this.cadastreService.getBuildingDetailsByRC(this.properties[0].rc).subscribe(( pro) => {
            const parser2 = new DOMParser();
            const dataXML = parser2.parseFromString(pro, 'text/xml');
            const data = dataXML.getElementsByTagName('bico')[0];
            this.building.year  = this.convertToProperty(data, this.properties[0].rc).yearConstruction;
            this.building.rc = this.properties[0].rc.slice(0, -6);
          });
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
      this.getInfoBuilding(this.itemSelectedFromHistory);
    }
    if (changes.propSelectFromMap && changes.propSelectFromMap.currentValue &&
      changes.propSelectFromMap.currentValue !== changes.propSelectFromMap.previousValue){
      this.searchFromHistory = true;
      this.propSelectFromMap = changes.propSelectFromMap.currentValue;
      this.getInfoBuilding(this.propSelectFromMap);
    }
  }

  initialData(): void{
    this.propSelected = null;
    this.propIsSelected = true;
    this.isAFavProperty = false;
  }

  getInfoBuilding( building: Building) {
    this.cadastreService.getBuildingDetailsByRC(building.rc).subscribe((prop) => {
      this.propSelected = null;
      this.propIsSelected = false;
      const parser2 = new DOMParser();
      const dataXML = parser2.parseFromString(prop, 'text/xml');
      // case: when request is only one property
      const propertyOnly = dataXML.getElementsByTagName('bico')[0];
      this.properties = [];
      if ( propertyOnly !== undefined ){
        const property = this.getInfoPropGeneral(propertyOnly, building.address);
        this.properties.push(property);
      } else {
        // case: when request are many properties
        const properties = dataXML.getElementsByTagName('rcdnp');
        // tslint:disable-next-line:prefer-for-of
        for ( let i = 0; i < properties.length ; i++){
          const detail = properties[i];
          const property = this.getInfoPropGeneral(detail, building.address);
          this.properties.push(property);
        }
      }
      this.propertiesFilter = this.properties;
      this.cadastreService.getFacadeImage(this.properties[0].rc).subscribe( (baseImage: any) => {
        const urlCreator = window.URL;
        this.properties[0].image = this.sanitizer.bypassSecurityTrustUrl(urlCreator.createObjectURL(baseImage));
        // @ts-ignore
        this.properties[0].latlng = { lat: building.lat, lng: building.lng};
        this.properties[0].type = this.URBAN_TYPE;
        this.isAFavoriteProperty(building);
        this.building = building;
        this.building.region = this.properties[0].province;
      });
    });
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
   * @param building
   */
  addToFavorites( building: Building ): void{
    const propToSave = {
      country: building.country,
      climate_zone: building.climateZone,
      year: building.year,
      rc: building.rc,
      address: building.address,
      uid: this.currentUser.uid,
      lat: +building.coordinates.lat,
      lng: +building.coordinates.lng,
    };
    if ( this.isUserLogged ) {
      this.userService.addPropertyToHistory(propToSave).subscribe( res => {
        this.history.push( new Building(building.country, building.climateZone, building.year,
          building.region, building.address, building.coordinates, [], building.rc, building.use, ''));
        this.isAFavProperty = true;
      });
    }
  }

  removeFromFavorites( building: Building): void{
    if ( this.isUserLogged ) {
      this.userService.removePropertyFromHistory( building.rc,  this.currentUser.uid).subscribe( res => {
        this.history.forEach( prop => {
          if ( prop.rc === building.rc ) {
            const index = this.history.indexOf(prop, 0);
            this.history.splice(index, 1);
            this.isAFavProperty = false;
            return;
          }
        });
      });
    }
  }

  isAFavoriteProperty(property: Building): void {
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

  calculateTypology(): void {
    this.mapControl = true;
    this.showMapEmitter.emit(false);
    this.calculateTypologyEmitter.emit(this.building);
  }

  clearFilters(): void {
    this.modelFilters = {filtBl: '', filtEs: '', filtPt: '', filtPu: ''};
    this.filterBuilding();
  }

  /**
   * Convert info from xml format to Property object
   * @param prop: property information in xml format
   * @param addressMain
   */
  getInfoPropGeneral(prop: any, addressMain: string) {
    const rc1 = prop.getElementsByTagName('pc1')[0].textContent;
    const rc2 = prop.getElementsByTagName('pc2')[0].textContent;
    const rc3 = prop.getElementsByTagName('car')[0].textContent;
    const rc4 = prop.getElementsByTagName('cc1')[0].textContent;
    const rc5 = prop.getElementsByTagName('cc2')[0].textContent;
    let rc = '';
    rc = rc.concat( rc1, rc2, rc3, rc4, rc5);
    const propType = prop.getElementsByTagName('cn').length > 0 ? prop.getElementsByTagName('cn')[0].textContent : 'urban';

    if ( propType === 'RU') {
      return new Property(rc, addressMain, '', '', '', '', '', '', '', 'rural',
        '', '', '', '', '', [], '', '', '');
    } else {
      const tagLocInt = prop.getElementsByTagName('loint')[0];
      const block = tagLocInt.getElementsByTagName('bq').length > 0 ?
        tagLocInt.getElementsByTagName('bq')[0].textContent.split(': ')[0] : '';
      const stair = tagLocInt.getElementsByTagName('es').length > 0 ?
        tagLocInt.getElementsByTagName('es')[0].textContent.split(': ')[0] : '';
      const plant = tagLocInt.getElementsByTagName('pt').length > 0 ?
        tagLocInt.getElementsByTagName('pt')[0].textContent.split(': ')[0] : '';
      const door = tagLocInt.getElementsByTagName('pu').length > 0 ?
        tagLocInt.getElementsByTagName('pu')[0].textContent.split(': ')[0] : '';
      const postalCode = prop.getElementsByTagName('dp')[0].textContent;
      const prov = prop.getElementsByTagName('np')[0].textContent;
      const town = prop.getElementsByTagName('nm')[0].textContent;
      let logInt = '';
      const textBlock = block !== '' ? 'Bl: ' + block : '';
      const textStair = stair !== '' ? 'Es: ' + stair : '';
      const textPlant = plant !== '' ? 'Pl: ' + plant : '';
      const textDoor = door !== '' ? 'Pt: ' + door : '';
      logInt = logInt.concat(textBlock, ' ' , textStair, ' ' , textPlant , ' ' , textDoor);
      return new Property(rc, addressMain, plant, logInt, '', postalCode, prov, town, '', 'urban',
        '', '', '', '', '', [], block, stair, door);
    }
  }

  showMap(): void{
    this.mapControl = false;
    this.showMapEmitter.emit(true);
  }
}
