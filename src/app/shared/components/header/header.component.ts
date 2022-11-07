import { Component, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

import {AngularFireAuth} from '@angular/fire/auth';

import { Router } from '@angular/router';
import {User} from '../../models/user';
import {UserService} from '../../../core/authentication/user.service';
import {LoginComponent} from '../../../modules/login/login.component';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  modalRef: BsModalRef;
  isUserLogged: boolean;
  currentUser: User = new User();

  constructor(private modalService: BsModalService, private router: Router, public afAuth: AngularFireAuth,
              public userService: UserService) {
    this.checkLogin();
  }

  ngOnInit(): void {
    this.modalService.onHide.subscribe((e) => {
      this.checkLogin();
    });
  }

  openModal() {
    this.modalRef = this.modalService.show(LoginComponent, { class: 'modal-lg' });
  }
  logOut() {
    this.afAuth.signOut();
    this.router.routeReuseStrategy.shouldReuseRoute = () => {
      return false;
    };
  }
  checkLogin(): void {
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.isUserLogged = true;
        this.userService.getByUid(user.uid).subscribe(userFromDB => {
          if (userFromDB) {
            this.currentUser = new User(user);
            this.currentUser.name = userFromDB['user'].name;
          }
        });
      } else {
        this.isUserLogged = false;
      }
    });
   }
}
