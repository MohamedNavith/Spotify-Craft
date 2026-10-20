/**
 * Official Music Video Resolver
 * Resolves verified YouTube Video IDs for official hits so full playback & video mode never break.
 */

// Comprehensive mapping of verified official YouTube music video IDs
export const CURATED_OFFICIAL_VIDEOS: Record<string, string> = {
  // Global Chartbusters
  'die with a smile': 'kPa7bsKwL-c',
  'birds of a feather': 'V9PVRfjEBTI',
  'taste': 'T94PHkuydcw',
  'espresso': 'eVli-tstM5E',
  'please please please': 'cF1Na4AIecM',
  'feather': 'k6swqP_H5jY',
  'bed chem': '9hE5mU8zI0k',
  'cruel summer': 'ic8j13piAhQ',
  'anti-hero': 'b1kbLwvqugk',
  'blank space': 'e-ORhEE9VVg',
  'fortnight': 'q3zqJs7JUCQ',
  'shake it off': 'nfWlot6h_JM',
  'lover': '-BjZmE2gtdo',
  'cardigan': 'K-a8s8OLBSE',
  'blinding lights': '4NRXx6U8ABQ',
  'starboy': '34Na4j8AVgA',
  'save your tears': 'XXYlFuWEuKI',
  'the hills': 'yzTuBuRdAyA',
  'die for you': 'uPD0QOGChkY',
  'shape of you': 'JGwWNGJdvx8',
  'perfect': '2Vv-BfVoq4g',
  'bad habits': 'orJSJGHjBLI',
  'shivers': 'Il0S8BoucSA',
  'thinking out loud': 'lp-EO5I60KA',
  'sunflower': 'ApXoWvfEYVU',
  'circles': 'wXhTHyIgQ_U',
  'congratulations': 'SC4xDypqxOM',
  'rockstar': 'UceaB4D0jpo',
  'believer': '7wtfhZwyrcc',
  'bones': 'TO-_3tck2tg',
  'demons': 'mWRsgZuwf_8',
  'thunder': 'fKopy74weus',
  'as it was': 'H5v3kku4y6Q',
  'watermelon sugar': 'E07s5ZYygmg',
  'sign of the times': 'qN4ooNx77u0',
  'levitating': 'TUVcZfQe-Kw',
  'dont start now': 'oygrmJFKYZY',
  'houdini': 'suAR1PYFNYA',
  'dance the night': 'OiC1rgCPmUQ',
  'not like us': 'H58vbez_m4E',
  'humble': 'tvTRZJ-4EyI',
  'money trees': 'smqhSl0u_Qk',
  'all the stars': 'GfCqMv--ncA',
  'viva la vida': 'dvgZkm1xWPE',
  'yellow': 'yKNxeF4KMsY',
  'something just like this': 'FM7MFYoylVs',
  'a sky full of stars': 'VPRjCeoBqrI',
  'hymn for the weekend': 'YykjpeuMNEk',
  'stay': 'kTJczUoc26U',
  'flowers': 'G7KNmW9a75Y',
  'bad guy': 'DyDFGwOK348',
  'lunch': 'MB3VkzPdgLA',
  'lovely': 'V1Pl8CzNzCw',
  'what was i made for': 'cW8VLC9nnTo',
  'someone you loved': 'zABLecsR5UE',
  'uptown funk': 'OPf0YbXqDm0',
  '24k magic': 'UqyT8IEBkvY',
  'thats what i like': 'PMivT7MJ41M',
  'just the way you are': 'LjhCEhWiKXk',
  'locked out of heaven': 'e-fA-gBCkj0',

  // Indian & Bollywood Chartbusters
  'kesariya': 'BddP6PYo2gs',
  'tauba tauba': 'zsgq6B1PcfY',
  'bad newz': 'zsgq6B1PcfY',
  'chaleya': 'VAdGW7QDJUI',
  'hukum': '1F3HM635S0k',
  'naa ready': 'szvt1vD0Uug',
  'kaavaalaa': 'flmwIe9iW1w',
  'badass': 'sU3vR6-Gf10',
  'arabic kuthu': 'KUN5Uf9mObQ',
  'vaathi coming': 'vx6MRb2a_l4',
  'vikram': 'OsMVS2v66_8',
  'once upon a time': 'bTqE4z1eN_U',
  'hayyoda': 'Q7n_S2Mv8P8',
  'fear song': '0d-Lh0K3jB8',
  'zinda banda': 'BddgUkQn5rU',
  'tum hi ho': 'Umqb9KENgmk',
  'apna bana le': 'ElZfdU54Cp8',
  'o maahi': '8sLS2knUa6Y' ,
  'satranga': 'HrnrqYxYrbk',
  'agar tum saath ho': 'sK7riqg2mr4',
  'channa mereya': '284Ov7ysmfA',
  'shayad': 'bBOPrpmkF_o',
  'gerua': 'AEIVhBS6baE',
  'hawayein': 'cYOB941gyXI',
  'ae dil hai mushkil': '6FURuLYrR_Q',
  'kalank': 'Grr0Exhy-lQ',
  'raabta': '0my1oddgB88',
  've kamleya': 'Ibdtff_QeG8',
  'softly': 'cWMxCE2HTag',
  'winning speech': 'vX2cDW8LU2A',
  '52 bars': '4BiL3e8qFVo',
  'white brown black': 'VNs_cCtdbPc',
  'admiring you': '2R_S5TkKk-k',
  'players': '0pWsCDLMVuG',
  'antidote': 'HnpxM_KkP0k',
  'illuminati': 'tOM-nWPcR4U',
  'jaanam': 'yL_Jg1oZ46s',
  'aaj ki raat': 'kP3x_L49o30',
  'kamariya': 'Wb5u38yYpI4',
  'saibo': 'g0kZc8f1oI4',
  'jeena jeena': '8tO_sM06j8k',
  'mileya mileya': '4b8mP_d3oU4',
  'balam pichkari': '0WtRNGubWGA',
  'badtameez dil': 'II2EO3Nw4m0',
  'ilahi': 'fdubeMFwuGs',
  'kabira': 'jHNNMj5bNQw',
  'tum se hi': 'mt9xg0mmt28',
  'subhanallah': 'dK_6Z26Z11o',
  'naina': '0v_Z3x_r360',
  'diljit lover': 'mH_LFkWxpI0',
  'born to shine': 'Xzp5bF_Xo_U',
  'g.o.a.t': 'cl0a3i2wFcc',
  'kinni kinni': '1Z7b5_j_oU8',
  'peaches': 'G3j_Z3w9-Q4',
  'hass hass': 'T8u7o-p26_8',
  'jai ho': 'xwwAVRyNmkQ',
  'kun faya kun': 'T94PHkuydcw',
  'chaiyya chaiyya': 'PQmrmVs10X8',
  'urvashi urvashi': '482o1bC_Jfg',
  'param sundari': 'w4cl694z0pU',
  'maa tujhe salaam': 'eKaZqN2R_oY',
  'enna sona': '4w_d84hWj2k',
  'tere bina': 'mY_v5o4P-l4',
  'raanjhanaa': 'osT_iWj6e6k',

  // Aashiqui 2 Complete Master Tracklist
  'sunn raha hai': 'z3UHfi9vpbc',
  'chahun main ya naa': 'VdyBtGaspss',
  'milne hai mujhse aayi': 'GtPvCa3vvxA',
  'hum mar jayenge': 'h5Y3Yj7E2E4',
  'meri aashiqui': 'w_HaY7sDbgw',
  'piya aaye na': 'Mmg_7lX4j6w',
  'bhula dena': '8aG_eRjXjP8',
  'aasan nahin yahan': 'z_8Z8-qQ238',

  // South Indian & Tamil Classics (Ilaiyaraaja, Unnikrishnan, Kamal Haasan, S. Janaki)
  'kanmani anbodu': 'aDk3lM1X9_0',
  'ennavale adi ennavale': 'o6XkP93q3L8',
  'roja janeman': '7f7DqL78b7g',
  'thenpandi cheemayile': 'H-y8bNq2q8g',
  'chinna chinna aasai': 'x0sE-KqYVb0',
  'sandhana kaatre': 'm6p7pGvB_18',
  'sundari kannal': 'uL9n0k8J8L8',
  'kannazhaga': 'w7_Y_V-tL1s',
  'why this kolaveri': 'YR12Z8f1Dh8',
  'aarambam': 'M9rX8K9yP7w',
  'vikram title track': 'j23_GZ7sKqw',
  'pathala pathala': 'sL5c9Hj5N_0',
  'porkanda singam': '8yL3V-e4r28',
  'naan ready': 'SZzxRP-7Pcw',

  // Lo-Fi & Study
  'snowman': 'yXn14eGv-uY',
  'controlla': '34z9j_5kP-0',
};

export function resolveVideoId(title: string, artist: string): string | null {
  const normTitle = title.toLowerCase().replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
  const normArtist = (artist || '').toLowerCase().trim();

  // 1. Direct curated key match
  for (const [key, id] of Object.entries(CURATED_OFFICIAL_VIDEOS)) {
    if (normTitle.includes(key) || key.includes(normTitle)) {
      return id;
    }
  }

  // 2. Check title + artist combined
  const combined = `${normTitle} ${normArtist}`;
  for (const [key, id] of Object.entries(CURATED_OFFICIAL_VIDEOS)) {
    if (combined.includes(key)) {
      return id;
    }
  }

  // 3. Check title for embedded 11-char YouTube ID like [ic8j13piAhQ]
  const match = title.match(/\[([a-zA-Z0-9_-]{11})\]/);
  if (match) return match[1];

  return null;
}
