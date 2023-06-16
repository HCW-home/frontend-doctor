import { TranslateService } from "@ngx-translate/core";
import { Pipe, PipeTransform } from "@angular/core";
import { DatePipe, } from "@angular/common";
@Pipe({
  name: "msgTime"
})
export class MsgTimePipe implements PipeTransform {


  constructor(
    private translateSer: TranslateService
  ) {

    console.log("current lang ", this.translateSer.currentLang)
  }
  datePipe = new DatePipe(this.translateSer.currentLang);


  transform(time: any, args?: any): any {

    let format = "LLL d";

    if (new Date().toDateString() === new Date(time).toDateString()) {
      format = "HH:mm";
    }

    if (new Date(Date.now() - 8.64e+7).toDateString() === new Date(time).toDateString()) {
      return "Hier";
    }

    return this.datePipe.transform(time, format);

  }

}
