import { MongoAbility, RawRuleOf, createMongoAbility } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { users, permission } from 'prisma/prisma-client';
import { Abilities } from './ability.type';

export type AppAbility = MongoAbility<Abilities>;
@Injectable()
export class CaslAbilityFactory {
  createAbility = (rules: RawRuleOf<AppAbility>[]) =>
    createMongoAbility<AppAbility>(rules);

  parseCondition(permissions: any, currentUser: users): permission[] {
    permissions.forEach((permission) => {
      let condition = permission.conditions ?? undefined;

      if (condition) {
        condition = this.replaceUserPlaceholders(condition, currentUser);
      }
    });
    return permissions;
  }

  replaceUserPlaceholders(condition: string, user: users) {
    const replacer = (value: any): any => {
      if (typeof value === 'string' && value.startsWith('user.')) {
        const userKey = value.split('.')[1];
        return user[userKey];
      } else if (typeof value === 'object') {
        for (const key in value) {
          value[key] = replacer(value[key]);
        }
      }
      return value;
    };
    return replacer(condition);
  }
}
