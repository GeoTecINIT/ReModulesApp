import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {BsModalService} from 'ngx-bootstrap/modal';
import {AngularFireAuth} from '@angular/fire/auth';
import {Property} from '../../shared/models/property';
import {CadastreService} from '../../core/cadastre/cadastre.service';
import {User} from '../../shared/models/user';
import {Router} from '@angular/router';
import {UserService} from '../../core/authentication/user.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  active: number;
  properties: Property[];
  point: any;
  isUserLogged: boolean;
  currentUser: User = new User();
  history: any;
  constructor(private modalService: BsModalService, private router: Router,
              public afAuth: AngularFireAuth, public userService: UserService) {
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.isUserLogged = true;
        this.currentUser = new User(user);
        this.history = [];
        this.userService.getByUid(user.uid).subscribe(data => {
          this.currentUser.id = data['id'];
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
  }

  receivePoint($event) {
    this.properties = [];
    this.properties = $event;
  }

  refreshFavorites() {
    this.userService.getHistoryByUser(this.currentUser.id).subscribe( hist => {
      this.history = hist;
    });
  }
}
