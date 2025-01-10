import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  @Input('markdownUrl') markdownUrl = '';
  processedMarkdown: string = '';

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    if (this.markdownUrl) {
      this.loadMarkdown();
    }
  }

  loadMarkdown(): void {
    this.http.get(this.markdownUrl, { responseType: 'text' }).subscribe({
      next: (markdown) => {
        this.processedMarkdown = this.sanitizeMarkdown(markdown);
      },
      error: (err) => {
      },
    });
  }

  sanitizeMarkdown(markdown: string): string {
    const processedMarkdown = markdown.replace(/onclick="([^"]*)"/g, (match, handler) => {
      return `onclick="${handler}"`;
    });

    return this.sanitizer.bypassSecurityTrustHtml(processedMarkdown) as string;
  }
}
