import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Typology} from '../../shared/models/typology';
import {TypologyService} from '../../core/typology/typology.service';
import {Envelope} from '../../shared/models/envelope';
import {SystemType} from '../../shared/models/systemType';
import {Building} from '../../shared/models/building';

@Component({
  selector: 'app-typology',
  templateUrl: './typology.component.html',
  styleUrls: ['./typology.component.scss']
})
export class TypologyComponent implements OnInit, OnChanges {

  categoryIsSelected: boolean;
  active: number;
  selectTypology = true;
  @Input() typologies: Typology[];
  @Input() building: Building;
  @Output() calculateEnergyEmitter = new EventEmitter<Building>();
  constructor( private typologyService: TypologyService) { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ( changes.building.currentValue && changes.building.currentValue.typology &&
      changes.building.currentValue.typology.categoryCode ) {
      this.building = changes.building.currentValue;
      this.selectTypology = false;
      this.selectCategory(this.building.typology);
    }
    else if ( changes.typologies && changes.typologies.currentValue.length > 0 ) {
      this.typologies = changes.typologies.currentValue;
      this.selectTypology = true;
      this.categoryIsSelected  = false;
      this.active = 1;
    }
  }
  selectCategory( category: Typology) {
    this.building.typology = category;
    this.categoryIsSelected = true;
    this.building.typology.enveloped = [];
    this.building.typology.system = [];
    this.active = 2;
    this.typologyService.getEnvelope(this.building.typology.yearCode, this.building.country,
      this.building.climateZone, this.building.typology.categoryCode ).subscribe(res => {
      Object.values(res).forEach( env => {
        this.building.typology.enveloped.push(new Envelope(env.enveloped.enveloped_code, env.enveloped.type_construction,
            env.enveloped.description, env.enveloped.u_value, env.enveloped.picture, env.component_type.name));
      });
    });
    this.typologyService.getSystem(this.building.typology.yearCode, this.building.country,
      this.building.climateZone, this.building.typology.buildingCode).subscribe( res => {
      Object.values(res).forEach( sys => {
        this.building.typology.system.push(new SystemType(sys.system_type,
          sys.system_code, sys.System_code.description_system, sys.System_code.pictures));
      });
    });
  }
  calculateEfficiency( ) {
    this.calculateEnergyEmitter.emit(this.building);
  }
}
