/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TypingAreaProps {
  text: string;
  onProgress: (progress: number, wpm: number, accuracy: number, heatmap?: Record<string, { latency: number, errors: number }>) => void;
  onComplete: (wpm: number, accuracy: number, time: number, heatmap?: Record<string, { latency: number, errors: number }>) => void;
  disabled?: boolean;
}

const TypingArea: React.FC<TypingAreaProps & { theme?: 'dark' | 'light' }> = ({ text, onProgress, onComplete, disabled, theme = 'dark' }) => {
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [lastKeyTime, setLastKeyTime] = useState<number | null>(null);
  const [heatmap, setHeatmap] = useState<Record<string, { latency: number, count: number, errors: number }>>({});
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [mistakes, setMistakes] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [disabled]);

  const handleContainerClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const formatHeatmap = (raw: Record<string, { latency: number, count: number, errors: number }>) => {
    const formatted: Record<string, { latency: number, errors: number }> = {};
    Object.keys(raw).forEach(k => {
      formatted[k] = { latency: raw[k].latency, errors: raw[k].errors };
    });
    return formatted;
  };

  // Live timer tick to continuously update WPM even if typing pauses
  useEffect(() => {
    if (!startTime || disabled || userInput.length === text.length) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const timeElapsedMinutes = (now - startTime) / 60000;
      
      // Count only correct characters
      let correctChars = 0;
      for (let i = 0; i < userInput.length; i++) {
        if (i < text.length && userInput[i].toLowerCase() === text[i].toLowerCase()) {
          correctChars++;
        }
      }

      const wordsTyped = correctChars / 5;
      const calculatedWpm = timeElapsedMinutes >= 0.008 ? Math.round(wordsTyped / timeElapsedMinutes) : 0;
      
      setWpm(calculatedWpm);
      
      const progress = Math.min(userInput.length / text.length, 1);
      const formattedHeatmap = formatHeatmap(heatmap);
      onProgress(progress, calculatedWpm, accuracy, formattedHeatmap);
    }, 200);

    return () => clearInterval(timer);
  }, [startTime, disabled, userInput, text, accuracy, heatmap, onProgress]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const value = e.target.value;
    const now = Date.now();
    let currentStartTime = startTime;
    if (!currentStartTime) {
      currentStartTime = now;
      setStartTime(now);
      setLastKeyTime(now);
    }

    // Heatmap data collection
    let currentHeatmap = { ...heatmap };
    if (value.length > userInput.length && value.length <= text.length) {
      const targetChar = text[value.length - 1].toLowerCase();
      const userChar = value[value.length - 1].toLowerCase();
      const key = targetChar;
      
      if (!currentHeatmap[key]) currentHeatmap[key] = { latency: 0, count: 0, errors: 0 };
      
      if (lastKeyTime) {
        const latency = now - lastKeyTime;
        currentHeatmap[key].latency = (currentHeatmap[key].latency * currentHeatmap[key].count + latency) / (currentHeatmap[key].count + 1);
        currentHeatmap[key].count += 1;
      }
      
      if (userChar !== targetChar) {
        currentHeatmap[key].errors += 1;
      }
      
      setHeatmap(currentHeatmap);
      setLastKeyTime(now);
    }

    // Calculate progress
    const progress = Math.min(value.length / text.length, 1);
    
    // Calculate accuracy and mistakes
    let currentMistakes = 0;
    let correctChars = 0;
    for (let i = 0; i < value.length; i++) {
      const char = text[i];
      if (char && value[i].toLowerCase() === char.toLowerCase()) {
        correctChars++;
      } else {
        currentMistakes++;
      }
    }
    setMistakes(currentMistakes);
    const currentAccuracy = value.length > 0 ? Math.max(0, Math.round(((value.length - currentMistakes) / value.length) * 100)) : 100;
    setAccuracy(currentAccuracy);

    // Calculate WPM using standard formula: (Correct Characters ÷ 5) ÷ Minutes Elapsed
    if (currentStartTime) {
      const timeElapsedMinutes = (now - currentStartTime) / 60000;
      const wordsTyped = correctChars / 5;
      const currentWpm = timeElapsedMinutes >= 0.008 ? Math.round(wordsTyped / timeElapsedMinutes) : 0;
      setWpm(currentWpm);
      
      const formattedHeatmap = formatHeatmap(currentHeatmap);
      onProgress(progress, currentWpm, currentAccuracy, formattedHeatmap);
      
      if (value.length === text.length) {
        onComplete(currentWpm, currentAccuracy, (now - currentStartTime) / 1000, formattedHeatmap);
      }
    }

    if (value.length <= text.length) {
      setUserInput(value);
    }
  };

  const renderText = () => {
    return text.split('').map((char, index) => {
      let colorClass = theme === 'dark' ? 'text-white/30' : 'text-gray-300';
      if (index < userInput.length) {
        const userChar = userInput[index];
        colorClass = (userChar && userChar.toLowerCase() === char.toLowerCase()) ? 'text-green-400' : 'text-red-500 bg-red-500/20';
      } else if (index === userInput.length) {
        colorClass = `${theme === 'dark' ? 'text-blue-400 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-blue-600 border-blue-600'} border-b-4 animate-pulse px-1 rounded-sm bg-blue-500/10`;
      }

      return (
        <span key={index} className={`${colorClass} transition-colors duration-100 font-mono text-xl`}>
          {char}
        </span>
      );
    });
  };

  return (
    <div 
      className={`w-full max-w-5xl mx-auto flex flex-col items-center gap-1 md:gap-2 ${!disabled ? 'cursor-text' : ''}`}
      onClick={handleContainerClick}
    >
      <div className={`w-full backdrop-blur-xl border rounded-3xl p-3 md:p-4 shadow-[inset_0_2px_40px_rgba(0,0,0,0.05)] transition-all flex flex-wrap justify-center gap-x-1.5 gap-y-2 ${theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
        <div className="relative leading-relaxed select-none text-center max-w-4xl text-base md:text-lg">
          {renderText()}
        </div>
      </div>

      <div className="relative w-full max-w-xl">
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={handleInputChange}
          disabled={disabled}
          className={`w-full border rounded-xl px-4 py-2 md:py-3 text-base md:text-lg font-bold tracking-tight text-center focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder:text-white/10' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-300 shadow-sm'}`}
          placeholder={disabled ? "GET READY..." : "TYPE TO RACE"}
          spellCheck={false}
          autoComplete="off"
        />
        
        {disabled && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-2xl flex items-center justify-center pointer-events-none"
          >
             <span className="text-white/40 font-black italic tracking-tighter text-sm uppercase">Waiting for countdown...</span>
          </motion.div>
        )}
      </div>
      
      <div className={`w-full flex justify-between items-center font-mono text-[8px] md:text-[10px] px-6 uppercase tracking-[0.2em] font-bold ${theme === 'dark' ? 'text-white/20' : 'text-gray-400'}`}>
        <div className="flex gap-8">
          <div className="flex items-center gap-2">
            <span className="opacity-50">Length</span>
            <span className={theme === 'dark' ? 'text-white/60' : 'text-gray-600'}>{text.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="opacity-50">Progress</span>
            <span className={theme === 'dark' ? 'text-white/60' : 'text-gray-600'}>{Math.round((userInput.length / text.length) * 100)}%</span>
          </div>
        </div>
        <div>
          <AnimatePresence>
            {mistakes > 0 && (
              <motion.div 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="text-red-500/60 flex items-center gap-2"
              >
                <span>Mistakes</span>
                <span className="bg-red-500/10 px-2 py-0.5 rounded text-red-500">{mistakes}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TypingArea;
