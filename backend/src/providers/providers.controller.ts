import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ProviderRegistryService } from './provider-registry.service';
import {
  UnifiedAlbum,
  UnifiedArtist,
  UnifiedPlayback,
  UnifiedSearchResult,
  UnifiedTrack,
} from './types';

@Controller('api')
export class ProvidersController {
  constructor(private readonly registry: ProviderRegistryService) {}

  @Get('providers')
  getProviders() {
    return this.registry.getEnabledProviders().map((p) => ({
      id: p.id,
      name: p.name,
      isEnabled: p.isEnabled,
      requiresAuth: p.requiresAuth,
    }));
  }

  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<UnifiedSearchResult> {
    if (query !== undefined && (typeof query !== 'string' || query.length > 200)) {
      throw new BadRequestException('Search query must be at most 200 characters');
    }

    if (!query?.trim()) {
      return {
        provider: 'aggregated',
        tracks: [],
        albums: [],
        artists: [],
        totalResults: 0,
      };
    }

    const pageSize = limit === undefined ? 20 : Number(limit);
    const start = offset === undefined ? 0 : Number(offset);
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50 ||
        !Number.isSafeInteger(start) || start < 0) {
      throw new BadRequestException('Use a limit from 1 to 50 and a non-negative offset');
    }

    return this.registry.search(query.trim(), { limit: pageSize, offset: start });
  }

  @Get('tracks/:id')
  async getTrack(@Param('id') id: string): Promise<UnifiedTrack> {
    return this.registry.getTrack(id);
  }

  @Get('tracks/:id/playback')
  async getPlayback(@Param('id') id: string): Promise<UnifiedPlayback> {
    return this.registry.getPlayback(id);
  }

  @Get('artists/:id')
  async getArtist(@Param('id') id: string): Promise<UnifiedArtist> {
    return this.registry.getArtist(id);
  }

  @Get('albums/:id')
  async getAlbum(@Param('id') id: string): Promise<UnifiedAlbum> {
    return this.registry.getAlbum(id);
  }
}
