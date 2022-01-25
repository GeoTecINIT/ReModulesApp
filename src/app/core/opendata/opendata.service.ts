import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams, JsonpClientBackend} from '@angular/common/http';
import {Observable} from 'rxjs';
import { GlobalConstants } from '../../shared/GlobalConstants';

@Injectable({
  providedIn: 'root'
})
export class OpendataService {
  apiRoot = '/v1/test-dataset?';

  constructor(private http: HttpClient) { }

  getElevation(lat, lng): Observable<any>{
    const header = new HttpHeaders({ Accept: 'application/json'});
    const params = new HttpParams()
      .set('locations', `${lat},${lng}`);
    const options = {
      header,
      params
    };
    return this.http.get(this.apiRoot, options);
  }

}
