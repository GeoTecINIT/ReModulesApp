import { Injectable } from '@angular/core';
import {HttpClient, HttpParams, JsonpClientBackend} from '@angular/common/http';
import {Observable} from 'rxjs';
import { GlobalConstants } from '../../shared/GlobalConstants';

@Injectable({
  providedIn: 'root'
})
export class GeodataService {
  apiRoot = GlobalConstants.geoServerURL + '/geoserver/ows?';

  constructor(private http: HttpClient) { }

  getClimateZones(lat, lng): Observable<any>{
   const params = new HttpParams()
      .set('service', 'WFS')
      .set('version', '1.0.0')
      .set('request', 'GetFeature')
      .set('typeName', 'modulees_geo:climate_zones')
      .set('maxFeatures', '50')
      .set('outputFormat', 'application/json')
      .set('callback', 'archive')
      .set('CQL_FILTER', `intersects(geom, POINT(${lng} ${lat}))`)
     .set('PROPERTYNAME', 'climate,code');
   return this.http.get(this.apiRoot, {params});
  }

  getCountries(lat, lng): Observable<any>{
    const params = new HttpParams()
      .set('service', 'WFS')
      .set('version', '1.0.0')
      .set('request', 'GetFeature')
      .set('typeName', 'modulees_geo:countries')
      .set('maxFeatures', '50')
      .set('outputFormat', 'application/json')
      .set('callback', 'archive')
      .set('CQL_FILTER', `intersects(geom, POINT(${lng} ${lat}))`)
      .set('PROPERTYNAME', 'fips_cntry,iso_2digit,iso_3digit,countryaff,continent');
    return this.http.get(this.apiRoot, {params});
  }

  getProvinces(lat, lng): Observable<any>{
    const params = new HttpParams()
      .set('service', 'WFS')
      .set('version', '1.0.0')
      .set('request', 'GetFeature')
      .set('typeName', 'modulees_geo:provincias')
      .set('maxFeatures', '50')
      .set('outputFormat', 'application/json')
      .set('callback', 'archive')
      .set('CQL_FILTER', `intersects(geom, POINT(${lng} ${lat}))`)
      .set('PROPERTYNAME', 'cod_prov,provincia,cod_ccaa,nombre');
    return this.http.get(this.apiRoot, {params});
  }
}
