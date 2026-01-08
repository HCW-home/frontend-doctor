import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WebviewDetectionService {
  isWebView(): boolean {
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;

      console.log(ua, 'ua')
      alert(ua)
    const webViewPatterns = [
      /\bwv\b/,
      /WebView/i,
      /WhatsApp/i,
      /FB_IAB|FBAN|FBAV/i,
      /Instagram/i,
      /Twitter/i,
      /Line\//i,
      /Snapchat/i,
      /\bTelegram\b/i,
    ];

    const isIOSWebView = /iPhone|iPod|iPad/.test(ua) && !/Safari/.test(ua);
    const isAndroidWebView = /Android/.test(ua) && (/Version\/[\d.]+/.test(ua) || /\bwv\b/.test(ua));

    return webViewPatterns.some(pattern => pattern.test(ua)) || isIOSWebView || isAndroidWebView;
  }
}
