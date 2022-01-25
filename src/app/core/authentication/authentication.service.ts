import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  constructor(private http: HttpClient) { }

  loginWithGoogle( token: string): void {
    this.http.post('http://localhost:3001/api/user/auth/google',
      {
        token
      }
    ).subscribe( onSuccess => {
      console.log('Exito!!!! ', onSuccess);
    }, onFail => {
      console.log('fail!!!!!');
    });
  }
}
