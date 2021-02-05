import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

const baseUrl = 'http://localhost:3000/api/user';
const baseHistoryUserUrl = 'http://localhost:3000/api/history/user';
const baseHistoryUrl = 'http://localhost:3000/api/history';
const baseHistoryUsesUrl = 'http://localhost:3000/api/history/uses';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  getByUid(id) {
    return this.http.get(`${baseUrl}/${id}`);
  }

  create(data) {
    return this.http.post(baseUrl, data);
  }

  update(id, data) {
    return this.http.put(`${baseUrl}/${id}`, data);
  }

  getHistoryByUser(id){
    return this.http.get(`${baseHistoryUserUrl}/${id}`);
  }

  addPropertyToHistory(property) {
    return this.http.post(baseHistoryUrl, property);
  }
  getUses(){
    return this.http.get(`${baseHistoryUsesUrl}`);
  }
}
