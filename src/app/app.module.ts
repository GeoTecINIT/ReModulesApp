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
import {HttpClientJsonpModule, HttpClientModule} from '@angular/common/http';
import { CadastreInfoComponent } from './modules/cadastre-info/cadastre-info.component';
import { HistoryComponent } from './modules/history/history.component';
import {NgSelectModule} from '@ng-select/ng-select';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { FooterComponent } from './shared/components/footer/footer.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TypologyComponent } from './modules/typology/typology.component';

import { UserService} from './core/authentication/user.service';
import { CadastreService} from './core/cadastre/cadastre.service';
import { TypologyService } from './core/typology/typology.service';
import {AuthenticationService} from './core/authentication/authentication.service';
import {GeodataService} from './core/wfs/geodata.service';
import {OpendataService} from './core/opendata/opendata.service';
import { ScoreComponent } from './modules/score/score.component';
import {NgxChartsModule} from '@swimlane/ngx-charts';
import {BrowserAnimationsModule, NoopAnimationsModule} from '@angular/platform-browser/animations';

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
    ScoreComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    AngularFireAuthModule,
    ModalModule.forRoot(),
    HttpClientModule,
    HttpClientJsonpModule,
    NgbModule,
    NgSelectModule,
    NgxSliderModule,
    FlexLayoutModule,
    NgxChartsModule,
    BrowserAnimationsModule,
    NoopAnimationsModule
  ],
  providers: [
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    AngularFireAuthGuard,
    AuthenticationService,
    UserService,
    CadastreService,
    TypologyService,
    GeodataService,
    OpendataService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
