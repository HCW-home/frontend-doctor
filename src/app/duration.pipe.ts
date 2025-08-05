import { Pipe, PipeTransform } from "@angular/core";
import { intervalToDuration, formatDuration } from "date-fns";
import { enUS, uk, fr, sv, es, kk } from 'date-fns/locale';

@Pipe({
  name: "duration"
})
export class DurationPipe implements PipeTransform {
  private localeMap = {
    en: enUS,
    uk: uk,
    fr: fr,
    sv: sv,
    es: es,
    kk: kk,
  };

  constructor() {}

  transform(duration: number, expectedLocale?: string): string {
    const currentLang = localStorage.getItem('hhw-lang') || 'en';
    const locale =  this.localeMap[expectedLocale] || this.localeMap[currentLang] || enUS;

    if (!duration) return "";

    const durationObject = intervalToDuration({ start: 0, end: duration });
    return formatDuration(durationObject, { locale });
  }
}
