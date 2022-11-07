import { TestBed } from '@angular/core/testing';

import { CadastreESService } from './cadastreES.service';

describe('CadastreService', () => {
  let service: CadastreESService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CadastreESService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
