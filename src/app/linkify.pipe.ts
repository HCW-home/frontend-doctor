import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'linkify'
})
export class LinkifyPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(text: string): SafeHtml {
    if (!text) {
      return text;
    }

    const urlPattern = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    const wwwPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    const emailPattern = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/gim;

    let result = text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    result = result.replace(urlPattern, '<a href="$1" class="bubble-link" target="_blank" rel="noopener noreferrer">$1</a>');
    result = result.replace(wwwPattern, '$1<a href="http://$2" class="bubble-link" target="_blank" rel="noopener noreferrer">$2</a>');
    result = result.replace(emailPattern, '<a href="mailto:$1" class="bubble-link">$1</a>');

    return this.sanitizer.bypassSecurityTrustHtml(result);
  }
}
