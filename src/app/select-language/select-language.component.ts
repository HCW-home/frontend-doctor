import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-select-language',
  template: `
    <div id="hhwMultiLang">
      <div (click)="openDropdown()">
        <span [className]="'flag-icon flag-icon-' + (translate.currentLang === 'us' || translate.currentLang === 'en' ? 'us' : translate.currentLang)"></span>&nbsp;<span>{{ opened ? '▲' : '▼' }}</span>
      </div>
      <div *ngIf="opened">
        <div (click)="changeLang('en')" class="hhwmlOption"><span class="flag-icon flag-icon-us"></span></div>
        <div (click)="changeLang('fr')" class="hhwmlOption"><span class="flag-icon flag-icon-fr"></span></div>
      </div>
    </div>
  `,
  styles: [
    '#hhwMultiLang { cursor: pointer;position: fixed;width: 42px;left: calc(50% - 21px); }'
  ]
})
export class SelectLanguageComponent {
  opened = false

  constructor(public translate: TranslateService) { }

  openDropdown() {
    this.opened = !this.opened
  }

  changeLang(lang) {
    this.openDropdown()
    window.localStorage.setItem('hhw-lang', lang)
    this.translate.use(lang)
  }
}
