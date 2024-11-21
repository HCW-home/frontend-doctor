import {
  NgZone,
  OnInit,
  ViewChild,
  Component,
  OnDestroy,
  ElementRef,
} from "@angular/core";
import {Subscription} from "rxjs";
import { AuthService } from './auth/auth.service';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';
import { SocketEventsService } from './core/socket-events.service';
import { ConsultationService } from './core/consultation.service';
import {Router, NavigationStart} from "@angular/router";
import { ConfigService } from './core/config.service';
import { TranslateService } from '@ngx-translate/core';
import {
  MatSnackBar,
  MatSnackBarRef,
  SimpleSnackBar,
} from '@angular/material/snack-bar';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { SidenavToggleService } from './core/sidenav-toggle.service';
import { MatSidenav } from '@angular/material/sidenav';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('unreadBadge') unreadBadge: ElementRef;
  @ViewChild('sidenav') sidenav: MatSidenav;
  isMobile = false;
  private routerSubscription: Subscription;

  lastConectionStatus = '';
  currentUser;
  imageError = false;
  token = '';
  isLoggedIn = false;
  navigated;
  pendingConsultations;
  activeConsultations;
  currentSnackBar: MatSnackBarRef<SimpleSnackBar>;
  markdownExists: boolean = false;
  markdownUrl: string = 'assets/footer.md';
  currentLang: string = 'en';
  showFooter: boolean = true;


  constructor(
    private zone: NgZone,
    private router: Router,
    sanitizer: DomSanitizer,
    iconRegistry: MatIconRegistry,
    private _snackBar: MatSnackBar,
    private authService: AuthService,
    private translate: TranslateService,
    public configService: ConfigService,
    private breakpointObserver: BreakpointObserver,
    private consultationService: ConsultationService,
    private _socketEventsService: SocketEventsService,
    private sidenavToggleService: SidenavToggleService
  ) {
    this.currentLang = this.translate.currentLang;
    iconRegistry.addSvgIcon(
      'dashboard',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg/icon-dashboard.svg')
    );
    iconRegistry.addSvgIcon(
      'queue',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg/icon-queue.svg')
    );
    iconRegistry.addSvgIcon(
      'chat',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg/icon-open.svg')
    );
    iconRegistry.addSvgIcon(
      'history',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg/icon-history.svg')
    );
    iconRegistry.addSvgIcon(
      'next',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg/icon-next.svg')
    );
    iconRegistry.addSvgIcon(
      'back',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg/arrow-back.svg')
    );
    iconRegistry.addSvgIcon(
      'stat',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg/icon-user.svg')
    );
    iconRegistry.addSvgIcon(
      'info',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg/Icon-info.svg')
    );
    iconRegistry.addSvgIcon(
      'phone',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg/phone-solid.svg')
    );
    iconRegistry.addSvgIcon(
      'camera',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg/icon-cameraOn.svg')
    );
    iconRegistry.addSvgIcon(
      'mic',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg/icon-speak.svg')
    );
    iconRegistry.addSvgIcon(
      'micOff',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg/mic-off.svg')
    );
    iconRegistry.addSvgIcon(
      'hangup',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg/icon-hangup.svg')
    );
    iconRegistry.addSvgIcon(
      'incoming',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg/icon-audio.svg')
    );
    iconRegistry.addSvgIcon(
      'cameraOff',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg/icon-cameraOff.svg')
    );
    iconRegistry.addSvgIcon(
      'shareScreen',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg/screen-share.svg')
    );
    iconRegistry.addSvgIcon(
      'stopShareScreen',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg/stop-screen-share.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'logout',
      sanitizer.bypassSecurityTrustResourceUrl('../assets/svg/icon-logout.svg')
    );
    iconRegistry.addSvgIcon(
      'attach',
      sanitizer.bypassSecurityTrustResourceUrl(
        '../assets/svg/icon-attachment.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'pdf',
      sanitizer.bypassSecurityTrustResourceUrl(
        '../assets/svg/file-pdf-solid.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'send',
      sanitizer.bypassSecurityTrustResourceUrl(
        '../assets/svg/paper-plane-solid.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'question',
      sanitizer.bypassSecurityTrustResourceUrl(
        '../assets/svg/question-circle-solid.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'selfcheck',
      sanitizer.bypassSecurityTrustResourceUrl('../assets/svg/self-check.svg')
    );
    iconRegistry.addSvgIcon(
      'check',
      sanitizer.bypassSecurityTrustResourceUrl(
        '../assets/svg/icon-checkFull.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'invite',
      sanitizer.bypassSecurityTrustResourceUrl('../assets/svg/icon-invite.svg')
    );
    iconRegistry.addSvgIcon(
      'copy',
      sanitizer.bypassSecurityTrustResourceUrl('../assets/svg/copy.svg')
    );
    iconRegistry.addSvgIcon(
      'fail',
      sanitizer.bypassSecurityTrustResourceUrl('../assets/svg/fail.svg')
    );
    iconRegistry.addSvgIcon(
      'in-new-tab',
      sanitizer.bypassSecurityTrustResourceUrl('../assets/svg/in-new-tab.svg')
    );
    iconRegistry.addSvgIcon(
      'filter',
      sanitizer.bypassSecurityTrustResourceUrl('../assets/svg/filter.svg')
    );
    iconRegistry.addSvgIcon(
      'enlarge',
      sanitizer.bypassSecurityTrustResourceUrl('../assets/svg/icon-enlarge.svg')
    );
  }

  ngOnInit() {
    // if (!sessionStorage.getItem('hasSession')) {
    //   this.authService.logout()
    //   sessionStorage.setItem('hasSession',"true")
    // }
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.showFooter = !event.url.match(/^\/consultation\/[a-zA-Z0-9]+$/);
        if (event.url !== '/cgu' && event.url !== '/terms-acceptance') {
          this.checkTermsAndNavigate();
        }
      }
    });
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
    });

    this.sidenavToggleService.toggleSidenav$.subscribe(() => {
      this.sidenav.toggle();
    });

    this.token = this.GetParam('tk');
    this.checkMarkdown();
    this.currentUser = this.authService.currentUserValue;
    const isLoginPage = document.location.href.includes('/app/login');
    const isResetPawordPage = document.location.href.includes(
      '/app/reset-password'
    );
    const isForgotPasswordPage = document.location.href.includes(
      '/app/forgot-password'
    );

    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;

      // If the user is not authentified
      if (!this.currentUser) {
        this.isLoggedIn = false;
        // We let him browse to /login
        if (isLoginPage || isResetPawordPage || isForgotPasswordPage) {
          return;
        }
      }

      this.zone.run(() => {
        if (this.currentUser) {
          this.currentUser = user;
          this.isLoggedIn = true;

          this.initServices();

          setTimeout(() => (this.navigated = true), 1);
        }
      });
    });
  }

  getConsultationsOverview() {
    this.consultationService
      .getConsultationsOverview()
      .subscribe(consultations => {
        this.zone.run(() => {
          this.pendingConsultations = consultations.filter(c => {
            return c.consultation.status === 'pending';
          }).length;
          this.activeConsultations = consultations.filter(c => {
            return c.consultation.status === 'active';
          }).length;
        });
      });
  }

  initServices() {
    this._socketEventsService.init(this.currentUser);
    this.consultationService.init(this.currentUser);
    this._socketEventsService.onCall().subscribe(e => {
      this.zone.run(() => {
        this.router.navigate(['/consultation/' + e.data.consultation], {
          state: e.data,
        });
      });
    });

    this._socketEventsService.connectionSub().subscribe(status => {
      if (
        status === 'connect_failed' &&
        this.lastConectionStatus !== 'connect_failed'
      ) {
        this.lastConectionStatus = 'connect_failed';
        setTimeout(() => {
          this.openSnackBar(
            this.translate.instant('app.connectionFailed'),
            'red-snackbar'
          );
        }, 100);
      } else if (status === 'connect') {
        if (
          this.currentSnackBar &&
          this.lastConectionStatus === 'connect_failed'
        ) {
          this.openSnackBar(this.translate.instant('app.reconnected'), null);
        }
        this.lastConectionStatus = 'connect';
      }
    });
    this.getConsultationsOverview();
  }

  checkTermsAndNavigate() {
    this.authService.currentUserSubject.subscribe({
      next: user => {
        const config = this.configService.config;
        if (user && config) {
          if (
            Number(config.doctorTermsVersion) > Number(user.doctorTermsVersion)
          ) {
            this.router.navigate(['/terms-acceptance']);
          } else if (
            Number(config.doctorTermsVersion) &&
            !user.doctorTermsVersion
          ) {
            this.router.navigate(['/terms-acceptance']);
          }
        }
      },
    });
  }

  GetParam(name) {
    const results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(
      window.location.href
    );
    if (!results) {
      return '';
    }
    return results[1] || '';
  }

  openSnackBar(message: string, cssClass: string) {
    this.zone.run(() => {
      if (this.currentSnackBar) {
        this.currentSnackBar.dismiss();
      }
      const refreshButtonText = this.translate.instant('app.refresh')
      this.currentSnackBar = this._snackBar.open(message, cssClass ?  refreshButtonText : 'X', {
        panelClass: [cssClass],
        verticalPosition: 'bottom',
        horizontalPosition: 'center',
      });

      this.currentSnackBar.onAction().subscribe(() => {
        if (cssClass) {
          window.location.reload();
        }
      });

    });
  }

  onImageError() {
    this.imageError = true;
  }

  checkMarkdown() {
    const langSpecificMarkdownUrl = `assets/footer.${this.currentLang}.md`;

    this.configService.checkMarkdownExists(langSpecificMarkdownUrl).subscribe({
      next: (res) => {
        this.markdownUrl = langSpecificMarkdownUrl;
        this.markdownExists = true;
      },
      error: (err) => {
        this.configService.checkMarkdownExists('assets/footer.md').subscribe({
          next: (res) => {
            this.markdownUrl = 'assets/footer.md';
            this.markdownExists = true;
          },
          error: (err) => {
            this.markdownExists = false;
          }
        });
      }
    });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
