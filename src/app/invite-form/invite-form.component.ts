import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './../language.service';
import { TranslationOrganizationService } from './../translation-organization.service';
import { QueueService } from './../queue.service';
import { first, map } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { InviteService } from './../invite.service';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  FormControl, FormGroupDirective, NgForm, Validators, ValidatorFn,
  FormBuilder, FormGroup, AbstractControl
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { ConfigService } from '../config.service';




interface DialogData {
  phoneNumber: string;
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
  translationOrganization: string;
  doctorLanguage: string;
  isPatientInvite: boolean;
  edit: boolean;
  id?: string;
  status: string;
  inviteObj: any;
  metadata: object ;  //! metadata
}

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

const phoneNumberRegex = new RegExp(/^(\+|00)[0-9 ]+$/)

const emailOrPhoneValidator = (control: AbstractControl): { [key: string]: any } | null => {
  const testEmail = Validators.email(control)
  const testPhone = Validators.pattern(phoneNumberRegex)(control)

  if (testEmail && testPhone) {
    return { emailOrPhoneControl: { value: control.value } }
  }
  return null
};
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
  translationOrganizations
  subscriptions: Subscription[] = [];
  isSubmitted = false;
  edit = false;
  constructor(
    public dialogRef: MatDialogRef<InviteFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData, private inviteService: InviteService, private formBuilder: FormBuilder,
    private queueServ: QueueService,
    private translationOrganizationService: TranslationOrganizationService,
    private languageService: LanguageService,
    public translate: TranslateService,
    public configService: ConfigService,
  ) {
    this.edit = data.edit;
    if (!this.data.emailAddress) {
      this.data.emailAddress = '';
    }
    if (!this.data.phoneNumber) {
      this.data.phoneNumber = '';
    }
    if(this.data.scheduledFor){

      this.data.scheduledFor = new Date(this.data.scheduledFor).toISOString();
      this.schedule = true;
    }else{
      this.data.scheduledFor = '';
    }

    this.data.language = this.data.language || 'fr'

    if (this.data.guestContact) {
      this.inviteGuest = true
    }

    if (this.data.translationOrganization) {
      this.inviteTranslator = true
    }
  }


  createFormGroup() {
    let queueFormControl;
    queueFormControl = new FormControl(undefined);

    this.myForm = this.formBuilder.group({
      patientContactFormControl: new FormControl('', this.isPatientInvite ? [
        Validators.required,
        emailOrPhoneValidator
      ] : []),
      guestContactFormControl: new FormControl('', [
        emailOrPhoneValidator,
        this.guestContactValidatorValidator.bind(this)
      ]),

      emailFormControl:
        new FormControl('', this.isPatientInvite ? [Validators.email] : []),
      phoneNumberFormControl: new FormControl('', this.isPatientInvite ? [Validators.pattern(phoneNumberRegex)] : []),
      firstNameFormControl: new FormControl('', this.isPatientInvite ? [Validators.required] : []),
      lastNameFormControl: new FormControl('', this.isPatientInvite ? [Validators.required] : []),
      genderFormControl: new FormControl('', this.isPatientInvite ? [Validators.required] : []),
      languageFormControl: new FormControl('fr', this.isPatientInvite ? [Validators.required] : []),
      dateTimeFormControl: new FormControl(''),
      isScheduled: new FormControl(false),
      inviteTranslatorFormControl: new FormControl(false),
      inviteGuestFormControl: new FormControl(false),
      translationOrganizationFormControl: new FormControl(null, [this.translationOrganizationValidator.bind(this)]),
      queueFormControl,
      metadataFormControl: new FormControl(''),

      // our custom validator
    }, {
      validators: this.atLeastAGuestOrTranslator.bind(this)
    });
    (window as any).myForm = this.myForm;
  }

  translationOrganizationValidator(control: AbstractControl) {

    if (this.inviteTranslator && !control.value) {

      return { required: { value: control.value } }
    }
    return null

  }

  guestContactValidatorValidator(control: AbstractControl) {

    if (this.inviteGuest && !control.value) {

      return { required: { value: control.value } }
    }
    return null

  }

  changeEmail() {
    if (this.data.emailAddress.trim().length > 0) {
      this.data.phoneNumber = '';
      this.myForm.controls.phoneNumberFormControl.disable();
    } else {
      this.myForm.controls.phoneNumberFormControl.enable();
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
    this.data.doctorLanguage = window.localStorage.getItem('hhw-lang')



    if (this.data.patientContact || this.data.firstName) {
      this.showPatientForm()
    }
    this.loading = true
    this.subscriptions.push(this.translationOrganizationService.getTranslationOrganizations().subscribe(translationOrganizations => {
      this.translationOrganizations = translationOrganizations
      this.loading = false
      let languages = []
      this.translationOrganizations.forEach(organization => {
        (organization.languages || []).forEach(lang => {
          if (languages.indexOf(lang) === -1) {
            languages.push(lang)
          }
        });
      })

      this.languages = languages.map(l => {
        return {
          code: l,
          translated: this.translate.instant("inviteForm." + l)
        }
      })


    }))

  }

  showTierFrom() {

    this.isPatientInvite = false;
    this.dialogRef.updateSize('70%', '83%');

    this.queues = []
    this.inviteGuest = true;

    this.createFormGroup();

  }

  showPatientForm() {
    this.isPatientInvite = true;

    this.loading = true
    this.getQueuesSub = this.queueServ.getQueues().subscribe(queues => {
      this.loading = false
      this.queues = queues;


      this.createFormGroup();
      this.dialogRef.updateSize('70%', '83%');
    });
  }
  atLeastAGuestOrTranslator(group: FormGroup): { [s: string]: boolean } {
    if (!this.isPatientInvite) {

      if (group) {
        if (group.controls.guestContactFormControl.value || group.controls.translationOrganizationFormControl.value) {
          return null;
        }
      }
      if (this.isSubmitted || group.controls.guestContactFormControl.touched || group.controls.translationOrganizationFormControl.touched) {
        return { atLeastAGuestOrTranslator: true };
      }
    }
    return null;
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
  onSubmit() {
   
    //! Put on the metadata an object with all the item we set and we get from the form
    this.data.metadata = this.configService.config.metadata.reduce((result,item,index) => {
      result[item] = this.data[item]
      return result;
    },{});

    if (this.loading) {
      return;
    }
    this.loading = true;
    this.isSubmitted = true;

    const isPatientContactAnPhoneNumber = phoneNumberRegex.test(this.data.patientContact)
    if (isPatientContactAnPhoneNumber) {
      this.data.phoneNumber = this.data.patientContact
    } else {
      this.data.emailAddress = this.data.patientContact
    }



    if (this.inviteGuest && this.data.guestContact) {
      const isGuestContactAPhoneNumber = phoneNumberRegex.test(this.data.guestContact)
      if (isGuestContactAPhoneNumber) {
        this.data.guestPhoneNumber = this.data.guestContact
      } else {
        this.data.guestEmailAddress = this.data.guestContact
      }
    }
    if (!this.inviteTranslator) {
      this.data.translationOrganization = undefined;
    }

    console.log('submit ', this.data, this.myForm.valid, this.myForm);



    


    if (!this.myForm.valid || this.atLeastAGuestOrTranslator(this.myForm)) {
      // this to show error messages
      this.validateAllFormFields(this.myForm);

      if (!this.myForm.valid || this.atLeastAGuestOrTranslator(this.myForm)) {
        this.loading = false;
        return;
      }
    }
    
    
    this.data.isPatientInvite = this.isPatientInvite;
    if(this.edit){


      let cancelScheduledFor = false;
      let cancelGuestInvite = false;
      let cancelTranslationRequestInvite = false;

      if(this.data.inviteObj.scheduledFor && !this.schedule){
        cancelScheduledFor = true;
      }
      if(this.data.inviteObj.guestInvite && !this.inviteGuest){
        cancelGuestInvite = true;
      }
      console.log('this.data', this.data, this.inviteGuest,this.inviteTranslator )
      
      if(this.data.inviteObj.translationOrganization && !this.inviteTranslator){
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
        metadata,
      } = this.data;

      this.inviteService.updateInvite({
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
        metadata,
      }, this.data.id).subscribe(res => {
        this.dialogRef.close();
      }, err => {
        this.loading = false;

        this.error = err;
      });
    }else{

      this.createInviteSub = this.inviteService.createInvitation(this.data).subscribe(res => {
        this.dialogRef.close();
      }, err => {
        this.loading = false;

        this.error = err;
      });
    }
  }

  ngOnDestroy() {
    if (this.createInviteSub) {
      this.createInviteSub.unsubscribe();
    }
    if (this.getQueuesSub) {
      this.getQueuesSub.unsubscribe();
    }
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  validateAllFormFields(formGroup: FormGroup) {

    Object.keys(formGroup.controls).forEach(field => {  // {2}
      const control = formGroup.get(field);             // {3}
      if (control instanceof FormControl) {             // {4}
        control.markAsTouched({ onlySelf: true });
        control.updateValueAndValidity()
      } else if (control instanceof FormGroup) {        // {5}
        this.validateAllFormFields(control);            // {6}
      }
    });
  }

  languageSelectChanged(e) {
    this.data.translationOrganization = null;
  }

}
