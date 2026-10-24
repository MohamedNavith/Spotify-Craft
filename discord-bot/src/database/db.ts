import fs from 'fs';
import path from 'path';
import { GuildSettings, UserPlaylist, Track } from '../audio/types';
import { config } from '../config';

interface DatabaseSchema {
  guilds: Record<string, GuildSettings>;
  playlists: Record<string, UserPlaylist[]>; // userId -> playlists
  history: Record<string, Track[]>; // guildId -> tracks
}

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

class DatabaseStore {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.data = this.load();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to load database.json, initializing fresh schema:', err);
    }
    return {
      guilds: {},
      playlists: {},
      history: {},
    };
  }

  private save() {
    try {
      this.ensureDirectory();
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Failed to save database.json:', err);
    }
  }

  public getGuildSettings(guildId: string): GuildSettings {
    if (!this.data.guilds[guildId]) {
      this.data.guilds[guildId] = {
        guildId,
        prefix: config.defaultPrefix,
        defaultVolume: config.defaultVolume,
        idleTimeoutSeconds: config.idleTimeoutSeconds,
        djRoleId: null,
        defaultFilter: 'off',
        announceNowPlaying: true,
        requestChannelId: null,
        requestMessageId: null,
        mode247: false,
      };
      this.save();
    }
    return this.data.guilds[guildId];
  }

  public updateGuildSettings(guildId: string, partial: Partial<GuildSettings>): GuildSettings {
    const current = this.getGuildSettings(guildId);
    this.data.guilds[guildId] = { ...current, ...partial };
    this.save();
    return this.data.guilds[guildId];
  }

  public getUserPlaylists(userId: string): UserPlaylist[] {
    return this.data.playlists[userId] || [];
  }

  public saveUserPlaylist(userId: string, name: string, tracks: Track[]): UserPlaylist {
    if (!this.data.playlists[userId]) {
      this.data.playlists[userId] = [];
    }
    const existingIndex = this.data.playlists[userId].findIndex(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    );

    const playlist: UserPlaylist = {
      userId,
      name,
      tracks,
      createdAt: existingIndex >= 0 ? this.data.playlists[userId][existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.data.playlists[userId][existingIndex] = playlist;
    } else {
      this.data.playlists[userId].push(playlist);
    }
    this.save();
    return playlist;
  }

  public deleteUserPlaylist(userId: string, name: string): boolean {
    if (!this.data.playlists[userId]) return false;
    const initialLen = this.data.playlists[userId].length;
    this.data.playlists[userId] = this.data.playlists[userId].filter(
      (p) => p.name.toLowerCase() !== name.toLowerCase(),
    );
    const removed = this.data.playlists[userId].length < initialLen;
    if (removed) this.save();
    return removed;
  }

  public addHistory(guildId: string, track: Track) {
    if (!this.data.history[guildId]) {
      this.data.history[guildId] = [];
    }
    // Keep max 50 recent tracks
    this.data.history[guildId].unshift(track);
    if (this.data.history[guildId].length > 50) {
      this.data.history[guildId].pop();
    }
    this.save();
  }

  public getHistory(guildId: string, limit = 10): Track[] {
    return (this.data.history[guildId] || []).slice(0, limit);
  }
}

export const db = new DatabaseStore();
