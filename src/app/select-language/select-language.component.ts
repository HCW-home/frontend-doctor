import { Component } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import {languages} from "../contstants/global";

@Component({
  selector: "app-select-language",
  template: `
    <div class="language-selector">
      <mat-icon [ngStyle]="{'color':'white'}">language</mat-icon>
      <mat-form-field style="width: 100px">
        <select matNativeControl [(ngModel)]="selectedLanguage" (change)="onLanguageSelect($event.target.value)">
          <option *ngFor="let lang of languages" [value]="lang.value">{{lang.viewValue}}</option>
        </select>
      </mat-form-field>

    </div>
  `,
  styles: [`
    select {
      color: #FFFFFF;
    }
  .language-selector {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .language-selector mat-icon {
    margin-right: 8px;
  }
  .language-selector span {
    margin-right: 8px;
  }`]
})
export class SelectLanguageComponent {
  opened = false
  languages = languages;
  selectedLanguage;

  constructor(public translate: TranslateService) {
    this.selectedLanguage = localStorage.getItem("hhw-lang") || this.languages[0].value;
  }

  openDropdown() {
    this.opened = !this.opened
  }

  onLanguageSelect(lang) {
    this.openDropdown()
    window.localStorage.setItem("hhw-lang", lang)
    this.translate.use(lang)
  }
}
