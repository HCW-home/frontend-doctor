/**
 * The validator takes two arguments, a conditional function that is given the formGroup
 * and that is expected to return true if the validation is to apply and false otherwise,
 * and a validator (which may be a composition).
 * It will revalidate the field when the formGroup is updated, and it's can currently
 * only check things inside the same formGroup
 *
 * ```typescript
 * control: new FormControl(
 *    null,
 *    [
 *      validateIf(
 *        group => group.get('controlName').value === 'TEXT',
 *        Validators.compose([
 *          Validators.required,
 *          Validators.minLength(3)
 *        ])
 *      )
 *    ]
 * )
 * ```
 */

import { AbstractControl, ValidatorFn } from '@angular/forms';
import { distinctUntilChanged } from 'rxjs/operators';

export function validateIf(
  conditional: Function,
  validator: ValidatorFn | null,
) {
  return function (control: AbstractControl) {
    reValidateOnChanges(control);
    if (control && control.parent) {
      if (conditional(control.parent)) {
        return validator ? validator(control) : null;
      }
    }
  };
}

function reValidateOnChanges(control: AbstractControl) {
  if (control && control.parent && !control['_reValidateOnChanges']) {
    control['_reValidateOnChanges'] = true;
    control.parent.valueChanges
      .pipe(distinctUntilChanged((a, b) => compareObjects(a, b)))
      .subscribe(() => control.updateValueAndValidity());
  }
}

function compareObjects(a: object, b: object): boolean {
  if ((a && !b) || (!a && b)) {
    return false;
  } else if (a && b && Object.keys(a).length !== Object.keys(b).length) {
    return false;
  } else if (a && b) {
    for (const i in a) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
  }
  return true;
}

export function conditionalValidator(field: string): ValidatorFn {
  return (formControl) => {
    if (!formControl.parent) {
      return null;
    }
    return formControl.value || formControl.parent.get(field)?.value
      ? null
      : { error: 'this field or ' + field + ' is required' };
  };
}
