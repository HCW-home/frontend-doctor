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

  constructor(
    private dialogRef: MatDialogRef<WebviewWarningComponent>,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {}

  async openInBrowser() {
    const currentUrl = window.location.href;
    const ua = navigator.userAgent || '';

    if (/Android/i.test(ua)) {
      const urlWithoutProtocol = currentUrl.replace(/^https?:\/\//, '');
      const intentUrl = `intent://${urlWithoutProtocol}#Intent;scheme=https;package=com.android.chrome;end`;
      window.location.href = intentUrl;
      setTimeout(() => this.copyUrlAsFallback(currentUrl), 2000);
    } else if (/iPhone|iPod|iPad/i.test(ua)) {
      window.location.href = currentUrl;
      setTimeout(() => this.copyUrlAsFallback(currentUrl), 1000);
    } else {
      await this.copyUrlAsFallback(currentUrl);
    }
  }

  private async copyUrlAsFallback(url: string) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        this.snackBar.open(
          this.translate.instant('webviewWarning.urlCopied'),
            'X',
          { duration: 5000 }
        );
      } catch (error) {
        this.showUrlManually(url);
      }
    } else {
      this.showUrlManually(url);
    }
  }

  private showUrlManually(url: string) {
    this.snackBar.open(
      `${this.translate.instant('webviewWarning.copyUrlManually')}: ${url}`,
        'X',
      { duration: 10000 }
    );
  }
}
