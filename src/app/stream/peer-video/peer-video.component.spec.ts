import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeerVideoComponent } from './peer-video.component';

describe('PeerVideoComponent', () => {
  let component: PeerVideoComponent;
  let fixture: ComponentFixture<PeerVideoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PeerVideoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PeerVideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
