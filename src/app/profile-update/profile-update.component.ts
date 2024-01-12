import { Subscription } from 'rxjs';
import { UserService } from '../core/user.service';
import { Component, Inject, OnDestroy, OnInit,Input } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { UntypedFormControl, FormGroupDirective, NgForm, Validators, ValidatorFn, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { AuthService } from '../auth/auth.service';

import {
  trigger,
  state,
  style,
  animate,
  transition,
  // ...
} from '@angular/animations';

interface DialogData {
  number: string;
  firstName: string;
  lastName: string;
  department:string;  
}

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: UntypedFormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}
@Component({
  selector: 'app-profile-update',
  templateUrl: './profile-update.component.html',
  styleUrls: ['./profile-update.component.scss'],
  animations: [
    trigger('openClose', [
      // ...
      state('open', style({
        height: '85px', width: 'auto',
        // opacity: 1,
        // backgroundColor: 'yellow'
      })),
      state('closed', style({
        height: '0px', width: '0px',
        // opacity: 0.5,
        // backgroundColor: 'green'
      })),
      transition('open => closed', [
        animate('5s ease')
      ]),
      transition('closed => open', [
        animate('5s ease')
      ]),
    ]),
  ],
})
export class ProfileUpdateComponent implements OnDestroy, OnInit {
  currentUser;
  token;
  matcher = new MyErrorStateMatcher();
  loading = false;
  createProfileSub: Subscription;
  error = '';
  myForm;
  now = new Date();
  constructor(
    public dialogRef: MatDialogRef<ProfileUpdateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData, private userService: UserService, private formBuilder: UntypedFormBuilder, private authService: AuthService) {
    
  }


  createFormGroup() {
  
    this.myForm = this.formBuilder.group({
      phoneNumberFormControl: new UntypedFormControl('', [Validators.required]),
      firstNameFormControl: new UntypedFormControl('', [Validators.required]),
      lastNameFormControl: new UntypedFormControl('', [Validators.required]),
      // departementNameFormControl: new FormControl('', [Validators.required]),
      dateTimeFormControl: new UntypedFormControl('')
    });
    (window as any).myForm = this.myForm;
  }
  ngOnInit() {
   this.createFormGroup();
   this.currentUser = this.authService.currentUserValue.id;
   this.data.firstName = this.authService.currentUserValue.firstName;
   this.data.lastName= this.authService.currentUserValue.lastName;
   this.data.number = this.authService.currentUserValue.phoneNumber
  }
  
  onNoClick(): void {
    this.dialogRef.close();
  }
  
  onSubmit() {
    if (this.loading) {
      return;
    }
    this.loading = true;

    if (this.myForm.pristine || !this.myForm.valid) {
      this.validateAllFormFields(this.myForm);
      this.loading = false;
      return;
    }

    this.createProfileSub = this.userService.updateUserProfile(this.currentUser,this.data.firstName,this.data.lastName,this.data.department,this.data.number).subscribe(res => {
      this.dialogRef.close();
      this.token =this.authService.getToken();
      this.authService.login(this.token).subscribe(res=>{
        this.loading = false;
      })
    }, err => {
      this.loading = false;
      this.error = err;
    });
  }

  ngOnDestroy() {
    if (this.createProfileSub) {
      this.createProfileSub.unsubscribe();
    }
  }

  validateAllFormFields(formGroup: UntypedFormGroup) {         // {1}
    Object.keys(formGroup.controls).forEach(field => {  // {2}
      const control = formGroup.get(field);             // {3}
      if (control instanceof UntypedFormControl) {             // {4}
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof UntypedFormGroup) {        // {5}
        this.validateAllFormFields(control);            // {6}
      }
    });
  }
}

