import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { ApiError } from '@core/api';

export const SERVER_ERROR_KEY = 'serverError';

export function applyServerErrors(form: FormGroup, error: ApiError): boolean {
  let attached = false;

  for (const name of Object.keys(form.controls)) {
    const control = form.get(name);
    if (control === null) {
      continue;
    }

    const message = error.fieldError(name);
    if (message === null) {
      continue;
    }
    control.setErrors({ [SERVER_ERROR_KEY]: message });
    attached = true;
  }

  return attached;
}

export function clearServerError(control: AbstractControl): void {
  const errors = control.errors;
  if (errors === null) {
    return;
  }

  if (errors[SERVER_ERROR_KEY] === undefined) {
    return;
  }

  control.updateValueAndValidity({ emitEvent: true });
}

function requiredLengthOf(payload: unknown): number | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const value = (payload as Record<string, unknown>)['requiredLength'];
  return typeof value === 'number' ? value : null;
}

@Component({
  selector: 'app-field-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (message(); as text) {
      <p class="fieldset-label text-error" role="alert">{{ text }}</p>
    }
  `,
})
export class FieldError {
  readonly control = input.required<AbstractControl | null>();

  readonly label = input<string>('Trường này');

  private readonly version = signal(0);

  private readonly messages = computed<string | null>(() => {
    this.version();

    const control = this.control();
    if (control === null) {
      return null;
    }

    const errors = control.errors;
    if (errors === null) {
      return null;
    }

    const serverError = errors[SERVER_ERROR_KEY];
    if (typeof serverError === 'string' && serverError.length > 0) {
      return serverError;
    }

    if (!control.touched && !control.dirty) {
      return null;
    }

    const name = this.label();

    if (errors['required'] !== undefined) {
      return `${name} không được để trống.`;
    }

    if (errors['email'] !== undefined) {
      return 'Định dạng Email không chính xác.';
    }

    const min = requiredLengthOf(errors['minlength']);
    if (min !== null) {
      return `${name} phải có ít nhất ${min} ký tự.`;
    }

    const max = requiredLengthOf(errors['maxlength']);
    if (max !== null) {
      return `${name} không được vượt quá ${max} ký tự.`;
    }

    return `${name} không hợp lệ.`;
  });

  readonly message = this.messages;

  constructor() {
    effect((onCleanup) => {
      const control = this.control();
      if (control === null) {
        return;
      }

      const subscription = control.events.subscribe(() => {
        this.version.update((value) => value + 1);
      });

      onCleanup(() => subscription.unsubscribe());
    });
  }
}
