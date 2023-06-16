import { Component, OnInit } from '@angular/core';
import { FormControl, Validators, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';

import { MustMatch } from './_helpers/must-match.validator';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '../core/config.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {

  token = "";
  resetPasswordForm: UntypedFormGroup;

  linkSent = false;
  loading = false;
  error = "";
  success = false;

  // passwordControl = new FormControl('', [
  //   Validators.required,
  //   Validators.pattern(new RegExp("^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})")),
  // ]);

  constructor(private formBuilder: UntypedFormBuilder, private authService: AuthService,
    public configService: ConfigService) { }

  ngOnInit() {
    this.token = this.GetParam("token");

    this.resetPasswordForm = this.formBuilder.group({
      token: [this.token],
      password: ['', [Validators.required, Validators.pattern(new RegExp("^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})"))]],
      confirmPassword: ['', Validators.required],
    }, {
      validator: MustMatch('password', 'confirmPassword')
    });
  }

  resetPassword() {
    if (this.resetPasswordForm.valid) {
      this.loading = true;
      this.authService.resetPassword(
        this.resetPasswordForm.get("token").value,
        this.resetPasswordForm.get("password").value
      ).toPromise().then(result => {
        this.error = '';
        this.success = true;
      }).catch(err => {
        console.log("GOT ERROR", err);
        switch (err) {
          case 'token-expired':
            this.error = err;
            break;
          default:
            this.error = "unknown";
            break;
        }
      }).finally(() => {
        console.log("complete");
        this.loading = false;
      })
    }
  }

  GetParam(name) {
    const results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (!results) {
      return '';
    }
    return results[1] || '';
  }
}
