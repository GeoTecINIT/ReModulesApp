import {AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import * as L from 'leaflet';
import * as esri from 'esri-leaflet';
import 'proj4leaflet';
import 'proj4';
import 'leaflet.markercluster';
import * as esri_geo from 'esri-leaflet-geocoder';
import {Property} from '../../shared/models/property';
import {CadastreService} from '../../core/cadastre/cadastre.service';
import {DomSanitizer} from '@angular/platform-browser';
import {Building} from '../../shared/models/building';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, AfterViewInit, OnChanges {

  error: any;
  marker: any;
  point: any;
  markerClusterGroup: L.MarkerClusterGroup;
  @Output() buildingEmitter = new EventEmitter<any>();
  @Output() coordinatesEmitter = new EventEmitter<any>();
  @Input() properties: Property[];
  @Input() history: Building[];
  @Input() historyFilteredFromList: any;
  @Input() building: Building;
  @Input() fromHistory: boolean;
  WMS_CADASTRE = 'http://ovc.catastro.meh.es/cartografia/WMS/ServidorWMS.aspx?';
  CENTER_POINT = [ 39.723488, -0.3601076 ]; // center of Valencia
  ZOOM = 8;
  private map;

  constructor(public cadastreService: CadastreService, private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    this.properties = [];
    this.markerClusterGroup = L.markerClusterGroup({removeOutsideVisibleBounds: true});
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.history && changes.history.currentValue &&
      (changes.history.currentValue !== changes.history.previousValue)){
      this.history = [];
      this.history = changes.history.currentValue;
      this.addMarkersHistory();
    }
    /*if (changes.itemSelectedFromHistory && changes.itemSelectedFromHistory.currentValue &&
      (changes.itemSelectedFromHistory.currentValue !== changes.itemSelectedFromHistory.previousValue)){
      this.itemSelectedFromHistory = changes.itemSelectedFromHistory.currentValue;
      this.removeGroupMarkers();
      this.history.forEach( (prop: Building) => {
        if ( prop.rc === this.itemSelectedFromHistory.rc ) {
          const textPopup = '<h6> ' + prop.address
            + '</h6>' + '<p> Cadastre reference: ' + prop.rc + '</p>';
          this.marker = L.marker(L.latLng(prop.coordinates.lat, prop.coordinates.lng)).addTo(this.map);
          this.map.setView(L.latLng(prop.coordinates.lat, prop.coordinates.lng), 15);
          this.marker.bindPopup(textPopup).openPopup();
        }
      });
    }*/
    if ( changes.historyFilteredFromList && changes.historyFilteredFromList.currentValue) {
      this.history = changes.historyFilteredFromList.currentValue;
      this.addMarkersHistory();
      if ( this.history.length > 0 ){
        const newBound = this.markerClusterGroup.getBounds();
        this.map.fitBounds(newBound);
      }
    }
    if ( changes.building && changes.building.currentValue && !changes.building.firstChange){
      if (  changes.building.currentValue.length > 0 && ( changes.building.currentValue[0].error ||
        changes.building.currentValue[0].error_service )) {
        this.error = changes.building.currentValue.error_service ? changes.building.currentValue.error_service : 'Cadastre Service is not available' ;
      } else{
        if ( this.marker !== undefined ) {
          this.map.removeLayer(this.marker);
        }
        this.building = changes.building.currentValue;
        let buildingFromHist = false;
        this.history.forEach( (prop: Building) => {
          if (prop.rc === this.building.rc) {
            buildingFromHist = true;
            return;
          }
        });
        if ( !buildingFromHist  && this.building.coordinates) {
          const rcInfo =  '<p> Cadastre reference: ' + this.building.rc + '</p>';
          const textPopup = '<h6> ' + this.building.address  + '</h6>';
          this.marker = L.marker(L.latLng(this.building.coordinates.lat, this.building.coordinates.lng)).addTo(this.map);
          this.map.setView(L.latLng(this.building.coordinates.lat, this.building.coordinates.lng), 15);
          this.marker.bindPopup(textPopup).openPopup();
          if ( this.building.rc && this.building.rc.length > 1) {
            this.marker.bindPopup(textPopup + rcInfo).openPopup();
          } else {
            this.marker.bindPopup(textPopup).openPopup();
          }
        } else if ( changes.fromHistory && changes.fromHistory.currentValue ) {
          this.removeGroupMarkers();
          this.history.forEach( (prop: Building) => {
            if ( prop.rc === this.building.rc ) {
              const textPopup = '<h6> ' + prop.address  + '</h6>' +  '<p> Cadastre reference: ' + prop.rc + '</p>';
              this.marker = L.marker(L.latLng(prop.coordinates.lat, prop.coordinates.lng)).addTo(this.map);
              this.map.setView(L.latLng(prop.coordinates.lat, prop.coordinates.lng), 15);
              this.marker.bindPopup(textPopup).openPopup();
            }
          });
        }

      }
    }
  }

  private initMap(): void {
    const iconRetinaUrl = 'assets/marker-icon-2x.png';
    const iconUrl = 'assets/marker-icon.png';
    const shadowUrl = 'assets/marker-shadow.png';
    L.Marker.prototype.options.icon = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });

    // Reference system EPSG:25830 to get info from cadastre
    const crs = new L.Proj.CRS('EPSG:25830',
      '+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs',
      {
        resolutions: [2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5],
        origin: [0, 0]
      });

    this.map = L.map('map', {
      center: this.CENTER_POINT,
      zoom: this.ZOOM,
    });
    L.esri = esri;
    const basemapTopo = L.esri.basemapLayer('Topographic');
    const basemapOSM = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    const baseMaps = {
      OpenStreetMap: basemapOSM,
      Topographic: basemapTopo,
      Streets: L.esri.basemapLayer('Streets'),
    };
    const cadastreLayer = L.tileLayer.wms(this.WMS_CADASTRE, {
      format: 'image/png',
      transparent: true,
      tileSize: 2080,
    });
    const overlayMaps = {
      Cadastre: cadastreLayer
    };
    L.control.layers(baseMaps, overlayMaps).addTo(this.map);

    const results = L.layerGroup().addTo(this.map);
    // event click position in map
    this.map.on('click', (ev) => {
      const geocodeService = esri_geo.geocodeService();
      this.removeGroupMarkers();
      this.properties = [];
      this.marker = L.marker(ev.latlng);
      results.addLayer(this.marker);
      this.point = crs.project(ev.latlng);
      let address = '';
      geocodeService.reverse().latlng(ev.latlng).run((error, result) => {
        if (error) {
          return;
        }
        address = result.address.Address;
        if ( this.building.rc ) this.building.rc = '';
        this.coordinatesEmitter.emit({latlng: ev.latlng, x: this.point.x, y: this.point.y, address});
        //this.getInfoFromCadastre(this.point.x, this.point.y, ev.latlng, address);
      });
    });

    // search widget
    const searchControl = new esri_geo.Geosearch({ useMapBounds: false, expanded: true,
      placeholder: 'Search your address'}).addTo(this.map);

    searchControl.on('results',  (data) => {
      this.removeGroupMarkers();
      this.properties = [];
      if ( this.marker !== undefined ) {
        this.map.removeLayer(this.marker);
      }
      results.clearLayers();
      for ( let i = data.results.length - 1; i >= 0; i--) {
        this.marker = L.marker(data.results[i].latlng);
        results.addLayer(this.marker);
        this.point = crs.project(data.results[i].latlng);
        if ( this.building.rc ) this.building.rc = '';
        let address = '';
        address = data.results[i].text;
        this.coordinatesEmitter.emit({latlng: data.results[i].latlng, x: this.point.x, y: this.point.y, address});
        //this.getInfoFromCadastre(this.point.x, this.point.y, data.results[i].latlng, data.results[i].text );
      }
    });
  }

  /**
   * Add to properties array the list returned by cadastre service requested by the x and y value
   * @param x: value in x of the point
   * @param y: value in y of the point
   * @param latLng: point as coordinates
   * @param address: address to add in popup
   */
  getInfoFromCadastre( x: string, y: string , latLng: [], address: string) {
    this.cadastreService.getRCByCoordinates(x, y).then( (data) => {
      const parser = new DOMParser();
      const dataFile = parser.parseFromString(data, 'text/xml');
      const err = dataFile.getElementsByTagName('err')[0];
      if ( err ) {
        let textToShow = '';
        textToShow = '<h6> ' + address + '</h6>';
        this.marker.bindPopup(textToShow).openPopup();
        const desError = dataFile.getElementsByTagName('des')[0].textContent;
        this.buildingEmitter.emit([{error_service: desError}]);
      } else {
        const rc1 = dataFile.getElementsByTagName('pc1')[0].textContent;
        const rc2 = dataFile.getElementsByTagName('pc2')[0].textContent;
        const rcGeneral = rc1.concat(rc2);
        const addressMain = dataFile.getElementsByTagName('ldt')[0].textContent;
        this.cadastreService.getBuildingDetailsByRC(rcGeneral).subscribe((prop) => {
          const parser2 = new DOMParser();
          const dataXML = parser2.parseFromString(prop, 'text/xml');
          // case: when request is only one property
          const propertyOnly = dataXML.getElementsByTagName('bico')[0];
          this.properties = [];
          if ( propertyOnly !== undefined ){
            const property = this.getInfoPropGeneral(propertyOnly, addressMain);
            this.properties.push(property);
          } else {
            // case: when request are many properties
            const properties = dataXML.getElementsByTagName('rcdnp');
            // tslint:disable-next-line:prefer-for-of
            for ( let i = 0; i < properties.length ; i++){
              const detail = properties[i];
              const property = this.getInfoPropGeneral(detail, addressMain);
              this.properties.push(property);
            }
          }
          let textToShow = '';
          textToShow = '<h6> ' + this.properties[0].address
            + '</h6>' + '<p> Number of properties: ' + this.properties.length + '</p>';
          this.marker.bindPopup(textToShow).openPopup();

          this.cadastreService.getFacadeImage(this.properties[0].rc).subscribe( (baseImage: any) => {
            const urlCreator = window.URL;
            this.properties[0].image = this.sanitizer.bypassSecurityTrustUrl(urlCreator.createObjectURL(baseImage));
            this.properties[0].latlng = { lat: latLng['lat'], lng: latLng['lng']};
            this.building = new Building('', '', '', this.properties[0].yearConstruction, this.properties[0].province,
              '', this.properties[0].address, '', {lat: latLng['lat'], lng: latLng['lng']}, null,
              this.properties, rcGeneral, '', 0, null);
            this.buildingEmitter.emit(this.building);
          });
        });
      }
    })
      .catch((error) => {
        this.buildingEmitter.emit([ { error} ]);
      });
  }

  /**
   * Convert info from xml format to Property object
   * @param prop: property information in xml format
   * @param addressMain: complete Address with detail of indoor location
   */
  getInfoPropGeneral(prop: any, addressMain: string) {
    const rc1 = prop.getElementsByTagName('pc1')[0].textContent;
    const rc2 = prop.getElementsByTagName('pc2')[0].textContent;
    const rc3 = prop.getElementsByTagName('car')[0].textContent;
    const rc4 = prop.getElementsByTagName('cc1')[0].textContent;
    const rc5 = prop.getElementsByTagName('cc2')[0].textContent;
    let rc = '';
    rc = rc.concat( rc1, rc2, rc3, rc4, rc5);
    const propType = prop.getElementsByTagName('cn').length > 0 ? prop.getElementsByTagName('cn')[0].textContent : 'urban';

    if ( propType === 'RU') {
      return new Property(rc, addressMain, '', '', '', '', '', '', '', 'rural',
        '', '', '', '', '', null, '', '', '');
    } else {
      const tagLocInt = prop.getElementsByTagName('loint')[0];
      const block = tagLocInt.getElementsByTagName('bq').length > 0 ?
        tagLocInt.getElementsByTagName('bq')[0].textContent.split(': ')[0] : '';
      const stair = tagLocInt.getElementsByTagName('es').length > 0 ?
        tagLocInt.getElementsByTagName('es')[0].textContent.split(': ')[0] : '';
      const plant = tagLocInt.getElementsByTagName('pt').length > 0 ?
        tagLocInt.getElementsByTagName('pt')[0].textContent.split(': ')[0] : '';
      const door = tagLocInt.getElementsByTagName('pu').length > 0 ?
        tagLocInt.getElementsByTagName('pu')[0].textContent.split(': ')[0] : '';
      const postalCode = prop.getElementsByTagName('dp').length > 0 ?
        prop.getElementsByTagName('dp')[0].textContent : '';
      const prov = prop.getElementsByTagName('np').length > 0 ? prop.getElementsByTagName('np')[0].textContent : '';
      const town = prop.getElementsByTagName('nm')[0].textContent;
      let logInt = '';
      const textBlock = block !== '' ? 'Bloque: ' + block : '';
      const textStair = stair !== '' ? 'Escalera: ' + stair : '';
      const textPlant = plant !== '' ? 'Planta: ' + plant : '';
      const textDoor = door !== '' ? 'Puerta: ' + door : '';
      logInt = logInt.concat(textBlock, ' ' , textStair, ' ' , textPlant , ' ' , textDoor);
      return new Property(rc, addressMain, plant, logInt, '', postalCode, prov, town, '', 'urban',
        '', '', '', '', '', null, block, stair, door);
    }

  }

  removeGroupMarkers(){
    if (this.markerClusterGroup){
      this.markerClusterGroup.clearLayers();
    }
    if ( this.marker !== undefined ) {
      this.map.removeLayer(this.marker);
    }
  }

  addMarkersHistory() {
    this.removeGroupMarkers();
    this.map.setView(this.CENTER_POINT, this.ZOOM);
    const markerGroup = [];
    const latLngs = [];
    if (this.history && this.history.length > 0 ){
      this.history.forEach( propHistory => {
        if ( +propHistory.coordinates.lat > 0 ){
          const latlngToMark = L.latLng(propHistory.coordinates.lat, propHistory.coordinates.lng);
          const textPopup = '<h6> ' + propHistory.address
            + '</h6>' + '<p> Cadastre reference: ' + propHistory.rc + '</p>';
          const markers = L.marker(latlngToMark).bindPopup(textPopup).openPopup();
          markers.on('click', () => {
            this.building = propHistory;
            this.buildingEmitter.emit(this.building);
          });
          this.markerClusterGroup.addLayer(markers);
          markerGroup.push(markers);
          latLngs.push([+propHistory.coordinates.lat, +propHistory.coordinates.lng]);
        }
      });
    }
    this.markerClusterGroup.addTo(this.map);
  }

}
