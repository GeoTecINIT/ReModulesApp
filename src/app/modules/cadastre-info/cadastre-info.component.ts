import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Property} from '../../shared/models/property';
import {CadastreService} from '../../core/cadastre/cadastre.service';
import {DomSanitizer} from '@angular/platform-browser';
import {UserService} from '../../core/authentication/user.service';
import {User} from '../../shared/models/user';
import {AngularFireAuth} from '@angular/fire/auth';
import {TypologyService} from '../../core/typology/typology.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-cadastre-info',
  templateUrl: './cadastre-info.component.html',
  styleUrls: ['./cadastre-info.component.scss']
})
export class CadastreInfoComponent implements OnInit, OnChanges {
  propSelected: Property;
  totalArea: number;
  propIsSelected: boolean;
  facadeImage: any;
  error: any;
  currentUser: User = new User();
  isAFavProperty: boolean;
  isUserLogged: boolean;
  searchFromHistory: boolean;
  filtBl: string;
  filtEs: string;
  filtPt: string;
  filtPu: string;
  propertiesFilter: Property[];
  @Input() propSelectFromMap: string;
  @Input() history: any;
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

  ngOnInit(): void {
    this.filtBl = '';
    this.filtEs = '';
    this.filtPt = '';
    this.filtPu = '';
  }

  ngOnChanges(changes: SimpleChanges) {
    if ( changes.properties &&  changes.properties.firstChange) {
      this.propertiesFilter = changes.properties.currentValue;
    }
    if ( changes.properties &&  !changes.properties.firstChange ) {
      this.propSelected = null;
      this.propIsSelected = false;
      this.propertiesFilter = changes.properties.currentValue;
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

  initialData(){
    this.propSelected = null;
    this.totalArea = 0;
    this.propIsSelected = true;
    this.isAFavProperty = false;
  }

  /**
   * Assign to property selected the entire information from cadastral service
   * @param rc: Property selected from the list
   */
  getDetailFromRC(rc: any){
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
  convertToProperty(info: any, rc: string) {
    const address = info.getElementsByTagName('ldt')[0].textContent;
    const use = info.getElementsByTagName('luso')[0].textContent;
    const surfaceCons = info.getElementsByTagName('sfc').length > 0 ? info.getElementsByTagName('sfc')[0].textContent : '';
    const year = info.getElementsByTagName('ant').length > 0 ? info.getElementsByTagName('ant')[0].textContent : '';
    const surfaceGraph = info.getElementsByTagName('sfc')[0].textContent;
    console.log('Encontre!!! ', info.getElementsByTagName('cpt'));
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
  addToFavorites( propSelected: Property ){
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
      this.history.push(propToSave);
      this.isAFavProperty = true;
    });
  }

  removeFromFavorites( propSelected: Property ){
    this.userService.removePropertyFromHistory( propSelected.rc,  this.currentUser.uid).subscribe( res => {
      const index = this.history.indexOf(propSelected, 0);
      if (index > -1) {
        this.history.splice(index, 1);
      }
    });
  }

  isAFavoriteProperty(property: Property){
    if ( this.history ) {
      this.history.forEach(prop => {
        this.isAFavProperty = prop.rc === property.rc;
      });
    }
  }
  filterBuilding() {
    if ( this.filtBl !== '' ||  this.filtEs !== '' ||  this.filtPt !== '' ||  this.filtPu !== '' ) {
      this.propertiesFilter = this.properties.filter(
        it => ( this.filtBl ? it.block.toLowerCase().includes(this.filtBl.toLowerCase()) : false ) ||
          ( this.filtEs ? it.stair.toLowerCase().includes(this.filtEs.toLowerCase()) : false ) ||
          ( this.filtPt ? it.floor.toLowerCase().includes(this.filtPt.toLowerCase()) : false ) ||
          ( this.filtPu ? it.door.toLowerCase().includes(this.filtPu.toLowerCase()) : false )
      );
    } else {
      this.propertiesFilter = this.properties;
    }
  }
  calculateTypology(){
    this.calculateTypologyEmitter.emit(this.propSelected);
  }
}
