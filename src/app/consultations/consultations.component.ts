import { Subscription } from 'rxjs';
import {
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { jsPDF } from 'jspdf';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { DurationPipe } from '../duration.pipe';
import { UserService } from '../core/user.service';
import { AuthService } from '../auth/auth.service';
import { QueueService } from '../core/queue.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfigService } from '../core/config.service';
import { InviteService } from '../core/invite.service';
import { MessageService } from '../core/message.service';
import { environment } from '../../environments/environment';
import { ConsultationService } from '../core/consultation.service';
import { InviteFormComponent } from '../invite-form/invite-form.component';
import { InviteLinkComponent } from '../invite-link/invite-link.component';
import { FilterModalComponent } from '../filter-modal/filter-modal.component';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-consultations',
  templateUrl: './consultations.component.html',
  styleUrls: ['./consultations.component.scss'],
})
export class ConsultationsComponent implements OnInit, OnDestroy {
  @ViewChild('chatHistory') chatHistory: ElementRef;
  @ViewChild('filterButton') filterButton;
  appLiedFiltersCount = 0;
  filterState = null;
  queues = [];
  queue = null;
  consultations = [];
  allConsultations = [];
  page = 0;
  status;
  overviewSub;
  unreadActiveCountSub;
  unreadPendingCountSub;
  unreadCount;
  currentConsultation;
  chatOpen;
  title: {
    title;
    icon;
  };
  titles = [
    {
      status: 'pending',
      title: "Salle d'attente",
      icon: 'queue',
    },
    {
      status: 'active',
      title: 'Consultations ouvertes',
      icon: 'chat',
    },
    {
      status: 'closed',
      title: 'Historique des consultations',
      icon: 'history',
    },
  ];

  currentUser;
  consultationId;
  PDFConsultation;
  subscriptions: Subscription[] = [];
  isMobile = false;

  constructor(
    private zone: NgZone,
    public dialog: MatDialog,
    private datePipe: DatePipe,
    private snackBar: MatSnackBar,
    private queueServ: QueueService,
    private msgServ: MessageService,
    private userService: UserService,
    private authService: AuthService,
    private durationPipe: DurationPipe,
    public configService: ConfigService,
    private translate: TranslateService,
    private activeRoute: ActivatedRoute,
    private inviteService: InviteService,
    private activatedRoute: ActivatedRoute,
    private breakpointObserver: BreakpointObserver,
    private consultationService: ConsultationService
  ) {
    this.titles = [
      {
        status: 'pending',
        title: translate.instant('consultations.waitingRoom'),
        icon: 'queue',
      },
      {
        status: 'active',
        title: translate.instant('consultations.openedConsultation'),
        icon: 'chat',
      },
      {
        status: 'closed',
        title: translate.instant('consultations.consultationsHistory'),
        icon: 'history',
      },
    ];
  }

  ngOnInit() {
    this.consultationId = this.activeRoute.snapshot.params.id;
    this.currentUser = this.authService.currentUserValue;

    this.status = this.activatedRoute.snapshot.data.status;
    this.title = this.titles.find(t => t.status === this.status);
    this.getConsultations();
    this.getUnreadCount();
    this.getQueues();
    this.breakpointObserver.observe([Breakpoints.XSmall]).subscribe(result => {
      this.isMobile = result.matches;
    });
  }

  getQueues() {
    this.queueServ.getQueues().subscribe(queues => {
      this.queues = queues;
    });
  }

  applyFilters(filters: {
    queues: any[];
    createdBy: { me: boolean; notMe: boolean };
  }) {
    const selectedQueueIds = filters.queues
      .filter(queue => queue.selected)
      .map(queue => queue.id);

    const consultations = [...this.allConsultations];

    // Apply queue filter
    let filteredConsultations =
      selectedQueueIds.length > 0
        ? consultations.filter(cons =>
            selectedQueueIds.includes(cons.consultation?.queue)
          )
        : consultations;

    // Apply createdBy filter
    if (filters.createdBy.me && !filters.createdBy.notMe) {
      filteredConsultations = filteredConsultations.filter(
        cons => !cons.nurse?.firstName
      );
    }

    if (filters.createdBy.notMe && !filters.createdBy.me) {
      filteredConsultations = filteredConsultations.filter(
        cons => cons.nurse?.firstName
      );
    }
    this.appLiedFiltersCount =
      selectedQueueIds.length +
      (filters.createdBy.me ? 1 : 0) +
      (filters.createdBy.notMe ? 1 : 0);

    this.consultations = filteredConsultations;
  }

