/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Zap, Target, Timer, Coins, Star, ArrowRight, User, Keyboard, BarChart3 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PlayerProgress } from '../types';
import Heatmap from './Heatmap';
import AdvancedStats from './AdvancedStats';
import { AvatarDisplay } from './AvatarDisplay';

interface ScoreCardProps {
  stats: {
    position: number;
    wpm: number;
    accuracy: number;
    time: number;
    combo: number;
    points: number;
    rewards?: {
      xp?: number;
      level?: number;
      totalXp?: number;
      coins?: number;
      points?: number;
    };
    heatmap?: Record<string, { latency: number, errors: number }>;
  };
  players?: PlayerProgress[];
  currentUserId?: string;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

const ScoreCard: React.FC<ScoreCardProps> = ({ stats, players = [], currentUserId, onClose, theme = 'dark' }) => {
  const [timeLeft, setTimeLeft] = React.useState(10);
  const [activeTab, setActiveTab] = React.useState<'performance' | 'analysis'>('performance');
  const timerRef = React.useRef<any>(null);
  const hasClosedRef = React.useRef(false);

  React.useEffect(() => {
    if (stats.position === 1) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#f59e0b', '#ef4444']
      });
    }
  }, [stats.position]);

  React.useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  React.useEffect(() => {
    if (timeLeft === 0 && !hasClosedRef.current) {
      hasClosedRef.current = true;
      onClose();
    }
  }, [timeLeft, onClose]);

  const getMotivationalMessage = () => {
    if (stats.position === 1) return "Dominance! You're the undisputed king of the track.";
    if (stats.wpm > 60) return "Excellent! You improved your typing speed. Keep racing to reach 100 WPM!";
    if (stats.accuracy > 95) return "Precision Specialist! Your accuracy is your greatest weapon.";
    return "Great effort! Consistency is the key to becoming a Type Legend.";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
    >
      <div className={`border rounded-[2rem] overflow-hidden max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl transition-all ${theme === 'dark' ? 'bg-gradient-to-br from-neutral-900 to-black border-white/10 shadow-black' : 'bg-white border-gray-200'}`}>
        <div className="bg-blue-600 p-4 md:p-5 text-center relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="relative z-10"
          >
            <Trophy className="w-8 h-8 md:w-10 md:h-10 text-yellow-400 mx-auto mb-1 drop-shadow" />
            <h2 className="text-xl md:text-2xl font-black italic text-white tracking-tighter">RACE FINISHED</h2>
            <p className="text-blue-100 font-bold tracking-widest text-[10px] md:text-xs mt-1">{getMotivationalMessage()}</p>
          </motion.div>
        </div>

        <div className="p-4 md:p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* Tab Switcher */}
          <div className="flex gap-1.5 p-1 rounded-xl bg-black/10 self-start shrink-0">
            <button 
              onClick={() => setActiveTab('performance')}
              className={`px-3.5 py-1.5 rounded-lg font-black italic text-[10px] transition-all flex items-center gap-1.5 ${activeTab === 'performance' ? 'bg-blue-600 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
            >
              <Zap className="w-3 h-3" /> PERFORMANCE
            </button>
            <button 
              onClick={() => setActiveTab('analysis')}
              className={`px-3.5 py-1.5 rounded-lg font-black italic text-[10px] transition-all flex items-center gap-1.5 ${activeTab === 'analysis' ? 'bg-blue-600 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
            >
              <BarChart3 className="w-3 h-3" /> ANALYSIS
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'performance' ? (
              <motion.div
                key="performance"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="space-y-4"
              >
                {players.length > 1 ? (
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                    {players.sort((a, b) => (b.wpm || 0) - (a.wpm || 0)).map((player, idx) => (
                      <div 
                        key={player.id} 
                        className={`relative border rounded-xl px-4 py-2 flex items-center justify-between gap-3 transition-all ${
                          player.id === currentUserId 
                            ? (theme === 'dark' ? 'bg-blue-600/15 border-blue-500/30' : 'bg-blue-50 border-blue-200') 
                            : (theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-150')
                        }`}
                      >
                        {idx === 0 && (
                          <div className="absolute -top-1.5 -right-1.5 bg-yellow-500 text-white p-1 rounded-full shadow z-20">
                            <Trophy className="w-3 h-3" />
                          </div>
                        )}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="font-bold text-[10px] w-4 shrink-0 text-neutral-400">#{idx + 1}</div>
                          <AvatarDisplay avatarId={player.avatar} size="xs" />
                          <div className="font-black italic text-xs tracking-tighter truncate max-w-[120px] sm:max-w-[180px]" title={player.username}>
                            {player.username} {player.id === currentUserId && "(YOU)"}
                          </div>
                        </div>
                        <div className="flex items-center gap-5 shrink-0">
                          <div className="text-right">
                            <span className="text-[8px] font-bold text-neutral-400 uppercase mr-1">WPM</span>
                            <span className="text-xs font-black italic">{Math.round(player.wpm)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] font-bold text-neutral-400 uppercase mr-1">ACC</span>
                            <span className="text-xs font-black italic">{Math.round(player.accuracy)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatBox theme={theme} icon={<Zap className="w-4 h-4 text-blue-400" />} label="WPM" value={stats.wpm} />
                    <StatBox theme={theme} icon={<Target className="w-4 h-4 text-orange-400" />} label="ACCURACY" value={`${Math.round(stats.accuracy)}%`} />
                    <StatBox theme={theme} icon={<Timer className="w-4 h-4 text-red-400" />} label="TIME" value={formatTime(stats.time)} />
                    <StatBox theme={theme} icon={<Trophy className="w-4 h-4 text-yellow-400" />} label="RANK" value={stats.position} unit={getOrdinal(stats.position)} />
                  </div>
                )}

                {stats.heatmap && Object.keys(stats.heatmap).length > 0 && (
                  <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                    <Heatmap data={stats.heatmap} theme={theme} />
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
              >
                {stats.heatmap && (
                  <AdvancedStats heatmap={stats.heatmap} theme={theme} />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
            <div className="grid grid-cols-2 gap-3 w-full sm:w-auto md:grid-cols-4">
              <RewardBox theme={theme} icon={<Zap className="w-3.5 h-3.5 text-blue-400" />} label="XP EARNED" value={`+${stats.rewards?.xp || stats.points || 50}`} />
              <RewardBox theme={theme} icon={<Star className="w-3.5 h-3.5 text-yellow-400" />} label="LEVEL" value={`LVL ${stats.rewards?.level || 1}`} />
              <RewardBox theme={theme} icon={<Trophy className="w-3.5 h-3.5 text-orange-400" />} label="TOTAL XP" value={`${stats.rewards?.totalXp || stats.points || 0}`} />
              <RewardBox theme={theme} icon={<Coins className="w-3.5 h-3.5 text-yellow-500" />} label="COINS" value={`+${stats.rewards?.coins || stats.points || 50}`} />
            </div>
            <button
              onClick={onClose}
              className={`group px-6 py-2.5 rounded-xl font-black italic flex items-center justify-center gap-1.5 transition-all transform hover:scale-[1.02] shrink-0 text-xs w-full sm:w-auto ${theme === 'dark' ? 'bg-white text-black hover:bg-blue-500 hover:text-white' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100'}`}
            >
              CONTINUE ({timeLeft}s) <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const StatBox = ({ icon, label, value, unit, theme }: any) => (
  <div className={`border rounded-xl p-3 text-center transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
    <div className="flex justify-center mb-1">{icon}</div>
    <div className={`text-[9px] font-bold uppercase tracking-widest mb-0.5 ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>{label}</div>
    <div className="flex justify-center items-baseline gap-0.5">
      <span className={`text-xl font-black italic ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{value}</span>
      {unit && <span className={`text-[9px] font-bold ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>{unit}</span>}
    </div>
  </div>
);

const RewardBox = ({ icon, label, value, theme }: any) => (
  <div className="flex items-center gap-2">
    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-white/5' : 'bg-white shadow-sm border border-gray-100'}`}>{icon}</div>
    <div>
      <div className={`text-[8px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>{label}</div>
      <div className={`text-sm font-black italic ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{value}</div>
    </div>
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

export default ScoreCard;
