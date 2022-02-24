import { TestBed } from '@angular/core/testing';

import { TranslationOrganizationService } from './translation-organization.service';

describe('TranslationOrganizationService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TranslationOrganizationService = TestBed.get(TranslationOrganizationService);
    expect(service).toBeTruthy();
  });
});
