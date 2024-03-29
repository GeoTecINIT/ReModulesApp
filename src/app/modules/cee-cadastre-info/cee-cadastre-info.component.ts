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
import { CeeService } from 'src/app/core/wms/cee.service';
import {Router} from '@angular/router';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-cee-cadastre-info',
  templateUrl: './cee-cadastre-info.component.html',
  styleUrls: ['./cee-cadastre-info.component.scss']
})
export class CeeCadastreInfoComponent implements OnInit, OnChanges {
  spinnerColor: string;
  propSelected: Property;
  propIsSelected: boolean;
  facadeImage: any;
  hasError: boolean;
  error: string;
  currentUser: User = new User();
  isUserLogged: boolean;
  modelFilters = {filtBl: '', filtEs: '', filtPt: '', filtPu: ''};
  propertiesFilter: Property[];
  mapControl: boolean;
  ruralBuilding: boolean;
  selectBuilding: boolean;
  errorLocation: boolean;
  data: any;
  optionSelected: number;

  dataNumberCertificate: any;
  dataCalificationCEE: any;
  dataEnergyConsumed: any;
  dataCo2Emissions: any;
  calificationEnergyPrimary: any;
  dataCalificationEnergyPrimary: any;
  dataCadastreReference: any;

  numberCertificate: any;
  calificationCEE: any;
  energyConsumed: any;
  co2Emissions: any;
  cadastreReference: any;
  expDirection: any;
  caseCertificate: any;
  co2EmissionsCertificate2: any;
  energyConsumedCertificate2: any;
  numberCertificate2: any;
  calificationEnergyPrimaryCertificate2: any;
  calificationCO2EmissionsCertificate2: any;

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
  @Output() optionEmitter = new EventEmitter<any>();

  constructor(private cadastreServiceES: CadastreESService,
    private cadastreNLService: CadastreNLService,
    private sanitizer: DomSanitizer,
    public afAuth: AngularFireAuth,
    private userService: UserService,
    private typologyService: TypologyService,
    private ceeServiceCV: CeeService,
    private spinner: NgxSpinnerService,
    private router: Router) {
      this.afAuth.onAuthStateChanged(user => {
        if (user) {
          this.currentUser = new User(user);
          this.isUserLogged = true;
        }
        else { this.isUserLogged = false; }
      });
      this.propertiesFilter = this.properties;
      this.spinnerColor = '#63c5ab';
  }

