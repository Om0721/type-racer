import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Target, Keyboard, ArrowRight } from 'lucide-react';

interface AdvancedStatsProps {
  heatmap: Record<string, { latency: number, errors: number }>;
  theme?: 'dark' | 'light';
}

const AdvancedStats: React.FC<AdvancedStatsProps> = ({ heatmap, theme = 'dark' }) => {
  // Logic to identify problematic keys
  const problematicKeys = Object.entries(heatmap)
    .filter(([_, stats]) => stats.errors > 0 || stats.latency > 300)
    .sort((a, b) => {
      // Sort by errors first, then by latency
      if (b[1].errors !== a[1].errors) return b[1].errors - a[1].errors;
      return b[1].latency - a[1].latency;
    });

  const generateDrills = () => {
    if (problematicKeys.length === 0) return ["No issues detected! Keep up the great work."];
    
    // Select top problematic keys
    const topKeys = problematicKeys.slice(0, 3).map(([key]) => key.toUpperCase());
    
    // Drill suggestions based on keys
    const suggestions = [
      `Focus on the "${topKeys.join(', ')}" keys. Try slow, deliberate practice.`,
      `Practice rhythmic typing to reduce latency spikes on "${topKeys[0]}".`,
      `Drill words containing ${topKeys.slice(0, 2).join(' and ')} to build muscle memory.`
    ];

    if (problematicKeys.length === 1) {
      return [
        `The key "${topKeys[0]}" is causing most of your issues.`,
        `Practice simple words like '${topKeys[0].toLowerCase()}a', '${topKeys[0].toLowerCase()}e', '${topKeys[0].toLowerCase()}i' to stabilize your movement.`
      ];
    }

    return suggestions;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-black italic tracking-tighter uppercase">Advanced Analysis</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mistakes Breakdown */}
        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-3 opacity-50">
            <AlertCircle className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Mistake Breakdown</span>
          </div>
          
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
            {problematicKeys.length > 0 ? (
              problematicKeys.map(([key, stats]) => (
                <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center font-black italic text-blue-500 uppercase">
                      {key}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold opacity-50 uppercase">Errors</div>
                      <div className="text-sm font-black italic text-red-500">{stats.errors}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold opacity-50 uppercase">Latency</div>
                    <div className={`text-sm font-black italic ${stats.latency > 300 ? 'text-orange-500' : 'text-green-500'}`}>
                      {Math.round(stats.latency)}ms
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 opacity-30 italic text-sm">Perfect run! No mistakes detected.</div>
            )}
          </div>
        </div>

        {/* Suggested Drills */}
        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-3 opacity-50">
            <Keyboard className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Suggested Drills</span>
          </div>

          <div className="space-y-3">
            {generateDrills().map((drill, idx) => (
              <div key={idx} className="flex gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <ArrowRight className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs font-bold leading-relaxed">{drill}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdvancedStats;
