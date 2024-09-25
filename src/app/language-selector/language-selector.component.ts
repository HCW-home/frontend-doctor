import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-language-selector',
  template: `
    <div class="language-selector">
      <mat-icon>language</mat-icon>
      <mat-form-field>
        <mat-select
          [(value)]="selectedLanguage"
          (selectionChange)="onLanguageSelect($event)">
          <mat-option *ngFor="let lang of languages" [value]="lang.value">
            {{ lang.viewValue }}
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
        
                :is(mat-form-field) {
                  width: 100px;
                }
              }
            `,
  ],
})
export class LanguageSelectorComponent {
  opened = false;
  languages = [
    { value: 'en', viewValue: 'English' },
    { value: 'fr', viewValue: 'Français' },
  ];
  selectedLanguage = 'fr';

  constructor(public translate: TranslateService) {
    this.selectedLanguage =
      localStorage.getItem('hhw-lang') || this.languages[0].value;
  }

  openDropdown() {
    this.opened = !this.opened;
  }

  onLanguageSelect(lang) {
    this.openDropdown();
    window.localStorage.setItem('hhw-lang', lang.value);
    this.translate.use(lang.value);
  }
}
