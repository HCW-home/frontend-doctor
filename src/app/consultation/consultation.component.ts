import {
  Component,
  OnInit,
  Input,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import moment from 'moment-timezone';

import { OpenViduService } from '../openvidu.service';
import { ConsultationService } from '../core/consultation.service';
import { Router, ActivatedRoute } from '@angular/router';
import { SocketEventsService } from '../core/socket-events.service';
import { ConfirmationService } from '../core/confirmation.service';
import { InviteService } from '../core/invite.service';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { RescheduleDialogComponent } from '../reschedule-dialog/reschedule-dialog.component';
import { InviteLinkComponent } from '../invite-link/invite-link.component';
import { CallService } from '../core/call.service';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '../core/config.service';
import { PlanConsultationService } from '../core/plan-consultation.service';
import { ChatComponent } from '../chat/chat.component';

@Component({
  selector: 'app-consultation',
  templateUrl: './consultation.component.html',
  styleUrls: ['./consultation.component.scss'],
})
export class ConsultationComponent implements OnInit, OnDestroy {
  @Input() consultation;
  @ViewChild(ChatComponent) chatComponent: ChatComponent;
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
  dialogShown = false;
  scheduledCardClosed = false;

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
    private authService: AuthService,
    private configService: ConfigService,
    private planConsultationService: PlanConsultationService
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
  }

  checkForActiveCall() {
    this.callService.getCurrentCall(this.consultationId).subscribe(
      call => {
        if (call && call.status === 'ongoing' && !call.closedAt) {
          this.currentCall = call;
          if (
            call.from !== this.currentUser.id &&
            !call.currentParticipants?.find(p => p.id === this.currentUser.id)
          ) {
            this.otherDoctorInCall = true;
          }
        }
      },
      err => {
        if (err.status === 404) {
          this.router.navigate(['/consultation-not-found']);
        }
      }
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
            !msg.data.closedAt &&
            msg.data.from !== this.currentUser.id
          ) {
            this.otherDoctorInCall = true;
            this.currentCall = msg.data;
          } else if (msg.data.status === 'ended' || msg.data.closedAt) {
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
              lastName: event.data.newOwner.lastName,
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
          if (consultation) {
            if (!this.consultation) {
              this.loadPublicInvite();
            }

            this.consultation = consultation;

            if (
              consultation?.consultation?.status === 'pending' &&
              !this.dialogShown
            ) {
              this.showStartConsultationDialog();
            }
          }
        })
    );
  }

  loadPublicInvite() {
    this.subscriptions.push(
      this.inviteServ.getByConsultation(this.consultationId).subscribe({
        next: publicInvite => {
          this.publicinvite = publicInvite;
        },
        error: err => {
          if (err.status === 403) {
            this.router.navigate(['/forbidden']);
          }
        },
      })
    );
  }

  showStartConsultationDialog() {
    this.dialogShown = true;
    const skipPlanPage = this.configService.config?.skipConsultationPlanPage;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      id: 'start_consultation_dialog',
      data: {
        question: this.translate.instant(
          'confirmationDialog.acceptAndStartConsultation'
        ),
        yesText: this.translate.instant('confirmationDialog.yesText'),
        noText: this.translate.instant('confirmationDialog.noText'),
        title: this.translate.instant('confirmationDialog.confirmationTitle'),
        showDelayInput: !skipPlanPage,
        delayValue: 10,
      },
      autoFocus: false,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.delay) {
          this.planConsultationService
            .planConsultation(this.consultationId, result.delay)
            .subscribe(
              () => {
                this.getConsultation();
                if (this.chatComponent) {
                  this.chatComponent.getMessages();
                }
              },
              error => {
                console.error('Error planning consultation:', error);
                if (error.status === 403) {
                  this.router.navigate(['/forbidden']);
                } else if (error.status === 404) {
                  this.router.navigate(['/not-found']);
                }
              }
            );
        } else if (result.confirmed || result === true) {
          this.acceptConsultation();
        }
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

  async checkVideoAccess(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      return false;
    }
  }

  async checkDevices(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      stream.getTracks().forEach(track => track.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();

      this.videoDevices = devices.filter(
        device => device.kind === 'videoinput'
      );
      if (this.videoDevices.length && this.videoDevices[0].deviceId !== '') {
        this.videoDeviceId = this.videoDevices[0].deviceId;
      }

      this.audioDevices = devices.filter(
        device => device.kind === 'audioinput'
      );
      if (this.audioDevices.length && this.audioDevices[0].deviceId !== '') {
        this.audioDeviceId = this.audioDevices[0].deviceId;
      }
    } catch (error) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        this.videoDevices = devices.filter(
          device => device.kind === 'videoinput'
        );
        this.audioDevices = devices.filter(
          device => device.kind === 'audioinput'
        );
      } catch (e) {
        console.error('Error enumerating devices:', e);
      }
    }
  }

  async initiateVideoCall() {
    const hasVideoAccess = await this.checkVideoAccess();

    if (!hasVideoAccess) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: {
          question: this.translate.instant('consultation.cameraNotAccessible'),
          yesText: this.translate.instant('consultation.continueWithoutCamera'),
          noText: this.translate.instant('confirmationDialog.noText'),
        },
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.makeCall(true);
        }
      });
    } else {
      this.makeCall(false);
    }
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
          const errorMessage = this.translate.instant(
            'consultation.selfCallNotAllowed'
          );
          this.showErrorDialog(
            errorMessage,
            this.translate.instant('consultation.callError')
          );
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

  async openConfiguration() {
    await this.checkDevices();
    this.showConfiguration = true;
  }

  closeConfiguration() {
    this.showConfiguration = false;
  }

  openRescheduleDialog() {
    const dialogRef = this.dialog.open(RescheduleDialogComponent, {
      width: '500px',
      data: {
        consultation: this.consultation,
        currentScheduledFor: this.consultation?.consultation?.scheduledFor,
        currentTZ: this.consultation?.consultation?.patientTZ || 'UTC',
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.rescheduleConsultation(result.scheduledFor, result.patientTZ);
      }
    });
  }

  rescheduleConsultation(scheduledFor: number, patientTZ: string) {
    this.conServ
      .rescheduleConsultation(this.consultationId, scheduledFor, patientTZ)
      .subscribe(
        response => {
          if (this.consultation?.consultation) {
            this.consultation.consultation.scheduledFor = scheduledFor;
            this.consultation.consultation.patientTZ = patientTZ;
          }
          this.translate
            .get('consultation.rescheduleSuccess')
            .subscribe(msg => {
              console.log(msg);
            });

          if (response.messageService === '4' && response.inviteUrl) {
            this.dialog.open(InviteLinkComponent, {
              width: '600px',
              data: {
                link: response.inviteUrl,
              },
            });
          }
        },
        error => {
          let errorMessage =
            error?.error?.error || error?.error?.message || error?.message;

          if (!errorMessage) {
            this.translate
              .get('consultation.rescheduleError')
              .subscribe(msg => {
                this.dialog.open(ErrorDialogComponent, {
                  data: { message: msg },
                });
              });
          } else {
            this.dialog.open(ErrorDialogComponent, {
              data: { message: errorMessage },
            });
          }
        }
      );
  }

  getFormattedScheduledTime(): string {
    if (!this.consultation?.consultation?.scheduledFor) return '';

    const tz = this.consultation?.consultation?.patientTZ || 'UTC';
    return moment(this.consultation.consultation.scheduledFor)
      .tz(tz)
      .format('D MMMM YYYY HH:mm');
  }

  closeScheduledCard() {
    this.scheduledCardClosed = true;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => {
      sub?.unsubscribe();
    });
  }
}
