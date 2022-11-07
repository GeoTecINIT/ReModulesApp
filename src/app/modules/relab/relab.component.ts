import { Component, OnInit } from '@angular/core';
import {User} from '../../shared/models/user';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {AngularFireAuth} from '@angular/fire/auth';
import {UserService} from '../../core/authentication/user.service';
import { UserModalComponent } from 'src/app/components/user-modal/user-modal.component';


@Component({
  selector: 'app-relab',
  templateUrl: './relab.component.html',
  styleUrls: ['./relab.component.scss']
})
export class RelabComponent implements OnInit {

  users: User[] = [];
  tmpUser: User[] = [];
  isUserLogged: boolean;
  currentUser: User = new User();
  modalRef: BsModalRef;
  showLogin: boolean;
  searchTextSupplier: any;

  constructor(private afAuth: AngularFireAuth, private userService: UserService, private modalService: BsModalService) { }

  ngOnInit(): void {
    this.checkLogin();
    this.getUsers();
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

  getUsers(){
    this.userService.getUsers(localStorage.getItem('auth-token')).subscribe( user => {
      this.buildUsersInformation(user);
      this.users.forEach( user => {
        this.tmpUser.push(user);
      });
    });
  }

  buildUsersInformation(data) {
    data.forEach( user => {
      const info = new User(user);
      this.users.push(info);
    });
  }

  openModal(user: User) {

    this.modalRef = this.modalService.show(UserModalComponent,
      { class: 'modal-dialog-centered modal-lg',
        ignoreBackdropClick: true,
        initialState: { user}});
    this.modalRef.content.closeBtnName = 'Close';
  }
}
