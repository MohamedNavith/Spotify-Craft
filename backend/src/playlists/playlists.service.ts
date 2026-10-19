import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface PlaylistItemRecord {
  id: string;
  trackId: string;
  position: number;
  addedAt: Date;
}

export interface PlaylistRecord {
  id: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  userId: string;
  isPublic: boolean;
  isCollaborative: boolean;
  createdAt: Date;
  updatedAt: Date;
  items: PlaylistItemRecord[];
}

@Injectable()
export class PlaylistsService {
  private readonly inMemoryPlaylists = new Map<string, PlaylistRecord>();

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, title: string, description?: string): Promise<PlaylistRecord> {
    if (this.prisma.isConnected) {
      try {
        const created = await this.prisma.playlist.create({
          data: {
            title,
            description: description || null,
            userId,
          },
          include: { items: true },
        });
        return created as unknown as PlaylistRecord;
      } catch {
        // Fall back to memory
      }
    }

    const newPlaylist: PlaylistRecord = {
      id: `pl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      description: description || null,
      coverUrl: null,
      userId,
      isPublic: true,
      isCollaborative: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
    };

    this.inMemoryPlaylists.set(newPlaylist.id, newPlaylist);
    return newPlaylist;
  }

  async getUserPlaylists(userId: string): Promise<PlaylistRecord[]> {
    if (this.prisma.isConnected) {
      try {
        const lists = await this.prisma.playlist.findMany({
          where: { userId },
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        });
        return lists as unknown as PlaylistRecord[];
      } catch {
        // Fall back to memory
      }
    }

    return Array.from(this.inMemoryPlaylists.values()).filter((p) => p.userId === userId);
  }

  async getById(id: string): Promise<PlaylistRecord> {
    if (this.prisma.isConnected) {
      try {
        const pl = await this.prisma.playlist.findUnique({
          where: { id },
          include: { items: true },
        });
        if (pl) return pl as unknown as PlaylistRecord;
      } catch {
        // Fall back to memory
      }
    }

    const found = this.inMemoryPlaylists.get(id);
    if (!found) {
      throw new NotFoundException(`Playlist ${id} not found`);
    }
    return found;
  }

  async addTrack(playlistId: string, trackId: string): Promise<PlaylistRecord> {
    const playlist = await this.getById(playlistId);

    const newItem: PlaylistItemRecord = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      trackId,
      position: playlist.items.length,
      addedAt: new Date(),
    };

    playlist.items.push(newItem);
    playlist.updatedAt = new Date();

    return playlist;
  }

  async removeTrack(playlistId: string, trackId: string): Promise<PlaylistRecord> {
    const playlist = await this.getById(playlistId);
    playlist.items = playlist.items.filter((item) => item.trackId !== trackId);
    playlist.updatedAt = new Date();
    return playlist;
  }
}
