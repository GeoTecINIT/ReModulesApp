import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {DomSanitizer} from '@angular/platform-browser';
import { GlobalConstants} from '../../shared/GlobalConstants';

@Injectable({
  providedIn: 'root'
})
export class CadastreService {

  private cadastreByCoordinateURL  = '/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_RCCOOR';
  private cadastreByRcURL = '/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC';
  private cadastreGetFacadeURL = '/ovcservweb/OVCWcfLibres/OVCFotoFachada.svc/RecuperarFotoFachadaGet?ReferenciaCatastral=';

  constructor(private http: HttpClient) { }

  getRCByCoordinates(coorX: string, coorY: string) {
    const header = new HttpHeaders({Accept: 'application/xml'});
    const params = new HttpParams()
      .set('SRS', 'EPSG:25830')
      .set('Coordenada_X', coorX)
      .set('Coordenada_Y', coorY);
    const options = {
      header: header,
      params: params,
      responseType: 'text' as 'text'
    };
    return this.http.request('GET', this.cadastreByCoordinateURL, options).toPromise();
  }

  getBuildingDetailsByRC(rc: string) {
    const header = new HttpHeaders({ Accept: 'application/xml'});
    const params = new HttpParams()
      .set('RC', rc)
      .set('Provincia', '')
      .set('Municipio', '');
    const options = {
      header: header,
      params: params,
      responseType: 'text' as 'text'
    };
    return this.http.request('GET', this.cadastreByRcURL, options);
  }

  getFacadeImage( rc: string) {
    return this.http.get(this.cadastreGetFacadeURL + rc, {
      responseType: 'blob'});
  }
}
