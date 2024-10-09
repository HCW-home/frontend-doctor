import {Component, Inject, Optional} from "@angular/core";
import { LocationStrategy } from '@angular/common';
import { ConfigService } from '../core/config.service';
import {User} from "../user";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {TranslateService} from "@ngx-translate/core";

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

  getCountries() {
    this.configService.getCountries().subscribe(
      res => {
        if (res) {
          res.unshift('Any');
          this.countries = res;
          this.error = false;
        }
      },
      error => {
        this.error = true;
      }
    );
  }

  goBack() {
    if (this.data?.showCloseButton) {
      this.onClose()
    } else {
      this.locationStrategy.historyGo(-1);
    }
  }

  changeCountry(country: string) {
    this.selectedCountry = country;
    if (country === 'Any') {
      this.selectedTermName = `terms.${this.currentLang}.md`;
    } else {
      this.selectedTermName = `terms.${country}.${this.currentLang}.md`;
    }
  }
}
