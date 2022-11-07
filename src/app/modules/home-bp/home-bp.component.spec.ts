import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeBpComponent } from './home-bp.component';

describe('HomeBpComponent', () => {
  let component: HomeBpComponent;
  let fixture: ComponentFixture<HomeBpComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HomeBpComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeBpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
