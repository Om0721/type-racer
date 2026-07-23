/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AvatarItem {
  id: string;
  name: string;
  category: 'boys' | 'girls' | 'gaming' | 'cartoon' | 'animals' | 'abstract' | 'random';
  bgGradient: string;
  borderColor: string;
  accentHex: string;
}

export const AVATAR_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'boys', label: 'Boys' },
  { id: 'girls', label: 'Girls' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'cartoon', label: 'Cartoon' },
  { id: 'animals', label: 'Animals' },
  { id: 'abstract', label: 'Abstract' },
  { id: 'random', label: 'Random Fun' },
] as const;

export const AVATARS: AvatarItem[] = [
  // BOYS (4)
  { id: 'avatar_boy_1', name: 'Speed Boy Alex', category: 'boys', bgGradient: 'from-blue-600 to-indigo-900', borderColor: 'border-blue-400', accentHex: '#3b82f6' },
  { id: 'avatar_boy_2', name: 'Cyber Boy Kai', category: 'boys', bgGradient: 'from-cyan-600 to-blue-900', borderColor: 'border-cyan-400', accentHex: '#06b6d4' },
  { id: 'avatar_boy_3', name: 'Cap Racer Max', category: 'boys', bgGradient: 'from-slate-700 to-slate-900', borderColor: 'border-slate-400', accentHex: '#64748b' },
  { id: 'avatar_boy_4', name: 'Racer Ethan', category: 'boys', bgGradient: 'from-sky-500 to-indigo-800', borderColor: 'border-sky-300', accentHex: '#0284c7' },

  // GIRLS (4)
  { id: 'avatar_girl_1', name: 'Speed Queen Maya', category: 'girls', bgGradient: 'from-pink-600 to-rose-900', borderColor: 'border-pink-400', accentHex: '#ec4899' },
  { id: 'avatar_girl_2', name: 'Neon Valkyrie Zara', category: 'girls', bgGradient: 'from-purple-600 to-indigo-900', borderColor: 'border-purple-400', accentHex: '#a855f7' },
  { id: 'avatar_girl_3', name: 'Gamer Chloe', category: 'girls', bgGradient: 'from-fuchsia-600 to-pink-900', borderColor: 'border-fuchsia-400', accentHex: '#d946ef' },
  { id: 'avatar_girl_4', name: 'Racer Luna', category: 'girls', bgGradient: 'from-violet-600 to-purple-900', borderColor: 'border-violet-400', accentHex: '#8b5cf6' },

  // GAMING (4)
  { id: 'avatar_game_1', name: 'Gamepad Master', category: 'gaming', bgGradient: 'from-emerald-600 to-teal-900', borderColor: 'border-emerald-400', accentHex: '#10b981' },
  { id: 'avatar_game_2', name: 'Pixel Helmet', category: 'gaming', bgGradient: 'from-amber-600 to-orange-900', borderColor: 'border-amber-400', accentHex: '#f59e0b' },
  { id: 'avatar_game_3', name: 'Arcade Pilot', category: 'gaming', bgGradient: 'from-red-600 to-rose-950', borderColor: 'border-red-400', accentHex: '#ef4444' },
  { id: 'avatar_game_4', name: 'VR Striker', category: 'gaming', bgGradient: 'from-indigo-600 to-violet-950', borderColor: 'border-indigo-400', accentHex: '#6366f1' },

  // CARTOON (4)
  { id: 'avatar_cart_1', name: 'Cheeky Toon', category: 'cartoon', bgGradient: 'from-yellow-500 to-amber-800', borderColor: 'border-yellow-300', accentHex: '#eab308' },
  { id: 'avatar_cart_2', name: 'Rocket Champ', category: 'cartoon', bgGradient: 'from-orange-500 to-red-800', borderColor: 'border-orange-400', accentHex: '#f97316' },
  { id: 'avatar_cart_3', name: 'Superstar Toon', category: 'cartoon', bgGradient: 'from-blue-500 to-cyan-800', borderColor: 'border-blue-300', accentHex: '#3b82f6' },
  { id: 'avatar_cart_4', name: 'Cosmic Alien', category: 'cartoon', bgGradient: 'from-lime-600 to-emerald-950', borderColor: 'border-lime-400', accentHex: '#84cc16' },

  // ANIMALS (4)
  { id: 'avatar_anim_1', name: 'Turbo Cheetah', category: 'animals', bgGradient: 'from-amber-500 to-yellow-800', borderColor: 'border-amber-300', accentHex: '#f59e0b' },
  { id: 'avatar_anim_2', name: 'Apex Fox', category: 'animals', bgGradient: 'from-orange-600 to-amber-900', borderColor: 'border-orange-400', accentHex: '#ea580c' },
  { id: 'avatar_anim_3', name: 'Cyber Panda', category: 'animals', bgGradient: 'from-zinc-700 to-neutral-900', borderColor: 'border-zinc-400', accentHex: '#a1a1aa' },
  { id: 'avatar_anim_4', name: 'Lightning Eagle', category: 'animals', bgGradient: 'from-sky-600 to-blue-950', borderColor: 'border-sky-400', accentHex: '#0284c7' },

  // ABSTRACT (4)
  { id: 'avatar_abst_1', name: 'Neon Hexagon', category: 'abstract', bgGradient: 'from-indigo-700 to-purple-950', borderColor: 'border-indigo-400', accentHex: '#6366f1' },
  { id: 'avatar_abst_2', name: 'Prism Shield', category: 'abstract', bgGradient: 'from-rose-600 to-pink-900', borderColor: 'border-rose-400', accentHex: '#f43f5e' },
  { id: 'avatar_abst_3', name: 'Vortex Ring', category: 'abstract', bgGradient: 'from-teal-600 to-cyan-900', borderColor: 'border-teal-400', accentHex: '#14b8a6' },
  { id: 'avatar_abst_4', name: 'Orbital Pulse', category: 'abstract', bgGradient: 'from-purple-700 to-slate-900', borderColor: 'border-purple-400', accentHex: '#a855f7' },

  // RANDOM FUN (4)
  { id: 'avatar_fun_1', name: 'Nitro Pizza', category: 'random', bgGradient: 'from-red-500 to-amber-800', borderColor: 'border-red-400', accentHex: '#ef4444' },
  { id: 'avatar_fun_2', name: 'Golden Crown', category: 'random', bgGradient: 'from-yellow-600 to-amber-900', borderColor: 'border-yellow-400', accentHex: '#eab308' },
  { id: 'avatar_fun_3', name: 'Fire Flame', category: 'random', bgGradient: 'from-orange-600 to-red-900', borderColor: 'border-orange-400', accentHex: '#f97316' },
  { id: 'avatar_fun_4', name: 'Lucky Dice', category: 'random', bgGradient: 'from-blue-600 to-slate-900', borderColor: 'border-blue-400', accentHex: '#3b82f6' }
];

export const DEFAULT_AVATAR_ID = 'avatar_boy_1';

export function getAvatarById(id?: string): AvatarItem {
  if (!id) return AVATARS[0];
  const found = AVATARS.find(a => a.id === id);
  return found || AVATARS[0];
}
