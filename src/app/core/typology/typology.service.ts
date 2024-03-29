import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {GlobalConstants} from '../../shared/GlobalConstants';

@Injectable({
  providedIn: 'root'
})
export class TypologyService {

  private baseUrlTypology = GlobalConstants.backendURL + '/api/typology';
  private baseUrlBuilding = GlobalConstants.backendURL + '/api/geoData';
  constructor(private http: HttpClient) { }

  getTypologyPics(year, country, zone ){
    return this.http.get(`${this.baseUrlTypology}/pics/year/${year}/country/${country}/zone/${zone}`);
  }

  getTypologyCode(year, country, zone, categoryCode ){
    return this.http.get(`${this.baseUrlBuilding}/year/${year}/country/${country}/zone/${zone}/category/${categoryCode}`);
  }

  getEnvelope(yearCode, country, zone, category ){
    return this.http.get(`${this.baseUrlTypology}/envelope/country/${country}/category/${category}`);
  }

  getSystem(categoryPicCode ){
    return this.http.get(`${this.baseUrlTypology}/system/category_pic_code/${categoryPicCode}`);
  }
  getYearCode( year ){
    return this.http.get(`${this.baseUrlBuilding}/year/${year}`);
  }
  getAltitude( elevation , climateZone, country ){
    return this.http.get(`${this.baseUrlBuilding}/altitude/country/${country}/climate/${climateZone}/height/${elevation}`);
  }
  getClimateSubZone( altitude, province , climateZone, country ){
    return this.http.get(`${this.baseUrlBuilding}/climateSubZone/country/${country}/climate/${climateZone}/province/${province}/altitude/${altitude}`);
  }
  getRefurbishment( categoryPicCode ) {
    return this.http.get(`${this.baseUrlTypology}/refurbishment/enveloped/category_pic_code/${categoryPicCode}`);
  }
  getSystemRefurbishment( categoryPicCode, codeMeasure ) {
    return this.http.get(`${this.baseUrlTypology}/refurbishment/systems/category_pic_code/${categoryPicCode}/system_measure/${codeMeasure}`);
  }
  getEfficiency( categoryPicCode, codeMeasure ) {
    return this.http.get(`${this.baseUrlTypology}/refurbishment/efficiency/category_pic_code/${categoryPicCode}/system_measure/${codeMeasure}`);
  }
}
