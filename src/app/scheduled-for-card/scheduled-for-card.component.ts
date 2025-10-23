import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

@Component({
  selector: 'app-scheduled-for-card',
  templateUrl: './scheduled-for-card.component.html',
  styleUrls: ['./scheduled-for-card.component.scss'],
})
export class ScheduledForCardComponent implements OnInit {
  @Input() scheduledTime: string;
  @Input() timezone: string;
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }

  ngOnInit() {
    console.log(this.scheduledTime, 'scheduledTime');
  }
}
