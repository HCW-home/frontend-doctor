import { Component, OnInit, Input, NgZone, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

import { OpenViduService } from '../openvidu.service';
import { ConsultationService } from '../core/consultation.service';
import { Router, ActivatedRoute } from '@angular/router';
import { SocketEventsService } from '../core/socket-events.service';
import { ConfirmationService } from '../core/confirmation.service';
import { InviteService } from '../core/invite.service';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { CallService } from '../core/call.service';
import { AuthService } from '../auth/auth.service';

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
  otherDoctorInCall = false;
  currentUser;

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
    public dialog: MatDialog,
    private callService: CallService,
    private authService: AuthService
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
    this.currentUser = this.authService.currentUserValue;
    this.consultationId = this.activeRoute.snapshot.params.id;
    this.getConsultation();
    this.checkForActiveCall();
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
          this.otherDoctorInCall = false;
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

  checkForActiveCall() {
    this.callService.getCurrentCall(this.consultationId).subscribe(
      call => {
        if (call && call.status === 'ongoing') {
          this.currentCall = call;
          if (
            call.from !== this.currentUser.id &&
            !call.currentParticipants?.find(p => p.id === this.currentUser.id)
          ) {
            this.otherDoctorInCall = true;
          }
        }
      },
      err => {}
    );

    this.subscriptions.push(
      this._socketEventsService.onMessage().subscribe(msg => {
        if (
          msg.data &&
          msg.data.consultation === this.consultationId &&
          (msg.data.type === 'videoCall' || msg.data.type === 'audioCall')
        ) {
          if (
            msg.data.status === 'ongoing' &&
            msg.data.from !== this.currentUser.id
          ) {
            this.otherDoctorInCall = true;
            this.currentCall = msg.data;
          } else if (msg.data.status === 'ended') {
            this.otherDoctorInCall = false;
            if (!this.incomingCall) {
              this.currentCall = null;
            }
          }
        }
      })
    );

    this.subscriptions.push(
      this._socketEventsService.onCall().subscribe(e => {
        if (
          e.data &&
          e.data.consultation === this.consultationId &&
          e.data.from !== this.currentUser.id
        ) {
          if (!this.incomingCall && !this.currentCall) {
            this.otherDoctorInCall = true;
            this.currentCall = e.data.message || e.data;
          }
        }
      })
    );

    this.subscriptions.push(
      this._socketEventsService.onAcceptCall().subscribe(e => {
        if (
          e.data &&
          e.data.consultation &&
          e.data.consultation.id === this.consultationId &&
          e.data.message &&
          e.data.message.from !== this.currentUser.id
        ) {
          this.otherDoctorInCall = true;
          this.currentCall = e.data.message;
        }
      })
    );

    this.subscriptions.push(
      this._socketEventsService.onRejectCall().subscribe(e => {
        if (
          e.data &&
          e.data.consultation &&
          e.data.consultation.id === this.consultationId
        ) {
          this.otherDoctorInCall = false;
          if (!this.incomingCall) {
            this.currentCall = null;
          }
        }
      })
    );

    this.subscriptions.push(
      this._socketEventsService.onOwnershipTransferred().subscribe(event => {
        if (
          event.data &&
          event.data.consultation &&
          event.data.consultation.id === this.consultationId
        ) {
          if (this.consultation) {
            this.consultation.consultation.acceptedBy = event.data.newOwner.id;
            this.consultation.acceptedByUser = {
              firstName: event.data.newOwner.firstName,
              lastName: event.data.newOwner.lastName
            };
            this.consultation.doctor = event.data.newOwner;
          }
        }
      })
    );
  }

  getConsultation() {
    this.subscriptions.push(
      this.conServ
        .getConsultation(this.consultationId)
        .subscribe(consultation => {
          if (!this.consultation) {
            this.subscriptions.push(
              this.inviteServ.getByConsultation(this.consultationId).subscribe({
                next: publicInvite => {
                  this.publicinvite = publicInvite;
                },
                error: err => {},
              })
            );
          }

          this.consultation = consultation;

          if (consultation?.consultation?.status === 'pending') {
            this.showStartConsultationDialog();
          }
        })
    );
  }

  showStartConsultationDialog() {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      id: 'start_consultation_dialog',
      data: {
        question: this.translate.instant(
          'confirmationDialog.acceptAndStartConsultation'
        ),
        yesText: this.translate.instant('confirmationDialog.yesText'),
        noText: this.translate.instant('confirmationDialog.noText'),
        title: this.translate.instant('confirmationDialog.confirmationTitle'),
      },
      autoFocus: false,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.acceptConsultation();
      } else {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  acceptConsultation() {
    this.conServ.acceptConsultation(this.consultationId).subscribe(
      res => {
        this.getConsultation();
      },
      error => {
        console.error('Error accepting consultation:', error);
      }
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
        if (err.error?.error === 'SELF_CALL_NOT_ALLOWED') {
          const errorMessage = this.translate.instant('consultation.selfCallNotAllowed');
          this.showErrorDialog(errorMessage, this.translate.instant('consultation.callError'));
          return;
        }

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
