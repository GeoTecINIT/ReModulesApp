import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, FormBuilder, Validator } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MapComponent } from './modules/map/map.component';

// Import firebase-firestore
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireAuthGuard } from '@angular/fire/auth-guard';

import {environment} from '../environments/environment';
import {HashLocationStrategy, LocationStrategy} from '@angular/common';
import { LoginComponent } from './modules/login/login.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { HomeComponent } from './modules/home/home.component';
import {ModalModule} from 'ngx-bootstrap/modal';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {HttpClient, HttpClientJsonpModule, HttpClientModule} from '@angular/common/http';
import { CadastreInfoComponent } from './modules/cadastre-info/cadastre-info.component';
import { HistoryComponent } from './modules/history/history.component';
import {NgSelectModule} from '@ng-select/ng-select';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { FooterComponent } from './shared/components/footer/footer.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TypologyComponent } from './modules/typology/typology.component';

import { UserService} from './core/authentication/user.service';
import { CadastreESService} from './core/cadastre/ES/cadastreES.service';
import { TypologyService } from './core/typology/typology.service';
import {AuthenticationService} from './core/authentication/authentication.service';
import {GeodataService} from './core/wfs/geodata.service';
import {OpendataService} from './core/opendata/opendata.service';
import { ScoreComponent } from './modules/score/score.component';
import {NgxChartsModule} from '@swimlane/ngx-charts';
import {BrowserAnimationsModule, NoopAnimationsModule} from '@angular/platform-browser/animations';
import {NgxSpinnerModule} from 'ngx-spinner';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {HighchartsChartModule} from 'highcharts-angular';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import {
  FacebookLoginProvider,
  GoogleLoginProvider,
  SocialAuthService,
  SocialAuthServiceConfig,
  SocialLoginModule
} from 'angularx-social-login';
import { UserPanelComponent } from './modules/user-panel/user-panel.component';
import { DataMapComponent } from './modules/data-map/data-map.component';
import { UserHistoryComponent } from './modules/user-history/user-history.component';
import { UserAccountComponent } from './modules/user-account/user-account.component';
import { RemoduleesComponent } from './modules/remodulees/remodulees.component';
import { HeaderMainComponent } from './components/header-main/header-main.component';
import { LandingComponent } from './modules/landing/landing.component';
import { SignupComponent } from './modules/signup/signup.component';
import { ToolsModalComponent } from './components/tools-modal/tools-modal.component';
import { ToolsComponent } from './modules/tools/tools.component';
import { RelabComponent } from './modules/relab/relab.component';
import { UserModalComponent } from './components/user-modal/user-modal.component';
import { BestPracticesComponent } from './modules/best-practices/best-practices.component';
import { HomeBpComponent } from './modules/home-bp/home-bp.component';
import { CeeCadastreInfoComponent } from './modules/cee-cadastre-info/cee-cadastre-info.component';
import { FormCeeComponent } from './modules/form-cee/form-cee.component';
import { BuildingModalComponent } from './components/building-modal/building-modal.component';
import { UserCeeHistoryComponent } from './modules/user-cee-history/user-cee-history.component';

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    LoginComponent,
    HeaderComponent,
    HomeComponent,
    CadastreInfoComponent,
    HistoryComponent,
    FooterComponent,
    TypologyComponent,
    ScoreComponent,
    UserPanelComponent,
    DataMapComponent,
    UserHistoryComponent,
    UserAccountComponent,
    RemoduleesComponent,
    HeaderMainComponent,
    LandingComponent,
    SignupComponent,
    ToolsModalComponent,
    ToolsComponent,
    RelabComponent,
    UserModalComponent,
    BestPracticesComponent,
    HomeBpComponent,
    CeeCadastreInfoComponent,
    FormCeeComponent,
    BuildingModalComponent,
    UserCeeHistoryComponent
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        ModalModule.forRoot(),
        HttpClientModule,
        HttpClientJsonpModule,
        NgbModule,
        NgSelectModule,
        NgxSliderModule,
        FlexLayoutModule,
        NgxChartsModule,
        BrowserAnimationsModule,
        NoopAnimationsModule,
        NgxSpinnerModule,
        TranslateModule.forRoot({
          loader: {
              provide: TranslateLoader,
              useFactory: HttpLoaderFactory,
              deps: [HttpClient]
          }
        }),
        HighchartsChartModule,
        AngularFireModule.initializeApp(environment.firebase),
        AngularFirestoreModule,
        AngularFireAuthModule,
        Ng2SearchPipeModule
    ],
  providers: [
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    AuthenticationService,
    UserService,
    CadastreESService,
    TypologyService,
    GeodataService,
    AngularFireAuthGuard,
    OpendataService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http);
}