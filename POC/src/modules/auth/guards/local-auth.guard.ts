import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Triggers the LocalStrategy for the login route. */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
