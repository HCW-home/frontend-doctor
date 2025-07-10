import { Pipe, PipeTransform } from "@angular/core";
import { intervalToDuration, formatDuration } from "date-fns";
import { enUS, uk, fr, sv, es } from "date-fns/locale";
import { TranslateService } from "@ngx-translate/core";

@Pipe({
  name: "duration"
})
export class DurationPipe implements PipeTransform {
  private localeMap = {
    en: enUS,
    uk: uk,
    fr: fr,
    sv: sv,
    es: es
  };

  constructor(private translate: TranslateService) {}

  transform(duration: number, expectedLocale?: string): string {
    const currentLang = this.translate.currentLang || 'en';
    const locale =  this.localeMap[expectedLocale] || this.localeMap[currentLang] || enUS;

    if (!duration) return "";

    const durationObject = intervalToDuration({ start: 0, end: duration });
    return formatDuration(durationObject, { locale });
  }
}
