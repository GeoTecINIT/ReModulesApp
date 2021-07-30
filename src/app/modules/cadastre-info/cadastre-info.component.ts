import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Property} from '../../shared/models/property';
import { CadastreESService } from '../../core/cadastre/ES/cadastreES.service';
import {DomSanitizer} from '@angular/platform-browser';
import {UserService} from '../../core/authentication/user.service';
import {User} from '../../shared/models/user';
import {AngularFireAuth} from '@angular/fire/auth';
import {Building} from '../../shared/models/building';
import {Typology} from '../../shared/models/typology';
import {TypologyService} from '../../core/typology/typology.service';
import {NgxSpinnerService} from 'ngx-spinner';
import {CadastreNLService} from '../../core/cadastre/NL/cadastre-nl.service';
import {ActivatedRoute} from '@angular/router';

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
  mapControl: boolean;
  ruralBuilding: boolean;
  selectBuilding: boolean;

  textSpinner: string;
  // Variables temp for 3 cases
  selectYear = false;
  years: string[];
  selectedYear: string;

  @Input() history: Building[];
  @Input() properties: Property[];
  @Input() building: Building;
  @Input() active: number;
  @Output() showMapEmitter = new EventEmitter<boolean>();
  @Output() calculateTypologyEmitter = new EventEmitter<any>();
  @Output() buildingCompleteEmitter = new EventEmitter<any>();
  constructor(private cadastreServiceES: CadastreESService,
              private cadastreNLService: CadastreNLService,
              private sanitizer: DomSanitizer,
              public afAuth: AngularFireAuth,
              private userService: UserService,
              private typologyService: TypologyService,
              private spinner: NgxSpinnerService) {
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
    this.years = [];
    for (let i = 1950; i <= new Date().getFullYear(); i++) {
      const year = String( i);
      this.years.push( year);
    }
    this.textSpinner = 'Loading ...';

  }

  ngOnChanges(changes: SimpleChanges) {
    if ( this.active === 1 && changes.building && changes.building.currentValue
      && changes.building.currentValue.country ) {
      if (  changes.building.currentValue.length > 0 && ( changes.building.currentValue[0].error ||
        changes.building.currentValue[0].error_service )) {
        this.hasError = true;
        this.error = changes.building.currentValue.error_service ? changes.building.currentValue.error_service : 'Cadastre Service is not available' ;
      } else {
        this.propertiesFilter = changes.building.currentValue.properties;
        this.properties = changes.building.currentValue.properties;
        this.hasError = false;
        this.error = '';
        if ( !changes.building.firstChange ) {
          this.propSelected = null;
          this.propIsSelected = false;
        }
        this.selectYear = false;
        this.selectedYear = null;
        this.ruralBuilding = false;
        if ( this.building.year ) this.selectedYear = this.building.year;
        if ( !this.building.favorite ) {
          this.building.typology = new Typology('', '', '', '', '', '',
            '', null, null, null);
          if ( this.building.country  === 'ES') {
            // Best case: Services gives all
            //if ( this.building.provinceCode === '46') {
            this.spinner.show();
            this.textSpinner = 'Waiting for the cadastre service ... ';
            this.selectBuilding = true;
            this.getInfoFromCadastre_ES(true);
            //}
            // Case when services only get year
            /*else if ( this.building.provinceCode === '12') {
              this.spinner.show();
              this.textSpinner = 'Waiting for the cadastre service ... ';
              this.selectBuilding = true;
              this.getInfoFromCadastre_ES(false);
            }
            // Case everything is request to user
            else if ( this.building.provinceCode === '03') {
              this.showYearSelection();
            }*/
          } else if ( this.building.country  === 'NL' ) {
            this.spinner.show();
            this.selectBuilding = true;
            this.getInfoFromCadastre_NL();
          } else {
            this.showYearSelection();
          }
        } else {
          this.selectBuilding = true;
        }
      }
      if ( changes.error && changes.error.currentValue) {
        this.error = changes.error.currentValue;
        this.hasError = true;
      }
    }
  }

  showYearSelection() {
    const buildingTmp  = this.building;
    this.building = null;
    this.spinner.show();
    this.selectBuilding = true;
    this.selectYear = true;
    this.building  = new Building(buildingTmp.country, buildingTmp.climateZone, buildingTmp.climateSubZone,
      '', buildingTmp.region, buildingTmp.provinceCode,
      buildingTmp.address, buildingTmp.altitudeCode, buildingTmp.coordinates, buildingTmp.point,
      [], null, '', null, null, false, null);
    this.properties = [];
    this.propertiesFilter = [];
    this.spinner.hide();
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
    this.cadastreServiceES.getBuildingDetailsByRC(rc).subscribe(( pro) => {
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
    this.cadastreServiceES.getFacadeImage(rc).subscribe( (baseImage: any) => {
      const urlCreator = window.URL;
      this.facadeImage = this.sanitizer.bypassSecurityTrustUrl(urlCreator.createObjectURL(baseImage));
    });
    return new Property(rc, '', '', '', surfaceCons, '', '', '', year, '', address, use,
      surfaceGraph, participation, this.facadeImage, null, '', '', '');
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
    this.calculateTypologyEmitter.emit({ building: this.building, selected: true});
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
      this.ruralBuilding = true;
      return new Property(rc, addressMain, '', '', '', '', '', '', '', 'rural',
        '', '', '', '', '', null, '', '', '');
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
        '', '', '', '', '', null, block, stair, door);
    }
  }

  showMap(): void{
    this.mapControl = false;
    this.showMapEmitter.emit(true);
  }
  getYearFromCadastre(): void {
    this.cadastreServiceES.getBuildingDetailsByRC(this.properties[0].rc).subscribe((pro) => {
      const parser2 = new DOMParser();
      const dataXML = parser2.parseFromString(pro, 'text/xml');
      const data = dataXML.getElementsByTagName('bico')[0];
      if ( !this.building.year ) {
        this.building.year = this.convertToProperty(data, this.properties[0].rc).yearConstruction;
      }
      this.typologyService.getYearCode( this.building.year ).subscribe(resYear => {
        this.building.typology.yearCode = resYear['year_code'];
        this.buildingCompleteEmitter.emit(this.building);
        this.spinner.hide();
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
    this.typologyService.getTypologyCode( this.building.year, this.building.country, this.building.climateZone,
      this.building.typology.categoryCode ).subscribe( resTypo => {
        const dataRes = resTypo[0];
        if ( dataRes ) {
          this.building.typology.categoryPicCode = dataRes.category_pic_code;
          this.building.typology.buildingCode = dataRes.category.building_code;
          this.building.typology.picName = dataRes.name;
          this.typologyService.getYearCode( this.building.year ).subscribe(resYear => {
            this.building.typology.yearCode = resYear['year_code'];
            this.calculateTypologyEmitter.emit({ building: this.building, selected: false});
          });
        } else {
          this.hasError = true;
          this.error = 'We do not have data in this climate zone';
        }
    });
  }
  getDataBuildingFromINSPIRE( parcel, partParcel ): void {
    const infoFromParcel = this.getInfoFromParcel(parcel);
    const infoFromPartOfParcel = this.getNumberOfFloorFromXML(partParcel);
    const useCut = infoFromParcel.use.split('_');
    const use = useCut[useCut.length - 1];
    if (use === 'residential' ) {
      if ( this.properties.length > 0   && !this.building.year) {
        this.cadastreServiceES.getBuildingDetailsByRC(this.properties[0].rc).subscribe((pro) => {
          const parser2 = new DOMParser();
          const dataXML = parser2.parseFromString(pro, 'text/xml');
          const data = dataXML.getElementsByTagName('bico')[0];
          const year = this.convertToProperty(data, this.properties[0].rc).yearConstruction;
          this.typologyService.getYearCode( year ).subscribe(resYear => {
            this.building.use = use;
            this.building.surface = +infoFromParcel.area;
            this.building.year = year;
            this.building.typology.yearCode = resYear['year_code'];
            this.getTypologyAutomatic(infoFromPartOfParcel, +infoFromParcel.numberOfResidentUnits );
            this.buildingCompleteEmitter.emit(this.building);
            this.spinner.hide();
          });
        });
      } else {
        this.getTypologyAutomatic(infoFromPartOfParcel, +infoFromParcel.numberOfResidentUnits );
        this.buildingCompleteEmitter.emit(this.building);
        this.spinner.hide();
      }
    } else {
      if ( infoFromParcel.area === '' && infoFromParcel.numberOfResidentUnits === '' &&
        infoFromParcel.numberOfUnits === ''  && infoFromParcel.use === '' ) {
        this.hasError = true;
        this.error = 'This Building is not residential';
      }
      this.building.typology.categoryName = 'Typology not available';
      this.spinner.hide();
    }
  }
  selectYearOption() {
    this.building.year = String(this.selectedYear);
  }
  getInfoFromCadastre_NL( ) {
    const buildingTmp = this.building;
    this.cadastreNLService.getGeneralInfoBuildingBYCoordinates(this.building.point.x, this.building.point.y).then( (data) => {
      const buildingInfo = JSON.parse(data).features[0].properties;
      buildingTmp.year = buildingInfo.bouwjaar;
      buildingTmp.use =  buildingInfo.gebruiksdoel;
      buildingTmp.rc = buildingInfo.identificatie;
      this.building = buildingTmp;
      this.buildingCompleteEmitter.emit(this.building);
      this.spinner.hide();
    });
  }
  getInfoFromCadastre_ES(getTypology: boolean) {
    const buildingTmp = this.building;
    this.cadastreServiceES.getRCByCoordinates(this.building.point.x, this.building.point.y).then( (data) => {
      this.building = null;
      const parser = new DOMParser();
      const dataFile = parser.parseFromString(data, 'text/xml');
      const err = dataFile.getElementsByTagName('err')[0];
      if ( err ){
        const desError = dataFile.getElementsByTagName('des')[0].textContent;
        this.hasError = true;
        this.error = desError;
        this.spinner.hide();
      } else {
        const rc1 = dataFile.getElementsByTagName('pc1').length > 0 ? dataFile.getElementsByTagName('pc1')[0].textContent : '';
        const rc2 = dataFile.getElementsByTagName('pc2')[0].textContent;
        const rcGeneral = rc1.concat(rc2);
        const addressMain = dataFile.getElementsByTagName('ldt')[0].textContent;
        this.cadastreServiceES.getBuildingDetailsByRC(rcGeneral).subscribe((prop) => {
          const parser2 = new DOMParser();
          const dataXML = parser2.parseFromString(prop, 'text/xml');
          // case: when request is only one property
          const propertyOnly = dataXML.getElementsByTagName('bico')[0];
          this.properties = [];
          if ( propertyOnly !== undefined ){
            const property = this.getInfoPropGeneral(propertyOnly, addressMain);
            this.properties.push(property);
          } else {
            // case: when request are many properties
            const properties = dataXML.getElementsByTagName('rcdnp');
            // tslint:disable-next-line:prefer-for-of
            for ( let i = 0; i < properties.length ; i++){
              const detail = properties[i];
              const property = this.getInfoPropGeneral(detail, addressMain);
              this.properties.push(property);
            }
            this.propertiesFilter = this.properties;
          }
          if ( !this.ruralBuilding ) {
            this.cadastreServiceES.getFacadeImage(this.properties[0].rc).subscribe( (baseImage: any) => {
              const urlCreator = window.URL;
              this.properties[0].image = this.sanitizer.bypassSecurityTrustUrl(urlCreator.createObjectURL(baseImage));
              this.properties[0].latlng = buildingTmp.coordinates;
              buildingTmp.year = this.properties[0].yearConstruction;
              buildingTmp.region = this.properties[0].province;
              buildingTmp.address = this.properties[0].address;
              buildingTmp.rc = rcGeneral;
              buildingTmp.properties = this.properties;
              this.building = buildingTmp;
              if ( getTypology ) {
                let getInfoFromINSPIRE = true;
                // Best case: Request info from Inspire
                const requestINSPIRE = this.cadastreServiceES.getBuildingInfoINSPIREParcel(this.building.rc).subscribe( parcel => {
                  this.cadastreServiceES.getBuildingInfoINSPIREPartParcel(this.building.rc).subscribe( partParcel => {
                    this.getDataBuildingFromINSPIRE(parcel, partParcel);
                  });
                }, (error) => {
                  getInfoFromINSPIRE = false;
                });
                // Case: Select Typology
                setTimeout(() => {
                  requestINSPIRE.unsubscribe();
                  if ( !getInfoFromINSPIRE && this.properties.length > 0 && !this.building.year) {
                    this.getYearFromCadastre();
                  }
                }, 1500);
              } else {
                this.getYearFromCadastre();
              }
            });
          } else {
            this.buildingCompleteEmitter.emit(this.building);
            this.spinner.hide();
          }
        });
      }
    });
  }
}
