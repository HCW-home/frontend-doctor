import { Component } from '@angular/core';
import { LocationStrategy } from '@angular/common';
import { ConfigService } from '../core/config.service';

@Component({
  selector: 'app-cgu',
  templateUrl: './cgu.component.html',
  styleUrls: ['./cgu.component.scss'],
})
export class CguComponent {
  error = false;
  selectedCountry = 'Any';
  selectedTermName = 'terms.md';
  countries = [];

  constructor(
    private locationStrategy: LocationStrategy,
    public configService: ConfigService
  ) {}

  ngOnInit() {
    this.getCountries();
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
    this.locationStrategy.historyGo(-1);
  }

  changeCountry(country: string) {
    this.selectedCountry = country;
    if (country === 'Any') {
      this.selectedTermName = 'terms.md';
    } else {
      this.selectedTermName = `terms.${country}.md`;
    }
  }
}
