import {
  Input,
  OnInit,
  NgZone,
  Output,
  OnDestroy,
  Component,
  EventEmitter,
} from "@angular/core";
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '../core/config.service';
import { ConsultationService } from '../core/consultation.service';
import { SidenavToggleService } from '../core/sidenav-toggle.service';
import {IStepOption, TourService} from "ngx-ui-tour-md-menu";
import {BreakpointObserver, Breakpoints} from "@angular/cdk/layout";
import {Direction, EventName, TourType} from "../models/tour";
import {Subscription} from "rxjs";
import {Router} from "@angular/router";
import {StartTourComponent} from "../shared/components/start-tour/start-tour.component";
import {MatDialog} from "@angular/material/dialog";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-top-nav',
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.scss'],
})
export class TopNavComponent implements OnInit, OnDestroy {
  @Input() consultation;
  @Input() title: string;
  @Input() icon: string;
  currentUser;
  logoutToggle = false;
  @Input() showCloseConsBtn;
  @Output() closeCon = new EventEmitter<boolean>();
  isMobile = false;
  private stepHideSubscription: Subscription;

  constructor(
    private zone: NgZone,
    private router: Router,
    public dialog: MatDialog,
    private authService: AuthService,
    private tourService: TourService,
    public configService: ConfigService,
    private translate: TranslateService,
    private breakpointObserver: BreakpointObserver,
    private consultationService: ConsultationService,
    private sidenavToggleService: SidenavToggleService,
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
    this.breakpointObserver.observe([Breakpoints.XSmall]).subscribe(result => {
      this.isMobile = result.matches;
    });
    this.listenToTourSubscriptions();
  }

  listenToTourSubscriptions() {
    this.stepHideSubscription = this.tourService.events$.subscribe(events => {
      const value = events.value as { step: IStepOption; direction: Direction };
      if (
          events.name === EventName.StepHide &&
          value &&
          value.step &&
          value.step.anchorId === TourType.CONSULTATION_HISTORY_MENU &&
          value.direction === Direction.Forwards
      ) {
        this.toggleLogout();
      }
      if (
          events.name === EventName.StepShow &&
          value &&
          value.step &&
          value.step.anchorId === TourType.INVITES_MENU &&
          value.direction === Direction.Forwards
      ) {
        this.sidenavToggleService.toggleSidenav('open');
      }
      if (
          events.name === EventName.StepShow &&
          value &&
          value.step &&
          value.step.anchorId === TourType.NEW_INVITE_BUTTON &&
          value.direction === Direction.Forwards &&
          this.isMobile
      ) {
        this.sidenavToggleService.toggleSidenav('close');
      }
      if (
          events.name === EventName.StepHide &&
          value &&
          value.step &&
          value.step.anchorId === TourType.NEW_INVITE_BUTTON &&
          value.direction === Direction.Backwards &&
          this.isMobile
      ) {
        this.sidenavToggleService.toggleSidenav('open');
      }
      if (
          events.name === EventName.StepHide &&
          value &&
          value.step &&
          value.step.anchorId === TourType.HEADER_PROFILE_MENU &&
          value.direction === Direction.Forwards
      ) {
        this.router.navigate([`/profile`]);
         this.dialog.open(StartTourComponent, {
          autoFocus: false,
           data: {
             title: this.translate.instant('tour.endTourTitle'),
             description: this.translate.instant('tour.endTourDescription'),
             submitBtnTitle: this.translate.instant('tour.endTourSubmitBtnTitle'),
           }
        });
      }
    });
  }

  toggleLogout() {
    this.zone.run(() => {
      this.logoutToggle = !this.logoutToggle;
    });
  }

  startTour() {
    this.sidenavToggleService.toggleSidenav('open');
    this.tourService.start();
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

  ngOnDestroy() {
    if (this.stepHideSubscription) {
      this.stepHideSubscription?.unsubscribe();
    }
  }

  protected readonly TourType = TourType;
}
