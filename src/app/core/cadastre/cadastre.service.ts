import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {DomSanitizer} from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class CadastreService {


  CATASTRO_SPAIN_BY_COORDINATES = '/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_RCCOOR';
  CATASTRO_SPAIN_BY_RC = '/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC';
  CATASTRO_SPAIN_FACADE_IMAGE = '/ovcservweb/OVCWcfLibres/OVCFotoFachada.svc/RecuperarFotoFachadaGet?ReferenciaCatastral=';

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
    return this.http.request('GET', this.CATASTRO_SPAIN_BY_COORDINATES, options).toPromise();
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
    return this.http.request('GET', this.CATASTRO_SPAIN_BY_RC, options);
  }

  getFacadeImage( rc: string) {
    return this.http.get(this.CATASTRO_SPAIN_FACADE_IMAGE + rc, {
      responseType: 'blob'});
  }
}
