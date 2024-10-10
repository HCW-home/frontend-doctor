import { Component } from '@angular/core';
import { LocationStrategy } from '@angular/common';
import { ConfigService } from '../core/config.service';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../core/user.service';
import { Router } from '@angular/router';
import {User} from "../user";
import {MatDialog} from "@angular/material/dialog";
import {CguComponent} from "../cgu/cgu.component";

@Component({
  selector: 'app-terms-acceptance',
  templateUrl: './terms-acceptance.component.html',
  styleUrls: ['./terms-acceptance.component.scss'],
})
export class TermsAcceptanceComponent {
  currentUser: User;
  error = false;
  showCheckbox = false;
  checked = false;

  constructor(
    private router: Router,
    public dialog: MatDialog,
    private userService: UserService,
    private authService: AuthService,
    public configService: ConfigService,
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
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        console.log(err, 'err');
      },
    });
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
