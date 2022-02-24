import { Component, OnInit, Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'app-side-chat',
  templateUrl: './side-chat.component.html',
  styleUrls: ['./side-chat.component.scss']
})
export class SideChatComponent implements OnInit {

  @Output() close = new EventEmitter();
  chatMessages: Array<any> = [];
  chatText: string;

  constructor() { }

  ngOnInit() {
  }
  onClose() {
    this.close.emit(null);
  }
}
