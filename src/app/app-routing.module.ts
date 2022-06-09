import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {HomeComponent} from './modules/home/home.component';
import {TypologyComponent} from './modules/typology/typology.component';
import {ScoreComponent} from './modules/score/score.component';
import {CadastreInfoComponent} from './modules/cadastre-info/cadastre-info.component';
import {RemoduleesComponent} from './modules/remodulees/remodulees.component';
import {LandingComponent} from './modules/landing/landing.component';


const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '', component: RemoduleesComponent, children: [
      {
        path: 'home',
        component: LandingComponent
      },
      {
        path: 'oneclick',
        component: HomeComponent
      },
      {
        path: 'typology',
        component: TypologyComponent
      },
      {
        path: 'score',
        component: ScoreComponent
      },
    ]
  },
  {
    path: 'building/:address',
    component: CadastreInfoComponent,
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
