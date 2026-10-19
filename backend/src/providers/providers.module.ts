import { Module } from '@nestjs/common';
import { ArchiveProvider } from './archive/archive.provider';
import { AudiusProvider } from './audius/audius.provider';
import { JamendoProvider } from './jamendo/jamendo.provider';
import { ProviderRegistryService } from './provider-registry.service';
import { ProvidersController } from './providers.controller';
import { SpotifyProvider } from './spotify/spotify.provider';

@Module({
  controllers: [ProvidersController],
  providers: [
    JamendoProvider,
    AudiusProvider,
    ArchiveProvider,
    SpotifyProvider,
    ProviderRegistryService,
  ],
  exports: [
    ProviderRegistryService,
    JamendoProvider,
    AudiusProvider,
    ArchiveProvider,
    SpotifyProvider,
  ],
})
export class ProvidersModule {}
