import { TranslateService } from "@ngx-translate/core";
import { Component, Inject, OnInit } from "@angular/core";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";

export interface DialogData {
  question: string
  yesText?: string
  noText?: string
  title?: string
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
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public translate: TranslateService

  ) {
    this.question = data.question
    this.yesText = data.yesText || this.translate.instant("confirmationDialog.yesText")
    this.noText = data.noText || this.translate.instant("confirmationDialog.noText")
    this.title = data.title || this.translate.instant("confirmationDialog.confirmationTitle")

  }

  ngOnInit() {

  }

  onConfirm() {

  }

  onCancel() {

  }
}
