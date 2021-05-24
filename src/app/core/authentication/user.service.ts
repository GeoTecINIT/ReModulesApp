import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { GlobalConstants} from '../../shared/GlobalConstants';
import {Building} from '../../shared/models/building';


@Injectable({
  providedIn: 'root'
})
export class UserService {

  private baseUrl = GlobalConstants.backendURL + '/api/user';
  private baseHistoryUserUrl = GlobalConstants.backendURL + '/api/history/user';
  private baseHistoryUrl = GlobalConstants.backendURL + '/api/history';

  constructor(private http: HttpClient) { }

  getByUid(uid) {
    return this.http.get(`${this.baseUrl}/${uid}`);
  }

  create(data) {
    return this.http.post(this.baseUrl, data);
  }

  update(uid, data) {
    return this.http.put(`${this.baseUrl}/${uid}`, data);
  }

  getHistoryByUser(uid){
    return this.http.get(`${this.baseHistoryUserUrl}/${uid}`);
  }

  addPropertyToHistory(building) {
    return this.http.post(this.baseHistoryUrl, building);
  }

  removePropertyFromHistory( rc, user ) {
    const header = new HttpHeaders({Accept: 'text/plain'});
    const options = {
      header,
      responseType: 'text' as 'text'
    };
    return this.http.request('delete', `${this.baseHistoryUrl}/prop/${rc}/user/${user}`, options);
  }

  getAllHistory() {
    return this.http.get(`${this.baseHistoryUrl}`);
  }

  getBuildingByAddress(address) {
    return this.http.get(`${this.baseHistoryUrl}/address/${address}`);
  }
}
