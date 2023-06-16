import { Inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { OwlDateTimeIntl } from "ng-pick-datetime";

// here is the default text string
@Injectable()
export class DefaultIntl extends OwlDateTimeIntl {

  constructor(@Inject(TranslateService) private translate) {
    super()
    this.setLocal()
    this.translate.onLangChange.subscribe(lang => {
      this.setLocal();
    });
  }
  setLocal() {
    /** A label for the up second button (used by screen readers).  */
    this.upSecondLabel = this.translate.instant('dateTimePicker.upSecondLabel') || 'Add a second';

    /** A label for the down second button (used by screen readers).  */
    this.downSecondLabel = this.translate.instant('dateTimePicker.downSecondLabel') || 'Minus a second';

    /** A label for the up minute button (used by screen readers).  */
    this.upMinuteLabel = this.translate.instant('dateTimePicker.upMinuteLabel') || 'Add a minute';

    /** A label for the down minute button (used by screen readers).  */
    this.downMinuteLabel = this.translate.instant('dateTimePicker.downMinuteLabel') || 'Minus a minute';

    /** A label for the up hour button (used by screen readers).  */
    this.upHourLabel = this.translate.instant('dateTimePicker.upHourLabel') || 'Add a hour';

    /** A label for the down hour button (used by screen readers).  */
    this.downHourLabel = this.translate.instant('dateTimePicker.downHourLabel') || 'Minus a hour';

    /** A label for the previous month button (used by screen readers). */
    this.prevMonthLabel = this.translate.instant('dateTimePicker.prevMonthLabel') || 'Previous month';

    /** A label for the next month button (used by screen readers). */
    this.nextMonthLabel = this.translate.instant('dateTimePicker.nextMonthLabel') || 'Next month';

    /** A label for the previous year button (used by screen readers). */
    this.prevYearLabel = this.translate.instant('dateTimePicker.prevYearLabel') || 'Previous year';

    /** A label for the next year button (used by screen readers). */
    this.nextYearLabel = this.translate.instant('dateTimePicker.nextYearLabel') || 'Next year';

    /** A label for the previous multi-year button (used by screen readers). */
    this.prevMultiYearLabel = this.translate.instant('dateTimePicker.prevMultiYearLabel') || 'Previous 21 years';

    /** A label for the next multi-year button (used by screen readers). */
    this.nextMultiYearLabel = this.translate.instant('dateTimePicker.nextMultiYearLabel') || 'Next 21 years';

    /** A label for the 'switch to month view' button (used by screen readers). */
    this.switchToMonthViewLabel = this.translate.instant('dateTimePicker.switchToMonthViewLabel') || 'Change to month view';

    /** A label for the 'switch to year view' button (used by screen readers). */
    this.switchToMultiYearViewLabel = this.translate.instant('dateTimePicker.switchToMultiYearViewLabel') || 'Choose month and year';

    /** A label for the cancel button */
    this.cancelBtnLabel = this.translate.instant('dateTimePicker.cancelBtnLabel') || 'Cancel';

    /** A label for the set button */
    this.setBtnLabel = this.translate.instant('dateTimePicker.setBtnLabel') || 'Set';

    /** A label for the range 'from' in picker info */
    this.rangeFromLabel = this.translate.instant('dateTimePicker.rangeFromLabel') || 'From';

    /** A label for the range 'to' in picker info */
    this.rangeToLabel = this.translate.instant('dateTimePicker.rangeToLabel') || 'To';

    /** A label for the hour12 button (AM) */
    this.hour12AMLabel = this.translate.instant('dateTimePicker.hour12AMLabel') || 'AM';

    /** A label for the hour12 button (PM) */
    this.hour12PMLabel = this.translate.instant('dateTimePicker.hour12PMLabel') || 'PM';

  }

}
