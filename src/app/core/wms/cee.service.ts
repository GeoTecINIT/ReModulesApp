import { Injectable } from '@angular/core';
import {HttpClient, HttpEvent, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CeeService {

  private ceeByURL = 'https://terramapas.icv.gva.es/certificados_energeticos?';

  constructor(private http: HttpClient) { }

  getGeneralInfoCEE(coorX: string, coorY: string): Promise<any>{
    const header = new HttpHeaders({Accept: 'application/xml'});
    const coorx2 = +coorX + .000001;
    const coory2 = +coorY + .000001;
    const bbox = coorX + ',' + coorY + ',' + String(coorx2) + ',' + String(coory2);
    const params = new HttpParams()
      .set('SERVICE', 'WMS')
      .set('QUERY_LAYERS', 'certificados')
      .set('VERSION', '1.3.0')
      .set('INFO_FORMAT', 'application/vnd.ogc.gml')
      .set('LAYERS', 'certificados')
      .set('REQUEST', 'GetFeatureInfo')
      .set('FEATURE_COUNT', '150')
      .set('LANGUAGE', 'spa')
      .set('WIDTH', '1446')
      .set('HEIGHT', '923')
      .set('BBOX', bbox)
      .set('CRS', 'EPSG:25830')
      .set('I', '868')
      .set('J', '202')
    const options = {
      header,
      params,
      responseType: 'text' as 'text'
    };
    return this.http.request('GET', this.ceeByURL, options).toPromise();
  }
}
