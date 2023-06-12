import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SideChatComponent } from './side-chat.component';

describe('SideChatComponent', () => {
  let component: SideChatComponent;
  let fixture: ComponentFixture<SideChatComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SideChatComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SideChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
