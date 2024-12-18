import { Component } from '@angular/core';
import { LocationStrategy } from '@angular/common';
import { ConfigService } from '../core/config.service';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../core/user.service';
import { Router } from '@angular/router';
import {User} from "../user";
import {MatDialog} from "@angular/material/dialog";
import {CguComponent} from "../cgu/cgu.component";
import {TourService} from "ngx-ui-tour-md-menu";
import {StartTourComponent} from "../shared/components/start-tour/start-tour.component";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-terms-acceptance',
  templateUrl: './terms-acceptance.component.html',
  styleUrls: ['./terms-acceptance.component.scss'],
})
export class TermsAcceptanceComponent {
  currentUser: User;
  error = false;
  checked = false;
  showCheckbox = false;

  constructor(
    private router: Router,
    public dialog: MatDialog,
    private authService: AuthService,
    private tourService: TourService,
    private userService: UserService,
    public configService: ConfigService,
    private translate: TranslateService,
    private locationStrategy: LocationStrategy
  ) {}

  ngOnInit() {
    this.authService.getCurrentUser().subscribe(user => {
      const config = this.configService.config;
      if (user && config) {
        this.currentUser = user;
        if (
          Number(config.doctorTermsVersion) > Number(user.doctorTermsVersion)
        ) {
          this.showCheckbox = true;
        }
        if (Number(config.doctorTermsVersion) && !user.doctorTermsVersion) {
          this.showCheckbox = true;
        }
      }
    });
  }


  goBack() {
    this.locationStrategy.historyGo(-1);
  }

  submit() {
    const body = {
      doctorTermsVersion: this.configService.config.doctorTermsVersion,
    };
    this.userService.updateUserTerms(body).subscribe({
      next: res => {
        this.authService.currentUserSubject.next({
          ...this.currentUser,
          doctorTermsVersion: res.doctorTermsVersion,
        });
        this.showStartTourDialog()
      },
      error: err => {
        console.log(err, 'err');
      },
    });
  }

  showStartTourDialog() {
    const dialogRef = this.dialog.open(StartTourComponent, {
      autoFocus: false,
      data: {
        title: this.translate.instant('tour.startTourTitle', this.configService.config),
        description: this.translate.instant('tour.startTourDescription', this.configService.config),
        dismissBtnTitle: this.translate.instant('tour.startTourDismissBtnTitle'),
        submitBtnTitle: this.translate.instant('tour.startTourSubmitBtnTitle'),
      },
      width: '450px',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.tourService.start();
      } else {
        this.router.navigate(['/dashboard']);
      }
    })
  }

  openTerms(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dialog.open(CguComponent, {
      autoFocus: false,
      minWidth: '80vw',
      data: {
        showCloseButton: true
      }
    });
  }
}
