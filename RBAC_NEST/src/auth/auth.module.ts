import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CaslAbilityFactory } from 'src/casl/casl.factory';
import { JwtAccessStrategy } from 'src/common/providers/access-jwt.strategy';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [ConfigModule],
  providers: [
    AuthService,
    PrismaService,
    JwtService,
    JwtAccessStrategy,
    CaslAbilityFactory,
  ],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
