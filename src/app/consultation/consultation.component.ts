import { Subscription } from 'rxjs';
import { OpenViduService } from '../openvidu.service';
import { Component, OnInit, Input, NgZone, OnDestroy } from '@angular/core';
import { ConsultationService } from '../core/consultation.service';
import { Router, ActivatedRoute } from '@angular/router';
import { SocketEventsService } from '../core/socket-events.service';
import { ConfirmationService } from '../core/confirmation.service';
import { InviteService } from '../core/invite.service';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-consultation',
  templateUrl: './consultation.component.html',
  styleUrls: ['./consultation.component.scss'],
})
export class ConsultationComponent implements OnInit, OnDestroy {
  @Input() consultation;
  public publicinvite;
  consultationId;
  token;
  incomingCall = false;
  user;
  callEvent;
  confirmClose = false;
  redirect;
  audioOnly = false;

  volumeLevel = 0;
  showConfiguration = false;

  videoDeviceId: string;
  audioDeviceId: string;
  videoDevices = [];
  audioDevices = [];

  currentCall;

  subscriptions: Subscription[] = [];

  mobileFullHeight = false;

  constructor(
    private conServ: ConsultationService,
    private inviteServ: InviteService,
    private activeRoute: ActivatedRoute,
    private router: Router,
    private _socketEventsService: SocketEventsService,
    private zone: NgZone,
    private confirmationServ: ConfirmationService,
    private openViduService: OpenViduService,
    private translate: TranslateService,
    public dialog: MatDialog
  ) {
    this.callEvent = {};
    if (
      this.router.getCurrentNavigation() &&
      this.router.getCurrentNavigation().extras.state
    ) {
      this.callEvent = this.router.getCurrentNavigation().extras.state;
    }
  }

  ngOnInit() {
    this.consultationId = this.activeRoute.snapshot.params.id;
    this.getConsultation();
    this.callEvent.id = this.callEvent._id = this.consultationId;
    if (this.callEvent.token) {
      this.incomingCall = true;
    }

    this.subscriptions.push(
      this._socketEventsService.onEndCall().subscribe(e => {
        if (this.currentCall && this.currentCall.id === e.data.message.id) {
          this.currentCall = null;
          this.token = null;
          this.incomingCall = null;
        }
      })
    );
    this.subscriptions.push(
      this.confirmationServ.getConfirmation().subscribe(redirect => {
        this.redirect = redirect;
        this.confirmClose = true;
      })
    );

    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
        this.openViduService.getDevices().then(devices => {
          this.videoDevices = devices.filter(
            device => device.kind === 'videoinput'
          );
          if (
            this.videoDevices.length &&
            this.videoDevices[0].deviceId !== ''
          ) {
            this.videoDeviceId = this.videoDevices[0].deviceId;
          }
          this.audioDevices = devices.filter(
            device => device.kind === 'audioinput'
          );
          if (
            this.audioDevices.length &&
            this.audioDevices[0].deviceId !== ''
          ) {
            this.audioDeviceId = this.audioDevices[0].deviceId;
          }
        });
      })
      .catch(error => {
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then(stream => {
            stream.getTracks().forEach(track => track.stop());
            this.openViduService.getDevices().then(devices => {
              this.videoDevices = devices.filter(
                device => device.kind === 'videoinput'
              );
              if (
                this.videoDevices.length &&
                this.videoDevices[0].deviceId !== ''
              ) {
                this.videoDeviceId = this.videoDevices[0].deviceId;
              }
            });
          })
          .catch(() => {});
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then(stream => {
            stream.getTracks().forEach(track => track.stop());
            this.openViduService.getDevices().then(devices => {
              this.audioDevices = devices.filter(
                device => device.kind === 'audioinput'
              );
              if (
                this.audioDevices.length &&
                this.audioDevices[0].deviceId !== ''
              ) {
                this.audioDeviceId = this.audioDevices[0].deviceId;
              }
            });
          })
          .catch(() => {});
      });
  }

  getConsultation() {
    this.subscriptions.push(
      this.conServ
        .getConsultation(this.consultationId)
        .subscribe(consultation => {
          if (!this.consultation) {
            this.subscriptions.push(
              this.inviteServ
                .getByConsultation(this.consultationId)
                .subscribe(publicinvite => {
                  this.publicinvite = publicinvite;
                })
            );
          }

          this.consultation = consultation;
        })
    );
  }

  makeCall(audioOnly) {
    this.audioOnly = audioOnly;
    this.openViduService.getToken(this.consultationId, audioOnly).then(
      response => {
        this.token = response.token;
        this.incomingCall = true;
        this.currentCall = response.msg;
      },
      err => {
        const message =
          err.error?.details ||
          err.details ||
          err.error?.message ||
          err.statusText ||
          err.message ||
          err;
        const errorMessage = `${this.translate.instant('consultation.callError')} ${message}`;
        this.showErrorDialog(errorMessage, '');
      }
    );
  }

  showErrorDialog(message: string, title: string): void {
    this.dialog.open(ErrorDialogComponent, {
      width: '450px',
      autoFocus: false,
      data: {
        title,
        message,
      },
    });
  }

  resizeLayout() {
    this.mobileFullHeight = !this.mobileFullHeight;
  }

  reject() {
    this.zone.run(() => {
      this.incomingCall = false;
    });
    if (this.currentCall) {
      this.openViduService
        .rejectCall(this.consultationId, this.currentCall.id)
        .then(r => {
          this.currentCall = null;
        })
        .catch(err => {
          console.log('error ', err);
        });
    }
    this.callEvent.token = undefined;
  }

  openConfiguration() {
    this.showConfiguration = true;
  }

  closeConfiguration() {
    this.showConfiguration = false;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => {
      sub?.unsubscribe();
    });
  }
}
