import React from 'react';
import { motion } from 'motion/react';

interface HeatmapProps {
  data: Record<string, { latency: number, errors: number }>;
  theme?: 'dark' | 'light';
}

const Heatmap: React.FC<HeatmapProps> = ({ data, theme = 'dark' }) => {
  const keyboard = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  const getColor = (key: string) => {
    const stats = data[key];
    if (!stats) return theme === 'dark' ? 'bg-white/5 text-white/20' : 'bg-gray-100 text-gray-400';
    
    // Performance color logic
    // Latency > 300ms or Errors > 0 = Bad
    if (stats.errors > 0) return 'bg-red-500 text-white border-red-400';
    if (stats.latency > 350) return 'bg-orange-500 text-white border-orange-400';
    if (stats.latency > 200) return 'bg-yellow-500 text-black border-yellow-400';
    return 'bg-green-500 text-white border-green-400';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-[10px] font-black italic tracking-widest uppercase opacity-30 mb-2">TYPING HEATMAP</div>
      <div className="flex flex-col gap-1 md:gap-2">
        {keyboard.map((row, i) => (
          <div key={i} className="flex justify-center gap-1 md:gap-2">
            {row.map(key => (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                key={key}
                className={`w-7 h-7 md:w-9 md:h-9 rounded-lg flex items-center justify-center font-black italic text-xs uppercase border-b-4 transition-all shadow-lg ${getColor(key)}`}
              >
                {key}
              </motion.div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-4 text-[8px] font-bold tracking-widest uppercase opacity-50">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> FAST</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500" /> SLOW</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> ERRORS</div>
      </div>
    </div>
  );
};

export default Heatmap;
