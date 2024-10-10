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
  selectedCountry = 'Any';
  selectedTermName = 'terms.en.md';
  countries = [];
  currentLang: string = 'en';

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
        console.log(res, 'res');
        if (res) {
          res.unshift('Any');
          this.changeCountry('Any');
          this.countries = res;
          this.error = false;
        }
      },
      error => {
        console.log(error, 'error');
        this.error = true;
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
    const fallbackTerms = `terms.md`;

    const specificTerms =  country === 'Any' ? `terms.${this.currentLang}.md` :  `terms.${country}.${this.currentLang}.md`;

    this.error = false;
    this.configService.checkTermsFileExists(specificTerms).subscribe(
      exists => {
        if (exists) {
          console.log(exists, 'exists');
          this.selectedTermName = specificTerms;
          this.error = false;
        } else {
          this.configService.checkTermsFileExists(fallbackTerms).subscribe(
            fallbackExists => {
              if (fallbackExists) {
                console.log(fallbackExists, 'fallbackExists');
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
