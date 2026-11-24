import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  async getHealth() {
    if (process.env.NODE_ENV === 'production') {
      try {
        await this.prisma.user.findFirst({ select: { id: true } });
      } catch {
        throw new ServiceUnavailableException('Database unavailable');
      }
    }
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
