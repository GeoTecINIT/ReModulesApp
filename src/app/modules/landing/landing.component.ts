import { Component, OnInit } from '@angular/core';
import {ToolsService} from '../../core/tools/tools.service';
import {Tools} from '../../shared/models/tools';
import {Router} from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {

  tools: Tools[] = [];
  filters = {countries: [], typologies: [], profiles: [], solutions: [], steps: [], stops: []};
  countrySelectd: string;
  profileSelectd: string;
  typologySelectd: string;
  solutionSelectd: string;
  stepSelectd: string;
  stopSelectd: string;
  filterApplied: string[];
  tmpTools: Tools[] = [];
  countryOneClick: string;
  countriesOneClick: [{id, name}];
  constructor( private toolsService: ToolsService, private router: Router) {
  }

  ngOnInit(): void {
    this.filterApplied = [];
    this.getTools();
    this.getCountries();
  }

  getCountries() {
   this.toolsService.getFilters().subscribe( data => {
     this.countriesOneClick = data['countries'];
   });
  }

  getTools() {
    this.toolsService.getTools().subscribe( data => {
      this.buildToolsInformation(data);
      this.tools.forEach( tool => {
        this.tmpTools.push(tool);
      });
    });
  }

  buildToolsInformation(data) {
    data.forEach( tool => {
      const countries = [];
      const profiles = [];
      const solutions = [];
      const typologies = [];
      const steps = [];
      const stops = [];
      tool.tools_countries.forEach( country => {
        countries.push({id: country.id, name: country.name});
        if (this.filters.countries.length === 0 || !this.filters.countries.find(item => item.id === country.id)){
          this.filters.countries.push({id: country.id, name: country.name});
        }
      });
      tool.tools_typologies.forEach( typology => {
        typologies.push({id: typology.id, typology: typology.typology});
        if (this.filters.typologies.length === 0 || !this.filters.typologies.find(item => item.id === typology.id)){
          this.filters.typologies.push({id: typology.id, typology: typology.typology});
        }
      });
      tool.tools_profiles.forEach( profile => {
        profiles.push({id: profile.id, profile: profile.profile});
        if (this.filters.profiles.length === 0 || !this.filters.profiles.find(item => item.id === profile.id)){
          this.filters.profiles.push({id: profile.id, profile: profile.profile});
        }
      });
      tool.tools_stops.forEach( stop => {
        stops.push({id: stop.id, stop: stop.stop});
        if (this.filters.stops.length === 0 || !this.filters.stops.find(item => item.id === stop.id)){
          this.filters.stops.push({id: stop.id, stop: stop.stop});
        }
      });
      tool.tools_steps.forEach( step => {
        steps.push({id: step.id, step: step.step});
        if (this.filters.steps.length === 0 || !this.filters.steps.find(item => item.id === step.id)){
          this.filters.steps.push({id: step.id, step: step.step});
        }
      });
      tool.tools_solutions.forEach( solution => {
        solutions.push({id: solution.id, solution: solution.solution});
        if (this.filters.solutions.length === 0 || !this.filters.solutions.find(item => item.id === solution.id)){
          this.filters.solutions.push({id: solution.id, solution: solution.solution});
        }
      });
      const info = new Tools(
        tool.name,
        tool.login_access,
        tool.url,
        tool.short_description,
        tool.long_description,
        tool.image,
        tool.wurl,
        countries,
        typologies,
        profiles,
        solutions,
        steps,
        stops
      );
      this.tools.push(info);
    });
  }
  applyFilter(): void {
    let toolsTmp = [];
    this.tools.forEach( tool => {
      toolsTmp.push(tool);
    });
    this.filterApplied.forEach( filter => {
      if (filter === 'countries') {
        const filterByCountry  = [];
        this.tools.forEach( tool => {
          const hasCountry = tool.countries.find( (item, i) => {
            if (item.id === this.countrySelectd){
              return true;
            }
          });
          if( hasCountry ) {
            filterByCountry.push(tool);
          }
        });
        toolsTmp = this.removeElementsFromArray(toolsTmp, filterByCountry);
      }
      if (filter === 'profiles') {
        const filterByProfiles  = [];
        this.tools.forEach( tool => {
          const hasProfile = tool.profiles.find( (item, i) => {
            if (item.id === this.profileSelectd){
              return true;
            }
          });
          if( hasProfile ) {
            filterByProfiles.push(tool);
          }
        });
        toolsTmp = this.removeElementsFromArray(toolsTmp, filterByProfiles);
      }
      if (filter === 'solutions') {
        const filterBySolutions  = [];
        this.tools.forEach( tool => {
          const hasSolution =  tool.solutions.find( (item, i) => {
            if (item.id === this.solutionSelectd){
              return true;
            }
          });
          if( hasSolution ) {
            filterBySolutions.push(tool);
          }
        });
        toolsTmp = this.removeElementsFromArray(toolsTmp, filterBySolutions);
      }

      if (filter === 'steps') {
        const filterBySteps  = [];
        this.tools.forEach( tool => {
          const hasStep = tool.steps.find( (item, i) => {
            if (item.id === this.stepSelectd){
              return true;
            }
          });
          if( hasStep ) {
            filterBySteps.push(tool);
          }
        });
        toolsTmp = this.removeElementsFromArray(toolsTmp, filterBySteps);
      }
      if (filter === 'stops') {
        const filterByStops  = [];
        this.tools.forEach( tool => {
          const hasStop = tool.stops.find( (item, i) => {
            if (item.id === this.stopSelectd){
              return true;
            }
          });
          if( hasStop ) {
            filterByStops.push(tool);
          }
        });
        toolsTmp = this.removeElementsFromArray(toolsTmp, filterByStops);
      }
      if (filter === 'typologies') {
        const filterByTypologies  = [];
        this.tools.forEach( tool => {
          const hasTypo = tool.typologies.find( (item, i) => {
            if (item.id === this.typologySelectd){
              return true;
            }
          });
          if( hasTypo ) {
            filterByTypologies.push(tool);
          }
        });
        toolsTmp = this.removeElementsFromArray(toolsTmp, filterByTypologies);
      }
    });
    this.tmpTools = toolsTmp;
  }
  filter(type: string): void {
    if ( ( type === 'countries' && this.countrySelectd !== null ) ||
      ( type === 'profiles' && this.profileSelectd !== null ) ||
      ( type === 'solutions' && this.solutionSelectd !== null ) ||
      ( type === 'steps' && this.stepSelectd !== null ) ||
      ( type === 'stops' && this.stopSelectd !== null ) ||
      ( type === 'typologies' && this.typologySelectd !== null )){

      const indexFilterApplied = this.filterApplied.indexOf(type);
      if (indexFilterApplied < 0) {
        this.filterApplied.push(type);
      }
    } else {
      this.cleanFilter(type);
    }
    this.applyFilter();
  }
  removeElementsFromArray(arrayInit, element) {
    const indexToRemove = [];
    arrayInit.forEach( filtered => {
      const index = element.indexOf(filtered, 0);
      if (index < 0 ) {
        indexToRemove.push(arrayInit.indexOf(filtered, 0));
      }
    });
    for (let i = indexToRemove.length - 1 ; i >= 0; i--){
      arrayInit.splice(indexToRemove[i], 1);
    }
    return arrayInit;
  }
  cleanFilter(type: string) {
    const indexFilterApplied = this.filterApplied.indexOf(type);
    if (indexFilterApplied > -1) {
      this.filterApplied.splice(indexFilterApplied, 1);
    }
  }
  goToOneClick(): void {
    this.router.navigate(['/', 'oneclick']);
  }
}
