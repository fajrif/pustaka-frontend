// Color mappings for book-related badges
// Uses Tailwind-compatible class names

export const JENIS_BUKU_COLORS = {
  'LKS': {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200'
  },
  'PG': {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200'
  },
  // Default fallback
  'default': {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200'
  }
};

export const JENJANG_STUDI_COLORS = {
  'SD': {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200'
  },
  'SMP': {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200'
  },
  'SMA': {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200'
  },
  'SMK': {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-200'
  },
  'default': {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200'
  }
};

// Color palette for Merk Buku (dynamic assignment based on hash)
const MERK_BUKU_COLOR_PALETTE = [
  { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200' },
  { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
  { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
  { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200' },
  { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-200' },
  { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200' },
  { bg: 'bg-lime-100', text: 'text-lime-800', border: 'border-lime-200' },
];

/**
 * Get color classes for Merk Buku based on code
 * Uses hash-based assignment for consistent colors
 */
export const getMerkBukuColor = (code) => {
  if (!code) return MERK_BUKU_COLOR_PALETTE[0];
  // Generate consistent color based on string hash
  const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return MERK_BUKU_COLOR_PALETTE[hash % MERK_BUKU_COLOR_PALETTE.length];
};

/**
 * Get color classes for Jenis Buku based on code
 */
export const getJenisBukuColor = (code) => {
  return JENIS_BUKU_COLORS[code] || JENIS_BUKU_COLORS['default'];
};

/**
 * Get color classes for Jenjang Studi based on code
 */
export const getJenjangStudiColor = (code) => {
  return JENJANG_STUDI_COLORS[code] || JENJANG_STUDI_COLORS['default'];
};
