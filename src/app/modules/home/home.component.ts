import {Component, ElementRef, EventEmitter, OnInit, Output} from '@angular/core';
import {BsModalService} from 'ngx-bootstrap/modal';
import {AngularFireAuth} from '@angular/fire/auth';
import {Property} from '../../shared/models/property';
import {CadastreService} from '../../core/cadastre/cadastre.service';
import {User} from '../../shared/models/user';
import {Router} from '@angular/router';
import {UserService} from '../../core/authentication/user.service';
import {TypologyService} from '../../core/typology/typology.service';
import {Typology} from '../../shared/models/typology';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  active: number;
  properties: Property[];
  propertySelectedFormMap: string;
  point: any;
  isUserLogged: boolean;
  currentUser: User = new User();
  history: any;
  itemSelectedFromHistory: string;
  historyFilteredFromList: any;
  showTypology: boolean;
  propertyToGetTypology: Property;
  categories: Typology[];
  constructor( public afAuth: AngularFireAuth, public userService: UserService, public typologyService: TypologyService) {
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.isUserLogged = true;
        this.currentUser = new User(user);
        this.history = [];
        this.userService.getByUid(user.uid).subscribe(data => {
          this.currentUser.id = data['uid'];
          this.userService.getHistoryByUser(this.currentUser.id).subscribe( hist => {
            this.history = hist;
          });
        });
      } else {
        this.isUserLogged = false;
      }
    });
  }

  ngOnInit(): void {
    this.properties = [];
    this.active = 1;
    this.itemSelectedFromHistory = '';
    this.propertySelectedFormMap = '';
  }

  refreshFavorites() {
    this.history = null;
    this.userService.getHistoryByUser(this.currentUser.id).subscribe( hist => {
      this.history = hist;
      this.properties = [];
      this.itemSelectedFromHistory = '';
      this.propertySelectedFormMap = '';
    });
  }
  receivePoint($event) {
    this.properties = [];
    this.properties = $event;
    this.active = 1;
  }
  receivePropSelected($event) {
    this.propertySelectedFormMap = '';
    this.propertySelectedFormMap = $event;
    this.active = 1;
  }
  receivePropFromHistory($event){
    this.itemSelectedFromHistory = $event;
    this.active = 1;
  }
  receiveHistoryFiltered($event){
    this.historyFilteredFromList = $event;
  }
  calculateTypology($event){
    this.showTypology = true;
    this.propertyToGetTypology = $event;
    this.categories = [];
    this.typologyService.getTypologyPics(this.propertyToGetTypology.yearConstruction, 'ES', 'ME').subscribe( res => {
      Object.values(res).forEach( cat => {
        const category = new Typology(cat.category.category_code, cat.category.name, cat.year.year_code, cat.name, 'ME', 'ES', null);
        this.categories.push(category);
      });
    });
  }
}
