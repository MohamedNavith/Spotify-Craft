import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds
  tokenType: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string | null;
    isPremium: boolean;
    role: string;
  };
}

interface StoredRefreshToken {
  tokenHash: string;
  userId: string;
  family: string;
  revoked: boolean;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly inMemoryRefreshTokens = new Map<string, StoredRefreshToken>();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
      avatarUrl: dto.avatarUrl,
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.generateTokens(user);
  }

  /**
   * Refresh Token Rotation with reuse detection
   */
  async rotateRefreshToken(rawRefreshToken: string): Promise<AuthTokens> {
    let payload: any;
    try {
      payload = this.jwtService.verify(rawRefreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'wavelength-dev-refresh-token-super-secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenHash = this.hashToken(rawRefreshToken);
    const storedToken = await this.findRefreshToken(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    // Reuse detection: If token is already revoked, an attacker may have stolen it
    if (storedToken.revoked) {
      this.logger.warn(
        `Refresh token reuse detected for user ${storedToken.userId}! Revoking token family.`,
      );
      await this.revokeFamily(storedToken.family);
      throw new UnauthorizedException('Token reuse detected. Please log in again.');
    }

    // Check expiration
    if (new Date() > storedToken.expiresAt) {
      await this.revokeToken(tokenHash);
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Revoke the used token
    await this.revokeToken(tokenHash);

    // Fetch user
    const user = await this.usersService.findById(storedToken.userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    // Issue new token pair preserving the family
    return this.generateTokens(user, storedToken.family);
  }

  async logout(userId: string, rawRefreshToken?: string): Promise<{ success: boolean }> {
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      const token = await this.findRefreshToken(tokenHash);
      if (token) {
        await this.revokeFamily(token.family);
      }
    } else {
      // Revoke all tokens for user
      await this.revokeAllUserTokens(userId);
    }
    return { success: true };
  }

  // --- Token Generation & Management ---

  private async generateTokens(user: any, familyId?: string): Promise<AuthTokens> {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
      secret: process.env.JWT_SECRET || 'wavelength-dev-jwt-super-secret-key',
    });

    const family = familyId || crypto.randomUUID();
    const rawRefreshToken = this.jwtService.sign(
      { sub: user.id, family, jti: crypto.randomUUID() },
      {
        expiresIn: '7d',
        secret: process.env.JWT_REFRESH_SECRET || 'wavelength-dev-refresh-token-super-secret',
      },
    );

    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.saveRefreshToken({
      tokenHash,
      userId: user.id,
      family,
      revoked: false,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 900, // 15 minutes
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isPremium: user.isPremium,
        role: user.role,
      },
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async saveRefreshToken(data: StoredRefreshToken): Promise<void> {
    if (this.prisma.isConnected) {
      try {
        await this.prisma.refreshToken.create({
          data: {
            tokenHash: data.tokenHash,
            userId: data.userId,
            family: data.family,
            revoked: data.revoked,
            expiresAt: data.expiresAt,
          },
        });
        return;
      } catch {
        // Fall back to memory
      }
    }

    this.inMemoryRefreshTokens.set(data.tokenHash, data);
  }

  private async findRefreshToken(tokenHash: string): Promise<StoredRefreshToken | null> {
    if (this.prisma.isConnected) {
      try {
        const found = await this.prisma.refreshToken.findUnique({
          where: { tokenHash },
        });
        return found ? (found as unknown as StoredRefreshToken) : null;
      } catch {
        // Fall back to memory
      }
    }

    return this.inMemoryRefreshTokens.get(tokenHash) || null;
  }

  private async revokeToken(tokenHash: string): Promise<void> {
    if (this.prisma.isConnected) {
      try {
        await this.prisma.refreshToken.update({
          where: { tokenHash },
          data: { revoked: true },
        });
        return;
      } catch {
        // Fall back to memory
      }
    }

    const item = this.inMemoryRefreshTokens.get(tokenHash);
    if (item) {
      item.revoked = true;
    }
  }

  private async revokeFamily(family: string): Promise<void> {
    if (this.prisma.isConnected) {
      try {
        await this.prisma.refreshToken.updateMany({
          where: { family },
          data: { revoked: true },
        });
        return;
      } catch {
        // Fall back to memory
      }
    }

    for (const item of this.inMemoryRefreshTokens.values()) {
      if (item.family === family) {
        item.revoked = true;
      }
    }
  }

  private async revokeAllUserTokens(userId: string): Promise<void> {
    if (this.prisma.isConnected) {
      try {
        await this.prisma.refreshToken.updateMany({
          where: { userId },
          data: { revoked: true },
        });
        return;
      } catch {
        // Fall back to memory
      }
    }

    for (const item of this.inMemoryRefreshTokens.values()) {
      if (item.userId === userId) {
        item.revoked = true;
      }
    }
  }
}
