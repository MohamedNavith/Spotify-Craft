export interface JamendoHeader {
  status: 'success' | 'failed';
  code: number;
  error_message: string;
  warnings: string;
  results_count: number;
  next?: string;
}

export interface JamendoTrackResult {
  id: string;
  name: string;
  duration: number;
  artist_id: string;
  artist_name: string;
  artist_idstr?: string;
  album_name?: string;
  album_id?: string;
  license_ccurl?: string;
  position?: number;
  releasedate?: string;
  album_image?: string;
  image?: string;
  audio?: string;
  audiodownload?: string;
  prourl?: string;
  shorturl?: string;
  shareurl?: string;
  audiodownload_allowed?: boolean;
  content_id_free?: boolean;
  musicinfo?: {
    tags?: {
      genres?: string[];
      instruments?: string[];
      vartags?: string[];
    };
  };
}

export interface JamendoArtistResult {
  id: string;
  name: string;
  website?: string;
  joindate?: string;
  image?: string;
  shorturl?: string;
  shareurl?: string;
}

export interface JamendoAlbumResult {
  id: string;
  name: string;
  releasedate?: string;
  artist_id: string;
  artist_name: string;
  image?: string;
  zip?: string;
  shareurl?: string;
  tracks?: JamendoTrackResult[];
}

export interface JamendoApiResponse<T> {
  headers: JamendoHeader;
  results: T[];
}
