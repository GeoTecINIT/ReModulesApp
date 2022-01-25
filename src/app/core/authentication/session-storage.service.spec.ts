import { TestBed } from '@angular/core/testing';

import { SesionStorageServiceService } from './session-storage.service';

describe('SesionStorageServiceService', () => {
  let service: SesionStorageServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SesionStorageServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
