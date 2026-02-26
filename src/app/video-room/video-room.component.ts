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
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-video-room',
  templateUrl: './video-room.component.html',
  styleUrls: ['./video-room.component.scss'],
})
export class VideoRoomComponent implements OnInit, OnDestroy {
  remoteUsers = [];
  resizeTimeout;
  muteStatus: 'on' | 'off' = 'on';

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
  connectionTimer: any;
  connecting = false;

  camStatus = 'on';
  screenStream: any = null;


  constructor(
    public dialog: MatDialog,
    private logger: LogService,
    private authService: AuthService,
    private roomService: RoomService,
    private translate: TranslateService,
    private remotePeersService: RemotePeersService,
    private snackBar: MatSnackBar,
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
    this.joinToSession();
  }

  ngOnDestroy() {
    clearTimeout(this.connectionTimer);
    this.rejected = true;
    this.subscriptions.forEach(sub => {
      sub?.unsubscribe();
    });
    this.roomService?.close();
    this.remoteUsers = [];
    this.hangup.emit(true);
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
    if (this.muteStatus === 'on') {
      this.roomService.muteMic();
      this.muteStatus = 'off';
    } else {
      this.roomService.unmuteMic();
      this.muteStatus = 'on';
    }
  }

  joinToSession() {
    if (this.rejected) return;
    this.accepted = true;
    this.connecting = true;

    this.remoteUsers = [];

    this.roomService.init({ peerId: this.peerId });

    this.roomService.join({
      roomId: this.sessionId,
      joinVideo: !this.audioOnly,
      joinAudio: true,
      token: this.token,
    });

    this.connectionTimer = setTimeout(() => {
      if (this.connecting) {
        this.snackBar.open(
          this.translate.instant('consultation.videoServerConnectionFailed'),
          null,
          { duration: 5000, panelClass: ['red-snackbar'] }
        );
        this.closeCall();
      }
    }, 15000);

    this.subscriptions.push(
      this.roomService.onCamProducing.subscribe(stream => {
        this.logger.debug('Cam producing ', stream);
        this.myCamStream = { ...stream };
        this.connecting = false;
        clearTimeout(this.connectionTimer);
      })
    );

    this.subscriptions.push(
      this.roomService.onCamError.subscribe((error) => {
        this.snackBar.open(
          this.translate.instant('videoRoom.cameraError'),
          'X',
          { duration: 5000, panelClass: ['red-snackbar'] }
        );
      })
    );
    this.subscriptions.push(
      this.roomService.onMicError.subscribe((error) => {
        this.snackBar.open(
          this.translate.instant('videoRoom.microphoneError'),
          'X',
          { duration: 5000, panelClass: ['red-snackbar'] }
        );
        if (this.connecting) {
          this.connecting = false;
          clearTimeout(this.connectionTimer);
          this.showPermissionRetryModal();
        }
      })
    );

    const signalingService = (this.roomService as any).signalingService;
    if (signalingService) {
      if (signalingService.onNotification) {
        this.subscriptions.push(
          signalingService.onNotification.subscribe((notification: any) => {
            if (notification?.method === 'roomReady') {
              this.connecting = false;
              clearTimeout(this.connectionTimer);
            }
          })
        );
      }
      if (signalingService.onDisconnected) {
        this.subscriptions.push(
          signalingService.onDisconnected.subscribe(() => {
            if (!this.rejected) {
              this.snackBar.open(
                this.translate.instant('consultation.videoConnectionLost'),
                null,
                { duration: 5000, panelClass: ['red-snackbar'] }
              );
              this.closeCall();
            }
          })
        );
      }
      if (signalingService.onReconnected) {
        this.subscriptions.push(
          signalingService.onReconnected.subscribe(() => {
            this.snackBar.open(
              this.translate.instant('consultation.reconnected'),
              null,
              { duration: 3000 }
            );
          })
        );
      }
    }

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
      this.remoteUsers = [];
      this.hangup.emit(true);
    }
  }

  closeCall() {
    clearTimeout(this.connectionTimer);
    this.rejected = true;
    this.roomService?.close();
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

  showPermissionRetryModal() {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      id: 'confirmation_dialog',
      data: {
        question: this.translate.instant('chat.needAccess'),
        yesText: this.translate.instant('chat.retryPermission'),
        noText: this.translate.instant('chat.cancelCall'),
        title: this.translate.instant('chat.permissionRequired'),
      },
      autoFocus: false,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.joinToSession();
      } else {
        this.closeCall();
      }
    });
  }

}
