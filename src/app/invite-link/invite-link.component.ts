import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface DialogData {
  link: string;
}

@Component({
  selector: 'app-invite-expert',
  templateUrl: './invite-link.component.html',
  styleUrls: ['./invite-link.component.scss'],
})
export class InviteLinkComponent {
  loading = false;
  error = '';

  constructor(
    private _snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialogRef: MatDialogRef<InviteLinkComponent>
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  copy() {
    this._snackBar.open('Copied to clipboard', 'X', {
      verticalPosition: 'top',
      horizontalPosition: 'right',
      duration: 2500,
    });
  }
}
