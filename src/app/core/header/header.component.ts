import { Component, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import {LoginComponent} from '../../modules/login/login.component';
import {AngularFireAuth} from '@angular/fire/auth';
import {User} from '../../shared/models/user';
import { Router } from '@angular/router';
import {UserService} from '../authentication/user.service';

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
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.isUserLogged = true;
        this.userService.getByUid(user.uid).subscribe( userFromDB => {
          if ( userFromDB ) {
            this.currentUser = new User(user);
            this.currentUser.name = userFromDB['name'];
          }
        });
      } else {
        this.isUserLogged = false;
      }
    });
  }

  ngOnInit(): void {
  }

  openModal() {
    this.modalRef = this.modalService.show(LoginComponent, { class: 'modal-lg' });
  }
  logOut() {
    this.afAuth.signOut();
    this.router.routeReuseStrategy.shouldReuseRoute = function () {
      return false;
    };
  }
}
