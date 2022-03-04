import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { GlobalConstants} from '../../shared/GlobalConstants';
import {Building} from '../../shared/models/building';


@Injectable({
  providedIn: 'root'
})
export class UserService {

  private baseUrl = GlobalConstants.backendURL + '/api/user';
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
  addPropertyToHistory(building: Building, token: string) {
    return this.http.post(this.baseHistoryUrl, building, { headers : { 'x-access-token' : token}});
  }
  getUserHistory(token: string) {
    return this.http.get(this.baseHistoryUrl + '/buildings',  { headers : { 'x-access-token' : token}});
  }
  isFavorite(token: string, address: string) {
    return this.http.get(this.baseHistoryUrl + '/favorite/address/' + encodeURIComponent(address),   { headers : { 'x-access-token' : token}});
  }
}
