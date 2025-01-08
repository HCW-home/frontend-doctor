import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {of, Subject} from "rxjs";
import { environment } from '../../environments/environment';
import {catchError, map, tap} from "rxjs/operators";

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  public configSub: Subject<any> = new Subject();
  public config;
  constructor(private http: HttpClient) {}

  getConfig() {
    return this.http.get<any>(`${environment.api}/config`).pipe(
        tap(config => {
          this.config = config;

          if (config.matomoUrl && config.matomoId) {
            this.initializeMatomo(config.matomoUrl, config.matomoId);
          }

          if (config.doctorAppPrimaryColor) {
            this.updatePrimaryColor(config.doctorAppPrimaryColor);
          }

          this.configSub.next(config);
        }),
        catchError(error => {
          console.error('Failed to fetch configuration:', error);
          return of(null);
        })
    );
  }

  updatePrimaryColor(color: string) {
    document.documentElement.style.setProperty('--primary-color', color);
  }

  //Matomo
  initializeMatomo(url: string, siteId: string): void {
    // @ts-ignore
    const _paq = (window._paq = window._paq || []);
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
    (function () {
      const u = url;
      _paq.push(['setTrackerUrl', u + 'matomo.php']);
      _paq.push(['setSiteId', siteId]);
      const d = document,
        g = d.createElement('script'),
        s = d.getElementsByTagName('script')[0];
      g.async = true;
      g.src = u + 'matomo.js';
      s.parentNode.insertBefore(g, s);
    })();
  }

  checkMarkdownExists(markdownUrl: string) {
    return this.http.get(markdownUrl, { responseType: 'text' });
  }

  getCountries() {
    return this.http.get<string[]>('assets/terms/countries.json');
  }

  checkTermsFileExists(fileName: string) {
    return this.http.get(`assets/terms/${fileName}`, { responseType: 'text' }).pipe(
        map(() => true),
        catchError(() => of(false))
    );
  }

}
