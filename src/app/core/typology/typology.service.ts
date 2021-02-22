import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';

const baseUrl = 'http://localhost:3000/api/typology';
@Injectable({
  providedIn: 'root'
})
export class TypologyService {

  constructor(private http: HttpClient) { }

  getTypologyPics(year, country, zone ){
    return this.http.get(`${baseUrl}/pics/year/${year}/country/${country}/zone/${zone}`);
  }

  getEnvelope(yearCode, country, zone, category ){
    return this.http.get(`${baseUrl}/envelope/year/${yearCode}/country/${country}/zone/${zone}/category/${category}`);
  }
}
