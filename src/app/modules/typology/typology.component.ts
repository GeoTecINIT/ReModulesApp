import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Typology} from '../../shared/models/typology';
import {TypologyService} from '../../core/typology/typology.service';
import {Envelope} from '../../shared/models/envelope';
import {SystemType} from '../../shared/models/systemType';

@Component({
  selector: 'app-typology',
  templateUrl: './typology.component.html',
  styleUrls: ['./typology.component.scss']
})
export class TypologyComponent implements OnInit, OnChanges {

  URL_IMAGES_TYPOLOGY = './assets/img/typology/';
  typologyCur: Typology;
  categoryIsSelected: boolean;
  active: number;
  navStyle: string;
  @Input() typologies: Typology[];
  constructor( private typologyService: TypologyService) { }

  ngOnInit(): void {
    this.active = 1;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ( changes.categories.currentValue ) {
      this.typologies = changes.categories.currentValue;
      this.typologyCur = null;
      this.categoryIsSelected  = false;
      this.active = 1;
    }
  }

  refreshStyles(type: string ) {
    if ( type === 'typology') {
      const elementToChange = document.getElementById( this.typologyCur.categoryCode);
      elementToChange.style.backgroundColor = '#ececec';
      const element2 = document.querySelector('#' +  this.typologyCur.categoryCode + ' .card-body');
      element2.append('<p>Selected</p>');
    }
  }
  selectCategory( category: Typology) {
    this.typologyCur = category;
    this.categoryIsSelected = true;
    this.typologyCur.enveloped = [];
    this.typologyCur.system = [];
    this.active = 2;
    this.typologyService.getEnvelope(this.typologyCur.yearCode, this.typologyCur.country,
        this.typologyCur.zone, this.typologyCur.categoryCode ).subscribe(res => {
      Object.values(res).forEach( env => {
        this.typologyCur.enveloped.push(new Envelope(env.enveloped.type_construction,
            env.enveloped.description, env.enveloped.u_value, env.enveloped.picture, env.component_type.name));
      });
    });
    this.typologyService.getSystem(this.typologyCur.yearCode, this.typologyCur.country,
      this.typologyCur.zone, this.typologyCur.buildingCode).subscribe( res => {
      Object.values(res).forEach( sys => {
        console.log('Info devuelta!!!! ', sys);
        this.typologyCur.system.push(new SystemType(sys.system_type,
          sys.system_code, sys.System_code.description_system, sys.System_code.pictures));
        console.log('La tipologia!!!! ', this.typologyCur);
      });
    });
  }
}
