/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { AVATARS, AVATAR_CATEGORIES } from '../data/avatars';
import { AvatarDisplay } from './AvatarDisplay';

interface AvatarPickerProps {
  selectedAvatarId: string;
  onSelectAvatar: (avatarId: string) => void;
  theme?: 'dark' | 'light';
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  selectedAvatarId,
  onSelectAvatar,
  theme = 'dark'
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredAvatars = activeCategory === 'all'
    ? AVATARS
    : AVATARS.filter(a => a.category === activeCategory);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white/70' : 'text-gray-700'}`}>
          Choose Profile Avatar
        </label>
        <span className={`text-[10px] font-mono ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>
          {AVATARS.length} Available
        </span>
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {AVATAR_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-blue-600 text-white shadow-md'
                : theme === 'dark'
                  ? 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Avatar Grid */}
      <div className={`grid grid-cols-4 sm:grid-cols-7 gap-3 max-h-56 overflow-y-auto p-2 rounded-2xl border ${
        theme === 'dark' ? 'bg-black/40 border-white/10' : 'bg-gray-50 border-gray-200'
      }`}>
        {filteredAvatars.map(avatar => {
          const isSelected = selectedAvatarId === avatar.id;
          return (
            <motion.button
              key={avatar.id}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectAvatar(avatar.id)}
              className={`relative flex flex-col items-center justify-center p-2 rounded-2xl border transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/20 ring-2 ring-blue-500/50 shadow-lg'
                  : theme === 'dark'
                    ? 'border-white/5 bg-white/5 hover:border-white/20'
                    : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <AvatarDisplay avatarId={avatar.id} size="md" showBorder={!isSelected} />
              <span className={`mt-1 text-[9px] font-bold truncate max-w-full text-center ${
                isSelected ? 'text-blue-400' : theme === 'dark' ? 'text-white/60' : 'text-gray-600'
              }`}>
                {avatar.name.split(' ')[0]}
              </span>

              {isSelected && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default AvatarPicker;
