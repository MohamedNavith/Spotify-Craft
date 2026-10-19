import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  isPremium: boolean;
  role: 'USER' | 'ARTIST' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UsersService {
  // In-memory fallback store for standalone development and tests
  private readonly inMemoryUsers = new Map<string, UserRecord>();

  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    const normalizedEmail = email.toLowerCase().trim();

    if (this.prisma.isConnected) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { email: normalizedEmail },
        });
        return user as UserRecord | null;
      } catch {
        // Fall back to memory if query fails
      }
    }

    for (const user of this.inMemoryUsers.values()) {
      if (user.email.toLowerCase() === normalizedEmail) {
        return user;
      }
    }
    return null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    if (this.prisma.isConnected) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id },
        });
        return user as UserRecord | null;
      } catch {
        // Fall back to memory
      }
    }

    return this.inMemoryUsers.get(id) || null;
  }

  async create(data: {
    email: string;
    passwordHash: string;
    displayName: string;
    avatarUrl?: string;
  }): Promise<UserRecord> {
    const normalizedEmail = data.email.toLowerCase().trim();

    if (this.prisma.isConnected) {
      try {
        const created = await this.prisma.user.create({
          data: {
            email: normalizedEmail,
            passwordHash: data.passwordHash,
            displayName: data.displayName,
            avatarUrl: data.avatarUrl || null,
          },
        });
        return created as UserRecord;
      } catch {
        // Fall back to memory
      }
    }

    const newUser: UserRecord = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      email: normalizedEmail,
      passwordHash: data.passwordHash,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl || null,
      bio: null,
      isPremium: false,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.inMemoryUsers.set(newUser.id, newUser);
    return newUser;
  }
}
