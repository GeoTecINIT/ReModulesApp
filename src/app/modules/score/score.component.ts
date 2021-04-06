import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {Building} from '../../shared/models/building';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import {GlobalConstants} from '../../shared/GlobalConstants';

@Component({
  selector: 'app-score',
  templateUrl: './score.component.html',
  styleUrls: ['./score.component.scss']
})
export class ScoreComponent implements OnInit, AfterViewInit {
  view: any[] = [700, 400];

  // options
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = true;
  showXAxisLabel = true;
  showYAxisLabel = true;
  yAxisLabel = 'Scale';
  animations = true;
  legendTitle = 'System';

  colorScheme = 'cool';

  dataChart: any[];
  @Input() building: Building;
  constructor() {
  }

  ngOnInit(): void {
    this.dataChart = [
      {
        name: 'Demand',
        series: []
      },
      {
        name: 'Final Energy',
        series: []
      },
      {
        name: 'Primary Energy',
        series: []
      },
      {
        name: 'Emissions',
        series: []
      },
    ];
    this.building.typology.energy.scoreSystem.forEach( system => {
      if ( system.system !== 'Total' ) {
        Object.keys(this.dataChart).forEach(key => {
          if ( this.dataChart[key].name === 'Demand') {
            this.dataChart[key].series.push({
              name: system.system,
              value: system.demand
            });
          } else if ( this.dataChart[key].name === 'Final Energy') {
            this.dataChart[key].series.push({
              name: system.system,
              value: system.finalEnergy
            });
          } else if ( this.dataChart[key].name === 'Primary Energy') {
            this.dataChart[key].series.push({
              name: system.system,
              value: system.primaryEnergy
            });
          } else if ( this.dataChart[key].name === 'Emissions') {
            this.dataChart[key].series.push({
              name: system.system,
              value: system.emissions
            });
          }
        });
      }
    });
  }
  ngAfterViewInit(): void {
    const elemEm: HTMLElement = document.getElementById('emissions');
    const color = GlobalConstants.colors[this.building.typology.energy.emissionRanking].color;
    elemEm.style.setProperty('--check-primary', color);
    elemEm.style.setProperty('--check-secondary', '1.25em solid ' + color);

    const elemCon: HTMLElement = document.getElementById('consumption');
    elemCon.style.setProperty('--check-primary', color);
    elemCon.style.setProperty('--check-secondary', '1.25em solid ' + color);
  }

}
