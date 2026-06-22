import { CustomDecorator, SetMetadata } from '@nestjs/common';
export const CHECK_ABILITY: string = 'check_ability';

type action = 'read' | 'create' | 'delete' | 'update' | 'manage';
type subject = 'users' | 'article';

export interface RequiredRule {
  action: action;
  subject: subject;
}
export const checkAbilities: (
  ...requirements: RequiredRule[]
) => CustomDecorator<string> = (
  ...requirements: RequiredRule[]
): CustomDecorator<string> => SetMetadata(CHECK_ABILITY, requirements);
