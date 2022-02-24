import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeerAudioComponent } from './peer-audio.component';

describe('PeerAudioComponent', () => {
  let component: PeerAudioComponent;
  let fixture: ComponentFixture<PeerAudioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PeerAudioComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PeerAudioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
