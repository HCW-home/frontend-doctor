import { TestBed } from '@angular/core/testing';

import { CallService } from './call.service';

describe('CallService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CallService = TestBed.get(CallService);
    expect(service).toBeTruthy();
  });
});
