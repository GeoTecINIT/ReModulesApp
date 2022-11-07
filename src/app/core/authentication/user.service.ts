import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { GlobalConstants} from '../../shared/GlobalConstants';
import {Building} from '../../shared/models/building';
import { Tools } from '../../shared/models/tools';
import { User } from 'src/app/shared/models/user';
import { ceeBuilding } from 'src/app/shared/models/ceeBuilding';


@Injectable({
  providedIn: 'root'
})
export class UserService {

  private baseUrl = GlobalConstants.backendURL + '/api/user';
  private baseHistoryUrl = GlobalConstants.backendURL + '/api/history';

  constructor(private http: HttpClient) { }

  getUsers(token: string){
    return this.http.get(`${this.baseUrl}`, { headers : { 'x-access-token' : token}});
  }

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
  addPropertyCEEToHistory(building: ceeBuilding, token: string) {
    return this.http.post(`${this.baseHistoryUrl}/cee`, building, { headers : { 'x-access-token' : token}});
  }
  addPropertyToolToHistory(tool: Tools, token: string) {
    return this.http.post(`${this.baseHistoryUrl}/tools`, tool, { headers : { 'x-access-token' : token}});
  }
  getUserHistory(token: string) {
    return this.http.get(this.baseHistoryUrl + '/buildings',  { headers : { 'x-access-token' : token}});
  }
  getUserCEEHistory(token: string) {
    return this.http.get(this.baseHistoryUrl + '/cee',  { headers : { 'x-access-token' : token}});
  }
  getUserTools(token: string) {
    return this.http.get(this.baseHistoryUrl + '/tools', { headers : { 'x-access-token' : token}});
  }
  isFavorite(token: string, address: string) {
    return this.http.get(this.baseHistoryUrl + '/favorite/address/' + encodeURIComponent(address),
      { headers : { 'x-access-token' : token}});
  }
  isFavorite2(token: string, name: string) {
    return this.http.get(this.baseHistoryUrl + '/favorite/name/' + encodeURIComponent(name),
      { headers : { 'x-access-token' : token}});
  }
  updatePropertyFromHistory(building: Building, token: string) {
    return this.http.put(this.baseHistoryUrl, building, { headers : { 'x-access-token' : token}});
  }
  deletePropertyFromHistory(idBuilding: number, token: string) {
    return this.http.delete(this.baseHistoryUrl + '/building/' + +idBuilding, { headers : { 'x-access-token' : token}});
  }
  deletePropertyCEEFromHistory(idBuilding: number, token: string) {
    return this.http.delete(this.baseHistoryUrl + '/cee/' + +idBuilding, { headers : { 'x-access-token' : token}});
  }
  deletePropertyToolFromHistory(idTool: number, token: string) {
    return this.http.delete(this.baseHistoryUrl + '/tools/' + +idTool, { headers : { 'x-access-token' : token}});
  }
  getYearsRange(country: string) {
    return this.http.get( `${this.baseHistoryUrl}/years/country/${country} `);
  }
}
