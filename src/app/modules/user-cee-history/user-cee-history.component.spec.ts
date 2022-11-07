import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserCeeHistoryComponent } from './user-cee-history.component';

describe('UserCeeHistoryComponent', () => {
  let component: UserCeeHistoryComponent;
  let fixture: ComponentFixture<UserCeeHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserCeeHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserCeeHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
