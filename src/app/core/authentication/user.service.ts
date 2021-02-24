import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {PropertySaved} from '../../shared/models/PropertySaved';

const baseUrl = 'http://localhost:3000/api/user';
const baseHistoryUserUrl = 'http://localhost:3000/api/history/user';
const baseHistoryUrl = 'http://localhost:3000/api/history';
const baseHistoryUsesUrl = 'http://localhost:3000/api/history/uses';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  getByUid(uid) {
    return this.http.get(`${baseUrl}/${uid}`);
  }

  create(data) {
    return this.http.post(baseUrl, data);
  }

  update(uid, data) {
    return this.http.put(`${baseUrl}/${uid}`, data);
  }

  getHistoryByUser(uid){
    return this.http.get<PropertySaved>(`${baseHistoryUserUrl}/${uid}`);
  }

  addPropertyToHistory(property) {
    return this.http.post(baseHistoryUrl, property);
  }
  getUses(){
    return this.http.get(`${baseHistoryUsesUrl}`);
  }

  removePropertyFromHistory( rc, user ) {
    const header = new HttpHeaders({Accept: 'text/plain'});
    const options = {
      header: header,
      responseType: 'text' as 'text'
    };
    return this.http.request('delete', `${baseHistoryUrl}/prop/${rc}/user/${user}`, options);
  }
}
