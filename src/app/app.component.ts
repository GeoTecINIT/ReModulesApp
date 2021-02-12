import {Component, OnInit} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'body',
  template: `
         <app-header></app-header>
        <router-outlet></router-outlet>
        <app-footer></app-footer>
      `
})
export class AppComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
        return;
      }
      window.scrollTo(0, 0);
    });
  }
}
