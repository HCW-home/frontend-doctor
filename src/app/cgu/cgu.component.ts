import { Component, Inject, Optional } from '@angular/core';
import { LocationStrategy } from '@angular/common';
import { ConfigService } from '../core/config.service';
import { User } from '../user';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-cgu',
  templateUrl: './cgu.component.html',
  styleUrls: ['./cgu.component.scss'],
})
export class CguComponent {
  currentUser: User;
  error = false;
  countryError = false;
  selectedCountry = 'Any';
  countries = [];
  currentLang: string = 'en';
  selectedTermName = 'terms.en.md';

  constructor(
    public configService: ConfigService,
    private translate: TranslateService,
    private locationStrategy: LocationStrategy,
    @Optional() public dialogRef: MatDialogRef<CguComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.currentLang = this.translate.currentLang;
  }

  ngOnInit() {
    this.getCountries();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onLanguageChange(language: string): void {
    this.currentLang = language;
    this.changeCountry(this.selectedCountry);
  }

  getCountries() {
    this.configService.getCountries().subscribe(
      res => {
        if (res) {
          res.unshift('Any');
          this.changeCountry('Any');
          this.countries = res;
          this.countryError = false;
        }
      },
      error => {
        this.countryError = true;
        this.selectedCountry = '';
        this.changeCountry('');
      }
    );
  }

  goBack() {
    if (this.data?.showCloseButton) {
      this.onClose();
    } else {
      this.locationStrategy.historyGo(-1);
    }
  }

  changeCountry(country: string) {
    this.selectedCountry = country;
    const fallbackTerms =  !country || country === 'Any' ? `terms.md` : `terms.${country}.md`;

    const specificTerms =  !country || country === 'Any' ? `terms.${this.currentLang}.md` :  `terms.${country}.${this.currentLang}.md`;

    this.error = false;
    this.configService.checkTermsFileExists(specificTerms).subscribe(
      exists => {
        if (exists) {
          this.selectedTermName = specificTerms;
          this.error = false;
        } else {
          this.configService.checkTermsFileExists(fallbackTerms).subscribe(
            fallbackExists => {
              if (fallbackExists) {
                this.selectedTermName = fallbackTerms;
                this.error = false;
              } else {
                this.error = true;
              }
            },
            error => {
              this.error = true;
            }
          );
        }
      },
      error => {
        this.error = true;
      }
    );
  }
}
