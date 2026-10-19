import {
  Controller,
  Get,
  Param,
  Query,
  UseInterceptors,
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
    if (!query || !query.trim()) {
      return {
        provider: 'aggregated',
        tracks: [],
        albums: [],
        artists: [],
        totalResults: 0,
      };
    }

    return this.registry.search(query.trim(), {
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    });
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
