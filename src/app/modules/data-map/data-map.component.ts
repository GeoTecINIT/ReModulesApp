import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-data-map',
  templateUrl: './data-map.component.html',
  styleUrls: ['./data-map.component.scss']
})
export class DataMapComponent implements OnInit {

  @Input() optionSelected: number;
  constructor() { }

  ngOnInit(): void {
  }

}
