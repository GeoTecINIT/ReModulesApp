import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {GlobalConstants} from '../../shared/GlobalConstants';

@Injectable({
  providedIn: 'root'
})
export class TypologyService {

  private baseUrl = GlobalConstants.backendURL + '/api/typology';
  constructor(private http: HttpClient) { }

  getTypologyPics(year, country, zone ){
    return this.http.get(`${this.baseUrl}/pics/year/${year}/country/${country}/zone/${zone}`);
  }

  getEnvelope(yearCode, country, zone, category ){
    return this.http.get(`${this.baseUrl}/envelope/year/${yearCode}/country/${country}/zone/${zone}/category/${category}`);
  }

  getSystem(yearCode, country, zone, buildingCode ){
    return this.http.get(`${this.baseUrl}/system/year/${yearCode}/country/${country}/zone/${zone}/building/${buildingCode}`);
  }
}
