import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface NoteDialogData {
  note: string;
}

@Component({
  selector: 'app-note-dialog',
  templateUrl: './note-dialog.component.html',
  styleUrls: ['./note-dialog.component.scss']
})
export class NoteDialogComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: NoteDialogData,
    public dialogRef: MatDialogRef<NoteDialogComponent>) {}

  saveNote() {
    this.dialogRef.close(this.data.note);
  }
}
