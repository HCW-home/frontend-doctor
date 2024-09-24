import {Component, Inject} from "@angular/core";
import { LocationStrategy } from '@angular/common';
import { ConfigService } from '../core/config.service';
import { AuthService } from '../auth/auth.service';
import {User} from "../user";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-cgu',
  templateUrl: './cgu.component.html',
  styleUrls: ['./cgu.component.scss'],
})
export class CguComponent {
  currentUser: User;
  error = false;
  selectedCountry = 'Any';
  selectedTermName = 'terms.md';
  countries = [];

  constructor(
    public configService: ConfigService,
    private locationStrategy: LocationStrategy,
    public dialogRef: MatDialogRef<CguComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}




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
      this.selectedTermName = 'terms.md';
    } else {
      this.selectedTermName = `terms.${country}.md`;
    }
  }
}
