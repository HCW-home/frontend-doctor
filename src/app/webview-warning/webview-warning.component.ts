import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-webview-warning',
  templateUrl: './webview-warning.component.html',
  styleUrls: ['./webview-warning.component.scss']
})
export class WebviewWarningComponent {
  currentUrl = window.location.href;
  copied = false;

  constructor(
    private dialogRef: MatDialogRef<WebviewWarningComponent>,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {}

  async copyUrl() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(this.currentUrl);
        this.copied = true;
        this.snackBar.open(
          this.translate.instant('webviewWarning.urlCopied'),
          'X',
          { duration: 3000 }
        );
      } catch (error) {
        this.selectUrlText();
      }
    } else {
      this.selectUrlText();
    }
  }

  private selectUrlText() {
    const urlInput = document.getElementById('url-display') as HTMLInputElement;
    if (urlInput) {
      urlInput.select();
      urlInput.setSelectionRange(0, 99999);
    }
  }
}
