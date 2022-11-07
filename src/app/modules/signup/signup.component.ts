import { Component, NgZone, OnInit } from '@angular/core';
import {BsModalService} from 'ngx-bootstrap/modal';
import {UserService} from '../../core/authentication/user.service';
import {AuthenticationService} from '../../core/authentication/authentication.service';
import {AngularFireAuth} from '@angular/fire/auth';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {

  newUser = { name: '', email: '', pwd: '', repPwd: ''};
  errorRegister: string;
  isRegistering = false;
  submitted = false;
  return = ''

  constructor(private afAuth: AngularFireAuth,
    private ngZone: NgZone,
    private modalService: BsModalService,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private authService: AuthenticationService) { 
      this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.ngZone.run(() => this.router.navigateByUrl(this.return)).then();
        this.modalService.hide();
      }
    });}

  ngOnInit(): void {
  }

  register() {
    if (this.newUser.pwd === this.newUser.repPwd) {
      this.afAuth.createUserWithEmailAndPassword(this.newUser.email, this.newUser.pwd)
        .catch(error => {
          // Handle Errors here.
          const errorCode = error.code;
          this.errorRegister = error.message;
        });
      this.afAuth.onAuthStateChanged(user => {
        if (user) {
          const newUser = {
            uid: user.uid != null ? user.uid : user.uid != null ? user.uid : '',
            email: user.email != null ? user.email : '',
            name: this.newUser.name ? this.newUser.name : user.displayName,
          };
          this.userService.getByUid(newUser.uid).subscribe( data => {
            if (!data) {
              this.userService.create(newUser).subscribe(
                response => {
                  this.authService.getToken(newUser.uid).subscribe( params => {
                    localStorage.clear();
                    localStorage.setItem('auth-token', params['accessToken']);
                  } );
                  this.submitted = true;
                },
                error => {
                  console.log(error);
                });
            }
          });
        }
      });
    } else {
      this.errorRegister = 'Your passwords are not equal';
    }
  }

  openRegister() {
    this.isRegistering = !this.isRegistering;
  }

}
