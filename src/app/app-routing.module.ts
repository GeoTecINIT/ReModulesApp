import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {HomeComponent} from './modules/home/home.component';
import {TypologyComponent} from './modules/typology/typology.component';
import {ScoreComponent} from './modules/score/score.component';
import {CadastreInfoComponent} from './modules/cadastre-info/cadastre-info.component';
import {RemoduleesComponent} from './modules/remodulees/remodulees.component';
import {LandingComponent} from './modules/landing/landing.component';
import {ToolsComponent} from './modules/tools/tools.component';
import { RelabComponent } from './modules/relab/relab.component';
import { UserAccountComponent } from './modules/user-account/user-account.component';
import { BestPracticesComponent } from './modules/best-practices/best-practices.component';
import { HomeBpComponent } from './modules/home-bp/home-bp.component';
import { FormCeeComponent } from './modules/form-cee/form-cee.component';


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
      {
        path: 'tools',
        component: ToolsComponent
      },
      {
        path: 'relab',
        component: RelabComponent
      },
      {
        path: 'accountuser',
        component: UserAccountComponent
      },
      {
        path: 'bestpractices',
        component: HomeBpComponent
      },
      {
        path: 'formcee',
        component: FormCeeComponent
      }
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
