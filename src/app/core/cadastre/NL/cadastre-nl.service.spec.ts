import { TestBed } from '@angular/core/testing';

import { CadastreNLService } from './cadastre-nl.service';

describe('CadastreNLService', () => {
  let service: CadastreNLService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CadastreNLService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
