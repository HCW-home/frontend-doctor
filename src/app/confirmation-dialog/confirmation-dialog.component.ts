import { TranslateService } from "@ngx-translate/core";
import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { UntypedFormBuilder, UntypedFormGroup, Validators } from "@angular/forms";

export interface DialogData {
  question: string
  yesText?: string
  noText?: string
  title?: string
  showDelayInput?: boolean
  delayValue?: number
}

@Component({
  selector: "app-confirmation-dialog",
  templateUrl: "./confirmation-dialog.component.html",
  styleUrls: ["./confirmation-dialog.component.scss"]
})
export class ConfirmationDialogComponent implements OnInit {

  question = ""
  yesText = ""
  noText = ""
  title = ""
  showDelayInput = false
  delayForm: UntypedFormGroup

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public translate: TranslateService,
    private formBuilder: UntypedFormBuilder,
    private dialogRef: MatDialogRef<ConfirmationDialogComponent>
  ) {
    this.question = data.question
    this.yesText = data.yesText || this.translate.instant("confirmationDialog.yesText")
    this.noText = data.noText || this.translate.instant("confirmationDialog.noText")
    this.title = data.title || this.translate.instant("confirmationDialog.confirmationTitle")
    this.showDelayInput = data.showDelayInput || false
  }

  ngOnInit() {
    if (this.showDelayInput) {
      this.delayForm = this.formBuilder.group({
        delay: [this.data.delayValue || 10, [Validators.required, Validators.max(60), Validators.min(1)]],
      });
    }
  }

  onConfirm() {
    if (this.showDelayInput) {
      if (this.delayForm.valid) {
        this.dialogRef.close({ confirmed: true, delay: this.delayForm.get('delay').value });
      }
    } else {
      this.dialogRef.close(true);
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
