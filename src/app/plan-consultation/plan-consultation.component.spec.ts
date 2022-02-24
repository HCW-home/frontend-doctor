import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanConsultationComponent } from './plan-consultation.component';

describe('PlanConsultationComponent', () => {
  let component: PlanConsultationComponent;
  let fixture: ComponentFixture<PlanConsultationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlanConsultationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlanConsultationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
