import { NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ConfigService } from '../core/config.service';

export let supportedLanguages = ['en', 'fr', 'es', 'kk', 'uk'];

@NgModule({
  imports: [
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: translateLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  exports: [TranslateModule],
})
export class I18nModule {
  constructor(translate: TranslateService, config: ConfigService) {
    config.getConfig().subscribe({
      next: (appConfig) => {
        if (appConfig) {
          const dynamicLanguages = appConfig.doctorLanguages?.length
            ? appConfig.doctorLanguages
            : supportedLanguages;

          supportedLanguages = dynamicLanguages;

          translate.addLangs(dynamicLanguages);

          const userLang =
            window.localStorage.getItem('hhw-lang') || translate.getBrowserLang();
          const defaultLang = dynamicLanguages.includes(userLang)
            ? userLang
            : dynamicLanguages[0];

          translate.use(defaultLang);
        }
      },
      error: () => {
        translate.addLangs(supportedLanguages);
        translate.use(supportedLanguages[0]);
      },
    });

    translate.setDefaultLang(supportedLanguages[0]);
  }
}

export function translateLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient);
}
