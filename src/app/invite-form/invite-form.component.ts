import { TranslateService } from '@ngx-translate/core';
import { TranslationOrganizationService } from '../core/translation-organization.service';
import { QueueService } from '../core/queue.service';
import { of, Subscription } from 'rxjs';
import { InviteService } from '../core/invite.service';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  NgForm,
  FormArray,
  FormGroup,
  Validators,
  FormBuilder,
  AbstractControl,
  FormGroupDirective,
  UntypedFormBuilder,
  UntypedFormGroup,
  UntypedFormControl,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { ConfigService } from '../core/config.service';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import {
  phoneNumberRegex,
  phoneOrEmailValidator,
} from '../shared/validators/phone-number-validator';
import { catchError, filter, switchMap } from 'rxjs/operators';

interface DialogData {
  phoneNumber: string;
  messageService: string;
  emailAddress: string;
  firstName: string;
  lastName: string;
  gender: string;
  queue: string;
  scheduledFor: string;
  language: string;
  guestContact: string;
  patientContact: string;
  guestEmailAddress: string;
  guestPhoneNumber: string;
  guestMessageService: string;
  translationOrganization: string;
  doctorLanguage: string;
  isPatientInvite: boolean;
  edit: boolean;
  id?: string;
  status: string;
  inviteObj: any;
  experts: string[];
}

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
  selector: 'app-invite-form',
  templateUrl: './invite-form.component.html',
  styleUrls: ['./invite-form.component.scss'],
})
export class InviteFormComponent implements OnDestroy, OnInit {
  isPatientInvite = true;
  matcher = new MyErrorStateMatcher();
  loading = false;
  createInviteSub: Subscription;
  error = '';
  myForm;
  queues;
  getQueuesSub;
  schedule = false;
  inviteTranslator = false;
  inviteGuest = false;
  now = new Date();
  languages;
  translationOrganizations;
  subscriptions: Subscription[] = [];
  isSubmitted = false;
  edit = false;
  showRadioGroup = false;
  showSuccessMessage = '';
  showGuestRadioGroup = false;
  showGuestSuccessMessage = '';

  constructor(
    private fb: FormBuilder,
    public dialog: MatDialog,
    private queueServ: QueueService,
    public translate: TranslateService,
    public configService: ConfigService,
    private inviteService: InviteService,
    private formBuilder: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialogRef: MatDialogRef<InviteFormComponent>,
    private translationOrganizationService: TranslationOrganizationService
  ) {
    this.edit = data.edit;
    if (!this.data.emailAddress) {
      this.data.emailAddress = '';
    }
    if (!this.data.phoneNumber) {
      this.data.phoneNumber = '';
    }
    if (this.data.scheduledFor) {
      this.data.scheduledFor = new Date(this.data.scheduledFor).toISOString();
      this.schedule = true;
    } else {
      this.data.scheduledFor = '';
    }

    this.data.language = this.data.language || 'fr';

    if (this.data.guestContact) {
      this.inviteGuest = true;
    }

    if (this.data.translationOrganization) {
      this.inviteTranslator = true;
    }
  }

  get expertsFormArray() {
    return this.myForm.get('experts') as FormArray;
  }

  addExpert() {
    this.expertsFormArray.push(
      this.fb.group({
        expertContact: [
          '',
          [
            phoneOrEmailValidator(),
            this.expertContactValidatorValidator.bind(this),
          ],
        ],
        messageService: [''],
        showRadioGroup: [false],
        showSuccessMessage: [''],
      })
    );
    this.handleValueChanges();
  }

  removeExpert(index: number) {
    this.expertsFormArray.removeAt(index);
  }

