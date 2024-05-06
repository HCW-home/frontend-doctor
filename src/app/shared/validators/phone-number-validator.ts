import {
  AbstractControl,
  ValidatorFn,
  Validators,
  ValidationErrors,
} from '@angular/forms';
import { PhoneNumberUtil } from 'google-libphonenumber';

export const phoneNumberRegex = new RegExp(/^(\+|00)[0-9 ]+$/);

export function phoneOrEmailValidator(): ValidatorFn {
  const phoneUtil = PhoneNumberUtil.getInstance();

  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    if (phoneNumberRegex.test(control.value)) {
      try {
        const number = phoneUtil.parse(control.value);
        const isValid = phoneUtil.isValidNumber(number);
        console.log(isValid, 'isValid');
        return isValid ? null : { emailOrPhoneControl: true };
      } catch (error) {
        return { emailOrPhoneControl: true };
      }
    } else {
      return Validators.email(control);
    }
  };
}
