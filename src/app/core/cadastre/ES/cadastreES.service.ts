import { Injectable } from '@angular/core';
import {HttpClient, HttpEvent, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CadastreESService {

  private cadastreByCoordinateURL  = '/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_RCCOOR';
  private cadastreByRcURL = '/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC';
  private cadastreGetFacadeURL = '/ovcservweb/OVCWcfLibres/OVCFotoFachada.svc/RecuperarFotoFachadaGet?ReferenciaCatastral=';
  private inspireParcelURL = '/INSPIRE/wfsBU.aspx';
  private inspireParcelCadastralParcel = '/INSPIRE/wfsCP.aspx';

  constructor(private http: HttpClient) { }

  getRCByCoordinates(coorX: string, coorY: string): Promise<any> {
    const header = new HttpHeaders({Accept: 'application/xml'});
    const params = new HttpParams()
      .set('SRS', 'EPSG:25830')
      .set('Coordenada_X', coorX)
      .set('Coordenada_Y', coorY);
    const options = {
      header,
      params,
      responseType: 'text' as 'text'
    };
    return this.http.request('GET', this.cadastreByCoordinateURL, options).toPromise();
  }

  getBuildingDetailsByRC(rc: string): Observable<string> {
    const header = new HttpHeaders({ Accept: 'application/xml'});
    const params = new HttpParams()
      .set('RC', rc)
      .set('Provincia', '')
      .set('Municipio', '');
    const options = {
      header,
      params,
      responseType: 'text' as 'text'
    };
    return this.http.request('GET', this.cadastreByRcURL, options);
  }

  getFacadeImage( rc: string): Observable<Blob> {
    return this.http.get(this.cadastreGetFacadeURL + rc, {
      responseType: 'blob'});
  }
  getBuildingInfoINSPIREPartParcel( rc: string ): Observable<string> {
    const header = new HttpHeaders({ Accept: 'application/xml'});
    const params = new HttpParams()
      .set('service', 'wfs')
      .set('version', '2.0.0')
      .set('StoredQuerie_id', 'GetBuildingPartByParcel')
      .set('request', 'getfeature')
      .set('REFCAT', rc);
    const options = {
      header,
      params,
      responseType: 'text' as 'text'
    };
    return this.http.request('GET', this.inspireParcelURL, options);
  }
  getBuildingInfoINSPIREParcel( rc: string ): Observable<string>{
    const header = new HttpHeaders({ Accept: 'application/xml'});
    const params = new HttpParams()
      .set('service', 'wfs')
      .set('version', '2.0.0')
      .set('StoredQuerie_id', 'GetBuildingByParcel')
      .set('request', 'getfeature')
      .set('REFCAT', rc);
    const options = {
      header,
      params,
      responseType: 'text' as 'text'
    };
    return this.http.request('GET', this.inspireParcelURL, options );
  }
  getBuildingInfoINSPIRECadastralParcel( rc: string ): Observable<string> {
    const header = new HttpHeaders({ Accept: 'application/xml'});
    const params = new HttpParams()
      .set('service', 'wfs')
      .set('version', '2')
      .set('request', 'getfeature')
      .set('STOREDQUERIE_ID', 'GetParcel')
      .set('REFCAT', rc)
      .set('SRSname', 'EPSG::25830');
    const options = {
      header,
      params,
      responseType: 'text' as 'text'
    };
    return this.http.request('GET', this.inspireParcelCadastralParcel, options );
  }
}
