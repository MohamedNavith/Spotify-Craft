import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlaylistsService } from './playlists.service';

@Controller('api/playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Request() req: any,
    @Body() body: { title: string; description?: string },
  ) {
    return this.playlistsService.create(req.user.id, body.title, body.description);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyPlaylists(@Request() req: any) {
    return this.playlistsService.getUserPlaylists(req.user.id);
  }

  @Get(':id')
  async getPlaylist(@Param('id') id: string) {
    return this.playlistsService.getById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/tracks')
  async addTrack(
    @Param('id') id: string,
    @Body() body: { trackId: string },
  ) {
    return this.playlistsService.addTrack(id, body.trackId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/tracks/:trackId')
  async removeTrack(
    @Param('id') id: string,
    @Param('trackId') trackId: string,
  ) {
    return this.playlistsService.removeTrack(id, trackId);
  }
}
