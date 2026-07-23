import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerProgress } from '../types';
import { AvatarDisplay } from './AvatarDisplay';

interface RaceViewProps {
  players: PlayerProgress[];
  currentUserId?: string;
  trackLength?: number;
  theme?: 'dark' | 'light';
}

const RaceView: React.FC<RaceViewProps> = ({ players = [], currentUserId, theme = 'dark' }) => {
  if (!players || players.length === 0) {
    return (
      <div className="w-full h-48 rounded-2xl overflow-hidden bg-black/20 flex items-center justify-center border border-white/5 backdrop-blur-xl">
        <span className="text-white/20 font-black italic tracking-widest animate-pulse uppercase">Warming up engines...</span>
      </div>
    );
  }

  return (
    <div className={`w-full rounded-2xl overflow-hidden border p-1 md:p-2 transition-all shadow-xl ${
      theme === 'dark' 
        ? 'bg-neutral-900 border-white/5 shadow-black/50' 
        : 'bg-slate-100 border-gray-200 shadow-gray-200/50'
    }`}>
      <div className="relative space-y-0.5">
        {/* Asphalt Road Background */}
        <div className={`absolute inset-y-0 left-[5%] right-[5%] rounded-2xl overflow-hidden ${
          theme === 'dark' ? 'bg-neutral-800' : 'bg-slate-300'
        }`}>
          {/* Animated Road Lines */}
          <div className="absolute inset-0 flex flex-col justify-around pointer-events-none opacity-20">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`h-px w-full border-t border-dashed ${theme === 'dark' ? 'border-white' : 'border-black'}`} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {players.map((player, idx) => (
            <div key={player.id} className="relative h-8 md:h-9 flex items-center group">
              {/* Individual Lane with Road Markings */}
              <div className={`absolute inset-x-[5%] inset-y-1 rounded-xl transition-colors flex items-center px-8 ${
                theme === 'dark' 
                  ? 'bg-neutral-900/50 group-hover:bg-neutral-800' 
                  : 'bg-slate-200 group-hover:bg-slate-100'
              }`}>
                {/* Lane Divider */}
                <div className={`absolute bottom-0 left-0 right-0 h-px border-b border-dashed opacity-10 ${
                  theme === 'dark' ? 'border-white' : 'border-black'
                }`} />
              </div>

              {/* Username Label */}
              <div className={`absolute left-0 w-[5%] text-[9px] font-black truncate pr-2 text-right uppercase tracking-tighter ${
                theme === 'dark' ? 'text-white/20' : 'text-gray-400'
              }`}>
                #{idx + 1}
              </div>

              {/* The Car / Racer */}
              <motion.div
                initial={false}
                animate={{ 
                  left: `${5 + (player.progress * 85)}%`,
                }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
                className="absolute z-10 -translate-x-1/2 flex flex-col items-center"
              >
                {/* Player Name, Avatar & WPM */}
                <div className="absolute -top-10 flex flex-col items-center whitespace-nowrap">
                  <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/10 shadow-md">
                    <AvatarDisplay avatarId={player.avatar} size="xs" showBorder={false} />
                    <span 
                      className={`text-[8px] font-extrabold uppercase tracking-tight max-w-[90px] truncate ${theme === 'dark' ? 'text-white' : 'text-gray-200'}`}
                      title={player.username}
                    >
                      {player.username}
                    </span>
                  </div>
                  <motion.div 
                    animate={{ scale: player.wpm > 0 ? [1, 1.1, 1] : 1 }}
                    className={`mt-0.5 px-1 py-0.5 rounded text-[8px] font-black italic shadow-lg ${
                      theme === 'dark' 
                        ? 'text-blue-400' 
                        : 'text-blue-600'
                    }`}
                  >
                    {Math.round(player.wpm)} <span className="text-[6px] opacity-50">WPM</span>
                  </motion.div>
                </div>

                {/* Detailed Car Asset */}
                <div className="relative group/car scale-75 md:scale-90">
                  {/* Car Shadow */}
                  <div className="absolute inset-0 translate-y-2 translate-x-1 blur-md bg-black/40 rounded-lg scale-90" />
                  
                  {/* Car Body */}
                  <div className={`relative w-12 h-6 md:w-14 md:h-7 rounded-lg overflow-hidden flex flex-col p-1 border-b-4 ${
                    player.id === currentUserId ? 'bg-blue-600 border-blue-800' : 'bg-red-600 border-red-800'
                  }`}>
                    {/* Windshield */}
                    <div className="w-1/3 h-full bg-sky-300/30 rounded-sm ml-auto mr-2 border border-sky-200/20" />
                    
                    {/* Headlights */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-1 pr-0.5">
                      <div className="w-1 h-1 bg-yellow-200 rounded-full shadow-[0_0_8px_white]" />
                      <div className="w-1 h-1 bg-yellow-200 rounded-full shadow-[0_0_8px_white]" />
                    </div>

                    {/* Brake Lights */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-1 pl-0.5">
                      <div className="w-1 h-1 bg-red-400 rounded-full" />
                      <div className="w-1 h-1 bg-red-400 rounded-full" />
                    </div>
                  </div>

                  {/* Wheels */}
                  <div className="absolute -bottom-1 inset-x-2 flex justify-between px-1">
                    <div className="w-2 h-1 bg-black rounded-t-sm" />
                    <div className="w-2 h-1 bg-black rounded-t-sm" />
                  </div>
                  <div className="absolute -top-1 inset-x-2 flex justify-between px-1">
                    <div className="w-2 h-1 bg-black rounded-b-sm" />
                    <div className="w-2 h-1 bg-black rounded-b-sm" />
                  </div>
                </div>
              </motion.div>

              {/* Progress Indicator */}
              <div className={`absolute right-0 w-[5%] text-[8px] font-mono font-bold pl-2 ${
                theme === 'dark' ? 'text-white/20' : 'text-gray-300'
              }`}>
                {Math.round(player.progress * 100)}%
              </div>
            </div>
          ))}
        </AnimatePresence>

        {/* Finish Line Pattern */}
        <div className="absolute right-[5%] top-0 bottom-0 w-4 flex flex-col opacity-10 pointer-events-none">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="flex flex-1">
              <div className={`flex-1 ${i % 2 === 0 ? 'bg-white' : 'bg-black'}`} />
              <div className={`flex-1 ${i % 2 === 1 ? 'bg-white' : 'bg-black'}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Track HUD */}
      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center px-4 md:px-8">
        <div className="flex gap-8">
          <div className="flex flex-col">
            <span className={`text-[7px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/20' : 'text-gray-400'}`}>Track Status</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              <span className={`text-[9px] font-black italic tracking-tighter ${theme === 'dark' ? 'text-white/80' : 'text-gray-900'}`}>RACING</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full border flex items-center gap-2 ${
            theme === 'dark' ? 'bg-black/40 border-white/10' : 'bg-white border-gray-100'
          }`}>
            <div className="w-1 h-1 rounded-full bg-blue-500" />
            <span className={`text-[8px] font-black italic tracking-widest uppercase ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
              Telemetry
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaceView;
