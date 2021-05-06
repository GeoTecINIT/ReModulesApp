import {AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import * as L from 'leaflet';
import * as esri from 'esri-leaflet';
import 'proj4leaflet';
import 'proj4';
import 'leaflet.markercluster';
import 'leaflet.awesome-markers';
import 'leaflet-groupedlayercontrol';
import * as esri_geo from 'esri-leaflet-geocoder';
import {Property} from '../../shared/models/property';
import {CadastreService} from '../../core/cadastre/cadastre.service';
import {DomSanitizer} from '@angular/platform-browser';
import {Building} from '../../shared/models/building';
import {GlobalConstants} from '../../shared/GlobalConstants';

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
  layersControl: any;
  historyLayer: any;
  buildingTypesLayer: any;
  emissionsLayer: any;
  yearLayer: any;
  legend: any;
  currentLayer: string;
  markersGroup: any[];
  historyMarkers: any[];
  typologyMarkers: any[];
  emissionsMarkers: any[];
  yearsMarkers: any[];
  @Output() buildingEmitter = new EventEmitter<any>();
  @Output() coordinatesEmitter = new EventEmitter<any>();
  @Input() properties: Property[];
  @Input() history: Building[];
  @Input() historyFilteredFromList: any;
  @Input() building: Building;
  @Input() fromHistory: boolean;
  @Input() active: number;
  WMS_CADASTRE = 'http://ovc.catastro.meh.es/cartografia/WMS/ServidorWMS.aspx?';
  CENTER_POINT = [ 39.723488, -0.3601076 ]; // center of Valencia
  ZOOM = 8;
  private map;

  constructor(public cadastreService: CadastreService, private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    this.properties = [];
    this.markerClusterGroup = L.markerClusterGroup({removeOutsideVisibleBounds: true});
    this.currentLayer = 'History';
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.history && changes.history.currentValue &&
      (changes.history.currentValue !== changes.history.previousValue )){
      this.history = [];
      this.history = changes.history.currentValue;
      console.log('El history!!!!', this.history);
      this.addMarkersHistory();
      this.map.on( 'overlayadd', (overla) => {
        this.markerClusterGroup.clearLayers();
        if ( this.legend ) {
          this.map.removeControl(this.legend);
        }

        this.legend = L.control({position: 'bottomright'});
        if ( overla.name === 'Building type') {
          this.legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'legend');
            div.innerHTML += '<h4> Building Type</h4>';
            // loop through our density intervals and generate a label with a colored square for each interval
            Object.keys( GlobalConstants.colorsTypo).forEach( key => {
              div.innerHTML += '<i style="background-color:' + GlobalConstants.colorsTypo[key] + '"></i> ' +
                '<span>' + key + '</span><br>' ;
            });

            return div;
          };

          this.legend.addTo(this.map);
          this.currentLayer = 'typology';
          this.markersGroup = this.typologyMarkers;
        }
        if ( overla.name === 'Emissions') {
          this.legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'legend');
            div.innerHTML += '<h4>Emissions Ranking</h4>';
            // loop through our density intervals and generate a label with a colored square for each interval
            Object.keys( GlobalConstants.colorsEmissionsLayer).forEach( key => {
              div.innerHTML += '<i style="background-color:' + GlobalConstants.colorsEmissionsLayer[key] + '"></i> ' +
                '<span>' + key + '</span><br>' ;
            });

            return div;
          };
          this.legend.addTo(this.map);
          this.currentLayer = 'emissions';
          this.markersGroup = this.emissionsMarkers;
        }

        if ( overla.name === 'Year of construction') {
          this.legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'legend');
            div.innerHTML += '<h4>Years Ranking</h4>';
            // loop through our density intervals and generate a label with a colored square for each interval
            Object.keys( GlobalConstants.colorsYears).forEach( key => {
              let textLabel = '';
              switch (key) {
                case '01': {
                  textLabel = '0 - 1900';
                  break;
                }
                case '02': {
                  textLabel = '1901- 1936';
                  break;
                }
                case '03': {
                  textLabel = '1937 - 1959';
                  break;
                }
                case '04': {
                  textLabel = '1960 - 1979';
                  break;
                }
                case '05': {
                  textLabel = '1980 - 2006';
                  break;
                }
                case '06': {
                  textLabel = '2007 - ';
                  break;
                }
              }
              div.innerHTML += '<i style="background-color:' + GlobalConstants.colorsYears[key] + '"></i> ' +
                '<span>' + textLabel + '</span><br>' ;
            });
            return div;
          };
          this.legend.addTo(this.map);
          this.currentLayer = 'year';
          this.markersGroup = this.yearsMarkers;
        }
      });
    }
    if ( changes.historyFilteredFromList && changes.historyFilteredFromList.currentValue) {
      this.history = changes.historyFilteredFromList.currentValue;
      console.log('El history!!!!', this.history);
      this.addMarkersFilters(this.currentLayer);
      /*if ( this.history.length > 0 ){
        const newBound = this.markerClusterGroup.getBounds();
        this.map.fitBounds(newBound);
      }*/
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
        if ( this.history.length > 0 ){
          this.history.forEach( (prop: Building) => {
            if (prop.rc === this.building.rc) {
              buildingFromHist = true;
              return;
            }
          });
        }
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
          this.removeClusterMarkers();
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
    if ( this.active === 1 ) {
      this.removeOverlays();
    }
  }

  private initMap(): void {
    L.Marker.prototype.options.icon = L.AwesomeMarkers.icon({
      prefix: 'fa',
      markerColor: 'blue',
      icon: 'circle',
      iconColor: 'white'
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
    const options = {
      exclusiveGroups: ['Energy Efficiency']
    };
    const overlayMaps = {
      Cadastre: {
        'Cadastre Layer': cadastreLayer
      },
      'Energy Efficiency': {
      }
    };
    this.layersControl = L.control.groupedLayers(baseMaps, overlayMaps, options).addTo(this.map);

    const results = L.layerGroup().addTo(this.map);
    // event click position in map
    this.map.on('click', (ev) => {
      const geocodeService = esri_geo.geocodeService();
      this.removeClusterMarkers();
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
      this.removeClusterMarkers();
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

  removeClusterMarkers(){
    if (this.markerClusterGroup){
      this.markerClusterGroup.clearLayers();
    }
    if ( this.marker !== undefined ) {
      this.map.removeLayer(this.marker);
    }
  }
  removeOverlays() {
    if ( this.layersControl) {
      this.layersControl._layers.forEach( layer => {
        if ( layer.group.name === 'Energy Efficiency' ) {
          const index = this.layersControl._layers.indexOf(layer, 0);
          if ( index > -1){
            this.layersControl._layers.splice( index);
          }
        }
      });
      this.layersControl._update();
    }
  }
  removeGroupMarkers() {
    if ( this.markersGroup && this.markersGroup.length > 0 ) {
      this.markersGroup.forEach( marker => {
        this.map.removeLayer(marker);
      });
    }
  }

  createMarker(source: string, building: Building ) {
    const markerStyle = L.AwesomeMarkers.icon({
      markerColor: source,
      prefix: 'fa',
      icon: 'circle',
      iconColor: 'white'
    });
    const textPopup = '<h6> ' + building.address
      + '</h6>' + '<p> Cadastre reference: ' + building.rc + '</p>';

    const latlngToMark = L.latLng(building.coordinates.lat, building.coordinates.lng);
    const markers = L.marker(latlngToMark, { icon: markerStyle}).bindPopup(textPopup).openPopup();
    markers.on('click', () => {
      this.building = building;
      this.buildingEmitter.emit(this.building);
    });
    return markers;
  }

  addMarkersHistory() {
    this.removeClusterMarkers();
    this.removeOverlays();
    this.removeGroupMarkers();
    this.map.setView(this.CENTER_POINT, this.ZOOM);
    this.addLayersEnergyEfficiency(this.history, false);
    this.markerClusterGroup.addTo(this.map);
    this.markersGroup = this.historyMarkers;
  }

  addLayersEnergyEfficiency( listProperties: Building[], fromFilters: boolean) {
    const markerGroup = [];
    const arrayTypology = [];
    const arrayEmissions = [];
    const arrayYear = [];
    if (listProperties && listProperties.length > 0 ){
      listProperties.forEach( propHistory => {

        const markerHistory = this.createMarker('blue', propHistory);
       if (!fromFilters) this.markerClusterGroup.addLayer(markerHistory);
        markerGroup.push(markerHistory);

        // pins for building type
        const buildingMarker = this.createMarker(GlobalConstants.colorsTypo[propHistory.typology.categoryCode], propHistory);
        arrayTypology.push(buildingMarker);

        // pins for emissions
        const emissionMarker = this.createMarker(GlobalConstants.colorsEmissionsLayer[propHistory.typology.energy.emissionRanking],
          propHistory);
        arrayEmissions.push(emissionMarker);

        // pins for year
        const yearMarker = this.createMarker(GlobalConstants.colorsYears[propHistory.typology.yearCode], propHistory);
        arrayYear.push(yearMarker);
      });

      if ( this.active === 2 ) {
        this.historyLayer = L.layerGroup(markerGroup);
        this.layersControl.addOverlay( this.historyLayer, 'History', 'Energy Efficiency');

        this.buildingTypesLayer = L.layerGroup(arrayTypology);
        this.layersControl.addOverlay( this.buildingTypesLayer, 'Building type', 'Energy Efficiency');

        this.emissionsLayer = L.layerGroup(arrayEmissions);
        this.layersControl.addOverlay( this.emissionsLayer, 'Emissions', 'Energy Efficiency');

        this.yearLayer = L.layerGroup(arrayYear);
        this.layersControl.addOverlay( this.yearLayer, 'Year of construction', 'Energy Efficiency');
      }
    }
    this.historyMarkers = markerGroup;
    this.typologyMarkers = arrayTypology;
    this.emissionsMarkers = arrayEmissions;
    this.yearsMarkers = arrayYear;
  }

  addMarkersFilters(currentLayer) {
    this.removeGroupMarkers();
    this.removeClusterMarkers();
    this.removeOverlays();
    this.map.setView(this.CENTER_POINT, this.ZOOM);
    this.addLayersEnergyEfficiency(this.history, true);
    switch ( currentLayer) {
      case 'History' : {
        this.historyMarkers.forEach( marker => {
          marker.addTo(this.map);
        });
        break;
      }
      case 'typology' : {
        this.typologyMarkers.forEach( marker => {
          marker.addTo(this.map);
        });
        break;
      }
      case 'emissions' : {
        this.emissionsMarkers.forEach( marker => {
          marker.addTo(this.map);
        });
        break;
      }
      case 'year' : {
        this.yearsMarkers.forEach( marker => {
          marker.addTo(this.map);
        });
        break;
      }
    }
  }
}
