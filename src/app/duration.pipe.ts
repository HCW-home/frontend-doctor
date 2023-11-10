import { Pipe, PipeTransform } from "@angular/core";
import { intervalToDuration, formatDuration } from "date-fns";
import { enUS } from "date-fns/locale";

@Pipe({
  name: "duration"
})
export class DurationPipe implements PipeTransform {

  transform(duration: number, args?: any): any {
    if(!duration) return "";
    const durationObject = intervalToDuration({ start: 0, end: duration });
    return formatDuration(durationObject, { locale: enUS });
  }
}
