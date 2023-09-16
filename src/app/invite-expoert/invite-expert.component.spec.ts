import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InviteExpertComponent } from './invite-expert.component';

describe('InviteExpoertComponent', () => {
  let component: InviteExpertComponent;
  let fixture: ComponentFixture<InviteExpertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InviteExpertComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InviteExpertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
