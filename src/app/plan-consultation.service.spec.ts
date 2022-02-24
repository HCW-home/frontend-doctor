import { TestBed } from '@angular/core/testing';

import { PlanConsultationService } from './plan-consultation.service';

describe('PlanConsultationService', () => {
  let service: PlanConsultationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlanConsultationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
