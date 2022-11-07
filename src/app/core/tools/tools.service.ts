import { Injectable } from '@angular/core';
import {GlobalConstants} from '../../shared/GlobalConstants';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ToolsService {

  private baseUrl = GlobalConstants.backendURL + '/api/tools';
  private baseHistoryUrl = GlobalConstants.backendURL + '/api/history/tools';
  constructor(private http: HttpClient) { }

  getTools() {
    return this.http.get(`${this.baseUrl}`);
  }

  getTools2(){
    return this.http.get(`${this.baseUrl}`);
  }

  getUserTools(token: string) {
    return this.http.get(`${this.baseHistoryUrl}`, { headers : { 'x-access-token' : token}});
  }

  getFilters() {
    return this.http.get(`${this.baseUrl}/filters`);
  }

  create(data): Observable<any> {
    return this.http.post(`${this.baseUrl}`, data);
  }


}
