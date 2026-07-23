import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare } from 'lucide-react';

interface WhatsAppSupportProps {
  whatsappNumber: string;
  theme: 'dark' | 'light';
}

const WhatsAppSupport: React.FC<WhatsAppSupportProps> = ({ whatsappNumber, theme }) => {
  return (
    <motion.a
      href={`https://wa.me/${whatsappNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1, y: -4 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={`fixed bottom-6 right-6 z-[90] p-4 rounded-2xl flex items-center justify-center shadow-[0_20px_50px_rgba(16,185,129,0.3)] border cursor-pointer group ${
        theme === 'dark' 
          ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500' 
          : 'bg-emerald-500 border-emerald-400 text-white hover:bg-emerald-400'
      }`}
      title="Contact Support on WhatsApp"
    >
      <span className="absolute inset-0 rounded-2xl bg-emerald-500/30 animate-ping group-hover:hidden" />
      <MessageSquare className="w-6 h-6 relative z-10" />
    </motion.a>
  );
};

export default WhatsAppSupport;
