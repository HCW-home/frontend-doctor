import { Component, Input, OnInit } from '@angular/core';
import { ConfigService } from '../core/config.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  error = false;
  @Input('markdownUrl') markdownUrl = '';

  constructor(
    public configService: ConfigService
  ) {
  }

  ngOnInit() {
  }
}
