import { Injectable } from '@angular/core';
import {GlobalConstants} from '../../shared/GlobalConstants';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ToolsService {

  private baseUrl = GlobalConstants.backendURL + '/api/tools';
  constructor(private http: HttpClient) { }

  getTools() {
    return this.http.get(`${this.baseUrl}`);
  }
  getFilters() {
    return this.http.get(`${this.baseUrl}/filters`);
  }
}
