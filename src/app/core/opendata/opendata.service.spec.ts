import { TestBed } from '@angular/core/testing';

import { OpendataService } from './opendata.service';

describe('OpendataService', () => {
  let service: OpendataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpendataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
