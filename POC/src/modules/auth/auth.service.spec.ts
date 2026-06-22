import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;
  let jwtService: any;

  const fakeUser = {
    id: 'user-1',
    email: 'jane@example.com',
    password: 'hashed',
    roles: ['USER'],
    refreshTokenHash: 'stored-hash',
  } as any;

  beforeEach(async () => {
    usersService = {
      findByEmailWithPassword: jest.fn(),
      findByIdWithRefreshToken: jest.fn(),
      setRefreshTokenHash: jest.fn().mockResolvedValue(undefined),
      recordLogin: jest.fn().mockResolvedValue(undefined),
      create: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('secret') } },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('validateCredentials', () => {
    it('returns the user when the password matches', async () => {
      usersService.findByEmailWithPassword!.mockResolvedValue(fakeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateCredentials('jane@example.com', 'pw');
      expect(result).toBe(fakeUser);
    });

    it('returns null when the password does not match', async () => {
      usersService.findByEmailWithPassword!.mockResolvedValue(fakeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      expect(await service.validateCredentials('jane@example.com', 'bad')).toBeNull();
    });

    it('returns null when the user is unknown', async () => {
      usersService.findByEmailWithPassword!.mockResolvedValue(null);
      expect(await service.validateCredentials('nobody@example.com', 'pw')).toBeNull();
    });
  });

  describe('login', () => {
    it('issues a token pair and stores the refresh hash', async () => {
      const tokens = await service.login(fakeUser);
      expect(tokens).toEqual({ accessToken: 'signed-token', refreshToken: 'signed-token' });
      expect(usersService.setRefreshTokenHash).toHaveBeenCalledWith(fakeUser.id, 'signed-token');
      expect(usersService.recordLogin).toHaveBeenCalledWith(fakeUser.id);
    });
  });

  describe('refresh', () => {
    it('rejects an invalid token', async () => {
      jwtService.verify!.mockImplementation(() => {
        throw new Error('bad');
      });
      await expect(service.refresh('bad-token')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('revokes the session on a token mismatch', async () => {
      jwtService.verify!.mockReturnValue({ sub: 'user-1', email: 'x', roles: [] });
      usersService.findByIdWithRefreshToken!.mockResolvedValue(fakeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refresh('token')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(usersService.setRefreshTokenHash).toHaveBeenCalledWith('user-1', null);
    });

    it('rotates tokens on a valid refresh', async () => {
      jwtService.verify!.mockReturnValue({ sub: 'user-1', email: 'x', roles: [] });
      usersService.findByIdWithRefreshToken!.mockResolvedValue(fakeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const tokens = await service.refresh('token');
      expect(tokens.accessToken).toBe('signed-token');
    });
  });
});
