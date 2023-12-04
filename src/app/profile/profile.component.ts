import { FormControl, Validators } from '@angular/forms';
import { UserService } from '../core/user.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { MatSlideToggleChange, MatSlideToggle } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { TranslateService } from '@ngx-translate/core';

import { ProfileUpdateComponent } from './../profile-update/profile-update.component';

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
