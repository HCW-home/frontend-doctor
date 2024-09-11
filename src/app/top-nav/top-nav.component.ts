import {
  Input,
  OnInit,
  NgZone,
  Output,
  EventEmitter,
  Component,
} from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '../core/config.service';
import { ConsultationService } from '../core/consultation.service';
import { SidenavToggleService } from '../core/sidenav-toggle.service';

@Component({
  selector: 'app-top-nav',
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.scss'],
})
export class TopNavComponent implements OnInit {
  @Input() consultation;
  @Input() title: string;
  @Input() icon: string;
  currentUser;
  logoutToggle = false;
  @Input() showCloseConsBtn;
  @Output() closeCon = new EventEmitter<boolean>();

  constructor(
    private authService: AuthService,
    private zone: NgZone,
    private consultationService: ConsultationService,
    private sidenavToggleService: SidenavToggleService,
    public configService: ConfigService
  ) {}

  ngOnInit() {
    if (this.consultation) {
      this.title = this.consultation.nurse
        ? this.consultation.nurse.firstName +
          ' ' +
          this.consultation.nurse.lastName.toUpperCase()
        : '';
      this.icon = 'info';
    }
    this.currentUser = this.authService.currentUserValue;
  }

  toggleLogout() {
    this.zone.run(() => {
      this.logoutToggle = !this.logoutToggle;
    });
  }

  toggleSidenav() {
    this.sidenavToggleService.toggleSidenav();
  }

  logout() {
    this.authService.logout(true);
  }

  acceptNextConsultation() {
    this.consultationService.acceptNext();
  }

  openNurse() {
    if (this.configService.config.doctorExternalLink) {
      window.open(this.configService.config.doctorExternalLink, '_blank');
    }
  }

  showCloseModal() {
    this.closeCon.emit(true);
  }
}
