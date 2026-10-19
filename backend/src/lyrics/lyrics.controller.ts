import { Controller, Get, Query } from '@nestjs/common';
import { LyricsResponse, LyricsService } from './lyrics.service';

@Controller('api/lyrics')
export class LyricsController {
  constructor(private readonly lyricsService: LyricsService) {}

  @Get()
  async getLyrics(
    @Query('track') track: string,
    @Query('artist') artist: string,
    @Query('duration') duration?: string,
  ): Promise<LyricsResponse> {
    const dur = duration ? parseFloat(duration) : undefined;
    return this.lyricsService.getLyrics(track || '', artist || '', dur);
  }
}
