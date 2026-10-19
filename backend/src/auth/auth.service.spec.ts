import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUsersService: any;
  let jwtService: JwtService;
  let mockPrisma: any;

  beforeEach(() => {
    const users = new Map<string, any>();

    mockUsersService = {
      findByEmail: jest.fn(async (email: string) => {
        for (const u of users.values()) {
          if (u.email === email.toLowerCase()) return u;
        }
        return null;
      }),
      findById: jest.fn(async (id: string) => users.get(id) || null),
      create: jest.fn(async (data: any) => {
        const u = {
          id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          email: data.email.toLowerCase(),
          passwordHash: data.passwordHash,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl || null,
          isPremium: false,
          role: 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        users.set(u.id, u);
        return u;
      }),
    };

    jwtService = new JwtService({
      secret: 'test-secret-key-wavelength',
    });

    mockPrisma = {
      isConnected: false,
    };

    authService = new AuthService(mockUsersService, jwtService, mockPrisma);
  });

  it('should register a new user and return access and refresh tokens', async () => {
    const res = await authService.register({
      email: 'user@wavelength.fm',
      password: 'password123',
      displayName: 'Navith Wavelength',
    });

    expect(res.accessToken).toBeDefined();
    expect(res.refreshToken).toBeDefined();
    expect(res.user.email).toBe('user@wavelength.fm');
    expect(res.user.displayName).toBe('Navith Wavelength');
  });

  it('should prevent duplicate user registration', async () => {
    await authService.register({
      email: 'duplicate@wavelength.fm',
      password: 'password123',
      displayName: 'First User',
    });

    await expect(
      authService.register({
        email: 'duplicate@wavelength.fm',
        password: 'password456',
        displayName: 'Second User',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should log in with valid credentials', async () => {
    await authService.register({
      email: 'login@wavelength.fm',
      password: 'secretPassword',
      displayName: 'Login User',
    });

    const res = await authService.login({
      email: 'login@wavelength.fm',
      password: 'secretPassword',
    });

    expect(res.accessToken).toBeDefined();
    expect(res.user.email).toBe('login@wavelength.fm');
  });

  it('should reject login with invalid password', async () => {
    await authService.register({
      email: 'wrongpass@wavelength.fm',
      password: 'correctPassword',
      displayName: 'Wrong Pass User',
    });

    await expect(
      authService.login({
        email: 'wrongpass@wavelength.fm',
        password: 'wrongPassword',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should rotate refresh token and issue new token pair', async () => {
    const init = await authService.register({
      email: 'rotate@wavelength.fm',
      password: 'password123',
      displayName: 'Rotate User',
    });

    const rotated = await authService.rotateRefreshToken(init.refreshToken);

    expect(rotated.accessToken).toBeDefined();
    expect(rotated.refreshToken).toBeDefined();
    expect(rotated.refreshToken).not.toBe(init.refreshToken);
  });

  it('should detect token reuse and reject revoked tokens', async () => {
    const init = await authService.register({
      email: 'reuse@wavelength.fm',
      password: 'password123',
      displayName: 'Reuse User',
    });

    const firstRotation = await authService.rotateRefreshToken(init.refreshToken);
    expect(firstRotation.refreshToken).toBeDefined();

    // Now try to re-use the old (already rotated/revoked) refresh token:
    await expect(authService.rotateRefreshToken(init.refreshToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
