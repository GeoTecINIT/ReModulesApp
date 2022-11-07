import { Component, Input, OnInit } from '@angular/core';
import { User } from 'src/app/shared/models/user';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {Tools} from '../../shared/models/tools';
import {AngularFireAuth} from '@angular/fire/auth';
import {UserService} from '../../core/authentication/user.service';

@Component({
  selector: 'app-user-modal',
  templateUrl: './user-modal.component.html',
  styleUrls: ['./user-modal.component.scss']
})
export class UserModalComponent implements OnInit {

  closeBtnName?: string;
  user?: User;
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
}