  createFormGroup() {
    const queueFormControl = new UntypedFormControl(undefined);

    this.myForm = this.formBuilder.group(
      {
        patientContactFormControl: new UntypedFormControl(
          '',
          this.isPatientInvite
            ? [Validators.required, phoneOrEmailValidator()]
            : []
        ),
        messageService: new UntypedFormControl(),
        guestContactFormControl: new UntypedFormControl('', [
          phoneOrEmailValidator(),
          this.guestContactValidatorValidator.bind(this),
        ]),
        guestContactMessageService: new UntypedFormControl(),
        emailFormControl: new UntypedFormControl(
          '',
          this.isPatientInvite ? [Validators.email] : []
        ),
        phoneNumberFormControl: new UntypedFormControl(
          '',
          this.isPatientInvite ? [Validators.pattern(phoneNumberRegex)] : []
        ),
        firstNameFormControl: new UntypedFormControl(
          '',
          this.isPatientInvite ? [Validators.required] : []
        ),
        lastNameFormControl: new UntypedFormControl(
          '',
          this.isPatientInvite ? [Validators.required] : []
        ),
        genderFormControl: new UntypedFormControl(
          '',
          this.isPatientInvite ? [Validators.required] : []
        ),
        languageFormControl: new UntypedFormControl(
          'fr',
          this.isPatientInvite ? [Validators.required] : []
        ),
        dateTimeFormControl: new UntypedFormControl(''),
        isScheduled: new UntypedFormControl(false),
        inviteTranslatorFormControl: new UntypedFormControl(false),
        inviteGuestFormControl: new UntypedFormControl(false),
        inviteExpert: new UntypedFormControl(false),
        experts: this.fb.array([
          this.fb.group({
            expertContact: [
              '',
              [
                phoneOrEmailValidator(),
                this.expertContactValidatorValidator.bind(this),
              ],
            ],
            messageService: [''],
            showRadioGroup: [false],
            showSuccessMessage: [false],
          }),
        ]),
        translationOrganizationFormControl: new UntypedFormControl(null, [
          this.translationOrganizationValidator.bind(this),
        ]),
        queueFormControl,
        // metadataFormControl: new FormControl(''),

        // our custom validator
      },
      {
        validators: this.atLeastAGuestOrTranslator.bind(this),
      }
    );
    (window as any).myForm = this.myForm;

    this.myForm.get('inviteExpert').valueChanges.subscribe(value => {
      (this.myForm.get('experts') as FormArray).controls.forEach(control => {
        control.get('expertContact').updateValueAndValidity();
      });
    });

    this.myForm
      .get('patientContactFormControl')
      .valueChanges.subscribe(value => {
        const control = this.myForm.get('patientContactFormControl');
        const messageServiceControl = this.myForm.get('messageService');
        if (phoneNumberRegex.test(value)) {
          if (control.valid) {
            setTimeout(() => {
              const { value } = this.myForm.get('patientContactFormControl');
              this.inviteService.checkPrefix(value).subscribe({
                next: res => {
                  switch (res.status) {
                    case 0:
                      control.setErrors({ cantSend: true });
                      break;
                    case 1:
                      this.showSuccessMessage = res.message;
                      this.resetValidators(true, 'messageService');
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
          this.resetValidators(false, 'messageService');
          this.showRadioGroup = false;
          this.showSuccessMessage = '';
        }
      });

    this.myForm.get('guestContactFormControl').valueChanges.subscribe(value => {
      const control = this.myForm.get('guestContactFormControl');
      const messageServiceControl = this.myForm.get(
        'guestContactMessageService'
      );
      if (phoneNumberRegex.test(value)) {
        if (control.valid) {
          setTimeout(() => {
            const { value } = this.myForm.get('guestContactFormControl');
            this.inviteService.checkPrefix(value).subscribe({
              next: res => {
                switch (res.status) {
                  case 0:
                    control.setErrors({ cantSend: true });
                    break;
                  case 1:
                    this.showGuestSuccessMessage = res.message;
                    this.resetValidators(true, 'guestContactMessageService');
                    this.showGuestRadioGroup = true;
                    break;
                  case 2:
                    this.showGuestSuccessMessage = res.message;
                    messageServiceControl.setValidators([]);
                    messageServiceControl.setValue('1');
                    messageServiceControl.updateValueAndValidity();
                    break;
                  case 3:
                    this.showGuestSuccessMessage = res.message;
                    messageServiceControl.setValidators([]);
                    messageServiceControl.setValue('2');
                    messageServiceControl.updateValueAndValidity();
                    break;
                }
              },
            });
          }, 100);
        }
        this.resetValidators(false, 'guestContactMessageService');
        this.showGuestRadioGroup = false;
        this.showGuestSuccessMessage = '';
      }
    });

    this.handleValueChanges();
  }

  handleValueChanges(): void {
    this.expertsFormArray.controls.forEach((group: FormGroup, index) => {
      const expertControl = group.get('expertContact');
      const showRadio = group.get('showRadioGroup');
      const showSuccessMessage = group.get('showSuccessMessage');
      const messageService = group.get('messageService');

      expertControl.valueChanges
        .pipe(
          filter(value => {
            showRadio.setValue(false);
            showSuccessMessage.setValue('');
            messageService.setValue('');
            messageService.setValidators([]);
            messageService.updateValueAndValidity();
            return phoneNumberRegex.test(value) && expertControl.valid;
          }),
          switchMap(value =>
            this.inviteService.checkPrefix(value).pipe(
              catchError(err => {
                console.error(err);
                return of(null);
              })
            )
          )
        )
        .subscribe(res => {
          if (res) {
            switch (res.status) {
              case 0:
                expertControl.setErrors({ cantSend: true });
                break;
              case 1:
                showSuccessMessage.setValue(res.message);
                showRadio.setValue(true, { emitEvent: false });
                messageService.setValidators([Validators.required]);
                messageService.updateValueAndValidity();
                break;
              case 2:
                showSuccessMessage.setValue(res.message);
                messageService.setValidators([]);
                messageService.setValue('1');
                messageService.updateValueAndValidity();
                break;
              case 3:
                showSuccessMessage.setValue(res.message);
                messageService.setValidators([]);
                messageService.setValue('2');
                messageService.updateValueAndValidity();
                break;
            }
          }
        });
    });
  }

  translationOrganizationValidator(control: AbstractControl) {
    if (this.inviteTranslator && !control.value) {
      return { required: { value: control.value } };
    }
    return null;
  }

  guestContactValidatorValidator(control: AbstractControl) {
    if (this.inviteGuest && !control.value) {
      return { required: { value: control.value } };
    }
    return null;
  }

  expertContactValidatorValidator(control: AbstractControl) {
    if (!this.myForm?.get('inviteExpert')?.value) {
      return null;
    }

    if (!control.value) {
      return { required: true };
    }

    return null;
  }

  resetValidators(set: boolean, formControl: string) {
    if (set) {
      const control = this.myForm.get(formControl);
      control.setValidators([Validators.required]);
      control.updateValueAndValidity();
    } else {
      const control = this.myForm.get(formControl);
      control.setValidators([]);
      control.setValue('');
      control.updateValueAndValidity();
    }
  }

  changeTel() {
    if (this.data.phoneNumber.trim().length > 0) {
      this.myForm.controls.emailFormControl.disable();
      this.data.emailAddress = '';
    } else {
      this.myForm.controls.emailFormControl.enable();
    }
  }

  ngOnInit() {
    this.dialogRef.updateSize('50%', '50%');
    this.data.doctorLanguage = window.localStorage.getItem('hhw-lang');

    if (this.data.patientContact || this.data.firstName) {
      this.showPatientForm();
    }
    this.loading = true;
    this.subscriptions.push(
      this.translationOrganizationService
        .getTranslationOrganizations()
        .subscribe(translationOrganizations => {
          this.translationOrganizations = translationOrganizations;
          this.loading = false;
        })
    );

    this.translationOrganizationService.getLanguages().subscribe({
      next: res => {
        if (res?.length) {
          this.languages = res.map(l => {
            return {
              code: l,
              translated: this.translate.instant('inviteForm.' + l),
            };
          });
        }
      },
      error: err => {
        console.log(err, 'err');
      },
    });
  }

  showTierFrom() {
    this.isPatientInvite = false;
    this.dialogRef.updateSize('70%', '83%');

    this.queues = [];
    this.inviteGuest = true;

    this.createFormGroup();
  }

  showPatientForm() {
    this.isPatientInvite = true;

    this.loading = true;
    this.getQueuesSub = this.queueServ.getQueues().subscribe(queues => {
      this.loading = false;
      this.queues = queues;

      this.createFormGroup();
      this.dialogRef.updateSize('70%', '83%');
    });
  }

  atLeastAGuestOrTranslator(group: UntypedFormGroup): { [s: string]: boolean } {
    if (!this.isPatientInvite) {
      if (group) {
        if (
          group.controls.guestContactFormControl.value ||
          group.controls.translationOrganizationFormControl.value
        ) {
          return null;
        }
      }
      if (
        this.isSubmitted ||
        group.controls.guestContactFormControl.touched ||
        group.controls.translationOrganizationFormControl.touched
      ) {
        return { atLeastAGuestOrTranslator: true };
      }
    }
    return null;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSubmit() {
    // ! Put on the metadata an object with all the item we set and we get from the form
    // if(this.configService.config.metadata.length != ""){
    //   this.data.metadata = this.configService.config.metadata.reduce((result,item,index) => {
    //     result[item] = this.data[item]
    //     return result;
    //   },{});
    // }

    if (this.loading) {
      return;
    }
    this.loading = true;
    this.isSubmitted = true;

    const { value } = this.myForm;
    const isPatientContactAnPhoneNumber = phoneNumberRegex.test(
      this.data.patientContact
    );
    if (isPatientContactAnPhoneNumber) {
      this.data.phoneNumber = this.data.patientContact;
      this.data.messageService = value.messageService;
    } else {
      this.data.emailAddress = this.data.patientContact;
    }

    if (this.inviteGuest && this.data.guestContact) {
      const isGuestContactAPhoneNumber = phoneNumberRegex.test(
        this.data.guestContact
      );
      if (isGuestContactAPhoneNumber) {
        this.data.guestPhoneNumber = this.data.guestContact;
        this.data.guestMessageService = value.guestContactMessageService;
      } else {
        this.data.guestEmailAddress = this.data.guestContact;
      }
    }
    if (!this.inviteTranslator) {
      this.data.translationOrganization = undefined;
    }

    if (this.myForm.get('inviteExpert').value) {
      this.data.experts = this.myForm.get('experts').value.filter(expert => {
        const value = expert.expertContact;
        return (
          value !== null &&
          value !== '' &&
          value !== undefined &&
          value?.trim() !== ''
        );
      });
    }

    if (!this.myForm.valid || this.atLeastAGuestOrTranslator(this.myForm)) {
      // this to show error messages
      this.validateAllFormFields(this.myForm);

      if (!this.myForm.valid || this.atLeastAGuestOrTranslator(this.myForm)) {
        this.loading = false;
        return;
      }
    }

    this.data.isPatientInvite = this.isPatientInvite;
    if (this.edit) {
      let cancelScheduledFor = false;
      let cancelGuestInvite = false;
      let cancelTranslationRequestInvite = false;

      if (this.data.inviteObj.scheduledFor && !this.schedule) {
        cancelScheduledFor = true;
      }
      if (this.data.inviteObj.guestInvite && !this.inviteGuest) {
        cancelGuestInvite = true;
      }

      if (
        this.data.inviteObj.translationOrganization &&
        !this.inviteTranslator
      ) {
        cancelTranslationRequestInvite = true;
      }

      const {
        firstName,
        lastName,
        emailAddress,
        phoneNumber,
        scheduledFor,
        queue,
        translationOrganization,
        gender,
        language,
        guestEmailAddress,
        guestPhoneNumber,
      } = this.data;

      this.inviteService
        .updateInvite(
          {
            firstName,
            lastName,
            emailAddress,
            phoneNumber,
            scheduledFor,
            queue,
            translationOrganization,
            gender,
            language,
            guestEmailAddress,
            guestPhoneNumber,
            cancelGuestInvite,
            cancelScheduledFor,
            cancelTranslationRequestInvite,
            // metadata,
          },
          this.data.id
        )
        .subscribe(
          res => {
            this.dialogRef.close();
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
        );
    } else {
      this.createInviteSub = this.inviteService
        .createInvitation(this.data)
        .subscribe(
          res => {
            this.dialogRef.close(true);
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
        );
    }
  }

  ngOnDestroy() {
    if (this.createInviteSub) {
      this.createInviteSub.unsubscribe();
    }
    if (this.getQueuesSub) {
      this.getQueuesSub.unsubscribe();
    }
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
  }

  validateAllFormFields(formGroup: UntypedFormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof UntypedFormControl) {
        control.markAsTouched({ onlySelf: true });
        control.updateValueAndValidity();
      } else if (control instanceof UntypedFormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }

  languageSelectChanged() {
    this.data.translationOrganization = null;
  }

  onDateTimeSelected(dateTime: any) {
    this.myForm.get('dateTimeFormControl').setValue(dateTime);
    this.data.scheduledFor = dateTime;
  }
}
