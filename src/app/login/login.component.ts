import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  NgForm,
  Validators,
  UntypedFormControl,
  FormGroupDirective,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Router, ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '../core/config.service';


export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: UntypedFormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched || isSubmitted)
    );
  }
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  emailFormControl = new UntypedFormControl('', [
    Validators.required,
    Validators.email,
  ]);
  passwordFormControl = new UntypedFormControl('', [Validators.required]);
  codeFormControl = new UntypedFormControl('', [Validators.required]);
  matcher = new MyErrorStateMatcher();

  subscriptions: Subscription[] = [];
  loading = false;
  returnUrl: string;
  error = '';
  email: string;
  password: string;
  samlLoginUrl = `${environment.api}/login-saml`;
  openIdLoginUrl: string;
  localLoginToken;
  smsLoginToken;
  smsVerificationCode;
  user;

  showPasswordLogin = false;
  showSamlLogin = false;
  showOpenIdLogin = false;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    public configService: ConfigService
  ) {}

  ngOnInit() {
    let redirectUrl = this.route.snapshot.queryParams.redirectUrl;
    let returnUrl = this.route.snapshot.queryParams.returnUrl;

    if (redirectUrl) {
      redirectUrl = decodeURIComponent(redirectUrl);
    }
    if (returnUrl) {
      returnUrl = decodeURIComponent(returnUrl);
    }

    this.returnUrl = redirectUrl || returnUrl || '/dashboard';

    this.openIdLoginUrl = `${environment.api}/login-openid?role=doctor`;
    if (this.returnUrl && this.returnUrl !== '/dashboard') {
      this.openIdLoginUrl += `&redirectUrl=${encodeURIComponent(this.returnUrl)}`;
    }

    if (this.authService.currentUserValue) {
      const urlParts = this.returnUrl.split('?');
      const path = urlParts[0];
      const queryParams = {};

      if (urlParts[1]) {
        urlParts[1].split('&').forEach(param => {
          const [key, value] = param.split('=');
          if (key && value && key !== 'tk' && key !== 'token') {
            queryParams[key] = decodeURIComponent(value);
          }
        });
      }

      this.router.navigate([path], { queryParams });
    }

    this.subscriptions.push(
      this.authService.getCurrentUser().subscribe(
        user => {
          if (user) {
            this.router.navigate([this.returnUrl]);
          } else {
            this.init();
          }
        },
        () => {
          this.init();
        }
      )
    );
  }

  init() {
    const token =
      this.route.snapshot.queryParams.token ||
      this.route.snapshot.queryParams.tk;
    if (token) {
      const redirectUrl = this.route.snapshot.queryParams.redirectUrl;
      this.returnUrl = redirectUrl || this.route.snapshot.queryParams.returnUrl || '/dashboard';

      this.subscriptions.push(
        this.authService
          .login(token)
          .pipe(first())
          .subscribe(
            data => {
              const urlParts = this.returnUrl.split('?');
              const path = urlParts[0];
              const queryParams = {};

              if (urlParts[1]) {
                urlParts[1].split('&').forEach(param => {
                  const [key, value] = param.split('=');
                  if (key && value && key !== 'tk' && key !== 'token') {
                    queryParams[key] = decodeURIComponent(value);
                  }
                });
              }

              this.router.navigate([path], { queryParams });
              setTimeout(() => {
                this.loading = false;
              }, 1000);
            },
            error => {
              this.error = error;
              this.loading = false;
            }
          )
      );
    }

    if (this.configService.config) {
      if (!('method' in this.configService.config)) {
        this.showPasswordLogin = true;
        this.showSamlLogin = true;
      }

      if (this.configService.config.method === 'saml') {
        this.showSamlLogin = true;
        if (!token) {
          (window as any).location.href = this.samlLoginUrl;
        }
      } else if (this.configService.config.method === 'password') {
        this.showPasswordLogin = true;
      } else if (this.configService.config.method === 'openid') {
        this.showOpenIdLogin = true;
        if (!token) {
          (window as any).location.href = this.openIdLoginUrl;
        }
      } else if (this.configService.config.method === 'both') {
        this.showPasswordLogin = true;
        this.showSamlLogin = true;
      }
    }
  }

  // When the user submits the local form
  loginLocal() {
    this.error = '';
    this.loading = true;
    this.subscriptions.push(
      this.authService.loginLocal(this.email, this.password).subscribe(
        res => {
          this.localLoginToken = res.localLoginToken;
          this.user = res.user;
          this.loading = false;
          this.router.navigate([this.returnUrl]);
        },
        err => {
          this.loading = false;
          this.error =
            err.details ||
            err.error?.message ||
            err.statusText ||
            err.message ||
            err;
        }
      )
    );
  }

  loginSms() {
    this.error = '';
    this.loading = true;
    this.subscriptions.push(
      this.authService.loginSms(this.smsVerificationCode, this.user).subscribe(
        res => {
          this.smsLoginToken = res.smsLoginToken;
          this.login2FA();
        },
        err => {
          if (err == 'MAX_ATTEMPTS') {
            this.localLoginToken = '';
            this.error = this.translate.instant('login.youReachedTheMaximumAttemptAmount');
          }
          this.loading = false;
          this.error =
            err.details ||
            err.error?.message ||
            err.statusText ||
            err.message ||
            err;
        }
      )
    );
  }
  login2FA() {
    this.error = '';
    this.subscriptions.push(
      this.authService
        .login2FA(this.localLoginToken, this.smsLoginToken, this.user)
        .subscribe(
          res => {
            this.loading = false;
            this.router.navigate([this.returnUrl]);
          },
          err => {
            this.loading = false;
            this.error =
              err.details ||
              err.error?.message ||
              err.statusText ||
              err.message ||
              err;
          }
        )
    );
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription?.unsubscribe();
    });
  }
}
