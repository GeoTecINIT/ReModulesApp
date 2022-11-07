import { Component, OnInit } from '@angular/core';
import {User} from '../../shared/models/user';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {LoginComponent} from '../../modules/login/login.component';
import { SignupComponent } from '../../modules/signup/signup.component';
import {AngularFireAuth} from '@angular/fire/auth';
import {UserService} from '../../core/authentication/user.service';
import Spain from '../../../assets/img/flags/spain.png';
import France from '../../../assets/img/flags/france.png';
import Bulgaria from '../../../assets/img/flags/bulgaria.png';
import Greece from '../../../assets/img/flags/greece.png';
import Italy from '../../../assets/img/flags/italy.png';
import Netherlands from '../../../assets/img/flags/netherlands.png';
import Slovenia from '../../../assets/img/flags/slovenia.png';
import { Router } from '@angular/router';

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

  public countries = [
    {
      label: "Bulgaria",
      src: Bulgaria,
      link: "",
      value: "BG"
    },
    {
      label: "Spain",
      src: Spain,
      link: "",
      value: "ES"
    },
    {
      label: "France",
      src: France,
      link: " ",
      value: "FR"
    },
    {
      label: "Greece",
      src: Greece,
      link: "",
      value: "GR"
    },
    {
      label: "Italy",
      src: Italy,
      link: " ",
      value: "IT"
    },
    {
      label: "Netherlands",
      src: Netherlands,
      link: " ",
      value: "NL"
    },
    {
      label: "Slovenia",
      src: Slovenia,
      link: " ",
      value: "Sl"
    }
  ];



  constructor(private modalService: BsModalService, public afAuth: AngularFireAuth, private userService: UserService, private router: Router) {
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

  openModalRegister() {
    this.modalRef = this.modalService.show(SignupComponent, { class: 'modal-lg' });
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

  logOut(){
    this.afAuth.signOut();
  }

  goToAccount(){
    this.router.navigate(['/', 'accountuser'])
  }
}
