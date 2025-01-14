import { UserService } from '../core/user.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { AuthService } from '../auth/auth.service';

import { TranslateService } from '@ngx-translate/core';

import { ProfileUpdateComponent } from '../profile-update/profile-update.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { InviteService } from '../core/invite.service';
import { TwilioWhatsappConfig } from '../../utils/twillo-whatsapp-config';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
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
  currentLang: string = 'en';

  constructor(
    public dialog: MatDialog,
    private _snackBar: MatSnackBar,
    private authService: AuthService,
    private userService: UserService,
    private translate: TranslateService,
    private inviteService: InviteService
  ) {
    this.currentLang = this.translate.currentLang;
  }

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    this.currentNotifPhoneNumber = this.currentUser.notifPhoneNumber;
    this.enableNotif = this.currentUser.enableNotif;

    if (this.currentNotifPhoneNumber) {
      this.checkIfSupportedPrefix(this.currentNotifPhoneNumber)
    }
    if (this.currentUser.messageService) {
      this.messageService = this.currentUser.messageService;
    }
  }

  checkIfSupportedPrefix(phoneNumber: string) {
    this.inviteService
      .checkPrefix(
        phoneNumber,
        this.currentLang,
        TwilioWhatsappConfig.offlineAction
      )
      .subscribe({
        next: res => {
          switch (res.status) {
            case 0:
              this.showRadioGroup = false;
              break;
            case 1:
              this.showRadioGroup = true;
              break;
            case 2:
              if (this.messageService !== '1') {
                this.messageService = '1';
                this.onSave();
              }
              this.showRadioGroup = false;
              break;
            case 3:
              if (this.messageService !== '2') {
                this.messageService = '2';
                this.onSave();
              }
              this.showRadioGroup = false;
              break;
          }
        },
        error: err => {
          const text = this.translate.instant('profile.messageServiceError');
          this.openSnackBar(text, null);
        },
      });
  }

  checkPrefix(phoneNumber: string) {
    this.inviteService
      .checkPrefix(
        phoneNumber,
        this.currentLang,
        TwilioWhatsappConfig.offlineAction
      )
      .subscribe({
        next: res => {
          switch (res.status) {
            case 0:
              this.showRadioGroup = false;
              break;
            case 1:
              this.showRadioGroup = true;
              break;
            case 2:
              this.showRadioGroup = false;
              break;
            case 3:
              this.showRadioGroup = false;
              break;
          }
        },
        error: err => {
          const text = this.translate.instant('profile.messageServiceError');
          this.openSnackBar(text, null);
        },
      });
  }

  onChange(ob: MatSlideToggleChange) {
    this.isLoading = true;
    this.userService.updateEnableNotif(ob.checked).subscribe(
      res => {
        const text =
          this.translate.instant('profile.notifications') +
          (ob.checked
            ? this.translate.instant('profile.enabled')
            : this.translate.instant('profile.disabled'));
        this.currentUser.enableNotif = ob.checked;
        this.openSnackBar(text, null);
        this.authService.storeCurrentUser(this.currentUser);
        this.isLoading = false;
      },
      err => {
        this.ref.checked = !ob.checked;
        const text =
          this.translate.instant('profile.notificationsWhereNot') +
          (ob.checked
            ? this.translate.instant('profile.enabled')
            : this.translate.instant('profile.disabled'));
        this.openSnackBar(text, null);
      }
    );
  }

  onChangeNumber() {
    this.isSMSPhoneChanged = true;
    this.checkPrefix(this.currentNotifPhoneNumber);
  }

  onMessageServiceChange() {
    this.isSMSPhoneChanged = true;
  }

  onSave() {
      if (!this.phoneNumberRegex.test(this.currentNotifPhoneNumber)) {
        this.openSnackBar(
          this.translate.instant('profile.invalidPhoneNumber'),
          'red-snackbar'
        );
        return;
      }
      this.isLoading = true;
      const body = {
        messageService: this.messageService,
        notifPhoneNumber: this.currentNotifPhoneNumber,
      };
      this.userService.updateUser(this.currentUser.id, body).subscribe(
          res => {
            const text = this.translate.instant('profile.messageServiceSuccess');
            this.openSnackBar(text, null);
            this.isLoading = false;
          },
          err => {
            const text = this.translate.instant('profile.messageServiceError');
            this.openSnackBar(text, null);
            this.isLoading = false;
          }
      );

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
      data: {},
    });
  }
}
