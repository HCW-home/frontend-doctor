import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {

  email: string;
  linkSent = false;
  loading = false;
  error = "";
  success = false;

  emailFormControl = new FormControl('', [
    Validators.required,
    Validators.email,
  ]);
    
  constructor(private authService: AuthService) { }

  ngOnInit() {
  }

  forgotPassword() {
      if (this.emailFormControl.valid) {
          this.loading = true;
          this.authService.getResetPasswordLink(this.emailFormControl.value).toPromise().then(result => {
              this.error = null;
              this.success = true;
          }).catch(err => {
              console.log(err);
              this.error = "Impossible de récupérer le lien";
          }).finally(() => {
              this.loading = false;
          })
      }
  }
}
