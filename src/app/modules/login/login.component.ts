import {Component, EventEmitter, Input, NgZone, OnInit, Output} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {ActivatedRoute, Router} from '@angular/router';
import firebase from 'firebase/app';
import {BsModalService} from 'ngx-bootstrap/modal';
import {UserService} from '../../core/authentication/user.service';
import {AuthenticationService} from '../../core/authentication/authentication.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  userLogin = {email: '', pwd: ''};
  newUser = { name: '', email: '', pwd: '', repPwd: ''};
  errorLogin: string;
  errorRegister: string;
  isRegistering = false;
  submitted = false;
  return = '';
  @Input() optionSelected: number;
  @Output() loginEndedEmitter = new EventEmitter<any>();

  constructor(
    private afAuth: AngularFireAuth,
    private ngZone: NgZone,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: BsModalService,
    private userService: UserService,
    private authService: AuthenticationService
  ) {
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.ngZone.run(() => this.router.navigateByUrl(this.return)).then();
        this.modalService.hide();
      }
    });

  }

  ngOnInit() {
    this.route.queryParams
      .subscribe(params => this.return = params.return || '/');
    if (this.afAuth.currentUser) {
      // User is signed in.
      this.ngZone.run(() => this.router.navigateByUrl(this.return)).then();
    }

  }

  login() {
    this.afAuth.signInWithEmailAndPassword(this.userLogin.email, this.userLogin.pwd)
      .then( user => {
        this.authService.getToken(user.user.uid).subscribe( token => {
          localStorage.clear();
          localStorage.setItem('auth-token', String(token));
        } );
      })
      .catch(error => {
        const errorCode = error.code;
        const errorMessage = error.message;
        if (errorCode === 'auth/wrong-password') {
          this.errorLogin = 'password or username is invalid';
        } else {
          this.errorLogin = errorMessage;
        }
      });
    this.route.queryParams.subscribe(params => this.return = params.return || '/home');
    if (this.afAuth.currentUser) {
      this.ngZone.run(() => this.router.navigateByUrl(this.return)).then();
      this.loginEndedEmitter.emit(true);
    }

  }

  loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();

    this.afAuth.signInWithPopup(provider).then(result => {
      const token = result.credential;
      // The signed-in user info.
      const user = result.user;
      const id = user.uid;
      const name = user.displayName;
      const email = user.email;
      this.loginEndedEmitter.emit(true);
      this.userService.getByUid(id).subscribe( async (data: any) => {
        if (!data || data.length < 1) {
          const newUser = {
            uid: id,
            email: email,
            name: name,
          };
          Object.keys(newUser).forEach(key => {
            if (newUser[key] === 'user') {
              delete newUser[key];
            }
          });
          await this.userService.create(newUser).subscribe();
          this.submitted = true;
        }
        this.authService.getToken(id).subscribe( params => {
          localStorage.clear();
          localStorage.setItem('auth-token', params['accessToken']);
        } );
      });
    }).catch(error => {
      const errorCode = error.code;
      const errorMessage = error.message;
      this.errorLogin = errorMessage;
      console.log(errorCode + ' - ' + errorMessage);
    });
  }

  logout() {
    localStorage.clear();
    this.afAuth.signOut();
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
