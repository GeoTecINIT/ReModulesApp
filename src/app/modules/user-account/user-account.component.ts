import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

import { AngularFireAuth } from '@angular/fire/auth';

import {User} from '../../shared/models/user';

@Component({
  selector: 'app-user-account',
  templateUrl: './user-account.component.html',
  styleUrls: ['./user-account.component.scss']
})
export class UserAccountComponent implements OnInit {

  @Input() currentUser: User = new User();
  @Output() logoutEmitter = new EventEmitter<any>();
  constructor( private afAuth: AngularFireAuth) { }

  ngOnInit(): void {
  }

  logout(): void {
    this.afAuth.signOut().then( out => {
      this.logoutEmitter.emit(true);
    });
  }
}
