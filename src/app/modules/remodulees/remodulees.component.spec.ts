import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoduleesComponent } from './remodulees.component';

describe('RemoduleesComponent', () => {
  let component: RemoduleesComponent;
  let fixture: ComponentFixture<RemoduleesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RemoduleesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoduleesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
