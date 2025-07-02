import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-error-dialog',
  templateUrl: './error-dialog.component.html',
  styleUrls: ['./error-dialog.component.scss'],
})
export class ErrorDialogComponent implements OnInit {
  safeHtml: SafeHtml = '';
  constructor(
    private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA)
    public data: { message: string; title: string; isHtml: boolean }
  ) {}

  ngOnInit() {
    if (this.data?.isHtml && this.data?.message) {
      this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(this.data.message);
    }
  }
}
