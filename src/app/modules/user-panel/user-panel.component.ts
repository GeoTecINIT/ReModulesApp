import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {UserService} from '../../core/authentication/user.service';
import {Building} from '../../shared/models/building';
import {Envelope} from '../../shared/models/envelope';
import {System} from '../../shared/models/system';
import {SystemType} from '../../shared/models/systemType';
import {Efficiency} from '../../shared/models/eficiency';
import {Typology} from '../../shared/models/typology';
import {Refurbishment} from '../../shared/models/refurbishment';
import {Energy} from '../../shared/models/energy';

@Component({
  selector: 'app-user-panel',
  templateUrl: './user-panel.component.html',
  styleUrls: ['./user-panel.component.scss']
})
export class UserPanelComponent implements OnInit {

  userHistory: Building[];
  @Input() optionSelected: number;
  @Output() historyEmitter = new EventEmitter<any>();
  constructor(
    public afAuth: AngularFireAuth,
    private userService: UserService,
  ) {
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
      }
    });
  }

  ngOnInit(): void {
  }

}
