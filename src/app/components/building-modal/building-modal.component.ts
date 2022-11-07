import { Component, Input, OnInit } from '@angular/core';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import { Building } from 'src/app/shared/models/building';
import {User} from '../../shared/models/user';
import {AngularFireAuth} from '@angular/fire/auth';
import {UserService} from '../../core/authentication/user.service'

@Component({
  selector: 'app-building-modal',
  templateUrl: './building-modal.component.html',
  styleUrls: ['./building-modal.component.scss']
})
export class BuildingModalComponent implements OnInit {

  closeBtnName?: string;
  building?: Building;
  isUserLogged: boolean;
  currentUser: User = new User();
  countryOneClick: string;
  countriesOneClick: [{id, name}];
  comments = "";
  postComments = [];
  replyComments = "";
  postReplyComments = [];

  @Input() currentUserID: string;

  constructor(public bsModalRef: BsModalRef, public afAuth: AngularFireAuth, private userService: UserService) {
    this.checkLogin();
   }

  ngOnInit(): void {
    this.dataValues();
  }

  checkLogin(): void {
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.isUserLogged = true;
        this.currentUser = new User(user);
        console.log('user 2!! ',  new User(user));
        this.userService.getByUid(user.uid).subscribe(userFromDB => {
          if (userFromDB) {
            this.currentUser.name = userFromDB['user'].name;
            this.currentUser.role = userFromDB['role'].name;
          }
        });
      } else {
        this.isUserLogged = false;
      }
    });
  }

  postComment(): void{
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.isUserLogged = true;
        this.currentUser = new User(user);
        console.log('user 2!! ',  new User(user));
        this.userService.getByUid(user.uid).subscribe(userFromDB => {
          if (userFromDB) {
            this.currentUser.name = userFromDB['user'].name;
            this.currentUser.role = userFromDB['role'].name;
          }
        });
      } else {
        this.isUserLogged = false;
      }
    });
    this.postComments.push(this.comments)
  }

  postReplyComment(): void{
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.isUserLogged = true;
        this.currentUser = new User(user);
        console.log('user 2!! ',  new User(user));
        this.userService.getByUid(user.uid).subscribe(userFromDB => {
          if (userFromDB) {
            this.currentUser.name = userFromDB['user'].name;
            this.currentUser.role = userFromDB['role'].name;
          }
        });
      } else {
        this.isUserLogged = false;
      }
    });
    this.postReplyComments.push(this.replyComments)
  }

  dataValues(){
    if(this.building.climateZone === 'ES.ME'){
      let elem = (document.getElementById("climateZone"));
      elem.innerHTML += "<div>Mediterranean</div>";
    }

    if(this.building.country === 'ES'){
      let elem = (document.getElementById("countryBuilding"));
      elem.innerHTML += "<div>Spain</div>";
    }
  }

}
