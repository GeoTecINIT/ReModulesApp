import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CeeCadastreInfoComponent } from './cee-cadastre-info.component';

describe('CeeCadastreInfoComponent', () => {
  let component: CeeCadastreInfoComponent;
  let fixture: ComponentFixture<CeeCadastreInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CeeCadastreInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CeeCadastreInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