  ngOnInit(){
    this.years = [];
    for (let i = new Date().getFullYear(); i >= 1000; i--) {
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
        this.selectedYear = null;
        this.ruralBuilding = false;
        if( changes.building.currentValue.year ) {
          this.selectedYear = changes.building.currentValue.year;
          this.building.year = changes.building.currentValue.year;
        }
        this.building.typology = new Typology('', '', '', '', '', '',
            '', null, null, null);
        if ( this.building.country  === 'ES') {
            this.spinner.show();
            this.textSpinner = 'Waiting for the cadastre service ... ';
            this.selectBuilding = true;
            this.selectYear = false;
            this.getInfoFromCadastre_ES(true);
            const coordinateX = this.building.point.x;
            const coordinateY = this.building.point.y;
            const coordinateLong = this.building.coordinates.lng;
            const coordinateLat = this.building.coordinates.lat;
            console.log(coordinateX)
            localStorage.setItem('coordinateX', coordinateX);
            localStorage.setItem('coordinateLong', coordinateLong)
            localStorage.setItem('coordinateLat', coordinateLat)
            console.log(coordinateY)
            console.log("Lat " + coordinateLat);
            console.log("Long " + coordinateLong)
            localStorage.setItem('coordinateY', coordinateY);
            this.getCEE(coordinateX, coordinateY);

        } else if ( this.building.country  === 'NL' ) {
          this.spinner.show();
          this.selectBuilding = true;
          this.selectYear = false;
          this.getInfoFromCadastre_NL();
        } else {
          this.showYearSelection();
        }
      }
      if ( changes.error && changes.error.currentValue) {
        this.error = changes.error.currentValue;
        this.hasError = true;
      }
    }
  }

  showErrorLocation() {
    const buildingTmp  = this.building;
    //this.building = null;
    this.spinner.show();
    this.errorLocation = true;
    this.selectBuilding = false;
    this.hasError = true;
    this.error = 'There is not information in this point, please move inside building ';
    this.building  = new Building(buildingTmp.country, buildingTmp.climateZone, buildingTmp.climateSubZone,
      '', buildingTmp.region, buildingTmp.provinceCode,
      buildingTmp.address, buildingTmp.altitudeCode, buildingTmp.coordinates, buildingTmp.point,
      [], null, '', null, null, false, null, [], 0);
    this.properties = [];
    this.propertiesFilter = [];
    this.spinner.hide();
  }

  showYearSelection() {
    const buildingTmp  = this.building;
    this.building = null;
    this.spinner.show();
    this.selectBuilding = true;
    this.selectYear = true;
    this.building  = new Building(buildingTmp.country, buildingTmp.climateZone, buildingTmp.climateSubZone,
      buildingTmp.year, buildingTmp.region, buildingTmp.provinceCode,
      buildingTmp.address, buildingTmp.altitudeCode, buildingTmp.coordinates, buildingTmp.point,
      [], null, '', null, null, false, null, [], 0);
    this.properties = [];
    this.propertiesFilter = [];
    this.spinner.hide();
  }
  initialData(): void{
    this.propSelected = null;
    this.propIsSelected = true;
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
      const postalCode = prop.getElementsByTagName('dp') && prop.getElementsByTagName('dp').length > 0 ?
        prop.getElementsByTagName('dp')[0].textContent : '';
      const prov = prop.getElementsByTagName('np') && prop.getElementsByTagName('np').length > 0 ?
        prop.getElementsByTagName('np')[0].textContent : '';
      const town = prop.getElementsByTagName('nm') && prop.getElementsByTagName('nm').length > 0 ?
        prop.getElementsByTagName('nm')[0].textContent : '';
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
    },
      err => {
        this.showYearSelection();
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

  getInfoFromINSPIRECP(information: string): any{
    const domParser = new DOMParser();
    const dataXML = domParser.parseFromString(information, 'text/xml');
    const buildedSurface = dataXML.getElementsByTagName('cp:areaValue').length > 0 ?
      dataXML.getElementsByTagName('cp:areaValue')[0].textContent : '';

    return buildedSurface;
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
  getTypologyAutomatic(floors: number, dwellings: number, numberOfUnits: number,  surfaceIn: number, buildedSurface: number  ): void {
    const typology = { code: '', name: ''};
    if ( numberOfUnits === 1 ) {
      const surface = surfaceIn * 0.6;

      if ( buildedSurface < surface ) {
        typology.code = 'SFH'; typology.name = 'Single Family Home';
      }
      else {
        typology.code = 'TH'; typology.name = 'Terraced House';
      }
    }
    else if ( dwellings > 1 ) {
      if ( floors > 1 && floors <= 5 ) { typology.code = 'MFH'; typology.name = 'MultiFamily Home'; }
      else if ( floors > 5 ) { typology.code = 'AB'; typology.name = 'Apartment block'; }
    }
    this.building.typology.categoryCode = typology.code;
    this.building.typology.categoryName = typology.name;
    this.typologyService.getTypologyCode( this.building.year, this.building.country, this.building.climateZone,
      this.building.typology.categoryCode ).subscribe( resTypo => {
        const dataRes = resTypo[0];
        if ( dataRes ) {
          this.building.typology.categoryPicCode = dataRes.category_pic_code;
          this.building.typology.buildingCode = dataRes.category.building_code;
          localStorage.setItem('typology', this.building.typology.categoryName);
          localStorage.setItem('addressBuilding', this.building.address);
          localStorage.setItem('yearBuilding', this.building.year);
          localStorage.setItem('facadeImage', this.properties[0].image);
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
  getDataBuildingFromINSPIRE( parcel, partParcel, cp ): void {
    const infoFromParcel = this.getInfoFromParcel(parcel);
    const infoFromCadastralParcel = this.getInfoFromINSPIRECP(cp);
    const infoFromPartOfParcel = this.getNumberOfFloorFromXML(partParcel);
    const useCut = infoFromParcel.use.split('_');
    const use = useCut[useCut.length - 1];
    if (use === 'residential' ) {
      if ( this.properties.length > 0   && !this.building.year) {
        this.cadastreServiceES.getBuildingDetailsByRC(this.properties[0].rc).subscribe((pro) => {
          const parser2 = new DOMParser();
          const dataXML = parser2.parseFromString(pro, 'text/xml');
          const data = dataXML.getElementsByTagName('bico')[0];
          const infoProp0 = this.convertToProperty(data, this.properties[0].rc);
          const year = infoProp0.yearConstruction;
          if ( infoProp0.surfaceCons !== '0'){
            this.typologyService.getYearCode( year ).subscribe(resYear => {
              this.building.use = use;
              this.building.surface = +infoFromParcel.area;
              this.building.year = year;
              this.building.typology.yearCode = resYear['year_code'];
              this.getTypologyAutomatic(infoFromPartOfParcel, +infoFromParcel.numberOfResidentUnits, +infoFromParcel.numberOfUnits,
                infoFromCadastralParcel, +infoFromParcel.area );
              this.buildingCompleteEmitter.emit(this.building);
              this.spinner.hide();
            });
          } else {
            this.hasError = true;
            this.error = 'This Building is not residential';
            this.spinner.hide();
          }
        });
      } else {
        this.getTypologyAutomatic(infoFromPartOfParcel, +infoFromParcel.numberOfResidentUnits, +infoFromParcel.numberOfUnits,
          infoFromCadastralParcel,
          +infoFromParcel.buildedSurface  );
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
    this.errorLocation = false;
    this.selectYear = false;
    const buildingTmp = this.building;
    this.cadastreServiceES.getRCByCoordinates(this.building.point.x, this.building.point.y).then( (data) => {
      this.selectBuilding = false;
      //this.building = null;
      const parser = new DOMParser();
      const dataFile = parser.parseFromString(data, 'text/xml');
      const err = dataFile.getElementsByTagName('err')[0];
      if ( err ){
        const desError = dataFile.getElementsByTagName('des')[0].textContent;
        const codError = dataFile.getElementsByTagName('cod')[0].textContent;
        if ( codError === '16') {
          this.showErrorLocation();
          this.spinner.hide();
        } else {
          this.showYearSelection();
          this.spinner.hide();
        }
        /*this.hasError = true;
        this.error = desError;
        this.spinner.hide();*/
      } else {
        this.selectBuilding = true;
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
              localStorage.setItem('ImageFacade', this.properties[0].image);
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
                  if ( parcel && parcel.length > 0 ) {
                    getInfoFromINSPIRE = true;
                    this.cadastreServiceES.getBuildingInfoINSPIREPartParcel(this.building.rc).subscribe( partParcel => {
                      this.cadastreServiceES.getBuildingInfoINSPIRECadastralParcel(this.building.rc).subscribe( cp => {
                        this.getDataBuildingFromINSPIRE(parcel, partParcel, cp);
                      },err => {
                        this.showYearSelection();
                      });
                    },err => {
                      this.showYearSelection();
                    });
                  }
                  else  {
                    this.showYearSelection();
                  }
                }, (error) => {
                  this.showYearSelection();
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
            this.showYearSelection();
          }
        });
      }
    }, error => {
      this.spinner.show();
      this.building = buildingTmp;
      if ( !this.errorLocation ) {
        this.selectYear = true;
        this.selectBuilding = true;
      } else {
        this.selectBuilding = false;
      }
      this.properties = [];
      this.propertiesFilter = [];
      this.spinner.hide();
    });
  }

  goBack() {
    this.optionEmitter.emit(1);
  }

  getCEE(coorX: string, coorY: string): any {
    this.ceeServiceCV.getGeneralInfoCEE(coorX, coorY).then(pro => {
      const parser = new DOMParser();
      const dataXML = parser.parseFromString(pro, 'text/xml');
      //Certificate 1
      let yearCertificate = dataXML.getElementsByTagName('certificados_layer')[0].getElementsByTagName('certificados_feature')[0].getElementsByTagName('codigo')[0].textContent.substring(1, 5);
      let calificationCO2EmissionsCEE = dataXML.getElementsByTagName('certificados_layer')[0].getElementsByTagName('certificados_feature')[0].getElementsByTagName('cer_emicalificacion')[0].textContent;
      let calificationEnergyPrimaryCEE = dataXML.getElementsByTagName('certificados_layer')[0].getElementsByTagName('certificados_feature')[0].getElementsByTagName('cer_concalificacion')[0].textContent;
      let energyConsumed = dataXML.getElementsByTagName('certificados_layer')[0].getElementsByTagName('certificados_feature')[0].getElementsByTagName('cer_contotal')[0].textContent;
      let co2Emissions = dataXML.getElementsByTagName('certificados_layer')[0].getElementsByTagName('certificados_feature')[0].getElementsByTagName('cer_emitotal')[0].textContent;
      let cadastreReference = dataXML.getElementsByTagName('certificados_layer')[0].getElementsByTagName('certificados_feature')[0].getElementsByTagName('ref_referencia')[0].textContent;
      let expDirection = dataXML.getElementsByTagName('certificados_layer')[0].getElementsByTagName('certificados_feature')[0].getElementsByTagName('exp_direccion')[0].textContent;
      let caseCertificate = dataXML.getElementsByTagName('certificados_layer')[0].getElementsByTagName('certificados_feature')[0].getElementsByTagName('usoedificio')[0].textContent;
      const err = dataXML.getElementsByTagName('err')[0];

      //Certificate 2
      let yearCertificate2 = dataXML.getElementsByTagName('certificados_layer')[0].getElementsByTagName('certificados_feature')[1].getElementsByTagName('codigo')[0].textContent.substring(1, 5);
      let co2Emissions2 = dataXML.getElementsByTagName('certificados_layer')[0].getElementsByTagName('certificados_feature')[1].getElementsByTagName('cer_emitotal')[0].textContent;
      let energyConsumed2 = dataXML.getElementsByTagName('certificados_layer')[0].getElementsByTagName('certificados_feature')[1].getElementsByTagName('cer_contotal')[0].textContent;
      let calificationCO2EmissionsCEECertificate2 = dataXML.getElementsByTagName('certificados_layer')[0].getElementsByTagName('certificados_feature')[1].getElementsByTagName('cer_emicalificacion')[0].textContent;
      let calificationEnergyPrimaryCEECertificate2 = dataXML.getElementsByTagName('certificados_layer')[0].getElementsByTagName('certificados_feature')[1].getElementsByTagName('cer_concalificacion')[0].textContent;
      
      this.data = pro;

      console.log(this.data);
      console.log(yearCertificate);
      console.log(calificationCO2EmissionsCEE);
      console.log(calificationEnergyPrimaryCEE);
      console.log(energyConsumed);
      console.log(co2Emissions);
      console.log(cadastreReference);

      //Certificate 2
      console.log("Certificate 2: " + yearCertificate2);
      console.log("Co2 emissions certificate 2: " + co2Emissions2);
      console.log("Energy consumed Certificate 2: " + energyConsumed2);
      console.log("Calification Co2 emissions certificate 2: " + calificationCO2EmissionsCEECertificate2);
      console.log("Calification energy consumed certificate 2: " + calificationEnergyPrimaryCEECertificate2);

      this.numberCertificate = yearCertificate;
      this.calificationCEE = calificationCO2EmissionsCEE;
      this.energyConsumed = energyConsumed;
      this.co2Emissions = co2Emissions;
      this.calificationEnergyPrimary = calificationEnergyPrimaryCEE;
      this.cadastreReference = cadastreReference;
      this.expDirection = expDirection;
      this.caseCertificate = caseCertificate;

      //Certificate 2
      this.co2EmissionsCertificate2 = co2Emissions2;
      this.energyConsumedCertificate2 = energyConsumed2;
      this.numberCertificate2 = yearCertificate2;
      this.calificationEnergyPrimaryCertificate2 = calificationEnergyPrimaryCEECertificate2;
      this.calificationCO2EmissionsCertificate2 = calificationCO2EmissionsCEECertificate2;

      if(calificationCO2EmissionsCEE === 'A'){
        let elem = (document.getElementById("calificationCEE"));
        elem?.setAttribute("style", "color:black; background-color: #0c964d; padding-top: 5px !important; width: 50%; border-top-right-radius: 15px; border-bottom-right-radius: 15px; border-left-color: #0c964d; border-bottom: 10px solid transparent;");
      }else if(calificationCO2EmissionsCEE === 'B'){
        let elem = (document.getElementById("calificationCEE"));
        elem?.setAttribute("style", "color:black; background-color: #21b14a; padding-top: 5px !important; width: 50%; border-top-right-radius: 15px; border-bottom-right-radius: 15px; border-left-color: #21b14a; border-bottom: 10px solid transparent;");
      }else if(calificationCO2EmissionsCEE === 'C'){
        let elem = (document.getElementById("calificationCEE"));
        elem?.setAttribute("style", "color:black; background-color: #99ca39; padding-top: 5px !important; width: 50%; border-top-right-radius: 15px; border-bottom-right-radius: 15px; border-left-color: #99ca39; border-bottom: 10px solid transparent;");
      }else if(calificationCO2EmissionsCEE === 'D'){
        let elem = (document.getElementById("calificationCEE"));
        elem?.setAttribute("style", "color:black; background-color: #ebe724; padding-top: 5px !important; width: 50%; border-top-right-radius: 15px; border-bottom-right-radius: 15px; border-left-color: #ebe724; border-bottom: 10px solid transparent;");
      }else if(calificationCO2EmissionsCEE === 'E'){
        let elem = (document.getElementById("calificationCEE"));
        elem?.setAttribute("style", "color:black; background-color: #f0b619; padding-top: 5px !important; width: 50%; border-top-right-radius: 15px; border-bottom-right-radius: 15px; border-left-color: #f0b619; border-bottom: 10px solid transparent; --angle-width: 2rem !important;");
      }else if(calificationCO2EmissionsCEE === 'F'){ 
        let elem = (document.getElementById("calificationCEE"));
        elem?.setAttribute("style", "color:black; background-color: #e17726; padding-top: 5px !important; width: 50%; border-top-right-radius: 15px; border-bottom-right-radius: 15px; border-left-color: #e17726; border-bottom: 10px solid transparent;");
      }else if(calificationCO2EmissionsCEE === 'G'){
        let elem = (document.getElementById("calificationCEE"));
        elem?.setAttribute("style", "color:black; background-color: #e52d29; padding-top: 5px !important; width: 50%; border-top-right-radius: 15px; border-bottom-right-radius: 15px; border-left-color: #e52d29; border-bottom: 10px solid transparent;");
      }

      if(calificationEnergyPrimaryCEE === 'A'){
        let elem = (document.getElementById("calificationEnergyPrimaryCEE"));
        elem?.setAttribute("style", "color:black; background-color: #0c964d; padding-top: 5px !important; width: 50%; border-top-right-radius: 15px; border-bottom-right-radius: 15px; border-left-color: #0c964d; border-bottom: 10px solid transparent;");
      }else if(calificationEnergyPrimaryCEE === 'B'){
        let elem = (document.getElementById("calificationEnergyPrimaryCEE"));
        elem?.setAttribute("style", "color:black; background-color: #21b14a; padding-top: 5px !important; width: 50%; border-top-right-radius: 15px; border-bottom-right-radius: 15px; border-left-color: #21b14a; border-bottom: 10px solid transparent;");
      }else if(calificationEnergyPrimaryCEE === 'C'){
        let elem = (document.getElementById("calificationEnergyPrimaryCEE"));
        elem?.setAttribute("style", "color:black; background-color: #99ca39; padding-top: 5px !important; width: 50%; border-top-right-radius: 15px; border-bottom-right-radius: 15px; border-left-color: #99ca39; border-bottom: 10px solid transparent;");
      }else if(calificationEnergyPrimaryCEE === 'D'){
        let elem = (document.getElementById("calificationEnergyPrimaryCEE"));
        elem?.setAttribute("style", "color:black; background-color: #ebe724; padding-top: 5px !important; width: 50%; border-top-right-radius: 15px; border-bottom-right-radius: 15px; border-left-color: #ebe724; border-bottom: 10px solid transparent;");
      }else if(calificationEnergyPrimaryCEE === 'E'){
        let elem = (document.getElementById("calificationEnergyPrimaryCEE"));
        elem?.setAttribute("style", "color:black; background-color: #f0b619; padding-top: 5px !important; width: 50%; border-top-right-radius: 15px; border-bottom-right-radius: 15px; border-left-color: #f0b619; border-bottom: 10px solid transparent; --angle-width: 2rem !important;");
      }else if(calificationEnergyPrimaryCEE === 'F'){ 
        let elem = (document.getElementById("calificationEnergyPrimaryCEE"));
        elem?.setAttribute("style", "color:black; background-color: #e17726; padding-top: 5px !important; width: 50%; border-top-right-radius: 15px; border-bottom-right-radius: 15px; border-left-color: #e17726; border-bottom: 10px solid transparent;");
      }else if(calificationEnergyPrimaryCEE === 'G'){
        let elem = (document.getElementById("calificationEnergyPrimaryCEE"));
        elem?.setAttribute("style", "color:black; background-color: #e52d29; padding-top: 5px !important; width: 50%; border-top-right-radius: 15px; border-bottom-right-radius: 15px; border-left-color: #e52d29; border-bottom: 10px solid transparent;");
      }

      localStorage.setItem('numberCertificate', this.numberCertificate);
      localStorage.setItem('calificationCEE', this.calificationCEE);
      localStorage.setItem('energyConsumed', this.energyConsumed);
      localStorage.setItem('co2Emissions', this.co2Emissions);
      localStorage.setItem('cadastreReference', this.cadastreReference);
      localStorage.setItem('calificationEnergyPrimary', this.calificationEnergyPrimary);
      localStorage.setItem('expDirection', this.expDirection);
      localStorage.setItem('caseCertificate', this.caseCertificate);

      //Certificate 2
      localStorage.setItem('yearCertificate2', this.numberCertificate2);
      localStorage.setItem('co2EmissionsCertificate2', this.co2EmissionsCertificate2);
      localStorage.setItem('energyConsumedCertificate2', this.energyConsumedCertificate2);
      localStorage.setItem('calificationEnergyConsumedCertificate2', this.calificationEnergyPrimaryCertificate2);
      localStorage.setItem('calificatioCo2EmissionsCertificate2', this.calificationCO2EmissionsCertificate2);

      this.dataNumberCertificate = localStorage.getItem('numberCertificate');
      this.dataCalificationCEE = localStorage.getItem('calificationCEE');
      this.dataEnergyConsumed = localStorage.getItem('energyConsumed');
      this.dataCo2Emissions = localStorage.getItem('co2Emissions');
      this.dataCalificationEnergyPrimary = localStorage.getItem('calificationEnergyPrimary');
      this.dataCadastreReference = localStorage.getItem('cadastreReference');

      return { yearCertificate, calificationCO2EmissionsCEE, energyConsumed, co2Emissions, calificationEnergyPrimaryCEE, cadastreReference }
    });
  }

  goToFormCEE() {
    this.optionEmitter.emit('formcee');
  }
}
