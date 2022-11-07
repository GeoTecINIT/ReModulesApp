import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CadastreInfoComponent } from './cadastre-info.component';

describe('CadastreInfoComponent', () => {
  let component: CadastreInfoComponent;
  let fixture: ComponentFixture<CadastreInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CadastreInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CadastreInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
