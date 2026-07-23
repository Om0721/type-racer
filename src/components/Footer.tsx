import React from 'react';
import { motion } from 'motion/react';
import { Heart, MessageSquare } from 'lucide-react';

interface FooterProps {
  theme: 'dark' | 'light';
  onTermsClick: () => void;
  onPrivacyClick: () => void;
  whatsappNumber: string;
}

const Footer: React.FC<FooterProps> = ({ theme, onTermsClick, onPrivacyClick, whatsappNumber }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`w-full py-8 px-6 mt-16 border-t transition-colors relative z-10 ${
      theme === 'dark' 
        ? 'bg-black border-white/5 text-white/50' 
        : 'bg-white border-gray-100 text-gray-500 shadow-inner'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Left section: Copyright and author */}
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="flex items-center gap-1.5 font-bold italic tracking-tighter text-sm uppercase">
            <span>Type Racer</span>
            <span className={theme === 'dark' ? 'text-white/20' : 'text-gray-300'}>|</span>
            <span className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}>© {currentYear}</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 opacity-80 mt-1">
            Made with <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" /> by Om
          </p>
        </div>

        {/* Center section: Legal links */}
        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-2 text-xs font-black uppercase tracking-widest">
          <button 
            onClick={onTermsClick}
            className={`transition-colors hover:underline ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}
          >
            Terms & Conditions
          </button>
          <button 
            onClick={onPrivacyClick}
            className={`transition-colors hover:underline ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}
          >
            Privacy Policy
          </button>
          <a 
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 transition-colors hover:underline text-emerald-500`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Support
          </a>
        </div>

        {/* Right section: Support button */}
        <div className="flex items-center gap-4">
          <a 
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
              theme === 'dark' 
                ? 'bg-white/5 border-white/10 hover:bg-emerald-500/10 text-emerald-500 hover:border-emerald-500/30' 
                : 'bg-gray-50 border-gray-200 hover:bg-emerald-50 text-emerald-600 hover:border-emerald-200 shadow-sm'
            }`}
            title="Contact Support"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Contact Support</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
