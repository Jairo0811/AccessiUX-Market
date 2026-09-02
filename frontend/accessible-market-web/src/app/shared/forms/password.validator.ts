import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const strongPassword: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '');
  const valid = value.length >= 12 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value);

  return valid ? null : { strongPassword: true };
};
