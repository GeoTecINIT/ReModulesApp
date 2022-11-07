import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CadastreNLService {

  private cadastreByCoordinateURL  = '/bag/wms/v1_1';

  constructor( private http: HttpClient ) { }

  getGeneralInfoBuildingBYCoordinates(coorX: string, coorY: string): Promise<any> {
    const header = new HttpHeaders({Accept: 'application/xml'});
    const coorx2 = +coorX + .000001;
    const coory2 = +coorY + .000001;
    const bbox = coorX + ',' + coorY + ',' + String(coorx2) + ',' + String(coory2);
    const params = new HttpParams()
      .set('SERVICE', 'WMS')
      .set('VERSION', '1.3.0')
      .set('REQUEST', 'GetFeatureInfo')
      .set('FORMAT', 'image/png')
      .set('TRANSPARENT', 'true')
      .set('QUERY_LAYERS', 'pand')
      .set('layers', 'pand')
      .set('INFO_FORMAT', 'application/json')
      .set('FEATURE_COUNT', '8')
      .set('I', '50')
      .set('J', '50')
      .set('CRS', 'EPSG:28992')
      .set('WIDTH', '101')
      .set('HEIGHT', '101')
      .set('BBOX', bbox);
    const options = {
      header,
      params,
      responseType: 'text' as 'text'
    };
    return this.http.request('GET', this.cadastreByCoordinateURL, options).toPromise();
  }
}
