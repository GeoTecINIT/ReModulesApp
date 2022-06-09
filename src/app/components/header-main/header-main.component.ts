import { Component, OnInit } from '@angular/core';
import {User} from '../../shared/models/user';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {LoginComponent} from '../../modules/login/login.component';
import {AngularFireAuth} from '@angular/fire/auth';
import {UserService} from '../../core/authentication/user.service';

@Component({
  selector: 'app-header-main',
  templateUrl: './header-main.component.html',
  styleUrls: ['./header-main.component.scss']
})
export class HeaderMainComponent implements OnInit {

  isUserLogged: boolean;
  currentUser: User = new User();
  modalRef: BsModalRef;
  showLogin: boolean;

  constructor(private modalService: BsModalService, public afAuth: AngularFireAuth, private userService: UserService) { }

  ngOnInit(): void {
    this.modalService.onHide.subscribe((e) => {
      this.checkLogin();
    });
  }

  openModal() {
    this.modalRef = this.modalService.show(LoginComponent, { class: 'modal-lg' });
  }

  checkLogin(): void {
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.isUserLogged = true;
        this.currentUser = new User(user);
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
}
