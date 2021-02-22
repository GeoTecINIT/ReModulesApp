import {Component, Input, OnInit} from '@angular/core';
import {Typology} from '../../shared/models/typology';
import {TypologyService} from '../../core/typology/typology.service';
import {Envelope} from '../../shared/models/envelope';

@Component({
  selector: 'app-typology',
  templateUrl: './typology.component.html',
  styleUrls: ['./typology.component.scss']
})
export class TypologyComponent implements OnInit {

  URL_IMAGES_TYPOLOGY = './assets/img/typology/';
  categorySelected: Typology;
  categoryIsSelected: boolean;
  active: number;
  navStyle: string;
  @Input() categories: Typology[];
  constructor( private typologyService: TypologyService) { }

  ngOnInit(): void {
    this.active = 1;
  }

  refreshStyles(type: string ) {
    console.log('ENTRE!!! ', type);
    if ( type === 'typology') {
      const elementToChange = document.getElementById( this.categorySelected.categoryCode);
      console.log('EY!!! ', this.categorySelected.categoryCode);
      elementToChange.style.backgroundColor = '#ececec';
      const element2 = document.querySelector('#' +  this.categorySelected.categoryCode + ' .card-body');
      element2.append('<p>Selected</p>');
    }
  }
  selectCategory( category: Typology) {
    this.categorySelected = category;
    this.categoryIsSelected = true;
    this.categorySelected.enveloped = [];
    this.active = 2;
    this.typologyService.getEnvelope(this.categorySelected.yearCode, this.categorySelected.country,
        this.categorySelected.zone, this.categorySelected.categoryCode ).subscribe( res => {
      Object.values(res).forEach( env => {
        this.categorySelected.enveloped.push(new Envelope(env.enveloped['type_construction'],
            env.enveloped.description, env.enveloped['u_value'], env.enveloped.picture, env['component_type'].name));
      });
    });
  }
}
