import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface ImageViewerDialogData {
  rawUrl: string;
  fileName: string;
  alt?: string;
}

@Component({
  selector: 'app-image-viewer-dialog',
  templateUrl: './image-viewer-dialog.component.html',
  styleUrls: ['./image-viewer-dialog.component.scss'],
})
export class ImageViewerDialogComponent {
  safeUrl: SafeResourceUrl;

  constructor(
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    public dialogRef: MatDialogRef<ImageViewerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImageViewerDialogData
  ) {
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(data.rawUrl);
  }

  close(): void {
    this.dialogRef.close();
  }

  async download(): Promise<void> {
    if (!this.data?.rawUrl) {
      return;
    }
    try {
      const response = await fetch(this.data.rawUrl);
      const blob = await response.blob();
      const fileName = this.data.fileName || 'image';

      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) {
      console.error('Error downloading image', err);
      this.snackBar.open(
        this.translate.instant('chat.downloadFailed'),
        this.translate.instant('chat.close'),
        { duration: 3000 }
      );
    }
  }
}
