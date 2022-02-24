import { TestBed } from '@angular/core/testing';

import { OpenViduService } from './openvidu.service';

describe('OpenviduService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: OpenViduService = TestBed.get(OpenViduService);
    expect(service).toBeTruthy();
  });
});
