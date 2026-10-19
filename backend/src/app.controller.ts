import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'Wavelength API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  @Get()
  getRoot() {
    return {
      name: 'Wavelength Music Streaming API',
      version: '1.0.0',
      description: 'Production Spotify-grade streaming engine powered by NestJS',
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        search: '/api/search',
        providers: '/api/providers',
        tracks: '/api/tracks/:id',
        artists: '/api/artists/:id',
        albums: '/api/albums/:id',
      },
    };
  }
}
