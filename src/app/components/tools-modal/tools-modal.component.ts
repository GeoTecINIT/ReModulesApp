import { Component, Input, OnInit } from '@angular/core';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {Tools} from '../../shared/models/tools';
import {User} from '../../shared/models/user';
import {AngularFireAuth} from '@angular/fire/auth';
import {UserService} from '../../core/authentication/user.service';

@Component({
  selector: 'app-tools-modal',
  templateUrl: './tools-modal.component.html',
  styleUrls: ['./tools-modal.component.scss']
})
export class ToolsModalComponent implements OnInit {

  closeBtnName?: string;
  tool?: Tools;
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
    /*if(this.tool.name === 'DRIVE-0 autoevaluation'){
      let elem = (document.getElementById("imagen-modal"));
      elem.innerHTML += "<img class='logo-tool' src='./assets/img/tools/cropped-circular.png' width='100' height='90' alt='Logo tool'>";
    }else{
      let elem = (document.getElementById("imagen-modal"));
      elem.innerHTML += "<img class='logo-tool' src='https://www.hommaxsistemas.com:13443/web/image/website/1/favicon?unique=ff3737a' style='background-color: #ACBDD5 !important; border-radius: 50%;' width='150' height='150' alt='Logo tool'>";
    }*/
  }
}