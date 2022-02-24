import { Component, OnInit, Input, NgZone, EventEmitter, Output } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Location } from '@angular/common';
import { ConsultationService } from '../consultation.service';
@Component({
  selector: 'app-top-nav',
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.scss']
})
export class TopNavComponent implements OnInit {
  @Input() consultation;
  @Input() title: string;
  @Input() icon: string;
  currentUser;
  logoutToggle = false;
  infoToggle = false;
  @Input() showCloseConsBtn;
  @Output() closeCon = new EventEmitter<boolean>();
  constructor(private authService: AuthService, private location: Location, private zone: NgZone, private consultationService: ConsultationService) { }

  ngOnInit() {
    if (this.consultation) {
      console.log('consultation in nav', this.consultation);
      this.title = this.consultation.nurse ? this.consultation.nurse.firstName + ' ' + this.consultation.nurse.lastName.toUpperCase() : '';
      this.icon = 'info';
    }
    this.currentUser = this.authService.currentUserValue;
  }

  goBack() {
    this.location.back();
  }

  toggleLogout() {
    this.zone.run(() => {
      this.logoutToggle = !this.logoutToggle;
    });
  }

  logout() {
    this.authService.logout();
  }

  acceptNextConsultation() {
    this.consultationService.acceptNext();
  }

  showCloseModal() {
    this.closeCon.emit(true);
  }
}
