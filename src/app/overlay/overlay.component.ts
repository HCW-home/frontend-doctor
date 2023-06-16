import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
import { ConsultationService } from '../core/consultation.service';
import { Router } from '@angular/router';
import { ConfigService } from '../core/config.service';

@Component({
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss']
})
export class OverlayComponent implements OnInit {

  constructor(private conServ: ConsultationService,
    private router: Router,
    public configService: ConfigService) { }

  @Input() consultation;
  @Input() redirect;
  @Output() close = new EventEmitter();
  @Input() showCloseOverlay;
  @Input() showFinishOption;
  loading = false;
  error = '';
  public showFeedbackOverlay = false;

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
  publicinvite
  noPagination
  ngOnInit() {

  }

  onClose(event, force) {
    event.stopPropagation();
    if (event.target.id == 'overlay' && force == 'closeConsultationSession') {
      this.conServ.closeConsultationFeedback(this.consultation._id);
      this.close.emit(null);

      if (this.router.url !== '/active-consultations') {
        this.router.navigate(['/dashboard'], { replaceUrl: true, state: { confirmed: true } });
      }
    }

    if (event.target.id !== 'overlay' && (!force || force == 'closeConsultationSession')) { return; }
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
      this.conServ.closeConsultation(this.consultation._id).subscribe(res => {
        this.consultation.consultation = res;
        this.showFeedbackOverlay = true;
        this.closingConsultation = false;
      }, err => {
        this.loading = false;
        this.error = err;
        this.closingConsultation = false;
      });
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
    this.conServ.saveConsultationFeedback(this.consultation._id, this.doctorRating, this.doctorComment).subscribe(
      (res) => {
        this.feedbackSent = true;
      },
      (err) => {
        this.feedbackSubmitted = false;
      }
    );
  }

  onCloseFeedback() {
    this.conServ.closeConsultationFeedback(this.consultation._id);
    this.close.emit(null);
    if (this.router.url !== '/active-consultations') {
      this.router.navigate(['/dashboard'], { replaceUrl: true, state: { confirmed: true } });
    }
  }
}

