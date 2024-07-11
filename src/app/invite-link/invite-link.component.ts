import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

export interface DialogData {
  link: string;
}

@Component({
  selector: 'app-invite-link',
  templateUrl: './invite-link.component.html',
  styleUrls: ['./invite-link.component.scss'],
})
export class InviteLinkComponent {
  constructor(
    private _snackBar: MatSnackBar,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialogRef: MatDialogRef<InviteLinkComponent>
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  copy() {
    this._snackBar.open(this.translate.instant('sendInviteLink.copied'), 'X', {
      verticalPosition: 'top',
      horizontalPosition: 'right',
      duration: 2500,
    });
  }
}
