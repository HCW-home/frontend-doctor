import { Component, OnInit, OnDestroy } from "@angular/core";
import {
  UntypedFormControl,
  FormGroupDirective,
  NgForm,
  Validators,
} from "@angular/forms";
import { ErrorStateMatcher } from "@angular/material/core";
import { Router, ActivatedRoute } from "@angular/router";
import { first } from "rxjs/operators";
import { Subscription } from "rxjs";


import { TranslateService } from "@ngx-translate/core";


import { environment } from "../../environments/environment";
import { AuthService } from "../auth/auth.service";
import {ConfigService} from "../core/config.service";
/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: UntypedFormControl | null,
    form: FormGroupDirective | NgForm | null,
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
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit, OnDestroy {
  emailFormControl = new UntypedFormControl("", [
    Validators.required,
    Validators.email,
  ]);
  passwordFormControl = new UntypedFormControl("", [Validators.required]);
  codeFormControl = new UntypedFormControl("", [Validators.required]);
  matcher = new MyErrorStateMatcher();

  subscriptions: Subscription[] = [];
  loading = false;
  submitted = false;
  returnUrl: string;
  error = "";
  email: string;
  password: string;
  samlLoginUrl = `${environment.api}/login-saml`;
  openIdLoginUrl = `${environment.api}/login-openid?role=doctor`;
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
  ) { }

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams.returnUrl || "/dashboard";
    console.log("login component ", this.returnUrl);
    // If the user is already logged in, redirect him
    if (this.authService.currentUserValue) {
      this.router.navigateByUrl(this.returnUrl);
    }

    this.subscriptions.push(this.authService.getCurrentUser().subscribe(user => {

      if (user) {
        this.router.navigate([this.returnUrl]);
      } else {
        this.init();
      }
    }, () => {
      this.init();
    }));


  }

  init() {
    console.log("inti login TOKEN ", this.route.snapshot.queryParams);
    const token = this.route.snapshot.queryParams.token || this.route.snapshot.queryParams.tk;
    // If we have a token in the URL, the user has been redirected after the SAML login
    if (
      token
    ) {
      console.log("token ", this.route.snapshot.queryParams.token);

      console.log("return url ", this.route.snapshot.queryParams.returnUrl);
      this.returnUrl = this.route.snapshot.queryParams.returnUrl || "/dashboard";

      this.subscriptions.push(
        this.authService
          .login(token)
          .pipe(first())
          .subscribe(
            (data) => {
              this.router.navigate([this.returnUrl]);
              setTimeout(() => {
                this.loading = false;
              }, 1000);
            },
            (error) => {
              this.error = error;
              this.loading = false;
            },
          ),
      );
    }


    console.log(this.configService.config, 'this.configService.config');
    if (!("method" in this.configService.config)) {
      this.showPasswordLogin = true;
      this.showSamlLogin = true;
    }

    if (this.configService.config.method === "saml") {
      this.showSamlLogin = true;
      if (!token) {
        (window as any).location.href = this.samlLoginUrl;
      }
    } else if (this.configService.config.method === "password") {
      this.showPasswordLogin = true;
    } else if (this.configService.config.method === "openid") {
      this.showOpenIdLogin = true;
      if (!token) {
        (window as any).location.href = this.openIdLoginUrl;
      }
    } else if (this.configService.config.method === "both") {
      this.showPasswordLogin = true;
      this.showSamlLogin = true;
    }



  }

  // When the user submits the local form
  loginLocal() {
    this.error = "";
    console.log("submit", this.email, this.password);
    this.loading = true;
    this.subscriptions.push(
      this.authService.loginLocal(this.email, this.password).subscribe(
        (res) => {
          this.localLoginToken = res.localLoginToken;
          this.user = res.user;
          this.loading = false;
          this.router.navigate([this.returnUrl]);
        },
        (err) => {
          this.loading = false;
          this.error = err;
        },
      ),
    );
  }

  loginSms() {
    this.error = "";
    this.loading = true;
    this.subscriptions.push(
      this.authService.loginSms(this.smsVerificationCode, this.user).subscribe(
        (res) => {
          this.smsLoginToken = res.smsLoginToken;
          this.login2FA();
        },
        (err) => {
          console.log(err);
          if (err == "MAX_ATTEMPTS") {
            this.localLoginToken = "";
            err == this.translate.instant("login.youReachedTheMaximumAttemptAmount");
          }
          this.loading = false;
          this.error = err;
        },
      ),
    );
  }
  login2FA() {
    this.error = "";
    this.subscriptions.push(
      this.authService
        .login2FA(this.localLoginToken, this.smsLoginToken, this.user)
        .subscribe(
          (res) => {
            this.loading = false;
            this.router.navigate([this.returnUrl]);
          },
          (err) => {
            this.loading = false;
            this.error = err;
          },
        ),
    );
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
