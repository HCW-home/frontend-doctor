import { environment } from "./../environments/environment";
import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  NgZone,
  HostListener,
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { MatIconRegistry } from "@angular/material/icon";
import {
  MatSnackBar,
  MatSnackBarRef,
  SimpleSnackBar,
} from "@angular/material/snack-bar";
import { SocketEventsService } from "./core/socket-events.service";
import { ConsultationService } from "./core/consultation.service";

import { AuthService } from "./auth/auth.service";
import { Router, ActivatedRoute } from "@angular/router";
import { ConfigService } from "./core/config.service";

import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  @ViewChild("unreadBadge") unreadBadge: ElementRef;

  lastConectionStatus = "";
  currentUser;
  unreadActiveCount = 0;
  unreadPendingCount = 0;
  imageError: boolean = false;
  token = "";
  callRunning = true;
  isLoggedIn = false;
  navigated;
  pendingConsultations;
  activeConsultations;
  currentSnackBar: MatSnackBarRef<SimpleSnackBar>;
  constructor(
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer,
    private _socketEventsService: SocketEventsService,
    private consultationService: ConsultationService,
    private zone: NgZone,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private _snackBar: MatSnackBar,
    public configService: ConfigService,
    private translate: TranslateService
  ) {
    iconRegistry.addSvgIcon(
      "dashboard",
      sanitizer.bypassSecurityTrustResourceUrl("assets/svg/icon-dashboard.svg")
    );
    iconRegistry.addSvgIcon(
      "queue",
      sanitizer.bypassSecurityTrustResourceUrl("assets/svg/icon-queue.svg")
    );
    iconRegistry.addSvgIcon(
      "chat",
      sanitizer.bypassSecurityTrustResourceUrl("assets/svg/icon-open.svg")
    );
    iconRegistry.addSvgIcon(
      "history",
      sanitizer.bypassSecurityTrustResourceUrl("assets/svg/icon-history.svg")
    );
    iconRegistry.addSvgIcon(
      "next",
      sanitizer.bypassSecurityTrustResourceUrl("assets/svg/icon-next.svg")
    );
    iconRegistry.addSvgIcon(
      "back",
      sanitizer.bypassSecurityTrustResourceUrl("assets/svg/arrow-back.svg")
    );
    iconRegistry.addSvgIcon(
      "stat",
      sanitizer.bypassSecurityTrustResourceUrl("assets/svg/icon-user.svg")
    );
    iconRegistry.addSvgIcon(
      "info",
      sanitizer.bypassSecurityTrustResourceUrl("assets/svg/Icon-info.svg")
    );
    iconRegistry.addSvgIcon(
      "phone",
      sanitizer.bypassSecurityTrustResourceUrl("assets/svg/phone-solid.svg")
    );
    iconRegistry.addSvgIcon(
      "camera",
      sanitizer.bypassSecurityTrustResourceUrl("assets/svg/icon-cameraOn.svg")
    );
    iconRegistry.addSvgIcon(
      "mic",
      sanitizer.bypassSecurityTrustResourceUrl("assets/svg/icon-speak.svg")
    );
    iconRegistry.addSvgIcon(
      "micOff",
      sanitizer.bypassSecurityTrustResourceUrl("assets/svg/mic-off.svg")
    );
    iconRegistry.addSvgIcon(
      "hangup",
      sanitizer.bypassSecurityTrustResourceUrl("assets/svg/icon-hangup.svg")
    );
    iconRegistry.addSvgIcon(
      "incoming",
      sanitizer.bypassSecurityTrustResourceUrl("assets/svg/icon-audio.svg")
    );
    iconRegistry.addSvgIcon(
      "cameraOff",
      sanitizer.bypassSecurityTrustResourceUrl("assets/svg/icon-cameraOff.svg")
    );
    iconRegistry.addSvgIcon(
      "shareScreen",
      sanitizer.bypassSecurityTrustResourceUrl("assets/svg/screen-share.svg")
    );
    iconRegistry.addSvgIcon(
      "stopShareScreen",
      sanitizer.bypassSecurityTrustResourceUrl("assets/svg/stop-screen-share.svg")
    );
    iconRegistry.addSvgIcon(
      "logout",
      sanitizer.bypassSecurityTrustResourceUrl("../assets/svg/icon-logout.svg")
    );
    iconRegistry.addSvgIcon(
      "attach",
      sanitizer.bypassSecurityTrustResourceUrl(
        "../assets/svg/icon-attachment.svg"
      )
    );
    iconRegistry.addSvgIcon(
      "pdf",
      sanitizer.bypassSecurityTrustResourceUrl(
        "../assets/svg/file-pdf-solid.svg"
      )
    );
    iconRegistry.addSvgIcon(
      "send",
      sanitizer.bypassSecurityTrustResourceUrl(
        "../assets/svg/paper-plane-solid.svg"
      )
    );
    iconRegistry.addSvgIcon(
      "question",
      sanitizer.bypassSecurityTrustResourceUrl(
        "../assets/svg/question-circle-solid.svg"
      )
    );
    iconRegistry.addSvgIcon(
      "selfcheck",
      sanitizer.bypassSecurityTrustResourceUrl("../assets/svg/self-check.svg")
    );
    iconRegistry.addSvgIcon(
      "check",
      sanitizer.bypassSecurityTrustResourceUrl(
        "../assets/svg/icon-checkFull.svg"
      )
    );
    iconRegistry.addSvgIcon(
      "invite",
      sanitizer.bypassSecurityTrustResourceUrl("../assets/svg/icon-invite.svg")
    );
    iconRegistry.addSvgIcon(
      "copy",
      sanitizer.bypassSecurityTrustResourceUrl("../assets/svg/copy.svg")
    );
    iconRegistry.addSvgIcon(
      "fail",
      sanitizer.bypassSecurityTrustResourceUrl("../assets/svg/fail.svg")
    );
  }

  ngOnInit() {
    // if (!sessionStorage.getItem('hasSession')) {
    //   this.authService.logout()
    //   sessionStorage.setItem('hasSession',"true")
    // }
    this.token = this.GetParam("tk");
    this.currentUser = this.authService.currentUserValue;
    const isLoginPage = document.location.href.includes("/app/login");
    const isResetPawordPage = document.location.href.includes(
      "/app/reset-password"
    );
    const isForgotPasswordPage = document.location.href.includes(
      "/app/forgot-password"
    );

    this.authService.currentUser.subscribe((user) => {
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
      .subscribe((consultations) => {
        this.zone.run(() => {
          this.pendingConsultations = consultations.filter((c) => {
            return c.consultation.status === "pending";
          }).length;
          this.activeConsultations = consultations.filter((c) => {
            return c.consultation.status === "active";
          }).length;
        });
      });
  }

  initServices() {
    this._socketEventsService.init(this.currentUser);
    this.consultationService.init(this.currentUser);
    this._socketEventsService.onCall().subscribe((e) => {
      this.zone.run(() => {
        this.router.navigate(["/consultation/" + e.data.consultation], {
          state: e.data,
        });
      });
    });

    this._socketEventsService.connectionSub().subscribe((status) => {
      if (
        status === "connect_failed" &&
        this.lastConectionStatus !== "connect_failed"
      ) {
        this.lastConectionStatus = "connect_failed";
        setTimeout(() => {
          this.openSnackBar(
            this.translate.instant("app.connectionFailed"),
            "red-snackbar"
          );
        }, 100);
      } else if (status === "connect") {
        if (
          this.currentSnackBar &&
          this.lastConectionStatus === "connect_failed"
        ) {
          this.openSnackBar( this.translate.instant("app.reconnected"),null);
        }
        this.lastConectionStatus = "connect";
      }
    });
    this.getConsultationsOverview();
  }

  GetParam(name) {
    const results = new RegExp("[\\?&]" + name + "=([^&#]*)").exec(
      window.location.href
    );
    if (!results) {
      return "";
    }
    return results[1] || "";
  }

  openSnackBar(message: string, cssClass: string) {
    this.zone.run(() => {
      if (this.currentSnackBar) {
        this.currentSnackBar.dismiss();
      }
      this.currentSnackBar = this._snackBar.open(message, "X", {
        panelClass: [cssClass],
        verticalPosition: "bottom",
        horizontalPosition: "center",
      });
    });
  }

  onImageError() {
    this.imageError = true;
  }
}
