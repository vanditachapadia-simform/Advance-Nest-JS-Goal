import { Reflector } from '@nestjs/core';
import { ForbiddenError } from '@casl/ability';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CaslAbilityFactory, AppAbility } from 'src/casl/casl.factory';
import { RequiredRule, CHECK_ABILITY } from '../decorator/policy.decorator';

@Injectable()
export class PolicyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rules: RequiredRule[] =
      this.reflector.get<RequiredRule[]>(CHECK_ABILITY, context.getHandler()) ||
      [];
    const isPublic = this.reflector.getAllAndOverride<boolean>('PUBLIC', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest();

    const currentUser = req?.user;

    const user = await this.prisma.users.findUnique({
      where: { user_id: currentUser.id },
      include: { role: { include: { permission: true } } },
    });

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    const parsedUserPermissions = this.caslAbilityFactory.parseCondition(
      user?.role?.permission,
      currentUser,
    );

    if (user?.role && user?.role.permission) {
      user.role.permission = parsedUserPermissions;
    }

    req.user = user;

    try {
      const ability: AppAbility = this.caslAbilityFactory.createAbility(
        Object(parsedUserPermissions),
      );
      for await (const rule of rules) {
        ForbiddenError.from(ability)
          .setMessage('Not Allowed')
          .throwUnlessCan(rule.action, rule.subject);
      }
      return true;
    } catch (error) {
      if (error instanceof ForbiddenError) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }
}
