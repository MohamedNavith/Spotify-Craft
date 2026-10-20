/**
 * Official Music Video Resolver
 * Resolves verified YouTube Video IDs for official hits so video mode never breaks.
 */

// Verified official YouTube music video IDs for global & regional chartbusters
export const CURATED_OFFICIAL_VIDEOS: Record<string, string> = {
  // Global Hits
  'die with a smile': 'kPa7bsKwL-c',
  'birds of a feather': 'V9PVRfjEBTI',
  'cruel summer': 'ic8j13piAhQ',
  'espresso': 'eVli-tstM5E',
  'please please please': 'cF1Na4AIecM',
  'taste': 'T94PHkuydcw',
  'starboy': '34Na4j8AVgA',
  'blinding lights': '4NRXx6U8ABQ',
  'shape of you': 'JGwWNGJdvx8',
  'sunflower': 'ApXoWvfEYVU',
  'believer': '7wtfhZwyrcc',
  'as it was': 'H5v3kku4y6Q',
  'levitating': 'TUVcZfQe-Kw',
  'stay': 'kTJczUoc26U',
  'flowers': 'G7KNmW9a75Y',
  'bad guy': 'DyDFGwOK348',
  'someone you loved': 'zABLecsR5UE',
  'perfect': '2Vv-BfVoq4g',

  // Indian & Bollywood Chartbusters
  'chaleya': 'VAdGW7QDJUI',
  'kesariya': 'BddP6PYo2gs',
  'tauba tauba': 'zsgq6B1PcfY',
  'illuminati': 'tOM-nWPcR4U',
  'naa ready': 'szvt1vD0Uug',
  'bad newz': 'yL_Jg1oZ46s',
  'jaanam': 'yL_Jg1oZ46s',
  'hukum': '1F3HM635S0k',
  'kaavaalaa': 'flmwIe9iW1w',
  'chaleya chaleya': 'VAdGW7QDJUI',
  'tum hi ho': 'IJq0yyWug1k',
  'apna bana le': 'ElZfdU54Cp8',
};

export function resolveVideoId(title: string, artist: string): string | null {
  const normTitle = title.toLowerCase().replace(/\(.*?\)/g, '').trim();

  // 1. Direct curated match
  for (const [key, id] of Object.entries(CURATED_OFFICIAL_VIDEOS)) {
    if (normTitle.includes(key) || key.includes(normTitle)) {
      return id;
    }
  }

  // 2. Check title for embedded 11-char YouTube ID like [ic8j13piAhQ]
  const match = title.match(/\[([a-zA-Z0-9_-]{11})\]/);
  if (match) return match[1];

  return null;
}
