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
import {PropertySaved} from '../../shared/models/PropertySaved';

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
  history: PropertySaved[];
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
        this.userService.getHistoryByUser(user.uid).subscribe( (hist: PropertySaved) => {
          this.history = [];
          Object.entries(hist).forEach( ([key, value]) => {
            this.history.push(value);
          });
        });
      } else {
        this.isUserLogged = false;
        this.history = [];
      }
    });
  }

  ngOnInit(): void {
    this.cleanVariables();
  }

  refreshFavorites(): void {
    this.history = null;
    this.showTypology = false;
    this.userService.getHistoryByUser(this.currentUser.uid).subscribe( (hist: PropertySaved ) => {
      this.history = [];
      Object.entries(hist).forEach( ([key, value]) => {
        this.history.push(value);
      });
      this.properties = [];
      this.itemSelectedFromHistory = '';
      this.propertySelectedFormMap = '';
    });
  }
  receivePoint($event): void {
    this.properties = [];
    this.properties = $event;
    this.active = 1;
  }
  receivePropSelected($event): void {
    this.propertySelectedFormMap = $event;
    this.showTypology = false;
    this.active = 1;
  }
  receivePropFromHistory($event): void{
    this.itemSelectedFromHistory = $event;
    this.showTypology = false;
    this.active = 1;
  }
  receiveHistoryFiltered($event): void{
    this.historyFilteredFromList = $event;
  }
  calculateTypology($event): void{
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
  cleanVariables(): void {
    this.properties = [];
    this.active = 1;
    this.itemSelectedFromHistory = '';
    this.propertySelectedFormMap = '';
    this.showTypology = false;
  }
}
