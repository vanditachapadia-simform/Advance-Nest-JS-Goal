import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signIn(email: string, password: string) {
    const user = await this.prismaService.users.findUnique({
      where: { user_email: email },
    });

    if (!user || !user.user_password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.user_password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { id: user.user_id, email: user.user_email };
    const { user_password, ...safeUser } = user;

    return {
      accessToken: await this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1d'),
        secret: this.configService.get<string>('JWT_SECRET'),
      }),
      user: safeUser,
    };
  }

  async createUser(email: string, password: string, role_id: number) {
    const existingUser = await this.prismaService.users.findUnique({
      where: { user_email: email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists!');
    }

    const roleExists = await this.prismaService.role.findUnique({
      where: { role_id: role_id },
    });

    if (!roleExists) {
      throw new BadRequestException('Invalid roleId. Role does not exist.');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await this.prismaService.users.create({
      data: {
        user_email: email,
        user_password: hashedPassword,
        role_id: role_id,
      },
    });

    const { user_password, ...safeUser } = newUser;
    return safeUser;
  }

  async findUser(userId: number) {
    const user = await this.prismaService.users.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    const { user_password, ...safeUser } = user;
    return safeUser;
  }

  async deleteUser(userId: number) {
    return this.prismaService.users.delete({ where: { user_id: userId } });
  }

  async findAll() {
    const users = await this.prismaService.users.findMany();
    return users.map(({ user_password, ...safeUser }) => safeUser);
  }
}
