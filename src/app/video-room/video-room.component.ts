import { AuthService } from '../auth/auth.service';
import {
  Stream,
  LogService,
  RoomService,
  RemotePeersService,
} from 'hcw-stream-lib';
import { OpenViduLayout } from './layout/openvidu-layout';
import { Subscription } from 'rxjs';
import {
  Input,
  Output,
  OnInit,
  OnDestroy,
  Component,
  HostListener,
  EventEmitter,
} from '@angular/core';

@Component({
  selector: 'app-video-room',
  templateUrl: './video-room.component.html',
  styleUrls: ['./video-room.component.scss'],
})
export class VideoRoomComponent implements OnInit, OnDestroy {
  remoteUsers = [];
  resizeTimeout;
  muteStatus: 'on' | 'off' = 'on';
  localStream: MediaStream | null = null;

  @Output() hangup = new EventEmitter<boolean>();
  @Output() resizeLayout = new EventEmitter<boolean>();

  rejected;
  message;
  @Input() sessionId: string;
  @Input() token: string;
  @Input() patient;
  @Input() audioOnly;
  @Input() videoDeviceId: string;
  @Input() audioDeviceId: string;
  reconnecting = false;
  accepted = false;
  openviduLayout;
  openviduLayoutOptions;
  subscriptions: Subscription[] = [];
  peerId;
  showControls = false;
  myCamStream: Stream;
  timer: any;

  camStatus = 'on';
  screenStream: any = null;


  constructor(
    private logger: LogService,
    private authService: AuthService,
    private roomService: RoomService,
    private remotePeersService: RemotePeersService,
  ) {
  }

  @HostListener('window:beforeunload')
  beforeunloadHandler() {
    this.exitSession();
  }

  @HostListener('window:resize', ['$event'])
  sizeChange(event) {
    clearTimeout(this.resizeTimeout);
    this.updateLayout();
  }

  ngOnInit() {
    if (this.audioOnly) {
      this.camStatus = 'off';
    }
    this.peerId = this.authService.currentUserValue.id;

    this.askForPerm()
      .then(stream => {
        this.localStream = stream;
        this.joinToSession();
      })
      .catch(error => {
        console.error('Error accessing media devices.', error);
      });
  }

  ngOnDestroy() {
    this.exitSession();
    this.stopWebCam();
    this.subscriptions.forEach(sub => {
      sub?.unsubscribe();
    });
    this.rejectCall();
    this.remoteUsers = [];
    this.roomService?.close();
  }

  stopWebCam() {
    try {
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
      }
    } catch (error) {
      console.error('Error stopping webcam stream', error);
    }
  }

  checkControlStatus() {
    clearTimeout(this.timer)
    const canHover = !(matchMedia('(hover: none)').matches);
    if(!canHover) {
      const nextState = !this.showControls;
      this.showControls = nextState
      if(nextState){
        this.timer = setTimeout(()=>{
          this.checkControlStatus()
        },5000)
      }
    }
  }

  muteStatusChanged() {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        if (this.muteStatus === 'on') {
          this.roomService.muteMic();
          this.muteStatus = 'off';
        } else {
          this.roomService.unmuteMic();
          this.muteStatus = 'on';
        }
      }
    }
  }

  joinToSession() {
    this.accepted = true;

    this.remoteUsers = [];

    this.roomService.init({ peerId: this.peerId });

    this.roomService.join({
      roomId: this.sessionId,
      joinVideo: !this.audioOnly,
      joinAudio: true,
      token: this.token,
    });

    this.roomService.onCamProducing.subscribe(stream => {
      this.logger.debug('Cam producing ', stream);
      this.myCamStream = { ...stream };
    });
    this.subscriptions.push(
      this.remotePeersService.remotePeers.subscribe(peers => {
        this.remoteUsers = [];
        this.logger.debug('got remote peers ', peers);
        peers.forEach(p => {
          this.remoteUsers.push({ ...p });
        });
        setTimeout(() => {
          this.updateLayout();
        }, 100);
      })
    );
    const layoutContainer = document.getElementById('layout');
    if (layoutContainer) {
      this.openviduLayout = new OpenViduLayout();
      this.openviduLayoutOptions = {
        maxRatio: 3 / 2, // The narrowest ratio that will be used (default 2x3)
        minRatio: 9 / 16, // The widest ratio that will be used (default 16x9)
        fixedRatio:
            true /* If this is true then the aspect ratio of the video is maintained
    and minRatio and maxRatio are ignored (default false)*/,
        bigClass: 'OV_big', // The class to add to elements that should be sized bigger
        bigPercentage: 0.9, // The maximum percentage of space the big ones should take up
        bigFixedRatio: true, // fixedRatio for the big ones
        bigMaxRatio: 3 / 2, // The narrowest ratio to use for the big elements (default 2x3)
        bigMinRatio: 9 / 16, // The widest ratio to use for the big elements (default 16x9)
        bigFirst: false, // Whether to place the big one in the top left (true) or bottom right
        animate: true, // Whether you want to animate the transitions
      };
      this.openviduLayout.initLayoutContainer(
          layoutContainer,
          this.openviduLayoutOptions
      );
    }

  }

  exitSession(rejoin?) {
    this.remoteUsers = [];

    this.openviduLayout = null;

    if (rejoin) {
      return this.joinToSession();
    } else {
      this.rejectCall();
    }
    // this.router.navigate(['']);
  }

  async startScreenSharing() {
    this.screenStream = await this.roomService.startScreenShare();
    if (!this.screenStream) {
      console.error('Screen sharing failed or was denied by the user.');
    }
  }

  stopScreenSharing() {
    this.roomService.stopScreenShare();
    this.screenStream = null;
  }

  private updateLayout() {
    this.resizeTimeout = setTimeout(() => {
      if (!this.openviduLayout) {
        return;
      }
      this.openviduLayout.updateLayout();
    }, 20);
  }

  rejectCall() {
    if (!this.rejected) {
      this.rejected = true;
      this.roomService?.close();
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          track.stop();
        });
      }
      this.remoteUsers = [];
      this.hangup.emit(true);
    }
  }

  closeCall() {
    this.rejected = true;
    this.hangup.emit(true);
  }

  resize() {
    this.updateLayout();
    this.resizeLayout.emit(true);
  }

  camStatusChanged() {
    if (this.camStatus === 'on') {
      this.roomService.disableWebcam();
      this.camStatus = 'off';
    } else {
      this.roomService.updateWebcam({ start: true, restart: true });
      this.camStatus = 'on';
    }
  }

  askForPerm() {
    this.logger.debug('Ask for video permissions ');

    const mediaPerms = { audio: true, video: true };
    return navigator.mediaDevices.getUserMedia(mediaPerms);
  }


}
