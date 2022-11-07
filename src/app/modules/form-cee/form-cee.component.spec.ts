import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormCeeComponent } from './form-cee.component';

describe('FormCeeComponent', () => {
  let component: FormCeeComponent;
  let fixture: ComponentFixture<FormCeeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FormCeeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormCeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
