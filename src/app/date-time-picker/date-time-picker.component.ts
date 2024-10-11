import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import * as moment from 'moment-timezone';

@Component({
  selector: 'app-date-time-picker',
  templateUrl: './date-time-picker.component.html',
  styleUrls: ['./date-time-picker.component.scss']
})
export class DateTimePickerComponent  implements OnInit {
  date: Date = new Date();
  time: string;
  times: string[] = this.generateTimes();
  filteredTimes: string[];
  timezones: string[] = [];
  filteredTimezones: string[] = [];

  @Input() selectedTimezone: string = '';
  @Output() dateTimeSelected = new EventEmitter<Date>();
  @Output() timeZoneSelected = new EventEmitter<string>();

  constructor() {
    const currentTime = new Date();
    const minutes = currentTime.getMinutes() < 30 ? '00' : '30';
    const hours = currentTime.getHours();
    this.time = `${hours < 10 ? '0' : ''}${hours}:${minutes}`;
    this.timezones = moment.tz.names();
    this.filteredTimezones = [...this.timezones];
  }

  ngOnInit() {
    this.emitDateTime();
    this.emitTimeZone();
    this.generateTimesForDate(this.date);
    this.filteredTimes = this.times;
  }

  generateTimesForDate(date: Date) {
    const today = new Date();
    today.setSeconds(0, 0);

    let times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        let timeCandidate = new Date(date);
        timeCandidate.setHours(hour, minute, 0, 0);

        if (timeCandidate.getTime() >= today.getTime()) {
          times.push(`${hour < 10 ? '0' : ''}${hour}:${minute === 0 ? '00' : minute}`);
        }
      }
    }

    this.times = times;
    this.filteredTimes = times;
  }


  private generateTimes(): string[] {
    let times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        times.push(`${hour < 10 ? '0' : ''}${hour}:${minute === 0 ? '00' : minute}`);
      }
    }
    return times;
  }

  onDateChange(event: any): void {
    this.generateTimesForDate(event.value);
    this.emitDateTime();
  }

  onTimeChange(event: any): void {
    this.filterTimes(this.time);
    this.emitDateTime();
  }

  onTimezoneChange(timezone: string): void {
    this.emitTimeZone();
  }

  filterTimezones() {
    const filterValue = this.selectedTimezone ? this.selectedTimezone.toLowerCase() : '';
    this.filteredTimezones = this.timezones.filter(tz =>
        tz.toLowerCase().includes(filterValue)
    );
  }

  filterTimes(val: string): void {
    this.filteredTimes = this.times.filter(option =>
        option.toLowerCase().includes(val ? val.toLowerCase() : ''));
  }

  filterDates = (d: Date | null): boolean => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return d ? d >= now : false;
  }

  displayFn(time?: string): string | undefined {
    return time ? time : undefined;
  }

  private emitDateTime(): void {
    if (this.date && this.time) {
      const [hours, minutes] = this.time.split(':').map(n => parseInt(n));
      const dateTime = new Date(this.date);
      dateTime.setHours(hours, minutes, 0);
      this.dateTimeSelected.emit(dateTime);
    }
  }

  emitTimeZone(): void {
    this.timeZoneSelected.emit(this.selectedTimezone)
  }
}

