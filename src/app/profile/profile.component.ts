import { UserService } from '../core/user.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { AuthService } from '../auth/auth.service';

import { TranslateService } from '@ngx-translate/core';

import { ProfileUpdateComponent } from "../profile-update/profile-update.component";
import {MatDialog} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MatSlideToggleChange} from "@angular/material/slide-toggle";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  currentUser;
  isSMSPhoneChanged = false;
  currentNotifPhoneNumber = '';
  enableNotif;
  isLoading = false;
  phoneNumberRegex = new RegExp(/^\+[0-9 ]+$/);
  showRadioGroup: boolean = false;
  messageService: '1' | '2' = '2';
  @ViewChild('toggleElement') ref;


  constructor(public dialog: MatDialog,
    private authService: AuthService,
    private _snackBar: MatSnackBar,
    private userService: UserService,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    this.currentNotifPhoneNumber = this.currentUser.notifPhoneNumber;
    this.enableNotif = this.currentUser.enableNotif;
    this.showRadioGroup = this.currentUser.allowUseWhatsapp;
    if (this.currentUser.messageService) {
      this.messageService = this.currentUser.messageService;
    }
  }

  onChange(ob: MatSlideToggleChange) {
    this.isLoading = true;
    this.userService.updateEnableNotif(ob.checked).subscribe(res => {
      const text = this.translate.instant('profile.notifications') + (ob.checked ? this.translate.instant('profile.enabled') : this.translate.instant('profile.disabled'));
      this.currentUser.enableNotif = ob.checked;
      this.openSnackBar(text, null);
      this.authService.storeCurrentUser(this.currentUser);
      this.isLoading = false;

    }, err => {
      this.ref.checked = !ob.checked;
      const text = this.translate.instant('profile.notificationsWhereNot') + (ob.checked ? this.translate.instant('profile.enabled') : this.translate.instant('profile.disabled'));
      this.openSnackBar(text, null);
    });


  }

  onChangeNumber() {
    this.isSMSPhoneChanged = true;
  }

  onMessageServiceChange(messageService: string) {
    const body = {
      messageService
    }
    this.userService.updateUser(this.currentUser.id,body).subscribe(res => {
      const text = this.translate.instant('profile.messageServiceSuccess');
      this.openSnackBar(text, null);
    }, err => {
      const text = this.translate.instant('profile.messageServiceError');
      this.openSnackBar(text, null);
    });
  }

  onSave() {
    if (this.isSMSPhoneChanged) {
      if (!this.phoneNumberRegex.test(this.currentNotifPhoneNumber)) {
        this.openSnackBar(this.translate.instant('profile.invalidPhoneNumber'), 'red-snackbar');
        return;
      }
      this.isLoading = true;

      this.userService.updatePhoneNumberNotif(this.currentNotifPhoneNumber).subscribe(res => {
        this.currentUser.notifPhoneNumber = this.currentNotifPhoneNumber
        this.openSnackBar(this.translate.instant('profile.numberSaved'), null);
        this.isLoading = false;
        this.isSMSPhoneChanged = false;
        this.authService.storeCurrentUser(this.currentUser);
      }, err => {
        this.isLoading = true;
        this.openSnackBar(this.translate.instant('profile.numberNotSaved'), 'red-snackbar');
      });
    }
  }
  openSnackBar(message: string, cssClass: string) {
    this._snackBar.open(message, null, {
      duration: 2000,
      panelClass: [cssClass],
    });
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(ProfileUpdateComponent, {
      width: '500px',
      height: '600 px',
      data: {}
    });
  }
}
