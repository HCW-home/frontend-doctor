import { Subscription } from 'rxjs';
import {
  Input,
  OnInit,
  NgZone,
  Output,
  Component,
  OnDestroy,
  ViewChild,
  ElementRef,
  EventEmitter,
  HostListener,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { AuthService } from '../auth/auth.service';
import { ConfigService } from '../core/config.service';
import { InviteService } from '../core/invite.service';
import { MessageService } from '../core/message.service';
import { environment } from '../../environments/environment';
import { ConsultationService } from '../core/consultation.service';
import { SocketEventsService } from '../core/socket-events.service';
import { NoteDialogComponent } from '../note-dialog/note-dialog.component';
import { InviteLinkComponent } from '../invite-link/invite-link.component';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { InviteExpertComponent } from '../invite-expoert/invite-expert.component';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, OnDestroy {
  @Input() consultation;
  @Input() publicinvite;
  @Input() showInput: boolean;
  @Input() overlay: boolean;
  @ViewChild('scroll') contentArea: ElementRef;
  @ViewChild('fileInput') fileInput: ElementRef;
  @ViewChild('generalInfo') element: ElementRef;

  currentUser;
  chatMessages = [];
  chatText: string;

  isUploading = false;
  loadingMsgs = true;
  @Input() noPagination = false;
  @Output() loaded = new EventEmitter<boolean>();

  chatHeight: string;
  overlayHeight: string;
  loadedImages = 0;
  chatImagesCount;
  subscriptions: Subscription[] = [];
  consultations = [];
  acceptAll: boolean;
  isMobile = false;
  viewMore = false;

  constructor(
    private zone: NgZone,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private msgServ: MessageService,
    private _sanitizer: DomSanitizer,
    private authService: AuthService,
    private translate: TranslateService,
    public configService: ConfigService,
    private inviteService: InviteService,
    private breakpointObserver: BreakpointObserver,
    private socketEventsService: SocketEventsService,
    private consultationService: ConsultationService
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.calculateHeight();
  }

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    this.acceptAll = !!this.configService.config?.extraMimeTypes;

    this.getMessages();
    this.socketEventsService.onMessage().subscribe(msg => {
      if (
        msg.data.consultation !==
        (this.consultation._id || this.consultation.id)
      ) {
        return;
      }

      this.zone.run(() => {
        this.chatMessages.push(this.adjustMsg(msg.data));

        this.scrollToBottom();
      });
    });

    this.listenToCallEvents();
    this.breakpointObserver.observe([Breakpoints.XSmall]).subscribe(result => {
      this.isMobile = result.matches;
    });
  }

  inviteExpert(expertLink: string) {
    this.dialog.open(InviteExpertComponent, {
      width: '800px',
      data: { expertLink, id: this.consultation._id || this.consultation.id, consultation: this.consultation },
      autoFocus: false,
    });
  }

  resendInvite(invitationId) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      id: 'confirmation_dialog',
      data: {
        question: this.translate.instant('invitations.confirmResend'),
        yesText: this.translate.instant('invitations.sendAgain'),
        noText: this.translate.instant('invitations.cancelSendAgain'),
        title: this.translate.instant('invitations.resendConfirmTitle'),
      },
      autoFocus: false,
    });
    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.inviteService.resendInvite(invitationId).subscribe(res => {
          if (res?.patientInvite) {
            if (
              !res.patientInvite.emailAddress &&
              !res.patientInvite.phoneNumber &&
              res.patientInvite.patientURL
            ) {
              this.dialog.open(InviteLinkComponent, {
                width: '600px',
                data: { link: res.patientInvite.patientURL },
                autoFocus: false,
              });
            } else {
              this.snackBar.open(
                this.translate.instant('sendInviteLink.sent'),
                'X',
                {
                  verticalPosition: 'top',
                  horizontalPosition: 'right',
                  duration: 2500,
                }
              );
            }
          }
        });
      }
    });
  }

  getExpertStatusById(id, flagExpertsOnline) {
    if (flagExpertsOnline && id in flagExpertsOnline) {
      return flagExpertsOnline[id];
    }
    return false;
  }

  listenToCallEvents() {
    this.subscriptions.push(
      this.socketEventsService.onRejectCall().subscribe(event => {
        const message = this.chatMessages.find(
          msg => msg.id === event.data.message.id
        );
        if (message) {
          message.closedAt = new Date();
        }
      })
    );
    this.subscriptions.push(
      this.socketEventsService.onAcceptCall().subscribe(event => {
        const message = this.chatMessages.find(
          msg => msg.id === event.data.message.id
        );
        if (message) {
          message.acceptedAt = new Date();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => {
      subscription?.unsubscribe();
    });
  }

  async getMessages(noScroll?) {
    this.loadingMsgs = true;

    this.msgServ
      .getConsultationMessages(
        this.consultation._id || this.consultation.id,
        this.chatMessages.length,
        this.noPagination
      )
      .subscribe({
        next: messages => {
          this.zone.run(() => {
            this.chatMessages = messages
              .map(m => {
                return this.adjustMsg(m);
              })
              .concat(this.chatMessages);

            this.chatImagesCount = this.chatMessages.filter(
              msg => msg.isImage
            ).length;
            this.loadingMsgs = false;

            if (this.noPagination && !this.chatImagesCount) {
              setTimeout(() => {
                this.addPageDividers();
              }, 0);
            }

            if (!noScroll) {
              this.scrollToBottom(100);
            }
            this.calculateHeight();
          });
        },
        error: () => {
          this.loadingMsgs = false;
        },
      });
  }

  scrollToBottom(after?): void {
    try {
      setTimeout(() => {
        this.contentArea.nativeElement.scrollTop =
          this.contentArea?.nativeElement?.scrollHeight;
      }, after || 10);
    } catch (err) {
      //    do nothing
    }
  }

  send() {
    this.chatText = this.chatText.trim();
    if (this.chatText === '') {
      return;
    }

    this.chatMessages.push({
      direction: 'outgoing',
      text: this.chatText,
      createdAt: Date.now(),
      fromUserDetail: {
        firstName: this.currentUser?.firstName,
        lastName: this.currentUser?.lastName,
      },
    });

    this.scrollToBottom();
    this.msgServ
      .sendMessage(this.consultation.id || this.consultation._id, this.chatText)
      .subscribe();

    this.chatText = '';
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  readMessages() {
    this.consultationService.readMessages(
      this.consultation.id || this.consultation._id
    );
  }

  adjustMsg(msg) {
    if (msg.type === 'attachment') {
      const requestUrl =
        environment.api +
        `/consultation/${
          this.consultation._id || this.consultation.id
        }/attachment/${msg.id}`;

      const user = this.authService.currentUserValue;

      if (msg.mimeType.endsWith('jpeg') || msg.mimeType.endsWith('png')) {
        fetch(requestUrl, {
          headers: {
            'x-access-token': user.token,
          },
        })
          .then(res => {
            return res.blob();
          })
          .then(imageFile => {
            msg.isImage = true;
            msg.attachmentsURL = this._sanitizer.bypassSecurityTrustResourceUrl(
              URL.createObjectURL(imageFile)
            );
          });
      } else if (msg.mimeType.startsWith('audio')) {
        msg.isAudio = true;
      } else {
        msg.attachmentsURL = requestUrl;
        msg.isFile = true;
      }
    }

    if (msg.from === this.currentUser.id) {
      msg.direction = 'outgoing';
    } else {
      msg.direction = 'incoming';
    }
    return msg;
  }

  downloadPdf(pdfUrl: string, fileName: string): void {
    this.consultationService.downloadPdf(pdfUrl).subscribe(blob => {
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName || 'attachment.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    });
  }

  showAttachBrowseDlg() {
    const event = new MouseEvent('click', { bubbles: true });
    this.fileInput.nativeElement.dispatchEvent(event);
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

  handleFileInput(event) {
    if (!event.target.files.item(0)) {
      return;
    }
    this.isUploading = true;
    this.consultationService
      .postFile(
        event.target.files.item(0),
        this.consultation.id || this.consultation._id
      )
      .subscribe({
        next: data => {
          this.zone.run(() => {
            this.chatMessages.push(this.adjustMsg(data.message));
            this.scrollToBottom(100);
          });
          this.isUploading = false;
        },
        error: err => {
          this.isUploading = false;
          const message = err?.error?.message || err?.error || err?.statusText;
          this.showErrorDialog(message, '');
        },
      });
  }

  @HostListener('scroll', ['$event'])
  public handleScroll(event) {
    const isReachingTop = event.target.scrollTop < 600;
    if (isReachingTop && !this.loadingMsgs && !this.noPagination) {
      this.getMessages(true);
    }
  }

  addPageDividers() {
    let page = 1;
    this.chatMessages.forEach(msg => {
      const elem = document.getElementById(msg.id);

      if (!elem) {
        return;
      }
      if (elem.offsetTop > 2970 * page - 720 && elem.offsetTop < 2970 * page) {
        elem.style['margin-top'] = '700px';
        page++;
      }
    });
    this.loaded.emit(true);
  }

  imageLoaded() {
    this.loadedImages++;
    if (this.loadedImages === this.chatImagesCount && this.noPagination) {
      this.addPageDividers();
    }
  }

  openNoteDialog() {
    const dialogRef = this.dialog.open(NoteDialogComponent, {
      autoFocus: false,
      data: {
        note: this.consultation.consultation.note,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      const body = {
        note: result,
      };
      this.consultationService
        .updateConsultationNote(this.consultation._id, body)
        .subscribe({
          next: () => {
            this.consultation.consultation.note = result;
          },
          error: err => {
            this.showErrorDialog(
              err?.message || 'Something went wrong. Please try again later.',
              ''
            );
          },
        });
    });
  }

  calculateHeight(): void {
    this.overlayHeight = `calc(100svh - ${this.element?.nativeElement?.offsetHeight}px - 70px - 30px)`;
    this.chatHeight =
      this.isMobile && this.showInput
        ? `calc(100svh - ${this.element?.nativeElement?.offsetHeight}px - 350px)`
        : `calc(100% - ${this.element?.nativeElement?.offsetHeight}px)`;
  }
}
