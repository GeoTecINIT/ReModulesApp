import {Component, NgZone, OnInit} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {ActivatedRoute, Router} from '@angular/router';
import firebase from 'firebase/app';
import {BsModalService} from 'ngx-bootstrap/modal';
import {User} from '../../shared/models/user';
import {UserService} from '../../core/authentication/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  public email: string;
  public pwd: string;
  public nameRegister: string;
  public errorLogin: string;
  public errorRegister: string;
  public emailRegister: string;
  public pwdRegister: string;
  public pwdRepRegister: string;
  public isRegistering = false;
  submitted = false;
  return = '';

  constructor(
    private afAuth: AngularFireAuth,
    private ngZone: NgZone,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: BsModalService,
    private userService: UserService
  ) {
    this.email = '';
    this.pwd = '';
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.ngZone.run(() => this.router.navigateByUrl(this.return)).then();
        this.modalService.hide();
      }
    });

  }

  ngOnInit() {
    this.route.queryParams
      .subscribe(params => this.return = params.return || '/home');
    if (this.afAuth.currentUser) {
      // User is signed in.
      this.ngZone.run(() => this.router.navigateByUrl(this.return)).then();
    }
  }

  login() {
    this.afAuth.signInWithEmailAndPassword(this.email, this.pwd)
      .catch(error => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        this.errorLogin = errorMessage;
        console.log(errorCode + ' - ' + errorMessage);
      });
    this.route.queryParams.subscribe(params => this.return = params.return || '/home');
    if (this.afAuth.currentUser) {
      this.ngZone.run(() => this.router.navigateByUrl(this.return)).then();
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
      this.userService.getByUid(id).subscribe( data => {
        if (!data) {
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
          this.userService.create(newUser).subscribe(
            response => {
              console.log(response);
              this.submitted = true;
            },
            error => {
              console.log(error);
            });
        }
      });
      // ...
    }).catch(error => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      this.errorLogin = errorMessage;
      console.log(errorCode + ' - ' + errorMessage);
    });
  }

  logout() {
    this.afAuth.signOut();
  }

  register() {
    if (this.pwdRegister === this.pwdRepRegister) {
      this.afAuth.createUserWithEmailAndPassword(this.emailRegister, this.pwdRegister)
        .catch(error => {
          // Handle Errors here.
          const errorCode = error.code;
          const errorMessage = error.message;
          this.errorRegister = errorMessage;
          console.log(errorCode + ' - ' + errorMessage);
        });
      this.afAuth.onAuthStateChanged(user => {
        if (user) {
         const newUser = {
           uid: user.uid != null ? user.uid : user.uid != null ? user.uid : '',
           email: user.email != null ? user.email : '',
           name: this.nameRegister ? this.nameRegister : user.displayName,
         };
         this.userService.getByUid(newUser.uid).subscribe( data => {
            if (!data) {
              this.userService.create(newUser).subscribe(
                response => {
                  console.log(response);
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

  forgotPwd(){
    const actionCodeSettings = {
      url: 'https://eo4geo-cdt.web.app/#/login', // the domain has to be added to firebase console whitelist
      handleCodeInApp: false
    };

    this.afAuth.sendPasswordResetEmail(this.email, actionCodeSettings)
      .then(() => {
        // Password reset email sent.
        this.errorLogin = 'Check your email to recover your password.';
      })
      .catch(error => {
        // Error occurred. Inspect error.code.
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        this.errorLogin = errorMessage;
        console.log(errorCode + ' - ' + errorMessage);
      });
  }

  openRegister() {
    this.isRegistering = !this.isRegistering;
  }

}
