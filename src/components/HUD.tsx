/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gauge, Target, Zap, Timer, Trophy } from 'lucide-react';

interface HUDProps {
  wpm: number;
  accuracy: number;
  combo: number;
  nitro: number;
  timer: number;
  rank: number;
  vertical?: boolean;
}

const HUD: React.FC<HUDProps & { theme?: 'dark' | 'light' }> = ({ wpm, accuracy, combo, nitro, timer, rank, theme = 'dark', vertical }) => {
  const speedKmh = Math.round(wpm * 2.5);

  if (vertical) {
    return (
      <div className="flex flex-col gap-4 w-48 pointer-events-none">
        <StatCard
          theme={theme}
          icon={<Timer className="w-5 h-5 text-red-400" />}
          label="TIMER"
          value={formatTime(timer)}
          unit=""
          color="border-red-500/30"
          vertical
        />
        <StatCard
          theme={theme}
          icon={<Gauge className="w-5 h-5 text-blue-400" />}
          label="WPM"
          value={`${wpm}`}
          unit=""
          color="border-blue-500/30"
          vertical
        />
        <StatCard
          theme={theme}
          icon={<Target className="w-5 h-5 text-green-400" />}
          label="ACCURACY"
          value={`${Math.round(accuracy)}`}
          unit="%"
          color="border-green-500/30"
          vertical
        />
        {rank > 0 && (
          <StatCard
            theme={theme}
            icon={<Trophy className="w-5 h-5 text-yellow-400" />}
            label="RANK"
            value={`${rank}`}
            unit={getOrdinal(rank)}
            color="border-yellow-500/30"
            vertical
          />
        )}
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-8 flex flex-col md:flex-row justify-between items-center md:items-end pointer-events-none gap-6">
      {/* Left HUD: WPM & Accuracy */}
      <div className="flex gap-4">
        <StatCard
          theme={theme}
          icon={<Gauge className="w-5 h-5 text-blue-400" />}
          label="SPEED"
          value={`${speedKmh}`}
          unit="KM/H"
          subValue={`${wpm} WPM`}
        />
        <StatCard
          theme={theme}
          icon={<Target className="w-5 h-5 text-orange-400" />}
          label="ACCURACY"
          value={`${Math.round(accuracy)}`}
          unit="%"
          color="border-orange-500/30"
        />
      </div>

      {/* Center HUD: Combo & Nitro */}
      <div className="flex flex-col items-center gap-4 mb-4">
        <AnimatePresence>
          {combo > 5 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="bg-blue-600 text-white px-6 py-1 rounded-full font-bold italic tracking-tighter shadow-[0_0_20px_rgba(37,99,235,0.6)]"
            >
              COMBO x{combo}
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className={`w-64 h-3 rounded-full overflow-hidden border backdrop-blur-md ${theme === 'dark' ? 'bg-white/10 border-white/5' : 'bg-gray-200 border-gray-300'}`}>
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600"
            animate={{ width: `${nitro}%` }}
            transition={{ type: 'spring', damping: 20 }}
          />
        </div>
        <div className="text-[10px] text-blue-400 font-bold tracking-widest uppercase">Nitro Power</div>
      </div>

      {/* Right HUD: Timer & Rank */}
      <div className="flex gap-4">
        <StatCard
          theme={theme}
          icon={<Timer className="w-5 h-5 text-red-400" />}
          label="TIME"
          value={formatTime(timer)}
          unit=""
          color="border-red-500/30"
        />
        <StatCard
          theme={theme}
          icon={<Trophy className="w-5 h-5 text-yellow-400" />}
          label="POSITION"
          value={`${rank}`}
          unit={getOrdinal(rank)}
          color="border-yellow-500/30"
        />
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, unit, subValue, color = "border-blue-500/30", theme, vertical }: any) => (
  <div className={`backdrop-blur-xl border-l-4 ${color} rounded-r-xl p-4 transition-all ${vertical ? 'w-full' : 'w-40'} shadow-2xl ${theme === 'dark' ? 'bg-black/60' : 'bg-white/90 shadow-gray-200'}`}>
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <span className={`text-[10px] font-bold tracking-wider ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>{label}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className={`${vertical ? 'text-2xl' : 'text-3xl'} font-black italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{value}</span>
      <span className={`text-xs font-bold ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>{unit}</span>
    </div>
    {subValue && !vertical && <div className="text-[10px] text-blue-400 font-mono mt-1">{subValue}</div>}
  </div>
);

const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return (s[(v - 20) % 10] || s[v] || s[0]);
};

export default HUD;