  async openDialog(event, pastConsultation) {
    event.stopPropagation();
    const consultation = pastConsultation.consultation;
    const user = await this.userService.getUser(consultation.owner).toPromise();
    const data = {
      gender: consultation.gender,
      queue: consultation.queue,
      firstName: consultation.firstName,
      lastName: consultation.lastName,
      emailAddress: user?.email,
      phoneNumber: user?.phoneNumber,
      metadata: consultation.metadata,
    };
    const dialogRef = this.dialog.open(InviteFormComponent, {
      id: 'invite_form_dialog',
      width: '500px',
      height: '70%',
      data,
    });
  }

  resendInvite(event, invitationId) {
    event.stopPropagation();
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

  trackItem(index, consultations) {
    return `${index}-${consultations.id}`;
  }

  getConsultations() {
    this.overviewSub = this.consultationService
      .getConsultationsOverview()
      .subscribe(consultations => {
        this.zone.run(() => {
          this.consultations = consultations.filter(
            c => c.consultation.status === this.status
          );
          this.allConsultations = this.consultations;
          if (this.status === 'closed') {
            this.consultations = this.consultations.sort((a, b) => {
              return b.consultation.closedAt - a.consultation.closedAt;
            });
          }
        });
      });
  }

  getUnreadCount() {
    if (this.status === 'active') {
      this.unreadActiveCountSub = this.consultationService
        .unreadActiveCount()
        .subscribe(count => {
          this.zone.run(() => {
            this.unreadCount = count;
          });
        });
    }

    if (this.status === 'pending') {
      this.unreadPendingCountSub = this.consultationService
        .unreadPendingCount()
        .subscribe(count => {
          this.zone.run(() => {
            this.unreadCount = count;
          });
        });
    }
  }

  showChat(id) {
    this.currentConsultation = this.consultations.find(c => c._id === id);
    this.chatOpen = true;
  }

  ngOnDestroy() {
    if (this.overviewSub) {
      this.overviewSub?.unsubscribe();
    }

    this.subscriptions.forEach(subscription => {
      subscription?.unsubscribe();
    });
    if (this.status === 'active') {
      if (this.unreadActiveCountSub) {
        this.unreadActiveCountSub?.unsubscribe();
      }
    }
    if (this.status === 'pending') {
      if (this.unreadPendingCountSub) {
        this.unreadPendingCountSub?.unsubscribe();
      }
    }
  }

  openFilterModal() {
    const bodyRect = document.body.getBoundingClientRect();
    const elemRect =
      this.filterButton._elementRef.nativeElement.getBoundingClientRect();
    const right = bodyRect.right - elemRect.right;
    const left = bodyRect.left - elemRect.left;
    const top = elemRect.top - bodyRect.top;

    const dialogRef = this.dialog.open(FilterModalComponent, {
      autoFocus: false,
      minWidth: '340px',
      position: this.isMobile
        ? { left: left + 37 + 'px', top: top + 37 + 'px' }
        : { right: right + 'px', top: top + 37 + 'px' },
      data: {
        queues: this.queues,
        filterState: this.filterState,
        appLiedFiltersCount: this.appLiedFiltersCount,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.queues) {
        this.filterState = result;
        this.applyFilters(result);
      } else if (result === 'clear') {
        this.filterState = null;
        this.appLiedFiltersCount = 0;
        this.consultations = [...this.allConsultations];
      }
    });
  }

  exportPDF(event, consultation) {
    event.stopPropagation();
    this.generatePDF(consultation.consultation, consultation.nurse);
  }

  getImageUrl(imageFile: Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = () => {
        reject(reader.error);
      };
      reader.readAsDataURL(imageFile);
    });
  }

  adjustMsg(msg, consultationId) {
    return new Promise(resolve => {
      if (msg.type === 'attachment') {
        const requestUrl = `${environment.api}/consultation/${consultationId}/attachment/${msg.id}`;
        const user = this.authService.currentUserValue;

        if (msg.mimeType.startsWith('image')) {
          fetch(requestUrl, {
            headers: {
              'x-access-token': user.token,
            },
          })
            .then(res => res.blob())
            .then(async imageFile => {
              msg.isImage = true;
              msg.attachmentsURL = await this.getImageUrl(imageFile);
              resolve(msg);
            })
            .catch(err => {
              msg.attachmentsURL = null;
              resolve(msg);
            });
        } else if (msg.mimeType.startsWith('audio')) {
          msg.isAudio = true;
          resolve(msg);
        } else {
          msg.attachmentsURL = requestUrl;
          msg.isFile = true;
          resolve(msg);
        }
      } else {
        resolve(msg);
      }
    });
  }

  generatePDF(data, nurse) {
    this.msgServ
      .getConsultationMessages(data._id || data.id, undefined, true)
      .subscribe(async res => {
        const messages = await Promise.all(
          res.map(m => this.adjustMsg(m, data._id || data.id))
        );
        const doc = new jsPDF();
        const getLabelWidth = (text: string) => doc.getTextWidth(text) + 2;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const imageUrl = this.configService.config?.logo;
        let yPosition = 10;

        const addPageIfNeeded = (lines = 1) => {
          if (yPosition + lines * 5 > pageHeight - 10) {
            doc.addPage();
            yPosition = 10;
          }
        };

        if (imageUrl) {
          await new Promise<void>(resolve => {
            const image = new Image();
            image.crossOrigin = 'Anonymous';

            const isSvg =
              imageUrl.toLowerCase().endsWith('.svg') ||
              imageUrl.startsWith('data:image/svg+xml');

            image.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = image.width || 200;
                canvas.height = image.height || 200;
                ctx.drawImage(image, 0, 0);

                const base64 = canvas.toDataURL(
                  isSvg ? 'image/png' : 'image/jpeg'
                );
                const imgWidth = 50;
                const imgHeight = (canvas.height / canvas.width) * imgWidth;

                doc.addImage(
                  base64,
                  isSvg ? 'PNG' : 'JPEG',
                  pageWidth / 2 - imgWidth / 2,
                  yPosition,
                  imgWidth,
                  imgHeight,
                  'Logo',
                  'FAST'
                );
                yPosition += imgHeight + 10;
                resolve();
              } catch (err) {
                console.error('Image processing failed:', err);
                resolve();
              }
            };

            image.onerror = () => {
              console.error('Failed to load image:', imageUrl);
              resolve();
            };

            image.src = imageUrl;
          });
        }

        const leftColX = 15;
        const labelValueGap = 20;
        const lineHeight = 5;

        doc.setFont('Helvetica', 'normal', 400);
        doc.setFontSize(22);
        doc.text(
          this.translate.instant('pdf.consultationReport'),
          leftColX,
          yPosition
        );
        yPosition += 15;

        doc.setFontSize(14);
        doc.setTextColor('#464F60');
        doc.text(
          this.translate.instant('pdf.patientInformation'),
          leftColX,
          yPosition
        );
        yPosition += 10;

        doc.setFontSize(10);
        doc.setTextColor('#000');
        doc.setFont('Helvetica', 'normal', 700);
        doc.text(
          this.translate.instant('pdf.firstname') + ':',
          leftColX,
          yPosition
        );
        doc.text(
          this.translate.instant('pdf.lastname') + ':',
          leftColX,
          yPosition + lineHeight
        );
        doc.text(
          this.translate.instant('pdf.gender') + ':',
          leftColX,
          yPosition + lineHeight * 2
        );

        doc.setFont('Helvetica', 'normal', 400);
        doc.text(`${data.firstName}`, leftColX + labelValueGap, yPosition);
        doc.text(
          `${data.lastName}`,
          leftColX + labelValueGap,
          yPosition + lineHeight
        );
        doc.text(
          `${data.gender}`,
          leftColX + labelValueGap,
          yPosition + lineHeight * 2
        );
        yPosition += lineHeight * 3 + 10;

        if (nurse?.firstName) {
          doc.setFontSize(14);
          doc.setTextColor('#464F60');
          doc.text(
            this.translate.instant('pdf.requesterInformation'),
            leftColX,
            yPosition
          );
          yPosition += 10;

          doc.setFontSize(10);
          doc.setTextColor('#000');
          doc.setFont('Helvetica', 'normal', 700);
          doc.text(
            this.translate.instant('pdf.firstname') + ':',
            leftColX,
            yPosition
          );
          doc.text(
            this.translate.instant('pdf.lastname') + ':',
            leftColX,
            yPosition + lineHeight
          );

          doc.setFont('Helvetica', 'normal', 400);
          doc.text(`${nurse.firstName}`, leftColX + labelValueGap, yPosition);
          doc.text(
            `${nurse.lastName}`,
            leftColX + labelValueGap,
            yPosition + lineHeight
          );
          yPosition += lineHeight * 2 + 10;
        }

        if (data.experts?.length) {
          doc.setFontSize(14);
          doc.setTextColor('#464F60');
          doc.text(
            this.translate.instant('pdf.expertInformation'),
            leftColX,
            yPosition
          );
          yPosition += 10;

          data.experts.forEach(expert => {
            doc.setFontSize(10);
            doc.setTextColor('#000');
            doc.setFont('Helvetica', 'normal', 700);
            doc.text(
              this.translate.instant('pdf.firstname') + ':',
              leftColX,
              yPosition
            );
            doc.text(
              this.translate.instant('pdf.lastname') + ':',
              leftColX,
              yPosition + lineHeight
            );

            doc.setFont('Helvetica', 'normal', 400);
            doc.text(
              `${expert.firstName}`,
              leftColX + labelValueGap,
              yPosition
            );
            doc.text(
              `${expert.lastName}`,
              leftColX + labelValueGap,
              yPosition + lineHeight
            );

            yPosition += lineHeight * 2 + 5;
          });
        }

        doc.setFontSize(14);
        doc.setTextColor('#464F60');
        doc.text(
          this.translate.instant('pdf.consultationInformation'),
          leftColX,
          yPosition
        );
        yPosition += 10;

        doc.setFontSize(10);
        doc.setTextColor('#000');
        doc.setFont('Helvetica', 'normal', 700);
        doc.text(
          this.translate.instant('pdf.startDateTime') + ':',
          leftColX,
          yPosition
        );
        doc.text(
          this.translate.instant('pdf.endDateTime') + ':',
          leftColX,
          yPosition + lineHeight
        );
        doc.text(
          this.translate.instant('pdf.duration') + ':',
          leftColX,
          yPosition + lineHeight * 2
        );

        doc.setFont('Helvetica', 'normal', 400);
        doc.text(
          `${this.datePipe.transform(data.acceptedAt, 'd MMM yyyy HH:mm', undefined, 'en')}`,
          leftColX +
            getLabelWidth(this.translate.instant('pdf.startDateTime') + ':'),
          yPosition
        );
        doc.text(
          `${this.datePipe.transform(data.closedAt, 'd MMM yyyy HH:mm', undefined, 'en')}`,
          leftColX +
            getLabelWidth(this.translate.instant('pdf.endDateTime') + ':'),
          yPosition + lineHeight
        );
        doc.text(
          `${this.durationPipe.transform(data.closedAt - data.createdAt, 'en')}`,
          leftColX +
            getLabelWidth(this.translate.instant('pdf.duration') + ':'),
          yPosition + lineHeight * 2
        );
        yPosition += lineHeight * 3 + 5;

        if (data.metadata && Object.keys(data.metadata).length) {
          Object.keys(data.metadata).forEach(key => {
            addPageIfNeeded();
            doc.setFont('Helvetica', 'normal', 700);
            doc.text(`${key}:`, leftColX, yPosition);
            doc.setFont('Helvetica', 'normal', 400);
            doc.text(
              `${data.metadata[key]}`,
              leftColX + getLabelWidth(`${key}:`),
              yPosition
            );
            yPosition += 5;
          });
        }

        doc.setFontSize(14);
        doc.setTextColor('#464F60');
        yPosition += 10;
        doc.text(
          this.translate.instant('pdf.chatHistory'),
          leftColX,
          yPosition
        );
        yPosition += 10;

        for (const message of messages) {
          addPageIfNeeded(4);
          doc.setFontSize(10);
          doc.setTextColor('#000');
          doc.setFont('Helvetica', 'normal', 700);

          const firstName =
            message.fromUserDetail.role === 'patient'
              ? data?.firstName
              : message.fromUserDetail.firstName || '';
          const lastName =
            message.fromUserDetail.role === 'patient'
              ? data?.lastName
              : message.fromUserDetail.lastName || '';
          const date = this.datePipe.transform(
            message.createdAt,
            'dd LLL HH:mm',
            undefined,
            'en'
          );
          const titleLine = `${firstName} ${lastName} (${message.fromUserDetail?.role}) - ${date}:`;

          const wrappedTitle = doc.splitTextToSize(titleLine, pageWidth - 30);
          doc.text(wrappedTitle, 15, yPosition);
          yPosition += wrappedTitle.length * 5;

          doc.setFont('Helvetica', 'normal', 400);
          doc.setTextColor('#464F60');

          if (message.type === 'videoCall' || message.type === 'audioCall') {
            const callTypeText =
              message.type === 'audioCall'
                ? this.translate.instant('pdf.audioCall')
                : this.translate.instant('pdf.videoCall');

            const callStatus = message.closedAt
              ? message.acceptedAt
                ? `${callTypeText} ${this.translate.instant('pdf.accepted')}`
                : `${callTypeText} ${this.translate.instant('pdf.missed')}`
              : `${callTypeText} ${this.translate.instant('pdf.call')}`;

            addPageIfNeeded(3);
            doc.text(callStatus, 15, yPosition);
            yPosition += 5;
            doc.text(
              `${this.datePipe.transform(message.createdAt, 'dd LLL HH:mm', undefined, 'en')}`,
              15,
              yPosition
            );
            yPosition += 5;

            if (message.acceptedAt && message.closedAt) {
              const closedDate = this.datePipe.transform(
                message.closedAt,
                'dd LLL HH:mm',
                undefined,
                'en'
              );
              doc.text(
                `${callTypeText} ${this.translate.instant('pdf.finished')}`,
                15,
                yPosition
              );
              yPosition += 5;
              doc.text(`${closedDate}`, 15, yPosition);
              yPosition += 5;
            }
          } else if (message.text) {
            const splitText = doc.splitTextToSize(message.text, pageWidth - 30);
            for (const line of splitText) {
              addPageIfNeeded();
              doc.text(line, 15, yPosition);
              yPosition += 4;
            }
          }

          if (message.isImage && message.attachmentsURL) {
            await new Promise<void>(resolve => {
              const image = new Image();
              image.src = message.attachmentsURL;
              image.onload = () => {
                const imgWidth = 50;
                const imgHeight = (image.height / image.width) * imgWidth;
                if (yPosition + imgHeight > pageHeight - 10) {
                  doc.addPage();
                  yPosition = 10;
                }
                doc.addImage(
                  message.attachmentsURL,
                  'JPEG',
                  15,
                  yPosition,
                  imgWidth,
                  imgHeight,
                  `${Math.random()}`,
                  'FAST'
                );
                yPosition += imgHeight + 5;
                resolve();
              };
              image.onerror = () => resolve();
            });
          }

          if (message.isFile && message.fileName) {
            addPageIfNeeded();
            doc.setFont('Helvetica', 'normal', 400);
            doc.setTextColor('#464F60');
            doc.text(
              `${this.translate.instant('pdf.attachedFile')}: ${message.fileName}`,
              15,
              yPosition
            );
            yPosition += 5;
          }
        }

        doc.save(this.translate.instant('pdf.fileName') + '.pdf');
      });
  }

  protected readonly Object = Object;
}
