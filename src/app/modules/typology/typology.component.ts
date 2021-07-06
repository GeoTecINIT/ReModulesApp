import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Typology} from '../../shared/models/typology';
import {TypologyService} from '../../core/typology/typology.service';
import {Envelope} from '../../shared/models/envelope';
import {SystemType} from '../../shared/models/systemType';
import {Building} from '../../shared/models/building';
import {System} from '../../shared/models/system';

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
  systemSelected: SystemType;

  isChecked;
  isCheckedName;
  @Input() typologies: Typology[];
  @Input() building: Building;
  @Input() subcategoriesTypo: [{category_pic_code: '', description: '', subcats: [] }];
  @Output() calculateEnergyEmitter = new EventEmitter<Building>();
  @Output() errorEmitter = new EventEmitter<string>();
  constructor( private typologyService: TypologyService) { }

  ngOnInit(): void {
    this.typologySelected = null;
    this.systemSelected = new SystemType('', '', '', []);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ( changes.building && changes.building.currentValue && changes.building.currentValue.typology &&
      changes.building.currentValue.typology.categoryCode ) {
      this.building = changes.building.currentValue;
      this.selectTypology = false;
      this.selectCategory(false);
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
      this.building.typology.system = [];
      this.active = 2;
      this.typologyService.getEnvelope(this.building.typology.yearCode, this.building.country,
        this.building.climateZone, this.building.typology.categoryPicCode ).subscribe(res => {
        Object.values(res).forEach( env => {
          this.building.typology.enveloped.push(new Envelope(env.enveloped.enveloped_code, env.enveloped.type_construction,
            env.enveloped.description, env.enveloped.u_value, env.enveloped.picture, env.component_type.name));
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
            this.building.typology.system.push(systemType);
          });
          console.log('SYSTEMS!!!!!!! ', this.building.typology.system);
      });
    } else  {
      this.errorEmitter.emit('We do not have data in this climate zone');
    }
  }
  calculateEfficiency( ) {
    this.calculateEnergyEmitter.emit(this.building);
  }
}
