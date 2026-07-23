import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, BookOpen } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  type: 'terms' | 'privacy';
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, theme, type }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 150 }}
            className={`relative w-full max-w-2xl max-h-[85vh] p-8 md:p-10 rounded-[3rem] border shadow-[0_0_80px_rgba(59,130,246,0.15)] flex flex-col ${
              theme === 'dark' 
                ? 'bg-neutral-950 border-white/10 text-white' 
                : 'bg-white border-gray-100 text-gray-900'
            }`}
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-6 border-b border-white/5 mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  type === 'terms' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'
                }`}>
                  {type === 'terms' ? <BookOpen className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none">
                    {type === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
                  </h3>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>
                    Last Updated: July 2026
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className={`p-2 rounded-xl transition-all border ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/50 hover:text-white' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className={`flex-1 overflow-y-auto pr-2 space-y-6 text-sm font-medium leading-relaxed uppercase-none ${
              theme === 'dark' ? 'text-white/60' : 'text-gray-600'
            }`}>
              {type === 'terms' ? (
                <>
                  <section className="space-y-2">
                    <h4 className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>1. Acceptance of Terms</h4>
                    <p className="text-xs">
                      Welcome to Type Racer! By creating an account or using our platform, you agree to bound by these Terms & Conditions, all applicable laws and regulations, and agree that you are responsible for compliance with any local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                    </p>
                  </section>
                  <section className="space-y-2">
                    <h4 className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>2. Account Information & SaaS Consent</h4>
                    <p className="text-xs">
                      Type Racer is a SaaS (Software-as-a-Service) application. By creating an account, you consent to our storing and processing your account information (including username, email address, phone number, and race statistics). We may contact you regarding system updates, security notifications, product improvements, and occasional promotional offers. You may opt out of marketing communications at any time.
                    </p>
                  </section>
                  <section className="space-y-2">
                    <h4 className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>3. Code of Conduct</h4>
                    <p className="text-xs">
                      You agree not to use any automated typing software, macros, scripts, hacks, or cheats that alter game physics or typing speed. Type Racer remains a competitive ground for human fingers, and any automated cheating will result in immediate account deletion and ban.
                    </p>
                  </section>
                  <section className="space-y-2">
                    <h4 className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>4. Deletion of Accounts</h4>
                    <p className="text-xs">
                      Users may delete their account at any time using the Settings menu on the Dashboard. For analytical consistency and future statistics tracking, deletion will mark your account status as deleted but preserve database records (including email, username, phone, and statistics) securely without allowing future logins.
                    </p>
                  </section>
                </>
              ) : (
                <>
                  <section className="space-y-2">
                    <h4 className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>1. Information We Collect</h4>
                    <p className="text-xs">
                      We collect basic personal information to support user authentication and stats tracking: your chosen Username, your Email Address, and your Mobile Phone Number (required for security validation and profile authentication). We also record race stats, keyboard metrics, and history.
                    </p>
                  </section>
                  <section className="space-y-2">
                    <h4 className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>2. How We Use Information</h4>
                    <p className="text-xs">
                      We use your information strictly to maintain the leaderboard, authorize race access, display user profile statistics, prevent duplicate account registration, and provide technical support. Under NO circumstances do we sell, rent, or trade your personal information to third parties.
                    </p>
                  </section>
                  <section className="space-y-2">
                    <h4 className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>3. Data Retention</h4>
                    <p className="text-xs">
                      We retain account information and telemetry stats to secure consistent and historical leaderboard matches. When an account is flagged as "deleted", authentication credentials are removed to prevent future logins, but historical records remain compiled for game-wide analytics.
                    </p>
                  </section>
                  <section className="space-y-2">
                    <h4 className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>4. Cookies & LocalStorage</h4>
                    <p className="text-xs">
                      We use standard local storage (`localStorage`) in your browser to maintain your login token and theme preferences across visits. No tracking cookies are injected, and we respect your privacy completely.
                    </p>
                  </section>
                </>
              )}
            </div>

            {/* Footer buttons */}
            <div className="pt-6 border-t border-white/5 mt-6 shrink-0">
              <button
                onClick={onClose}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black italic text-sm uppercase tracking-widest transition-all"
              >
                Understood & Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
