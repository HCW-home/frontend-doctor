import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import moment from 'moment-timezone';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-reschedule-dialog',
  templateUrl: './reschedule-dialog.component.html',
  styleUrls: ['./reschedule-dialog.component.scss']
})
export class RescheduleDialogComponent implements OnInit {
  rescheduleForm: FormGroup;
  timezones: string[] = [];
  filteredTimezones: Observable<string[]>;
  minDate: Date;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<RescheduleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      consultation: any;
      currentScheduledFor: number;
      currentTZ: string;
    }
  ) {
    this.minDate = new Date();
    this.timezones = moment.tz.names();
  }

  ngOnInit() {
    const currentScheduled = this.data.currentScheduledFor
      ? new Date(this.data.currentScheduledFor)
      : new Date();

    this.rescheduleForm = this.fb.group({
      scheduledDate: [currentScheduled, Validators.required],
      scheduledTime: [this.formatTime(currentScheduled), Validators.required],
      patientTZ: [this.data.currentTZ || 'UTC', Validators.required]
    });

    // Setup timezone filtering
    this.filteredTimezones = this.rescheduleForm.get('patientTZ').valueChanges.pipe(
      startWith(this.data.currentTZ || 'UTC'),
      map(value => this._filterTimezones(value || ''))
    );
  }

  private _filterTimezones(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.timezones.filter(tz => tz.toLowerCase().includes(filterValue));
  }

  formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  onSubmit() {
    if (this.rescheduleForm.valid) {
      const formValue = this.rescheduleForm.value;
      const date = new Date(formValue.scheduledDate);
      const [hours, minutes] = formValue.scheduledTime.split(':');

      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      date.setSeconds(0);
      date.setMilliseconds(0);

      this.dialogRef.close({
        scheduledFor: date.getTime(),
        patientTZ: formValue.patientTZ
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
