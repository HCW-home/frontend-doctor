import { Component, Inject, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { MyErrorStateMatcher } from '../profile-update/profile-update.component';
import { ConsultationService } from '../core/consultation.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  phoneNumberRegex,
  phoneOrEmailValidator,
} from '../shared/validators/phone-number-validator';
import { InviteService } from '../core/invite.service';
import { TwilioWhatsappConfig } from '../../utils/twillo-whatsapp-config';

export interface DialogData {
  expertLink: string;
  id: string;
  consultation: any;
}

@Component({
  selector: 'app-invite-expert',
  templateUrl: './invite-expert.component.html',
  styleUrls: ['./invite-expert.component.scss'],
})
export class InviteExpertComponent implements OnInit {
  matcher = new MyErrorStateMatcher();
  loading = false;
  error = '';
  myForm: UntypedFormGroup;
  showRadioGroup = false;
  showSuccessMessage = '';

  constructor(
    private _snackBar: MatSnackBar,
    private inviteService: InviteService,
    private formBuilder: UntypedFormBuilder,
    private consultationService: ConsultationService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialogRef: MatDialogRef<InviteExpertComponent>
  ) {}

  createFormGroup() {
    this.myForm = this.formBuilder.group({
      email: new UntypedFormControl('', [
        phoneOrEmailValidator(),
        Validators.required,
      ]),
      messageService: new UntypedFormControl(),
      link: new UntypedFormControl(this.data.expertLink),
    });

    this.myForm.get('email').valueChanges.subscribe(value => {
      const control = this.myForm.get('email');
      const messageServiceControl = this.myForm.get('messageService');
      if (phoneNumberRegex.test(value)) {
        if (control.valid) {
          setTimeout(() => {
            const { value } = this.myForm.get('email');
            this.inviteService.checkPrefix(value, '', TwilioWhatsappConfig.pleaseUseThisLink).subscribe({
              next: res => {
                switch (res.status) {
                  case 0:
                    control.setErrors({ cantSend: true });
                    break;
                  case 1:
                    this.resetValidators(true);
                    this.showRadioGroup = true;
                    break;
                  case 2:
                    this.showSuccessMessage = res.message;
                    messageServiceControl.setValidators([]);
                    messageServiceControl.setValue('1');
                    messageServiceControl.updateValueAndValidity();
                    break;
                  case 3:
                    this.showSuccessMessage = res.message;
                    messageServiceControl.setValidators([]);
                    messageServiceControl.setValue('2');
                    messageServiceControl.updateValueAndValidity();
                    break;
                }
              },
            });
          }, 100);
        }
        this.resetValidators(false);
        this.showRadioGroup = false;
        this.showSuccessMessage = '';
      }
    });
  }

  ngOnInit() {
    this.createFormGroup();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  copy() {
    this._snackBar.open('Copied to clipboard', 'X', {
      verticalPosition: 'top',
      horizontalPosition: 'right',
      duration: 2500,
    });
  }

  resetValidators(set: boolean) {
    if (set) {
      const control = this.myForm.get('messageService');
      control.setValidators([Validators.required]);
      control.updateValueAndValidity();
    } else {
      const control = this.myForm.get('messageService');
      control.setValidators([]);
      control.setValue('');
      control.updateValueAndValidity();
    }
  }

  onSubmit() {
    if (this.myForm.valid) {
      this.loading = true;
      const body = {
        expertLink: this.data.expertLink,
        to: this.myForm.get('email').value,
        messageService: this.myForm.get('messageService').value,
        consultationId: this.data.id,
      };
      this.consultationService.sendExpertLink(body).subscribe({
        next: res => {
          this._snackBar.open('Link Sent to Email', 'X', {
            verticalPosition: 'top',
            horizontalPosition: 'right',
            duration: 2500,
          });
          this.onNoClick();
          this.loading = false;
        },
        error: err => {
          this.error =
            err.details ||
            err.error?.message ||
            err.statusText ||
            err.message ||
            err;
          this.loading = false;
        },
      });
    } else {
      this.validateAllFormFields(this.myForm);
    }
  }

  validateAllFormFields(formGroup: UntypedFormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof UntypedFormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof UntypedFormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }
}
