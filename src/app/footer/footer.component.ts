import { Component, OnInit } from '@angular/core';
import { ConfigService } from '../core/config.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  error = false;
  markdownUrl = '';
  userLang = window.localStorage.getItem('hhw-lang');

  constructor(
    private translate: TranslateService,
    public configService: ConfigService
  ) {
    this.userLang =
      window.localStorage.getItem('hhw-lang') ||
      this.translate.getBrowserLang();
  }

  ngOnInit() {
    this.markdownUrl = 'assets/footer.' + this.userLang + '.md';
  }
}
