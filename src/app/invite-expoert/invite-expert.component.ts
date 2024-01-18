import {Component, Inject, OnInit} from "@angular/core";
import {UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators} from "@angular/forms";
import {MyErrorStateMatcher} from "../profile-update/profile-update.component";
import {DialogData} from "../confirmation-dialog/confirmation-dialog.component";
import {ConsultationService} from "../core/consultation.service";
import {emailOrPhoneValidator} from "../invite-form/invite-form.component";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
    selector: "app-invite-expert",
    templateUrl: "./invite-expert.component.html",
    styleUrls: ["./invite-expert.component.scss"]
})
export class InviteExpertComponent implements OnInit {
    matcher = new MyErrorStateMatcher();
    loading = false;
    error = "";
    myForm: UntypedFormGroup;

    constructor(
        public dialogRef: MatDialogRef<InviteExpertComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private _snackBar: MatSnackBar,
        private consultationService: ConsultationService,
        private formBuilder: UntypedFormBuilder) {
    }


    createFormGroup() {
        this.myForm = this.formBuilder.group({
            email: new UntypedFormControl("", [emailOrPhoneValidator, Validators.required]),
            link: new UntypedFormControl(this.data)
        });
    }

    ngOnInit() {
        this.createFormGroup();
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    copy() {
        this._snackBar.open("Copied to clipboard", "X", {
            verticalPosition: "top",
            horizontalPosition: "right",
            duration: 2500
        });
    }

    onSubmit() {
        if (this.myForm.valid) {
            this.loading = true;
            const body = {
                expertLink: this.data,
                to: this.myForm.get("email").value
            }
            this.consultationService.sendExpertLink(body).subscribe({
                next: (res) => {
                    this._snackBar.open("Link Sent to Email", "X", {
                        verticalPosition: "top",
                        horizontalPosition: "right",
                        duration: 2500
                    });
                    this.onNoClick();
                    this.loading = false;
                }, error: (err) => {
                    this.error = err.details || err.error?.message || err.statusText || err.message || err;
                    this.loading = false;
                }
            });
        } else {
            this.validateAllFormFields(this.myForm);
        }

    }

    validateAllFormFields(formGroup: UntypedFormGroup) {
        Object.keys(formGroup.controls).forEach(field => {
            const control = formGroup.get(field);
            if (control instanceof UntypedFormControl) {
                control.markAsTouched({onlySelf: true});
            } else if (control instanceof UntypedFormGroup) {
                this.validateAllFormFields(control);
            }
        });
    }
}
