import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

interface DialogData {
  title: string;
  description: string;
  dismissBtnTitle?: string;
  submitBtnTitle?: string;
}

@Component({
  selector: 'app-start-tour',
  templateUrl: './start-tour.component.html',
  styleUrls: ['./start-tour.component.scss'],
})
export class StartTourComponent {
  constructor(
    public dialogRef: MatDialogRef<StartTourComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
