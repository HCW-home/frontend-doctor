import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
import { ConsultationService } from '../core/consultation.service';
import { Router } from '@angular/router';
import { ConfigService } from '../core/config.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { AuthService } from '../auth/auth.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss'],
})
export class OverlayComponent implements OnInit {
  constructor(
    private conServ: ConsultationService,
    private router: Router,
    public configService: ConfigService,
    private authService: AuthService,
    public dialog: MatDialog,
    private translate: TranslateService
  ) {}

  @Input() consultation;
  @Input() redirect;
  @Output() close = new EventEmitter();
  @Input() showCloseOverlay;
  @Input() showFinishOption;
  loading = false;
  error = '';
  public showFeedbackOverlay = false;
  currentUser;

  // The current rating selected by the doctor or null if none selected
  public doctorRating: string = null;

  // The feedback comment written by the doctor
  public doctorComment = '';

  // The list of rating values
  public ratings: string[] = ['good', 'ok', 'bad'];

  // Whether or not the feedback has been submitted (i.e. the request is ongoing)
  public feedbackSubmitted = false;

  // Whether or not the feedback has been sent
  public feedbackSent = false;
  closingConsultation = false;
  publicinvite;
  noPagination;

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    this.listenToConsultationClosed();
  }

  listenToConsultationClosed() {
    if (this.consultation?.consultation?.status === 'active') {
      this.conServ.getConsultationsOverview().subscribe(consultations => {
        const currentConsultation = consultations.find(
          c => c._id === this.consultation?._id
        );
        if (
          currentConsultation &&
          currentConsultation.consultation.status === 'closed'
        ) {
          if (
            currentConsultation.consultation.closedBy !== this.currentUser.id &&
            !this.closingConsultation &&
            !this.showFeedbackOverlay
          ) {
            this.close.emit(null);
            this.router.navigate(['/dashboard'], {
              replaceUrl: true,
              state: { confirmed: true },
            });
          }
        }
      });
    }
  }

  get canTransferOwnership(): boolean {
    if (
      !this.consultation ||
      !this.consultation.queue ||
      !this.consultation.queue.shareWhenOpened ||
      this.consultation.consultation.status !== 'active'
    ) {
      return false;
    }

    const acceptedById = this.consultation.consultation.acceptedBy;
    const doctorId =
      this.consultation.doctor?.id || this.consultation.doctor?._id;

    return (
      acceptedById !== this.currentUser.id && doctorId !== this.currentUser.id
    );
  }

  transferOwnership() {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: this.translate.instant('chat.transferOwnershipTitle'),
        question: this.translate.instant('chat.transferOwnershipQuestion'),
        yesText: this.translate.instant('chat.transferOwnershipConfirm'),
        noText: this.translate.instant('chat.transferOwnershipCancel'),
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.conServ.transferOwnership(this.consultation._id).subscribe(
          res => {
            this.loading = false;
            this.consultation.consultation.acceptedBy = this.currentUser.id;
            this.consultation.acceptedByUser = {
              firstName: this.currentUser.firstName,
              lastName: this.currentUser.lastName,
            };
          },
          err => {
            this.loading = false;
            this.error = err.error?.error || 'Failed to transfer ownership';
          }
        );
      }
    });
  }

  onClose(event, force) {
    event.stopPropagation();
    if (event.target.id == 'overlay' && force == 'closeConsultationSession') {
      this.conServ.closeConsultationFeedback(this.consultation._id);
      this.close.emit(null);

      if (this.router.url !== '/active-consultations') {
        this.router.navigate(['/dashboard'], {
          replaceUrl: true,
          state: { confirmed: true },
        });
      }
    }

    if (
      event.target.id !== 'overlay' &&
      (!force || force == 'closeConsultationSession')
    ) {
      return;
    }
    this.close.emit(null);
  }

  acceptConsultation() {
    this.conServ.acceptConsultation(this.consultation._id).subscribe(res => {
      this.router.navigate(['/consultation/' + this.consultation._id]);
    });
  }

  closeConsultation() {
    if (!this.closingConsultation) {
      this.closingConsultation = true;
      this.conServ.closeConsultation(this.consultation._id).subscribe(
        res => {
          this.consultation.consultation = res;
          this.showFeedbackOverlay = true;
          this.closingConsultation = false;
        },
        err => {
          this.loading = false;
          this.error = err;
          this.closingConsultation = false;
        }
      );
    }
  }

  finishConsultation() {
    if (this.redirect) {
      this.router.navigate([this.redirect], { state: { confirmed: true } });
    } else {
      this.router.navigate(['/dashboard'], { state: { confirmed: true } });
    }
  }

  resumeConsultation() {
    this.router.navigate(['/consultation/' + this.consultation._id]);
  }

  doNothing(event) {
    event.stopPropagation();
    return;
  }

  /**
   * Event fired when the doctor clicks on one of the ratings
   * @param rating The clicked rating
   */
  onRatingClick(rating) {
    if (rating === this.doctorRating) {
      this.doctorRating = null;
    } else if (this.ratings.indexOf(rating) !== -1) {
      this.doctorRating = rating;
    }
  }

  onSubmitFeedback() {
    if (this.feedbackSubmitted) {
      return;
    }
    this.feedbackSubmitted = true;
    this.conServ
      .saveConsultationFeedback(
        this.consultation._id,
        this.doctorRating,
        this.doctorComment
      )
      .subscribe(
        res => {
          this.feedbackSent = true;
        },
        err => {
          this.feedbackSubmitted = false;
        }
      );
  }

  onCloseFeedback() {
    this.conServ.closeConsultationFeedback(this.consultation._id);
    this.close.emit(null);
    if (this.router.url !== '/active-consultations') {
      this.router.navigate(['/dashboard'], {
        replaceUrl: true,
        state: { confirmed: true },
      });
    }
  }

  closeOverlay() {
    this.close.emit(null);
  }
}
