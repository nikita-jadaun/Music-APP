/**
 * Extracts the singer/artist name from track metadata.
 */
const KNOWN_ARTISTS = [
  'arijit singh', 'arijit', 'atif aslam', 'atif', 'neha kakkar', 'tony kakkar', 'sonu nigam',
  'shreya ghoshal', 'sunidhi chauhan', 'jubin nautiyal', 'jubin', 'darshan raval',
  'pritam', 'a.r. rahman', 'ar rahman', 'rahman', 'anirudh', 'anirudh ravichander',
  'diljit dosanjh', 'diljit', 'sidhu moosewala', 'karan aujla', 'ap dhillon',
  'gurdas maan', 'ammy virk', 'b praak', 'jaani', 'guru randhawa', 'hardy sandhu',
  'badshah', 'honey singh', 'yo yo honey singh', 'raftaar', 'divine', 'emiway bantai',
  'king', 'mc stan', 'seedhe maut', 'kr$na', 'krsna', 'vishal mishra', 'stebin ben',
  'asees kaur', 'tulsi kumar', 'dhvani bhanushali', 'kanika kapoor', 'mika singh',
  'sukhwinder singh', 'kailash kher', 'rahat fateh ali khan', 'nusrat fateh ali khan',
  'mohit chauhan', 'kk', 'shaan', 'lucky ali', 'papon', 'armaan malik', 'amal mallik',
  'alka yagnik', 'udit narayan', 'kumar sanu', 'kishore kumar', 'lata mangeshkar',
  'mohammad rafi', 'mukesh', 'anuv jain', 'prateek kuhad', 'jasleen royal',
  'ed sheeran', 'taylor swift', 'the weeknd', 'coldplay', 'drake', 'justin bieber',
  'billie eilish', 'dualipa', 'dua lipa', 'post malone', 'bruno mars', 'eminem',
  'adele', 'rihanna', 'shakira', 'shawn mendes', 'charlie puth', 'alan walker',
  'imagine dragons', 'maroon 5', 'one direction', 'zayn', 'harry styles'
];

export const extractArtistFromTrack = (track) => {
  if (!track) return 'Singer';

  const uploader = (track.uploader || '').trim();
  const title = (track.title || '').trim();
  const fullText = `${uploader} ${title}`.toLowerCase();

  // 1. Check if any known artist name appears in uploader or title
  for (const name of KNOWN_ARTISTS) {
    const regex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(fullText)) {
      // Capitalize first letters nicely
      return name
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  }

  // 2. If uploader is not a generic label, clean and use uploader
  let cleanedUploader = uploader
    .replace(/\s*-\s*Topic$/i, '')
    .replace(/VEVO$/i, '')
    .replace(/\s*Official\s*(Channel|Music)?$/i, '')
    .replace(/\s*Records$/i, '')
    .trim();

  const genericLabels = [
    't-series', 'tseries', 'zee music', 'sony music', 'speed records',
    'yrf', 'tips official', 'aditya music', 'geet mp3', 'white hill',
    'saregama', 'desimusicfactory', 'universal music', 'warner music',
    'eros now', 'b4u'
  ];

  const isGeneric = genericLabels.some((lbl) =>
    cleanedUploader.toLowerCase().includes(lbl)
  );

  if (!isGeneric && cleanedUploader.length > 2) {
    return cleanedUploader;
  }

  // 3. Fallback: Parse title segments
  const segments = title
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .split(/[|•\-–—:]/)
    .map((s) => s.trim())
    .filter(
      (s) =>
        s.length > 2 &&
        !/full\s*(video|song|audio)|official|lyrics|lyrical|4k|hd|teaser|trailer|remix|status/i.test(
          s
        )
    );

  if (segments.length >= 2) {
    return segments[1].slice(0, 30).trim();
  } else if (segments.length === 1) {
    return segments[0].slice(0, 30).trim();
  }

  return cleanedUploader || 'Music';
};
