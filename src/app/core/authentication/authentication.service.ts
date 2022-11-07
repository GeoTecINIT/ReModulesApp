import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {GlobalConstants} from '../../shared/GlobalConstants';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  private baseUrl = GlobalConstants.backendURL + '/api/user';
  constructor(private http: HttpClient) { }

  getToken( uid: string) {
    return this.http.post(this.baseUrl + '/token',
      { uid });
  }
}
