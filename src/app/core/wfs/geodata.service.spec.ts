import { TestBed } from '@angular/core/testing';

import { GeodataService } from './geodata.service';

describe('GeodataService', () => {
  let service: GeodataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeodataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
