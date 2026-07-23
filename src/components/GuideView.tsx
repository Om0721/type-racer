import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, MousePointer2, Keyboard, Lightbulb, CheckCircle2 } from 'lucide-react';

interface GuideViewProps {
  onBack: () => void;
  theme?: 'dark' | 'light';
}

const GuideView: React.FC<GuideViewProps> = ({ onBack, theme = 'dark' }) => {
  const tips = [
    { title: 'Maintain Good Posture', desc: 'Sit straight with your feet flat on the floor and elbows at a 90-degree angle.' },
    { title: 'Home Row Positioning', desc: 'Keep your fingers rested on ASDF and JKL; keys. Your index fingers should feel the bumps on F and J.' },
    { title: 'Don\'t Look Down', desc: 'Focus on the screen, not your hands. Use your muscle memory to find the keys.' },
    { title: 'Accuracy Before Speed', desc: 'It\'s better to type slowly and accurately than fast with many mistakes. Speed will come naturally.' },
    { title: 'Take Regular Breaks', desc: 'Avoid RSI by taking breaks every 30-60 minutes to stretch your wrists and hands.' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="relative z-10 p-8 pt-12 max-w-6xl mx-auto"
    >
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase">TYPING GUIDE</h2>
        </div>
        <button 
          onClick={onBack}
          className={`px-8 py-3 rounded-xl font-black italic transition-all ${
            theme === 'dark' 
              ? 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white' 
              : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-900 shadow-sm'
          }`}
        >
          BACK TO DASHBOARD
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Hand Placement Image */}
          <div className={`rounded-[3rem] p-12 border transition-all relative overflow-hidden ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-xl'}`}>
            <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-8 flex items-center gap-3">
              <MousePointer2 className="w-6 h-6 text-blue-500" />
              HAND PLACEMENT
            </h3>
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-white group">
              <img 
                src="/src/assets/images/typing_hand_placement_guide_1784542473660.jpg" 
                alt="Typing Hand Placement Guide"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-[10px] font-black italic tracking-widest opacity-40 uppercase mb-1">Left Hand</div>
                <div className="font-bold text-sm">ASDF</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-black italic tracking-widest opacity-40 uppercase mb-1">Right Hand</div>
                <div className="font-bold text-sm">JKL;</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-black italic tracking-widest opacity-40 uppercase mb-1">Thumbs</div>
                <div className="font-bold text-sm">SPACEBAR</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-black italic tracking-widest opacity-40 uppercase mb-1">Anchor</div>
                <div className="font-bold text-sm">F & J BUMPS</div>
              </div>
            </div>
          </div>

          {/* Keyboard Layout Info */}
          <div className={`rounded-[2rem] p-10 border transition-all ${theme === 'dark' ? 'bg-blue-600/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
            <h3 className="text-xl font-black italic tracking-tighter uppercase mb-4 flex items-center gap-3 text-blue-500">
              <Keyboard className="w-5 h-5" />
              THE QWERTY ADVANTAGE
            </h3>
            <p className={`text-sm font-medium leading-relaxed ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
              The standard QWERTY layout was designed to prevent physical typewriter jams, but it has become the universal standard. Mastering it allows you to type on almost any device in the world with maximum efficiency.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <div className={`rounded-[3rem] p-10 border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-xl'}`}>
            <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-8 flex items-center gap-3">
              <Lightbulb className="w-6 h-6 text-yellow-500" />
              PRO TIPS
            </h3>
            <div className="space-y-6">
              {tips.map((tip, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="mt-1">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-black italic text-sm uppercase tracking-tighter mb-1">{tip.title}</h4>
                    <p className="text-xs font-bold opacity-50 leading-relaxed uppercase tracking-widest">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-[2rem] p-10 bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-2xl relative overflow-hidden`}>
            <div className="relative z-10">
              <h3 className="text-xl font-black italic tracking-tighter uppercase mb-2">READY TO PRACTICE?</h3>
              <p className="text-xs font-bold opacity-70 uppercase tracking-widest mb-6">Put these tips to the test in a practice race.</p>
              <button 
                onClick={onBack}
                className="w-full bg-white text-blue-600 py-4 rounded-xl font-black italic tracking-widest text-xs shadow-xl hover:scale-[1.02] transition-all"
              >
                START A RACE
              </button>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default GuideView;
