/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Gamepad2, Crown, Flame, Dices, Shield, Zap, Sparkles, 
  Cat, Dog, Bird, Skull, Bot, User, Cpu, Pizza, Rocket,
  Glasses, Star, Radio, Headphones
} from 'lucide-react';
import { getAvatarById } from '../data/avatars';

interface AvatarDisplayProps {
  avatarId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBorder?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-xl',
  xl: 'w-20 h-20 text-2xl',
  '2xl': 'w-24 h-24 text-3xl',
};

const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
  xl: 'w-10 h-10',
  '2xl': 'w-12 h-12',
};

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ 
  avatarId = 'avatar_boy_1', 
  size = 'md', 
  className = '',
  showBorder = true
}) => {
  const avatar = getAvatarById(avatarId);

  const renderVectorContent = () => {
    switch (avatar.id) {
      // BOYS
      case 'avatar_boy_1':
        return <User className={`${iconSizes[size]} text-blue-200`} />;
      case 'avatar_boy_2':
        return <Glasses className={`${iconSizes[size]} text-cyan-200`} />;
      case 'avatar_boy_3':
        return <Headphones className={`${iconSizes[size]} text-slate-200`} />;
      case 'avatar_boy_4':
        return <Zap className={`${iconSizes[size]} text-sky-200`} />;

      // GIRLS
      case 'avatar_girl_1':
        return <Crown className={`${iconSizes[size]} text-pink-200`} />;
      case 'avatar_girl_2':
        return <Sparkles className={`${iconSizes[size]} text-purple-200`} />;
      case 'avatar_girl_3':
        return <Headphones className={`${iconSizes[size]} text-fuchsia-200`} />;
      case 'avatar_girl_4':
        return <Star className={`${iconSizes[size]} text-violet-200`} />;

      // GAMING
      case 'avatar_game_1':
        return <Gamepad2 className={`${iconSizes[size]} text-emerald-200`} />;
      case 'avatar_game_2':
        return <Cpu className={`${iconSizes[size]} text-amber-200`} />;
      case 'avatar_game_3':
        return <Radio className={`${iconSizes[size]} text-red-200`} />;
      case 'avatar_game_4':
        return <Bot className={`${iconSizes[size]} text-indigo-200`} />;

      // CARTOON
      case 'avatar_cart_1':
        return <Bot className={`${iconSizes[size]} text-yellow-200`} />;
      case 'avatar_cart_2':
        return <Rocket className={`${iconSizes[size]} text-orange-200`} />;
      case 'avatar_cart_3':
        return <Star className={`${iconSizes[size]} text-blue-200`} />;
      case 'avatar_cart_4':
        return <Skull className={`${iconSizes[size]} text-lime-200`} />;

      // ANIMALS
      case 'avatar_anim_1':
        return <Cat className={`${iconSizes[size]} text-amber-200`} />;
      case 'avatar_anim_2':
        return <Dog className={`${iconSizes[size]} text-orange-200`} />;
      case 'avatar_anim_3':
        return <Cat className={`${iconSizes[size]} text-zinc-200`} />;
      case 'avatar_anim_4':
        return <Bird className={`${iconSizes[size]} text-sky-200`} />;

      // ABSTRACT
      case 'avatar_abst_1':
        return <Shield className={`${iconSizes[size]} text-indigo-200`} />;
      case 'avatar_abst_2':
        return <Sparkles className={`${iconSizes[size]} text-rose-200`} />;
      case 'avatar_abst_3':
        return <Zap className={`${iconSizes[size]} text-teal-200`} />;
      case 'avatar_abst_4':
        return <Cpu className={`${iconSizes[size]} text-purple-200`} />;

      // RANDOM
      case 'avatar_fun_1':
        return <Pizza className={`${iconSizes[size]} text-red-200`} />;
      case 'avatar_fun_2':
        return <Crown className={`${iconSizes[size]} text-yellow-200`} />;
      case 'avatar_fun_3':
        return <Flame className={`${iconSizes[size]} text-orange-200`} />;
      case 'avatar_fun_4':
        return <Dices className={`${iconSizes[size]} text-blue-200`} />;

      default:
        return <User className={`${iconSizes[size]} text-white`} />;
    }
  };

  return (
    <div 
      className={`relative shrink-0 rounded-2xl flex items-center justify-center bg-gradient-to-br ${avatar.bgGradient} shadow-md overflow-hidden transition-transform ${sizeClasses[size]} ${showBorder ? `border-2 ${avatar.borderColor}` : ''} ${className}`}
      title={avatar.name}
    >
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
      <div className="relative z-10 flex items-center justify-center">
        {renderVectorContent()}
      </div>
    </div>
  );
};

export default AvatarDisplay;
