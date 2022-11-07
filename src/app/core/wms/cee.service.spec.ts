import { TestBed } from '@angular/core/testing';

import { CeeService } from './cee.service';

describe('CeeService', () => {
  let service: CeeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CeeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
