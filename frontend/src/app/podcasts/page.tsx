'use client';

import { Clock, Mic, Play, Radio, Sparkles } from 'lucide-react';
import { useState } from 'react';
import TopBar from '../../components/TopBar';
import { usePlayerStore } from '../../stores/usePlayerStore';

const SAMPLE_PODCASTS = [
  {
    id: 'pod_1',
    title: 'The Sound Design Podcast',
    host: 'Audio Architects',
    description: 'Deep dives into synthesizer history, acoustic design, and music theory.',
    coverBg: 'from-purple-800 to-indigo-900',
    episodes: [
      {
        id: 'ep_1',
        title: 'Analog vs Digital: The Synthesizer Revolution',
        duration: 2150,
        published: '2 days ago',
        resumeSec: 420,
      },
      {
        id: 'ep_2',
        title: 'The Art of Spatial Audio and Binaural Beats',
        duration: 1840,
        published: '1 week ago',
        resumeSec: 0,
      },
    ],
  },
  {
    id: 'pod_2',
    title: 'Open Source Waves',
    host: 'Free Software Foundation Audio',
    description: 'Exploring Creative Commons music, open protocols like Audius, and independent artists.',
    coverBg: 'from-emerald-800 to-teal-900',
    episodes: [
      {
        id: 'ep_3',
        title: 'Democratizing Music Distribution with Web Protocols',
        duration: 2400,
        published: '3 days ago',
        resumeSec: 1200,
      },
      {
        id: 'ep_4',
        title: 'The Legal Frontier: Fair Use and Open Audio Licenses',
        duration: 1980,
        published: '2 weeks ago',
        resumeSec: 0,
      },
    ],
  },
];

export default function PodcastsPage() {
  const { setTrack } = usePlayerStore();

  const handlePlayEpisode = (ep: any, pod: any) => {
    setTrack({
      id: `podcast:${ep.id}`,
      provider: 'archive',
      providerTrackId: ep.id,
      title: ep.title,
      artistName: pod.host,
      albumName: pod.title,
      duration: ep.duration,
      streamUrl: 'https://prod-1.storage.jamendo.com/?trackid=241&format=mp31',
      streamFormat: 'mp3',
      license: 'Podcast Free Distribution License',
      explicit: false,
    });
  };

  return (
    <div className="flex flex-col min-h-full pb-16 select-none">
      <TopBar />

      <div className="px-8 max-w-5xl mx-auto w-full flex flex-col gap-8 mt-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Podcasts & Shows</h1>
          <p className="text-spotify-subtext text-sm mt-1">
            Stream inspiring talk shows, technical deep-dives, and musical conversations.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {SAMPLE_PODCASTS.map((pod) => (
            <div
              key={pod.id}
              className="bg-spotify-card border border-spotify-border rounded-xl p-6 flex flex-col gap-6 shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-20 h-20 rounded-lg bg-gradient-to-br ${pod.coverBg} flex items-center justify-center text-white shrink-0 shadow-md`}
                >
                  <Mic className="w-8 h-8" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-spotify-green uppercase tracking-wider">
                    Podcast
                  </span>
                  <h2 className="text-2xl font-bold text-white truncate mt-0.5">
                    {pod.title}
                  </h2>
                  <p className="text-xs text-spotify-subtext mt-1">{pod.description}</p>
                </div>
              </div>

              {/* Episodes List */}
              <div className="flex flex-col divide-y divide-spotify-border">
                {pod.episodes.map((ep) => (
                  <div
                    key={ep.id}
                    onClick={() => handlePlayEpisode(ep, pod)}
                    className="py-4 flex items-center justify-between group cursor-pointer hover:bg-spotify-hover/40 px-2 rounded transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <button className="w-10 h-10 rounded-full bg-white group-hover:bg-spotify-green text-black flex items-center justify-center shrink-0 transition-all group-hover:scale-105">
                        <Play className="w-4 h-4 fill-black ml-0.5" />
                      </button>

                      <div className="flex flex-col min-w-0">
                        <h3 className="text-sm font-bold text-white group-hover:text-spotify-green transition-colors truncate">
                          {ep.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-spotify-subtext mt-1">
                          <span>{ep.published}</span>
                          <span>•</span>
                          <span>{Math.floor(ep.duration / 60)} min</span>
                          {ep.resumeSec > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-spotify-green font-semibold">
                                Resumes at {Math.floor(ep.resumeSec / 60)}m
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
