import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  constructor(private http: HttpClient) { }

  getToken( uid: string) {
    return this.http.post('http://localhost:3000/api/user/token',
      { uid });
  }
}
