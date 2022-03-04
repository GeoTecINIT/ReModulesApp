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
import {Building} from '../../shared/models/building';
import {GlobalConstants} from '../../shared/GlobalConstants';
import {Crs} from '../../shared/models/crs';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, AfterViewInit, OnChanges {

  error: any;
  marker: any;
  point: Crs;
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
  @Input() totalHistory: Building[];
  @Input() optionSelected: number;
  WMS_CADASTRE = 'http://ovc.catastro.meh.es/cartografia/WMS/ServidorWMS.aspx?';
  CENTER_POINT = [ 45.7098955, 11.1355771 ]; // center of Valencia
  ZOOM = 5.22;
  private map;

  constructor() { }

  ngOnInit(): void {
    this.properties = [];
    this.markerClusterGroup = L.markerClusterGroup({removeOutsideVisibleBounds: true});
    this.currentLayer = 'History';
    this.point = new Crs(null, null);
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.optionSelected && changes.optionSelected.currentValue && changes.optionSelected.currentValue !== 4 ) {
      this.removeOverlays();
      this.removeGroupMarkers();
      this.removeClusterMarkers();
      this.markersGroup = [];
      this.currentLayer = '';
    }
   // this.removeMarkerFromMap();
    else  if (this.optionSelected === 4 && changes.history && changes.history.currentValue) {
      const markerTmp = this.marker;
      this.removeMarkerFromMap(markerTmp);
      this.removeOverlays();
      this.removeGroupMarkers();
      this.removeClusterMarkers();
      if ( this.legend ) {
        this.map.removeControl(this.legend);
      }
      console.log('History!!!', changes.history.currentValue);
      this.addMarkersHistory(changes.history.currentValue, true);
      this.map.on( 'overlayadd', (overla) => {
        this.addOverlayAction(overla);
      });
    }
  }

  private initMap(): void {
    L.Marker.prototype.options.icon = L.AwesomeMarkers.icon({
      prefix: 'fa',
      markerColor: 'blue',
      icon: 'circle',
      iconColor: 'white'
    });

    // Reference system EPSG:25830 to get info from cadastre Spain
    const crs25830 = new L.Proj.CRS('EPSG:25830',
      '+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs',
      {
        resolutions: [2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5],
        origin: [0, 0]
      });

    // Reference system EPSG:28992 to get info from cadastre Nederlands
    const crs28992 = new L.Proj.CRS('EPSG:28992',
      '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs',
      {
        resolutions: [3251.206502413005, 1625.6032512065026, 812.8016256032513, 406.40081280162565,
          203.20040640081282, 101.60020320040641, 50.800101600203206,
          25.400050800101603, 12.700025400050801, 6.350012700025401, 3.1750063500127004,
          1.5875031750063502, 0.7937515875031751, 0.39687579375158755, 0.19843789687579377, 0.09921894843789689, 0.04960947421894844],
        origin: [0, 0]
      });

    this.map = L.map('map', {
      center: this.CENTER_POINT,
      zoom: this.ZOOM,
    });
    this.map.zoomControl.setPosition('topright');

    /*const mapControlsContainer = document.getElementsByClassName("leaflet-control")[0];
    const logoContainer = document.getElementById("logoContainer");

    mapControlsContainer.appendChild(logoContainer);*/

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
      this.removeMarkerFromMap(this.marker);
      if ( this.marker !== undefined ) {
        this.map.removeLayer(this.marker);
      }
      results.clearLayers();
      const geocodeService = esri_geo.geocodeService();
      this.properties = [];
      this.marker = L.marker(ev.latlng).addTo(this.map);
      results.addLayer(this.marker);
      this.point.ESPG25830 = crs25830.project(ev.latlng);
      this.point.ESPG28992 = crs28992.project(ev.latlng);
      let address = '';
      geocodeService.reverse().latlng(ev.latlng).run((error, result) => {
        if (error) {
          return;
        }
        address = result.address.Address;
        if ( this.building.rc ) this.building.rc = '';
        this.coordinatesEmitter.emit({latlng: ev.latlng, x: this.point.ESPG25830.x, y: this.point.ESPG25830.y,
          address, point: this.point, region: result.address.Region});
      });
    });

    // search widget
    const searchControl = new esri_geo.Geosearch({ useMapBounds: false, expanded: true,
      placeholder: 'Search your address'}).addTo(this.map);

    searchControl.on('results',  (data) => {
      this.removeMarkerFromMap(this.marker);
      this.properties = [];
      if ( this.marker !== undefined ) {
        this.map.removeLayer(this.marker);
      }
      results.clearLayers();
      for ( let i = data.results.length - 1; i >= 0; i--) {
        this.marker = L.marker(data.results[i].latlng).addTo(this.map);
        results.addLayer(this.marker);
        this.point.ESPG25830 = crs25830.project(data.results[i].latlng);
        this.point.ESPG28992 = crs28992.project(data.results[i].latlng);
        if ( this.building.rc ) this.building.rc = '';
        let address = '';
        address = data.results[i].text;
        this.coordinatesEmitter.emit({latlng: data.results[i].latlng,
          x: this.point.ESPG25830.x, y: this.point.ESPG25830.y, address, point: this.point, region: ''});
        //this.getInfoFromCadastre(this.point.x, this.point.y, data.results[i].latlng, data.results[i].text );
      }
    });
  }

  addOverlayAction( overla ) {
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
  }

  removeMarkerFromMap(marker) {
    if ( marker !== undefined ) {
      this.map.removeLayer(marker);
    }
  }

  removeClusterMarkers(){
    if (this.markerClusterGroup){
      this.markerClusterGroup.clearLayers();
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
        if ( this.marker !== marker ) {
          this.map.removeLayer(marker);
        }
      });
    }
  }

  createMarker(sourceColor: string, building: Building, showOnlyPopup: boolean, idPopup: string ) {
    let markers = null;
    const markerStyleHistory = L.AwesomeMarkers.icon({
      markerColor: sourceColor,
      prefix: 'fa',
      icon: 'circle',
      iconColor: 'white'
    });
    const markerStyle = {
      radius: 8,
      fillColor: sourceColor,
      color: '#000',
      weight: 1,
      opacity: 1,
      fillOpacity: 1
    };
    let buildingInfo = '';
    const buttonBuilding = '<button id="' + idPopup + '" style="color: #2888BA; background: transparent; font-weight: 700; border: 0;"> See more ...</button>';
    if ( ! showOnlyPopup ) {
      buildingInfo = '<p> Cadastre reference: ' + building.rc + '</p>';
      const textPopup = '<h6> ' + building.address
        + '</h6>' + buildingInfo + buttonBuilding;

      const latlngToMark = L.latLng(building.coordinates.lat, building.coordinates.lng);
      markers = L.marker(latlngToMark, { icon: markerStyleHistory}).bindPopup(textPopup).openPopup();
    }
    else {
      buildingInfo = '<p> Typology: ' + building.typology.categoryName + '</p>'
        + '<p>Year: ' + building.year + '</p>'
      + '<p> Emissions: ' + building.typology.energy.emissionRanking + '</p>';
      const textPopup = '<h6> ' + building.address
        + '</h6>' + buildingInfo + buttonBuilding;

      const latlngToMark = L.latLng(building.coordinates.lat, building.coordinates.lng);
      markers = L.circleMarker(latlngToMark,  /*{ icon: markerStyle}*/ markerStyle).bindPopup(textPopup).openPopup();
    }
    markers.on('popupopen', mark => {
      L.DomEvent.on(L.DomUtil.get(idPopup),
        'click',
        (ev ) => {
          this.removeMarkerFromMap(this.marker);
          this.marker = mark.target;
          this.building = building;
          this.buildingEmitter.emit(this.building);
        });
    });
    return markers;
  }

  addMarkersHistory(listHistory: Building[], showCluster: boolean) {
    this.removeClusterMarkers();
    this.removeGroupMarkers();
    this.removeOverlays();
    this.addLayersEnergyEfficiencyPersonal(listHistory, false, showCluster);
    this.markerClusterGroup.addTo(this.map);
    this.markersGroup = this.historyMarkers;
  }

  addLayersEnergyEfficiencyPersonal(listProperties: Building[], fromFilters: boolean, showCluster: boolean) {
    const markerGroup = [];
    const arrayTypology = [];
    const arrayEmissions = [];
    const arrayYear = [];
    const showOnlyPopup = !showCluster;
    if (listProperties && listProperties.length > 0 ){
      let cont = 1;
      listProperties.forEach( propHistory => {
console.log('Recorrro!!', propHistory);
        const idPopup = 'marker-popup' + +cont;
        const markerHistory = this.createMarker('blue', propHistory, showOnlyPopup, idPopup);
       if (!fromFilters && showCluster) this.markerClusterGroup.addLayer(markerHistory);
        markerGroup.push(markerHistory);

        // pins for building type
        /*const buildingMarker = this.createMarker(GlobalConstants.colorsTypo[propHistory.typology.categoryCode], propHistory,
          showOnlyPopup, idPopup);
        arrayTypology.push(buildingMarker);

        // pins for emissions
        const emissionMarker = this.createMarker(GlobalConstants.colorsEmissionsLayer[propHistory.typology.energy.emissionRanking],
          propHistory, showOnlyPopup, idPopup);
        arrayEmissions.push(emissionMarker);

        // pins for year
        const yearMarker = this.createMarker(GlobalConstants.colorsYears[propHistory.typology.yearCode],
          propHistory, showOnlyPopup, idPopup);
        arrayYear.push(yearMarker);
*/
        cont ++;
      });

      this.historyLayer = L.layerGroup(markerGroup);
      this.layersControl.addOverlay( this.historyLayer, 'History', 'Energy Efficiency');

      this.buildingTypesLayer = L.layerGroup(arrayTypology);
      this.layersControl.addOverlay( this.buildingTypesLayer, 'Building type', 'Energy Efficiency');

      this.emissionsLayer = L.layerGroup(arrayEmissions);
      this.layersControl.addOverlay( this.emissionsLayer, 'Emissions', 'Energy Efficiency');

      this.yearLayer = L.layerGroup(arrayYear);
      this.layersControl.addOverlay( this.yearLayer, 'Year of construction', 'Energy Efficiency');

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
    this.addLayersEnergyEfficiencyPersonal(this.history, true, true);
    switch ( currentLayer) {
      case 'History' : {
        this.historyMarkers.forEach( marker => {
          marker.addTo(this.map);
        });
        this.markersGroup = this.historyMarkers;
        break;
      }
      case 'typology' : {
        this.typologyMarkers.forEach( marker => {
          marker.addTo(this.map);
        });
        this.markersGroup = this.typologyMarkers;
        break;
      }
      case 'emissions' : {
        this.emissionsMarkers.forEach( marker => {
          marker.addTo(this.map);
        });
        this.markersGroup = this.emissionsMarkers;
        break;
      }
      case 'year' : {
        this.yearsMarkers.forEach( marker => {
          marker.addTo(this.map);
        });
        this.markersGroup = this.yearsMarkers;
        break;
      }
    }
  }
}
