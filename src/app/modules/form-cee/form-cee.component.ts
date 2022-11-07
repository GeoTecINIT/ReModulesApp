import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Building } from 'src/app/shared/models/building';
import { Property } from 'src/app/shared/models/property';
import {DomSanitizer} from '@angular/platform-browser';
import { CadastreESService } from 'src/app/core/cadastre/ES/cadastreES.service';
import {User} from '../../shared/models/user';
import {UserService} from '../../core/authentication/user.service';
import { ceeBuilding } from 'src/app/shared/models/ceeBuilding';

@Component({
  selector: 'app-form-cee',
  templateUrl: './form-cee.component.html',
  styleUrls: ['./form-cee.component.scss']
})
export class FormCeeComponent implements OnInit {

  @Output() optionEmitter = new EventEmitter<string>();

  dataNumberCertificate: any;
  dataCalificationCEE: any;
  dataCalificationEnergyPrimary: any;
  dataEnergyConsumed: any;
  dataCo2Emissions: any;
  dataCadastreReference: any;
  dataTypology: any;
  dataBuildingAddress: any;
  dataBuildingYear: any;
  facadeImage: any;
  expDirection: any;
  caseCertificate: any;
  dataCo2EmissionsCertificate2: any;
  dataEnergyConsumedCertificate2: any;
  dataNumberCertificate2: any;
  dataCalificationEnergyPrimaryCertificate2: any;
  dataCalificationCO2EmissionsCertificate2: any;
  dataCO2Absolute: any;
  dataEnergyAbsolute: any;
  isFavoriteBuilding: boolean;

  coordinateLong: any;
  coordinateLat: any;

  coordinateX: any;
  coordinateY: any;

  dangerousUrl: any;
  trustedUrl: any;

  @Input() buildingCEE: ceeBuilding;
  @Input() properties: Property[];

  constructor(private sanitizer: DomSanitizer, private cadastreServiceES: CadastreESService, private userService: UserService) { 
    this.dangerousUrl = localStorage.getItem('ImageFacade').substring(39,102);
    this.trustedUrl = sanitizer.bypassSecurityTrustUrl(this.dangerousUrl);
  }

  ngOnInit(): void {
    this.getValues();
  }

  getValues(): any{
    this.dataNumberCertificate = localStorage.getItem('numberCertificate');
    this.dataCalificationCEE = localStorage.getItem('calificationCEE');
    this.dataEnergyConsumed = localStorage.getItem('energyConsumed');
    this.dataCo2Emissions = localStorage.getItem('co2Emissions');
    this.dataCalificationEnergyPrimary = localStorage.getItem('calificationEnergyPrimary');
    this.dataCadastreReference = localStorage.getItem('cadastreReference');
    this.dataTypology = localStorage.getItem('typology');
    this.dataBuildingAddress = localStorage.getItem('addressBuilding');
    this.dataBuildingYear = localStorage.getItem('yearBuilding');
    this.facadeImage = localStorage.getItem('facadeImage');
    this.expDirection = localStorage.getItem('expDirection');
    this.caseCertificate = localStorage.getItem('caseCertificate');

    //Certificate 2
    this.dataNumberCertificate2 = localStorage.getItem('yearCertificate2');
    this.dataCo2EmissionsCertificate2 = localStorage.getItem('co2EmissionsCertificate2');
    this.dataEnergyConsumedCertificate2 = localStorage.getItem('energyConsumedCertificate2');
    this.dataCalificationCO2EmissionsCertificate2 = localStorage.getItem('calificatioCo2EmissionsCertificate2');
    this.dataCalificationEnergyPrimaryCertificate2 = localStorage.getItem('calificationEnergyConsumedCertificate2');

    this.dataCO2Absolute = this.dataCo2Emissions - this.dataCo2EmissionsCertificate2;
    this.dataEnergyAbsolute = this.dataEnergyConsumed - this.dataEnergyConsumedCertificate2;

    this.coordinateLong = localStorage.getItem('coordinateLong');
    this.coordinateLat = localStorage.getItem('coordinateLat');
    this.coordinateX = localStorage.getItem('coordinateX');
    this.coordinateY = localStorage.getItem('coordinateY');
  }

  goBack() {
    this.optionEmitter.emit('infoBuilding');
  }

  saveBuildingCEE(data): void {
    console.log("The new building cee is " + data.ceeaddress + " " + data.ceeaddressmap + " " + data.ceecr + " " + data.ceetypology);
    const newCeeBuilding = new ceeBuilding(data.ceeaddress, data.ceeaddressmap, data.ceecr, data.ceetypology, data.ceecase, data.ceeyearconstruction, data.ceeyearcertificate,
      data.ceeco21, data.ceevalueemissions1, data.ceeepnr1, data.ceevalueepnr1, data.ceeyearcertificate2, data.ceeco22, data.ceevalueco22, data.ceeepnr2,
      data.ceevalueepnr2, data.ceeco2saving, data.ceeco2savingperc, data.ceeepnrsaving, data.ceeepnrsavingperc, {lng: data.ceecoordinatelong, lat: data.ceecoordinatelat}, 
      {x: data.ceecoordinatex, y: data.ceecoordinatey});
      console.log(newCeeBuilding);

    this.userService.addPropertyCEEToHistory(newCeeBuilding, localStorage.getItem('auth-token')).subscribe( () => {
      this.isFavoriteBuilding = true;
    });
  }

}
