import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Property} from '../../shared/models/property';
import {CadastreService} from '../../core/cadastre/cadastre.service';
import {DomSanitizer} from '@angular/platform-browser';
import {UserService} from '../../core/authentication/user.service';
import {User} from '../../shared/models/user';
import {AngularFireAuth} from '@angular/fire/auth';
import {Building} from '../../shared/models/building';
import {Typology} from '../../shared/models/typology';
import {TypologyService} from '../../core/typology/typology.service';

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
  @Input() history: Building[];
  @Input() properties: Property[];
  @Input() building: Building;
  @Output() showMapEmitter = new EventEmitter<boolean>();
  @Output() calculateTypologyEmitter = new EventEmitter<any>();
  constructor(private cadastreService: CadastreService, private sanitizer: DomSanitizer,
              public afAuth: AngularFireAuth, private userService: UserService, private typologyService: TypologyService) {
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
    if ( changes.building && changes.building.currentValue ) {
      if (  changes.building.currentValue.length > 0 && ( changes.building.currentValue[0].error ||
        changes.building.currentValue[0].error_service )) {
        this.hasError = true;
        this.error = changes.building.currentValue.error_service ? changes.building.currentValue.error_service : 'Cadastre Service is not available' ;
      } else {
        let getInfoFromINSPIRE = true;
        this.propertiesFilter = changes.building.currentValue.properties;
        this.isAFavoriteProperty(this.building);
        if ( changes.building.currentValue.properties.length < 1 && this.building.rc ){
          this.getInfoBuilding(this.building);
        }
        this.hasError = false;
        if ( !changes.building.firstChange ) {
          this.propSelected = null;
          this.propIsSelected = false;
        }
        this.building.typology = new Typology('', '', '', '',
          this.building.climateZone, this.building.country, '', null, null);
        console.log('La info del building !!! ', this.building);
        if (this.building.rc ) {
          // Best case: Request info from Inspire
          const requestINSPIRE = this.cadastreService.getBuildingInfoINSPIREParcel(this.building.rc).subscribe( parcel => {
            this.cadastreService.getBuildingInfoINSPIREPartParcel(this.building.rc).subscribe( partParcel => {
             this.getDataBuildingFromINSPIRE(parcel, partParcel);
            });
          }, (error) => {
            getInfoFromINSPIRE = false;
          });
          // Case: Select Typology
          setTimeout(() => {
            requestINSPIRE.unsubscribe();
            if ( !getInfoFromINSPIRE && this.properties.length > 0 && !this.building.year) {
              this.getInfoFromCadastreByRC();
            }
          }, 1500);
        }
      }
    }
    if (changes.history && changes.history.currentValue &&
      (changes.history.currentValue.length > this.history.length)){
      this.propSelected = null;
      this.history = changes.history.currentValue;
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
        /*if (!this.building.year) {
          this.building.year = this.properties[0].yearConstruction;
        }*/
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
        const buildingToAdd = new Building(building.country, building.climateZone, building.climateSubZone, building.year,
          building.region, building.address, building.altitudeCode, building.coordinates, [], building.rc, building.use, 0, null);
        this.history.push( buildingToAdd );
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
    this.isAFavProperty = false;
    if ( this.history ) {
      this.history.forEach(prop => {
        if ( prop.rc === property.rc ) {
          this.isAFavProperty = true;
          return;
        }
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
  getInfoFromCadastreByRC(): void {
    this.cadastreService.getBuildingDetailsByRC(this.properties[0].rc).subscribe((pro) => {
      const parser2 = new DOMParser();
      const dataXML = parser2.parseFromString(pro, 'text/xml');
      const data = dataXML.getElementsByTagName('bico')[0];
      if ( !this.building.year ) {
        this.building.year = this.convertToProperty(data, this.properties[0].rc).yearConstruction;
      }
      this.typologyService.getYearCode( this.building.year ).subscribe(resYear => {
        this.building.typology.yearCode = resYear['year_code'];
      });
    });
  }
  getInfoFromParcel(information: string): any{
    const domParser = new DOMParser();
    const dataXML = domParser.parseFromString(information, 'text/xml');
    const use = dataXML.getElementsByTagName('bu-ext2d:currentUse').length > 0 ?
      dataXML.getElementsByTagName('bu-ext2d:currentUse')[0].textContent : '';
    const numberOfUnits = dataXML.getElementsByTagName('bu-ext2d:numberOfBuildingUnits').length > 0 ?
      dataXML.getElementsByTagName('bu-ext2d:numberOfBuildingUnits')[0].textContent : '';
    const numberOfResidentUnits = dataXML.getElementsByTagName('bu-ext2d:numberOfDwellings').length > 0 ?
      dataXML.getElementsByTagName('bu-ext2d:numberOfDwellings')[0].textContent : '';
    const area = dataXML.getElementsByTagName('bu-ext2d:OfficialArea').length > 0 ?
      dataXML.getElementsByTagName('bu-ext2d:OfficialArea')[0].getElementsByTagName('bu-ext2d:value')[0].textContent : '';
    return {
      use,
      numberOfUnits,
      numberOfResidentUnits,
      area
    };
  }
  getNumberOfFloorFromXML(information: string): number{
    const domParser = new DOMParser();
    const dataXML = domParser.parseFromString(information, 'text/xml');
    const floorsInTotal = dataXML.getElementsByTagName('bu-ext2d:numberOfFloorsAboveGround');
    let floors = 0;
    for ( let i = 0; i < floorsInTotal.length; i++){
      const numberInPart = +floorsInTotal[i].textContent;
      if ( floors < numberInPart){
        floors = +numberInPart;
      }
    }
    return floors;
  }
  getTypologyAutomatic(floors: number, dwellings: number ): void {
    const typology = { code: '', name: ''};
    if ( dwellings === 1 ) { typology.code = 'SFH'; typology.name = 'Single Family Home'; }
    else if ( dwellings > 1 ) {
      if ( floors === 1) { typology.code = 'TH'; typology.name = 'Terraced House'; }
      else if ( floors > 1 && floors <= 4 ) { typology.code = 'MFH'; typology.name = 'MultiFamily Home'; }
      else if ( floors > 4 ) { typology.code = 'AB'; typology.name = 'Apartment block'; }
    }
    this.building.typology.categoryCode = typology.code;
    this.building.typology.categoryName = typology.name;
    this.typologyService.getBuildingCode( this.building.typology.categoryCode ).subscribe( resTypo => {
      this.building.typology.buildingCode = resTypo['building_code'];
      this.typologyService.getYearCode( this.building.year ).subscribe(resYear => {
        this.building.typology.yearCode = resYear['year_code'];
        this.calculateTypologyEmitter.emit(this.building);
      });
    });
  }
  getDataBuildingFromINSPIRE( parcel, partParcel ): void {
    const infoFromParcel = this.getInfoFromParcel(parcel);
    const infoFromPartOfParcel = this.getNumberOfFloorFromXML(partParcel);
    const useCut = infoFromParcel.use.split('_');
    const use = useCut[useCut.length - 1];
    if (use === 'residential' ) {
      if ( this.properties.length > 0   && !this.building.year) {
        this.cadastreService.getBuildingDetailsByRC(this.properties[0].rc).subscribe((pro) => {
          const parser2 = new DOMParser();
          const dataXML = parser2.parseFromString(pro, 'text/xml');
          const data = dataXML.getElementsByTagName('bico')[0];
          this.building.use = use;
          this.building.surface = +infoFromParcel.area;
          this.building.year = this.convertToProperty(data, this.properties[0].rc).yearConstruction;
          this.getTypologyAutomatic(infoFromPartOfParcel, +infoFromParcel.numberOfResidentUnits );
        });
      } else {
        this.getTypologyAutomatic(infoFromPartOfParcel, +infoFromParcel.numberOfResidentUnits );
      }
    } else {
      this.building.typology.categoryName = 'Typology not available';
    }
  }
}
