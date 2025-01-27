import {Component, EventEmitter, Input, Output} from "@angular/core";
import { TranslateService } from '@ngx-translate/core';
import {supportedLanguages} from "../i18n/i18n.module";

@Component({
  selector: 'app-language-selector',
  template: `
    <div class="language-selector">
      @if (!hideIcon) {
        <mat-icon>language</mat-icon>
      }
      <mat-form-field>
        <mat-label>{{'profile.selectLanguage' | translate}}</mat-label>
        <mat-select
          [(value)]="selectedLanguage"
          (selectionChange)="onLanguageSelect($event)">
          <mat-option *ngFor="let lang of supportedLanguages" [value]="lang">
            {{ 'selectLanguage.' + lang | translate }}
          </mat-option>
        </mat-select>
      </mat-form-field>
    </div>
  `,
  styles: [
    `
                      .language-selector {
                        gap: 6px;
                        display: flex;
                        align-items: center;
                      }
                    `,
  ],
})
export class LanguageSelectorComponent {

  @Output() selectedLanguageChange = new EventEmitter();
  @Input() hideIcon:boolean = false;
  opened = false;
  selectedLanguage = 'fr';

  constructor(public translate: TranslateService) {
    this.selectedLanguage =
      localStorage.getItem('hhw-lang') || supportedLanguages[0];
  }

  openDropdown() {
    this.opened = !this.opened;
  }

  onLanguageSelect(lang) {
    this.openDropdown();
    window.localStorage.setItem('hhw-lang', lang.value);
    this.translate.use(lang.value);
    this.selectedLanguageChange.emit(lang.value)
  }

  protected readonly supportedLanguages = supportedLanguages;
}
