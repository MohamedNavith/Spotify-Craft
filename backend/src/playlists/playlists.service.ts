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
          include: { items: { orderBy: [{ position: 'asc' }, { id: 'asc' }] } },
        });
        return created as unknown as PlaylistRecord;
      } catch (error) {
        if (process.env.NODE_ENV === 'production') throw error;
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
          include: { items: { orderBy: [{ position: 'asc' }, { id: 'asc' }] } },
          orderBy: { createdAt: 'desc' },
        });
        return lists as unknown as PlaylistRecord[];
      } catch (error) {
        if (process.env.NODE_ENV === 'production') throw error;
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
          include: { items: { orderBy: [{ position: 'asc' }, { id: 'asc' }] } },
        });
        if (pl) return pl as unknown as PlaylistRecord;
      } catch (error) {
        if (process.env.NODE_ENV === 'production') throw error;
        // Fall back to memory
      }
    }

    const found = this.inMemoryPlaylists.get(id);
    if (!found) {
      throw new NotFoundException(`Playlist ${id} not found`);
    }
    return found;
  }

  async addTrack(playlistId: string, trackId: string, userId: string): Promise<PlaylistRecord> {
    const playlist = await this.getById(playlistId);
    if (playlist.userId !== userId) throw new NotFoundException('Playlist not found');

    if (this.prisma.isConnected) {
      const track = await this.prisma.track.findUnique({ where: { id: trackId } });
      if (!track) throw new NotFoundException('Track not found');
      const position = (playlist.items[playlist.items.length - 1]?.position ?? -1) + 1;
      await this.prisma.playlistItem.upsert({
        where: { playlistId_trackId: { playlistId, trackId } },
        create: { playlistId, trackId, position },
        update: {},
      });
      return this.getById(playlistId);
    }

    if (playlist.items.some(item => item.trackId === trackId)) return playlist;
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

  async removeTrack(playlistId: string, trackId: string, userId: string): Promise<PlaylistRecord> {
    const playlist = await this.getById(playlistId);
    if (playlist.userId !== userId) throw new NotFoundException('Playlist not found');
    if (this.prisma.isConnected) {
      await this.prisma.playlistItem.deleteMany({ where: { playlistId, trackId } });
      return this.getById(playlistId);
    }

    playlist.items = playlist.items.filter((item) => item.trackId !== trackId);
    playlist.updatedAt = new Date();
    return playlist;
  }
}
