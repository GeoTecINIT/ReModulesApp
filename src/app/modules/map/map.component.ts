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
import {add} from 'ngx-bootstrap/chronos';
import {PropertySaved} from '../../shared/models/PropertySaved';

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
  @Output() propertiesEmitter = new EventEmitter<any>();
  @Output() propSelectFromMapEmitter = new EventEmitter<any>();
  @Input() itemSelectedFromHistory: string;
  @Input() properties: Property[];
  @Input() history: PropertySaved[];
  @Input() historyFilteredFromList: any;
  markersLayer: any;
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
    if (changes.itemSelectedFromHistory && changes.itemSelectedFromHistory.currentValue &&
      (changes.itemSelectedFromHistory.currentValue !== changes.itemSelectedFromHistory.previousValue)){
      this.itemSelectedFromHistory = changes.itemSelectedFromHistory.currentValue;
      this.removeGroupMarkers();
      this.history.forEach( prop => {
        if ( prop.rc === this.itemSelectedFromHistory ) {
          const textPopup = '<h6> ' + prop.address
            + '</h6>' + '<p> Cadastre reference: ' + prop.rc + '</p>';
          this.marker = L.marker(L.latLng(prop.lat, prop.lng)).addTo(this.map);
          this.map.setView(L.latLng(prop.lat, prop.lng), 15);
          this.marker.bindPopup(textPopup).openPopup();
        }
      });
    }
    if ( changes.historyFilteredFromList && changes.historyFilteredFromList.currentValue) {
      this.history = changes.historyFilteredFromList.currentValue;
      this.addMarkersHistory();
      if ( this.history.length > 0 ){
        const newBound = this.markerClusterGroup.getBounds();
        this.map.fitBounds(newBound);
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
      if ( this.marker !== undefined ) {
        this.map.removeLayer(this.marker);
      }
      this.marker = L.marker(ev.latlng);
      results.addLayer(this.marker);
      this.point = crs.project(ev.latlng);
      let address = '';
      geocodeService.reverse().latlng(ev.latlng).run((error, result) => {
        if (error) {
          return;
        }
        address = result.address.Address;
        this.getInfoFromCadastre(this.point.x, this.point.y, ev.latlng, address);
      });
    });

    // search widget
    const searchControl = new esri_geo.Geosearch({ useMapBounds: false}).addTo(this.map);

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
        this.getInfoFromCadastre(this.point.x, this.point.y, data.results[i].latlng, data.results[i].text );
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
  getInfoFromCadastre( x: any, y: any , latLng: any, address: string) {
    this.cadastreService.getRCByCoordinates(x, y).subscribe( (data) => {
      const parser = new DOMParser();
      const dataFile = parser.parseFromString(data, 'text/xml');
      const err = dataFile.getElementsByTagName('err')[0];
      if ( err ) {
        let textToShow = '';
        textToShow = '<h6> ' + address + '</h6>';
        this.marker.bindPopup(textToShow).openPopup();
        this.propertiesEmitter.emit(this.properties);
      } else {
        const rc1 = dataFile.getElementsByTagName('pc1')[0].textContent;
        const rc2 = dataFile.getElementsByTagName('pc2')[0].textContent;
        const rcGeneral = rc1.concat(rc2);
        this.cadastreService.getBuildingDetailsByRC(rcGeneral).subscribe((prop) => {
          const parser2 = new DOMParser();
          const dataXML = parser2.parseFromString(prop, 'text/xml');

          // case: when request is only one property
          const propertyOnly = dataXML.getElementsByTagName('bico')[0];
          if ( propertyOnly !== undefined ){
            const property = this.getInfoPropGeneral(propertyOnly);
            this.properties.push(property);
          } else {
            // case: when request are many properties
            const properties = dataXML.getElementsByTagName('rcdnp');
            // tslint:disable-next-line:prefer-for-of
            for ( let i = 0; i < properties.length ; i++){
              const detail = properties[i];
              const property = this.getInfoPropGeneral(detail);
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
            this.properties[0].latlng = latLng;
            this.propertiesEmitter.emit(this.properties);
          });
        });
      }
    });
  }

  /**
   * Convert info from xml format to Property object
   * @param prop: property information in xml format
   */
  getInfoPropGeneral(prop: any) {
    const rc1 = prop.getElementsByTagName('pc1')[0].textContent;
    const rc2 = prop.getElementsByTagName('pc2')[0].textContent;
    const rc3 = prop.getElementsByTagName('car')[0].textContent;
    const rc4 = prop.getElementsByTagName('cc1')[0].textContent;
    const rc5 = prop.getElementsByTagName('cc2')[0].textContent;
    let rc = '';
    rc = rc.concat( rc1, rc2, rc3, rc4, rc5);
    const tagAddr = prop.getElementsByTagName('dir')[0];
    const tagLocInt = prop.getElementsByTagName('loint')[0];
    const viaType = tagAddr.getElementsByTagName('tv')[0].textContent;
    const viaName = tagAddr.getElementsByTagName('nv')[0].textContent;
    const addNumber = tagAddr.getElementsByTagName('pnp')[0].textContent;
    const block = tagLocInt.getElementsByTagName('bq').length > 0 ?
      tagLocInt.getElementsByTagName('bq')[0].textContent.split(': ')[0] : '';
    const stair = tagLocInt.getElementsByTagName('es').length > 0 ?
      tagLocInt.getElementsByTagName('es')[0].textContent.split(': ')[0] : '';
    const plant = tagLocInt.getElementsByTagName('pt').length > 0 ?
      tagLocInt.getElementsByTagName('pt')[0].textContent.split(': ')[0] : '';
    const door = tagLocInt.getElementsByTagName('pu').length > 0 ?
      tagLocInt.getElementsByTagName('pu')[0].textContent.split(': ')[0] : '';
    let address = '';
    address = address.concat( viaType, ' ' ,  viaName, ' ', addNumber);
    const postalCode = prop.getElementsByTagName('dp')[0].textContent;
    const prov = prop.getElementsByTagName('np')[0].textContent;
    const town = prop.getElementsByTagName('nm')[0].textContent;
    let logInt = '';
    const textBlock = block !== '' ? 'Bloque: ' + block : '';
    const textStair = stair !== '' ? 'Escalera: ' + stair : '';
    const textPlant = plant !== '' ? 'Planta: ' + plant : '';
    const textDoor = door !== '' ? 'Puerta: ' + door : '';
    logInt = logInt.concat(textBlock, ' ' , textStair, ' ' , textPlant , ' ' , textDoor);
    return new Property(rc, address, plant, logInt, '', postalCode, prov, town, '', '',
      '', '', '', '', '', [], block, stair, door);
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
        if ( +propHistory.lat > 0 ){
          const latlngToMark = L.latLng(propHistory.lat, propHistory.lng);
          const textPopup = '<h6> ' + propHistory.address
            + '</h6>' + '<p> Cadastre reference: ' + propHistory.rc + '</p>';
          const markers = L.marker(latlngToMark).bindPopup(textPopup).openPopup();
          markers.on('click', () => {
            this.propSelectFromMapEmitter.emit(propHistory.rc);
          });
          this.markerClusterGroup.addLayer(markers);
          markerGroup.push(markers);
          latLngs.push([+propHistory.lat, +propHistory.lng]);
        }
      });
    }
    this.markerClusterGroup.addTo(this.map);
  }

}
