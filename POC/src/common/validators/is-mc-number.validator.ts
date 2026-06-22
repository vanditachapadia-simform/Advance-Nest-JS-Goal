import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Custom class-validator constraint: a Motor Carrier number must be "MC"
 * followed by 5–8 digits (e.g. MC123456). Demonstrates building reusable
 * domain validation decorators.
 */
@ValidatorConstraint({ name: 'isMcNumber', async: false })
export class IsMcNumberConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && /^MC\d{5,8}$/.test(value);
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must match the format "MC" + 5-8 digits (e.g. MC123456)`;
  }
}

export function IsMcNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsMcNumberConstraint,
    });
  };
}
