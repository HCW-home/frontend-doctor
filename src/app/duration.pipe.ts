import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';
@Pipe({
  name: 'duration'
})
export class DurationPipe implements PipeTransform {

  transform(duration: any, args?: any): any {
    if(!duration) return '';
    moment.locale('fr');
    return moment.duration(duration).humanize();
  }

}
