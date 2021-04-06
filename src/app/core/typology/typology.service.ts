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

  getEnvelope(yearCode, country, zone, category ){
    return this.http.get(`${this.baseUrlTypology}/envelope/year/${yearCode}/country/${country}/zone/${zone}/category/${category}`);
  }

  getSystem(yearCode, country, zone, buildingCode ){
    return this.http.get(`${this.baseUrlTypology}/system/year/${yearCode}/country/${country}/zone/${zone}/building/${buildingCode}`);
  }
  getYearCode( year ){
    return this.http.get(`${this.baseUrlBuilding}/year/${year}`);
  }
  getBuildingCode( typoCode ){
    return this.http.get(`${this.baseUrlBuilding}/code/${typoCode}`);
  }
  getAltitude( elevation , climateZone, country ){
    return this.http.get(`${this.baseUrlBuilding}/altitude/country/${country}/climate/${climateZone}/height/${elevation}`);
  }
  getClimateSubZone( altitude, province , climateZone, country ){
    return this.http.get(`${this.baseUrlBuilding}/climateSubZone/country/${country}/climate/${climateZone}/province/${province}/altitude/${altitude}`);
  }
  getEnergyScore(country, climateCode, ClimateZone, yearCode, categoryCode){
    return this.http.get(`${this.baseUrlTypology}/energyScore/year_code/${yearCode}/country/${country}/climate_code/${climateCode}/climate_zone/${ClimateZone}/category_code/${categoryCode}`);
  }
  getScoreChart( energyScore ) {
    return this.http.get(`${this.baseUrlTypology}/scoreChart/energy_score/${energyScore}`);
  }
}
