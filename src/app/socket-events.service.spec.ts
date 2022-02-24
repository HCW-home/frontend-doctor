import { TestBed } from '@angular/core/testing';

import { SocketEventsService } from './socket-events.service';

describe('SocketEventsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SocketEventsService = TestBed.get(SocketEventsService);
    expect(service).toBeTruthy();
  });
});
