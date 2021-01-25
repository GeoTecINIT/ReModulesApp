import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

const baseUrl = 'http://localhost:8080/api/user';
const baseHistoryUrl = 'http://localhost:8080/api/history';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  getAll() {
    return this.http.get(baseUrl);
  }

  getByUid(id) {
    return this.http.get(`${baseUrl}/${id}`);
  }

  create(data) {
    return this.http.post(baseUrl, data);
  }

  update(id, data) {
    return this.http.put(`${baseUrl}/${id}`, data);
  }

  delete(id) {
    return this.http.delete(`${baseUrl}/${id}`);
  }

  getHistoryByUser(id){
    return this.http.get(`${baseHistoryUrl}/${id}`);
  }

  addPropertyToHistory(property) {
    return this.http.post(baseHistoryUrl, property);
  }
}
