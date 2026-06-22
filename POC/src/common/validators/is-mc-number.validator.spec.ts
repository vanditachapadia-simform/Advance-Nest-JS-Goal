import { IsMcNumberConstraint } from './is-mc-number.validator';

describe('IsMcNumberConstraint', () => {
  const constraint = new IsMcNumberConstraint();

  it.each(['MC12345', 'MC123456', 'MC12345678'])('accepts valid value %s', (value) => {
    expect(constraint.validate(value)).toBe(true);
  });

  it.each(['MC123', '123456', 'XMC12345', 'MC1234567890', 42, null])(
    'rejects invalid value %s',
    (value) => {
      expect(constraint.validate(value as unknown as string)).toBe(false);
    },
  );
});
