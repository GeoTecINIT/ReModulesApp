import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Typology} from '../../shared/models/typology';
import {TypologyService} from '../../core/typology/typology.service';
import {Envelope} from '../../shared/models/envelope';
import {SystemType} from '../../shared/models/systemType';
import {Building} from '../../shared/models/building';
import {System} from '../../shared/models/system';
import {Refurbishment} from '../../shared/models/refurbishment';

@Component({
  selector: 'app-typology',
  templateUrl: './typology.component.html',
  styleUrls: ['./typology.component.scss']
})
export class TypologyComponent implements OnInit, OnChanges {

  categoryIsSelected: boolean;
  active: number;
  selectTypology = true;
  typologySelected: Typology;
  componentSelected: {component: string, value: number};
  envelopedSelected: Envelope[];
  systemSelected: SystemType;
  categorySystem: System;
  systems: SystemType[];

  showTypoSelect: boolean;
  selectedYear: string;
  years: string[];
  enableCalculate: boolean;

  buildingSelection: { };
  buildingDataCount: {
    floor: 0,
    roof: 0,
    wall: 0,
    window: 0,
    celling: 0,
    door: 0
  };
  @Input() typologies: Typology[];
  @Input() building: Building;
  @Input() subcategoriesTypo: [{category_pic_code: '', description: '', subcats: [] }];
  @Output() calculateEnergyEmitter = new EventEmitter<Building>();
  @Output() errorEmitter = new EventEmitter<string>();
  constructor( private typologyService: TypologyService) { }

  ngOnInit(): void {
    this.typologySelected = null;
    this.systemSelected = new SystemType('', '', '', []);
    this.systems = [];
    this.years = [];
    this.enableCalculate = false;
    this.showTypoSelect = true;
    for (let i = 1950; i <= new Date().getFullYear(); i++) {
      const year = String( i);
      this.years.push( year);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ( changes.building && changes.building.currentValue && changes.building.currentValue.typology &&
      changes.building.currentValue.typology.categoryCode ) {
      this.building = changes.building.currentValue;
      this.selectTypology = false;
      this.selectCategory(false);
      setTimeout(() => {
        this.selectComponent('Floor', 1);
        console.log('Enveloped!!!! ', this.building.typology.enveloped);
        this.showTypoSelect = true;
      }, 1000);
    }
    else if ( changes.typologies ) {
      this.typologies = changes.typologies.currentValue;
      this.selectTypology = true;
      this.categoryIsSelected  = false;
      this.active = 1;
      this.typologySelected = null;
    }
  }
  selectCategory( fromSelection: boolean ) {
    this.buildingSelection = [];
    let category = null;
    if ( !fromSelection ) {
      category = this.building.typology;
    } else if ( this.subcategoriesTypo && this.subcategoriesTypo.length > 0) {
      this.subcategoriesTypo[this.typologySelected.categoryCode].subcats.forEach( typo => {
        if ( typo.info.categoryPicCode === this.typologySelected.categoryPicCode) {
          category = typo.info;
        }
      });
    } else {
      category = this.typologySelected;
    }
    if (  category.categoryCode ) {
      this.building.typology = category;
      this.building.typology.enveloped = [];
      this.typologyService.getEnvelope(this.building.typology.yearCode, this.building.country,
        this.building.climateZone, this.building.typology.categoryPicCode ).subscribe(res => {
          this.buildingDataCount = {
            floor: 0,
            roof: 0,
            wall: 0,
            window: 0,
            celling: 0,
            door: 0
          };
          Object.values(res).forEach( env => {
          this.building.typology.enveloped.push(new Envelope(env.enveloped.enveloped_code, env.enveloped.type_construction,
            env.enveloped.description, env.enveloped.u_value, env.enveloped.picture, env.component_type.name));

          this.buildingDataCount[env.component_type.name] = this.buildingDataCount[env.component_type.name] ?
            this.buildingDataCount[env.component_type.name] + 1 : 1;
        });
          Object.keys(this.buildingDataCount).forEach( cat => {
            if ( this.buildingDataCount[cat] > 0 ){
              this.buildingSelection[cat] = this.buildingDataCount[cat] ;
            }
          });
      });
      this.typologyService.getSystem(this.building.typology.categoryPicCode).subscribe( res => {
          Object.values( res ).forEach( sysType => {
            const systemType = new SystemType(
              sysType.code_system_measure, sysType.system_measure.description_actual_conditions,
              sysType.system_measure.original_description_aconditions, []);
            systemType.systems.push(new System( 'Heating', sysType.heating.system_code, sysType.heating.system_description,
              sysType.heating.system_description_original, sysType.heating.picture));
            systemType.systems.push(new System( 'Water', sysType.water.system_code, sysType.water.system_description,
              sysType.water.system_description_original, sysType.water.picture));
            systemType.systems.push(new System( 'Ventilation', sysType.ventilation.system_code, sysType.ventilation.system_description,
              sysType.ventilation.system_description_original, sysType.ventilation.picture));
            this.systems.push(systemType);
          });
      });
    } else  {
      this.errorEmitter.emit('We do not have data in this climate zone');
    }
  }
  calculateEfficiency( ) {
    this.building.typology.system = this.systemSelected;
    this.building.refurbishment = new Refurbishment([], [], new SystemType('', '', '', []), new SystemType('', '', '', []));
    this.calculateEnergyEmitter.emit(this.building);
  }

  selectYearOption() {
    this.building.year = String(this.selectedYear);
  }
  selectTypo(typo: Typology) {
    this.typologySelected = typo;
  }
  selectComponent( component: string, value: any ) {
    this.componentSelected = { component, value};
    this.envelopedSelected = [];
    const buttons = document.getElementsByClassName('componentEnv') as HTMLCollectionOf<HTMLElement>;
    for( let i = 0; i < buttons.length; i++ ) {
      buttons[i].style.color = '#d8d5d5';
    }
    document.getElementById(component).style.color = 'white';
    this.building.typology.enveloped.forEach( env => {
      if ( env.componentType === component ){
        this.envelopedSelected.push(env);
      }
    });
  }
  selectSystem( system: number) {
    const buttons = document.getElementsByClassName('componentSys') as HTMLCollectionOf<HTMLElement>;
    for ( let i = 0; i < buttons.length; i++ ) {
      buttons[i].style.color = '#d8d5d5';
    }
    switch (system) {
      case 1 : {
        this.categorySystem = this.systemSelected.systems[0];
        document.getElementById('heating').style.color = 'white';
        break;
      }
      case 2 : {
        this.categorySystem = this.systemSelected.systems[1];
        document.getElementById('water').style.color = 'white';
        break;
      }
      case 3 : {
        this.categorySystem = this.systemSelected.systems[2];
        document.getElementById('ventilation').style.color = 'white';
        break;
      }
    }
  }

  calculateEnvelopedSystems(typo: Typology) {
    this.typologySelected = typo;
    this.selectCategory(true);
  }
}
