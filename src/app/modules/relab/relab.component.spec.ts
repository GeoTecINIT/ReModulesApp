import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RelabComponent } from './relab.component';

describe('RelabComponent', () => {
  let component: RelabComponent;
  let fixture: ComponentFixture<RelabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RelabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RelabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
