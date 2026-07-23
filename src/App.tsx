/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Trophy, User, Zap, Coins, Star, 
  Play, Settings, LogOut, ChevronRight,
  Shield, UserPlus, Mail, Lock, Gamepad2,
  Users, Bot, History, LayoutDashboard, Target, ArrowRight,
  BookOpen, Lightbulb, CheckCircle2, MousePointer2, Trash2, Phone,
  Flame, Award, Activity, Sparkles, Quote, BarChart2, TrendingUp, Smartphone
} from 'lucide-react';
import socket from './lib/socket';
import { User as UserType, Room, BOT_DIFFICULTIES, PlayerProgress } from './types';
import RaceView from './components/RaceView';
import TypingArea from './components/TypingArea';
import HUD from './components/HUD';
import ScoreCard from './components/ScoreCard';
import GuideView from './components/GuideView';
import Heatmap from './components/Heatmap';
import { PASSAGES } from './data/passages';
import Footer from './components/Footer';
import WhatsAppSupport from './components/WhatsAppSupport';
import { LegalModal } from './components/LegalModals';
import { AvatarPicker } from './components/AvatarPicker';
import { AvatarDisplay } from './components/AvatarDisplay';

// Main Application State
const SUPPORT_WHATSAPP_NUMBER = "7040381416";

export default function App() {
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'dashboard' | 'race' | 'lobby' | 'history' | 'guide'>('landing');
  const [user, setUser] = useState<UserType | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [stats, setStats] = useState({ wpm: 0, accuracy: 100, combo: 0, nitro: 0, timer: 0, rank: 1, heatmap: {} as Record<string, any> });
  const [showScoreCard, setShowScoreCard] = useState(false);
  const [raceText, setRaceText] = useState("");
  const [isBotRace, setIsBotRace] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [practiceTargetWpm, setPracticeTargetWpm] = useState(30);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [practiceTimeLeft, setPracticeTimeLeft] = useState(60);
  const [lastRewards, setLastRewards] = useState({ points: 0 });
  
  // Custom Modal States
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showChangeUsernameModal, setShowChangeUsernameModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [prevPoints, setPrevPoints] = useState(0);
  const [pointsAnimating, setPointsAnimating] = useState(false);
  const [prevLevel, setPrevLevel] = useState(1);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const botRaceStartTimeRef = React.useRef<number | null>(null);
  const hasSubmittedRaceStatsRef = React.useRef<boolean>(false);

  useEffect(() => {
    if (user) {
      if (user.level > prevLevel) {
        setShowLevelUpModal(true);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#facc15', '#ffffff']
        });
      }
      setPrevLevel(user.level);
    }
  }, [user?.level]);

  useEffect(() => {
    if (user && user.points > prevPoints) {
      if (view === 'dashboard') {
        setPointsAnimating(true);
        const timer = setTimeout(() => setPointsAnimating(false), 1500);
        setPrevPoints(user.points);
        return () => clearTimeout(timer);
      }
    } else if (user && view === 'dashboard' && user.points !== prevPoints) {
      setPrevPoints(user.points);
    }
  }, [user?.points, view, prevPoints]);
  const [multiplayerAction, setMultiplayerAction] = useState<'none' | 'select' | 'join'>('none');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  // Theme Effect
  useEffect(() => {
    const savedTheme = localStorage.getItem('type-racer-theme') as 'dark' | 'light';
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem('type-racer-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  
  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('type-racer-token');
    setRoom(null);
    setHistory([]);
    setView('landing');
    setError(null);
  }, []);

  // Auth Effects
  useEffect(() => {
    const token = localStorage.getItem('type-racer-token');
    if (token) {
      fetchProfile(token);
    }
  }, []);

  useEffect(() => {
    if (view === 'dashboard' && user) {
      // Any dashboard-specific init
    }
  }, [view, user]);

  const fetchProfile = async (token: string) => {
    if (!token || token === 'null' || token === 'undefined') {
      localStorage.removeItem('type-racer-token');
      return;
    }

    try {
      const res = await fetch('/api/users/profile', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data && data.id) {
          setUser(data);
          setView('dashboard');
        } else {
          handleLogout();
        }
      } else {
        // Token is invalid or expired
        handleLogout();
      }
    } catch (err: any) {
      console.error('Network error fetching profile:', err.message || err);
      setError('Connection to server failed. Please check your internet or try again.');
    }
  };

  // Socket Listeners
  useEffect(() => {
    socket.on('roomCreated', (newRoom) => {
      setRoom(newRoom);
      setRaceText(newRoom.text);
      setView('lobby');
    });

    socket.on('roomUpdate', (updatedRoom) => {
      setRoom(updatedRoom);
      if (updatedRoom.status === 'starting' || updatedRoom.status === 'racing') {
        setView('race');
      }

      if (updatedRoom.status === 'finished' && !showScoreCard) {
        setShowScoreCard(true);
      }
      
      // Update rewards and profile if user finished in multiplayer
      const me = updatedRoom.players.find((p: any) => p.id === (user?.id || socket.id));
      if (me && me.isFinished && me.rewards && lastRewards.points === 0) {
        setLastRewards(me.rewards);
        const token = localStorage.getItem('type-racer-token');
        if (token) fetchProfile(token);
      }
    });

    socket.on('countdown', (count) => {
      setCountdown(count);
    });

    return () => {
      socket.off('roomCreated');
      socket.off('roomUpdate');
      socket.off('countdown');
    };
  }, []);

  // Game Loop for Timer
  useEffect(() => {
    let interval: any;
    if (view === 'race' && room?.status === 'racing' && !showScoreCard) {
      interval = setInterval(() => {
        if (isPracticeMode) {
          setPracticeTimeLeft(prev => {
            if (prev <= 0.1) {
              clearInterval(interval);
              setShowScoreCard(true);
              return 0;
            }
            return prev - 0.1;
          });
        }
        
        setStats(prev => {
          const nextTimer = prev.timer + 100;
          if (nextTimer >= 60000 && !showScoreCard) {
            clearInterval(interval);
            setShowScoreCard(true);
            return { ...prev, timer: 60000 };
          }
          return { ...prev, timer: nextTimer };
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [view, room?.status, showScoreCard, isPracticeMode]);

  // Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        localStorage.setItem('type-racer-token', data.token);
        setView('dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Login failed. Please check your connection.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    if (isRegistering || (now - lastSubmitTime < 2000)) return;
    
    setError(null);
    setIsRegistering(true);
    setLastSubmitTime(now);

    const form = e.target as HTMLFormElement;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const phone_number = (form.elements.namedItem('phone_number') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const confirm_password = (form.elements.namedItem('confirm_password') as HTMLInputElement).value;
    const accept_terms = (form.elements.namedItem('accept_terms') as HTMLInputElement).checked;
    const avatar = (form.elements.namedItem('avatar') as HTMLInputElement)?.value || 'avatar_boy_1';

    // Client-side validations
    const cleanedPhone = phone_number.replace(/\s+/g, '');
    if (!/^\d{10}$/.test(cleanedPhone)) {
      setError('Phone number must be a 10-digit mobile number containing only digits.');
      setIsRegistering(false);
      return;
    }

    if (password !== confirm_password) {
      setError('Passwords do not match.');
      setIsRegistering(false);
      return;
    }

    if (!accept_terms) {
      setError('You must agree to the Terms & Conditions and Privacy Policy.');
      setIsRegistering(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, phoneNumber: cleanedPhone, password, avatar })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        localStorage.setItem('type-racer-token', data.token);
        setView('dashboard');
      } else {
        let errorMsg = data.error;
        if (errorMsg && errorMsg.includes('Email rate limit exceeded')) {
          errorMsg = 'Too many registration attempts. Please wait a few minutes before trying again.';
        }
        setError(errorMsg || 'Registration failed');
      }
    } catch (err: any) {
      setError('Registration failed. Please check your connection.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCreateRoom = () => {
    if (!user) return;
    hasSubmittedRaceStatsRef.current = false;
    setLastRewards({ points: 0 });
    setShowScoreCard(false);
    socket.emit('createRoom', { username: user.username, userId: user.id, avatar: user.avatar || 'avatar_boy_1' });
  };

  const handleJoinRoom = (code: string) => {
    if (!user) return;
    hasSubmittedRaceStatsRef.current = false;
    setLastRewards({ points: 0 });
    setShowScoreCard(false);
    socket.emit('joinRoom', { roomId: code, username: user.username, userId: user.id, avatar: user.avatar || 'avatar_boy_1' });
  };

  const handleStartRace = () => {
    hasSubmittedRaceStatsRef.current = false;
    setShowScoreCard(false);
    if ((isBotRace || isPracticeMode) && room) {
      setRoom(prev => prev ? { ...prev, status: 'starting' } : null);
      setView('race');
      let count = 3;
      setCountdown(count);
      
      const playBeep = (freq: number, type: OscillatorType = 'sine', duration: number = 0.1) => {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + duration);
        } catch (e) {}
      };

      playBeep(440, 'sine', 0.15); // First beep

      const interval = setInterval(() => {
        count--;
        setCountdown(count);
        if (count > 0) {
          playBeep(440, 'sine', 0.15);
        }
        if (count === 0) {
          playBeep(880, 'square', 0.3); // "Go" beep
          clearInterval(interval);
          setRoom(prev => prev ? { ...prev, status: 'racing', startTime: Date.now() } : null);
          setCountdown(null);
        }
      }, 1000);
      return;
    }
    if (room) {
      socket.emit('startRace', { roomId: room.id });
    }
  };

  const submitStats = async (wpm: number, accuracy: number, won: boolean, heatmap?: any) => {
    if (hasSubmittedRaceStatsRef.current) return;
    hasSubmittedRaceStatsRef.current = true;

    const token = localStorage.getItem('type-racer-token');
    if (!token) return;
    try {
      const mode = isBotRace ? 'bot' : (isPracticeMode ? 'practice' : 'multiplayer');
      const res = await fetch('/api/users/stats', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ wpm, accuracy, won, mode, heatmap, incrementRacesPlayed: true })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.rewards) {
          setLastRewards(data.rewards);
        }
        if (data.user) {
          setUser(data.user);
        } else {
          fetchProfile(token);
        }
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error('Failed to update stats', err);
    }
  };

  const fetchHistory = async () => {
    const token = localStorage.getItem('type-racer-token');
    if (!token) return;
    try {
      const res = await fetch('/api/users/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  const handleCloseScoreCard = useCallback(() => {
    setShowScoreCard(false);
    setView('dashboard');
    setRoom(null);
    setIsBotRace(false);
    setIsPracticeMode(false);
    setStats({ wpm: 0, accuracy: 100, combo: 0, nitro: 0, timer: 0, rank: 1, heatmap: {} });
    const token = localStorage.getItem('type-racer-token');
    if (token) fetchProfile(token);
  }, [fetchProfile]);

  const handleProgress = (progress: number, wpm: number, accuracy: number, heatmap?: any) => {
    if (room && room.status === 'racing' && !showScoreCard) {
      if (isBotRace || isPracticeMode) {
        setRoom(prev => {
          if (!prev) return null;
          const newPlayers = [...prev.players];
          const userIdx = newPlayers.findIndex(p => p.id === (user?.id || 'local'));
          if (userIdx !== -1) {
            newPlayers[userIdx] = { ...newPlayers[userIdx], progress, wpm, accuracy };
            if (progress >= 1 && !newPlayers[userIdx].isFinished) {
              newPlayers[userIdx] = { ...newPlayers[userIdx], isFinished: true, finishTime: Date.now() };
              
              // Finish Sound
              try {
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
                osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.4); // C6
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.4);
              } catch (e) {}

              // Submit Stats
              const won = isPracticeMode ? true : (newPlayers.filter(p => p.isFinished).length === 1);
              submitStats(wpm, accuracy, won, heatmap);
              setShowScoreCard(true);
              return { ...prev, status: 'finished', players: newPlayers };
            }
          }
          return { ...prev, players: newPlayers };
        });
      } else {
        socket.emit('updateProgress', { 
          roomId: room.id, 
          progress, 
          wpm, 
          accuracy,
          heatmap
        });
      }
      
      setStats(prev => {
        const newCombo = accuracy > 95 ? prev.combo + 1 : 0;
        const newNitro = Math.min(100, prev.nitro + (accuracy > 98 ? 2 : 0));
        
        // Calculate Rank locally for smoothness
        const rank = (room.players.filter(p => p.progress > progress).length) + 1;
        
        if (progress >= 1 && !showScoreCard) {
          setShowScoreCard(true);
        }

        return { ...prev, wpm, accuracy, combo: newCombo, nitro: newNitro, rank, heatmap: heatmap || prev.heatmap };
      });
    }
  };

  const handleComplete = (wpm: number, accuracy: number, time: number, heatmap?: any) => {
    // If progress already 1, handleProgress might have done some work
    // But we ensure final stats are set here
    setStats(prev => ({ 
      ...prev, 
      wpm, 
      accuracy, 
      timer: time * 1000,
      heatmap: heatmap || prev.heatmap 
    }));
    setShowScoreCard(true);
  };

  const handleBotRace = (difficultyWpm: number) => {
    hasSubmittedRaceStatsRef.current = false;
    setIsBotRace(true);
    setIsPracticeMode(false);
    setShowScoreCard(false);
    setLastRewards({ points: 0 });
    const randomPassage = PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
    const mockRoom: Room = {
      id: 'BOT-RACE',
      hostId: user?.id || 'local',
      players: [
        { id: user?.id || 'local', username: user?.username || 'You', avatar: user?.avatar || 'avatar_boy_1', wpm: 0, accuracy: 100, progress: 0, isReady: true, isFinished: false, carId: 'car-1' },
        { id: 'bot-1', username: `Bot (${difficultyWpm} WPM)`, avatar: 'avatar_bot_1', wpm: difficultyWpm, accuracy: 95, progress: 0, isReady: true, isFinished: false, carId: 'car-2' }
      ],
      status: 'waiting',
      text: randomPassage
    };
    setRoom(mockRoom);
    setRaceText(mockRoom.text);
    setView('lobby');
  };

  const handlePracticeMode = (targetWpm: number) => {
    hasSubmittedRaceStatsRef.current = false;
    setIsPracticeMode(true);
    setIsBotRace(false);
    setShowScoreCard(false);
    setPracticeTargetWpm(targetWpm);
    setPracticeTimeLeft(60);
    setLastRewards({ points: 0 });
    const randomPassage = PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
    const mockRoom: Room = {
      id: 'PRACTICE',
      hostId: user?.id || 'local',
      players: [
        { id: user?.id || 'local', username: user?.username || 'You', avatar: user?.avatar || 'avatar_boy_1', wpm: 0, accuracy: 100, progress: 0, isReady: true, isFinished: false, carId: 'car-3' }
      ],
      status: 'waiting',
      text: randomPassage
    };
    setRoom(mockRoom);
    setRaceText(mockRoom.text);
    setView('race');

    // Trigger immediate 3... 2... 1... GO countdown
    let count = 3;
    setCountdown(count);

    const playBeep = (freq: number, type: OscillatorType, duration: number) => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch (e) {}
    };

    playBeep(440, 'sine', 0.15);

    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count > 0) {
        playBeep(440, 'sine', 0.15);
      }
      if (count === 0) {
        playBeep(880, 'square', 0.3);
        clearInterval(interval);
        setRoom(prev => prev ? { ...prev, status: 'racing', startTime: Date.now() } : null);
        setCountdown(null);
      }
    }, 1000);
  };

  // Bot Logic for local simulation
  useEffect(() => {
    if (isBotRace && room?.status === 'racing') {
      const bot = room.players.find(p => p.id === 'bot-1');
      if (bot && !bot.isFinished) {
        const difficultyWpm = room.players[1].wpm; 
        if (!botRaceStartTimeRef.current) {
          botRaceStartTimeRef.current = Date.now();
        }
        const interval = setInterval(() => {
          setRoom(prev => {
            if (!prev) return null;
            const newPlayers = [...prev.players];
            const botIdx = newPlayers.findIndex(p => p.id === 'bot-1');
            if (botIdx !== -1 && !newPlayers[botIdx].isFinished) {
              const startTime = botRaceStartTimeRef.current || Date.now();
              const elapsedMs = Math.max(1, Date.now() - startTime);
              
              // WPM * 5 characters / 60,000 milliseconds = characters per millisecond
              const expectedChars = (difficultyWpm * 5 / 60000) * elapsedMs;
              const computedProgress = raceText.length > 0 ? expectedChars / raceText.length : 0;
              
              const progress = Math.min(1, computedProgress);
              
              newPlayers[botIdx] = { 
                ...newPlayers[botIdx], 
                progress: progress,
                wpm: difficultyWpm,
              };
              if (progress >= 1) {
                newPlayers[botIdx].isFinished = true;
                newPlayers[botIdx].finishTime = Date.now();
                clearInterval(interval);

                // Bot reached 100% progress first -> End race immediately!
                const userIdx = newPlayers.findIndex(p => p.id !== 'bot-1');
                if (userIdx !== -1) {
                  const player = newPlayers[userIdx];
                  submitStats(player.wpm, player.accuracy, false);
                }
                setShowScoreCard(true);
                return { ...prev, status: 'finished', players: newPlayers };
              }
            }
            return { ...prev, players: newPlayers };
          });
        }, 100);
        return () => clearInterval(interval);
      }
    } else {
      botRaceStartTimeRef.current = null;
    }
  }, [isBotRace, room?.status, raceText.length]);

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const performDeleteAccount = async () => {
    const token = localStorage.getItem('type-racer-token');
    if (!token) return;

    try {
      const res = await fetch('/api/users/profile', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        handleLogout();
      } else if (res.status === 401) {
        handleLogout();
      } else {
        setError('Failed to delete account.');
      }
    } catch (err) {
      setError('Error deleting account. Please check your connection.');
    }
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col justify-between overflow-x-hidden selection:bg-blue-500/30 transition-colors duration-500 ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Theme Toggle Button */}
      <div className="fixed top-6 right-8 z-[100]">
        <button 
          onClick={toggleTheme}
          className={`p-3 rounded-xl border transition-all shadow-xl flex items-center gap-2 group ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'}`}
        >
          {theme === 'dark' ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
                <Star className="w-5 h-5 text-yellow-400" />
              </motion.div>
              <span className="text-xs font-bold italic tracking-tighter">MIDNIGHT</span>
            </>
          ) : (
            <>
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <Zap className="w-5 h-5 text-orange-500 fill-orange-500" />
              </motion.div>
              <span className="text-xs font-bold italic tracking-tighter">DAYLIGHT</span>
            </>
          )}
        </button>
      </div>

      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={`absolute top-0 left-0 w-full h-full ${theme === 'dark' ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(29,78,216,0.15),transparent_70%)]' : 'bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)]'}`} />
        <div className={`absolute bottom-0 right-0 w-96 h-96 blur-[120px] rounded-full ${theme === 'dark' ? 'bg-blue-600/10' : 'bg-blue-400/5'}`} />
      </div>

      <div className="flex-1 w-full flex flex-col relative z-10">
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <LandingView 
              theme={theme} 
              onStart={() => { setError(null); setView('login'); }} 
              onPractice={() => { setError(null); setView('register'); }} 
            />
          )}
          {view === 'login' && (
            <LoginView 
              theme={theme} 
              onLogin={handleLogin} 
              onSwitch={() => { 
                setError(null); 
                setView('register'); 
              }} 
              error={error} 
            />
          )}
          {view === 'register' && (
            <RegisterView 
              theme={theme} 
              onRegister={handleRegister} 
              isRegistering={isRegistering} 
              error={error}
              onSwitch={() => { 
                setError(null); 
                setView('login'); 
              }} 
              onTermsClick={() => setShowTermsModal(true)}
              onPrivacyClick={() => setShowPrivacyModal(true)}
            />
          )}
          {view === 'dashboard' && user && (
            <DashboardView 
              user={user} 
              onCreateRoom={handleCreateRoom} 
              onBotRace={() => setView('lobby')} 
              onLogout={handleLogout}
              onBotSelect={handleBotRace}
              onPracticeMode={handlePracticeMode}
              onDeleteAccount={handleDeleteAccount}
              onChangeUsername={() => setShowChangeUsernameModal(true)}
              onShowGuide={() => setView('guide')}
              theme={theme}
              multiplayerAction={multiplayerAction}
              setMultiplayerAction={setMultiplayerAction}
              roomCodeInput={roomCodeInput}
              setRoomCodeInput={setRoomCodeInput}
              onJoinRoom={handleJoinRoom}
              pointsAnimating={pointsAnimating}
            />
          )}
          {view === 'lobby' && room && (
            <LobbyView 
              room={room} 
              isHost={room.hostId === user?.id} 
              onStart={handleStartRace} 
              onBack={() => setView('dashboard')}
              theme={theme}
            />
          )}
          {view === 'race' && room && (
            <div className="relative z-10 h-screen flex flex-col p-2 md:p-4 max-w-7xl mx-auto w-full overflow-hidden">
              <div className="flex flex-col lg:flex-row gap-2 mb-2 shrink-0">
                <div className="flex-1 min-h-0">
                  <RaceView players={room.players} currentUserId={user?.id || 'local'} theme={theme} />
                </div>
                <div className="shrink-0 hidden lg:block">
                  <HUD 
                    {...stats} 
                    timer={isPracticeMode ? practiceTimeLeft * 1000 : stats.timer} 
                    theme={theme} 
                    vertical
                  />
                </div>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center min-h-0 py-2">
                <TypingArea 
                  text={raceText} 
                  onProgress={handleProgress} 
                  onComplete={handleComplete}
                  disabled={room.status !== 'racing'} 
                  theme={theme}
                />
              </div>

              <div className="lg:hidden shrink-0 pb-2">
                <HUD 
                  {...stats} 
                  timer={isPracticeMode ? practiceTimeLeft * 1000 : stats.timer} 
                  theme={theme} 
                />
              </div>
              
              {showScoreCard && (
                <ScoreCard 
                  theme={theme}
                  players={room.players}
                  currentUserId={user?.id || 'local'}
                  stats={{
                    position: isPracticeMode ? 1 : stats.rank,
                    wpm: stats.wpm,
                    accuracy: stats.accuracy,
                    time: stats.timer,
                    combo: stats.combo,
                    points: (isBotRace || isPracticeMode) ? lastRewards.points : (room.players.find(p => p.id === (user?.id || 'local'))?.rewards?.points || 0),
                    heatmap: stats.heatmap
                  }}
                  onClose={handleCloseScoreCard}
                />
              )}
            </div>
          )}
          {view === 'history' && user && (
            <HistoryView 
              history={history} 
              onBack={() => setView('dashboard')} 
              theme={theme} 
            />
          )}
          {view === 'guide' && (
            <GuideView 
              onBack={() => setView('dashboard')} 
              theme={theme} 
            />
          )}
        </AnimatePresence>
      </div>

      {/* Countdown Overlay */}
      <AnimatePresence>
        {countdown !== null && countdown > 0 && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 2, opacity: 0, filter: 'blur(20px)' }}
            key={countdown}
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute inset-0 bg-blue-500/30 blur-[100px] rounded-full"
              />
              <span className="text-[20rem] font-black italic tracking-tighter text-blue-400 drop-shadow-[0_0_40px_rgba(59,130,246,0.9)] relative z-10">
                {countdown}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLevelUpModal && user && (
          <LevelUpModal 
            level={user.level} 
            theme={theme} 
            onClose={() => setShowLevelUpModal(false)} 
          />
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className={`w-full max-w-md p-8 rounded-[2.5rem] border shadow-2xl text-center relative z-10 ${theme === 'dark' ? 'bg-neutral-950 border-red-500/30 text-white' : 'bg-white border-red-500/30 text-gray-900'}`}
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2 text-red-500">Delete Account</h3>
              <p className={`text-sm font-medium mb-8 leading-relaxed ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
                Are you sure you want to delete your account? This action is irreversible. All access to your stats and dashboard will be permanently deactivated.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowDeleteConfirm(false);
                    await performDeleteAccount();
                  }}
                  className="py-4 rounded-2xl text-xs font-black uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legal Modals */}
      <LegalModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
        theme={theme} 
        type="terms" 
      />
      <LegalModal 
        isOpen={showPrivacyModal} 
        onClose={() => setShowPrivacyModal(false)} 
        theme={theme} 
        type="privacy" 
      />

      <AnimatePresence>
        {showChangeUsernameModal && user && (
          <EditProfileModal
            user={user}
            theme={theme}
            onClose={() => setShowChangeUsernameModal(false)}
            onSuccess={(updatedUser: UserType) => {
              setUser(updatedUser);
              const token = localStorage.getItem('type-racer-token');
              if (token) fetchProfile(token);
            }}
          />
        )}
      </AnimatePresence>

      {/* Floating WhatsApp Support Button */}
      {view !== 'race' && (
        <WhatsAppSupport 
          whatsappNumber={SUPPORT_WHATSAPP_NUMBER} 
          theme={theme} 
        />
      )}

      {/* Professional Footer */}
      {view !== 'race' && (
        <Footer 
          theme={theme} 
          onTermsClick={() => setShowTermsModal(true)} 
          onPrivacyClick={() => setShowPrivacyModal(true)} 
          whatsappNumber={SUPPORT_WHATSAPP_NUMBER} 
        />
      )}
    </div>
  );
}

const LevelUpModal = ({ level, theme, onClose }: any) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
  >
    <motion.div
      initial={{ scale: 0.8, y: 50, rotate: -5 }}
      animate={{ scale: 1, y: 0, rotate: 0 }}
      exit={{ scale: 0.8, y: 50, opacity: 0 }}
      transition={{ type: "spring", damping: 15, stiffness: 100 }}
      className={`relative w-full max-w-lg p-12 rounded-[4rem] border-4 shadow-[0_0_100px_rgba(59,130,246,0.3)] text-center overflow-hidden ${theme === 'dark' ? 'bg-black border-blue-500/50' : 'bg-white border-blue-500'}`}
    >
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-2 border-dashed border-blue-500/30 rounded-full"
        />
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative z-10"
      >
        <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_20px_50px_rgba(37,99,235,0.4)] rotate-12">
          <Trophy className="w-12 h-12 text-white" />
        </div>

        <h2 className="text-6xl font-black italic tracking-tighter uppercase mb-2">Level Up!</h2>
        <div className="text-blue-500 text-xl font-black italic uppercase tracking-[0.3em] mb-8">Promotion Achieved</div>

        <div className="flex items-center justify-center gap-6 mb-12">
          <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
            <span className="text-[10px] font-black opacity-40 uppercase">From</span>
            <span className="text-3xl font-black italic">{level - 1}</span>
          </div>
          <motion.div
            animate={{ x: [0, 10, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <ChevronRight className="w-8 h-8 text-blue-500" />
          </motion.div>
          <div className="w-24 h-24 rounded-3xl bg-blue-600 flex flex-col items-center justify-center shadow-xl rotate-3">
            <span className="text-[10px] font-black text-white/60 uppercase">To</span>
            <span className="text-4xl font-black italic text-white">{level}</span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-3xl font-black italic text-2xl uppercase tracking-tighter shadow-2xl transition-all"
        >
          Back to the Track
        </motion.button>
      </motion.div>
    </motion.div>
  </motion.div>
);

const EditProfileModal = ({ user, theme, onClose, onSuccess }: any) => {
  const [newUsername, setNewUsername] = useState(user.username || '');
  const [newPhone, setNewPhone] = useState(user.phoneNumber || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar || 'avatar_boy_1');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUsername = newUsername.trim();
    const trimmedPhone = newPhone.replace(/\s+/g, '');

    if (trimmedPhone && !/^\d{10}$/.test(trimmedPhone)) {
      setError('Phone number must be a 10-digit mobile number.');
      return;
    }

    if (trimmedUsername && (trimmedUsername.length < 3 || trimmedUsername.length > 20)) {
      setError('Username must be between 3 and 20 characters.');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('type-racer-token');
    try {
      let updatedUser = { ...user };

      // Update avatar if changed
      if (selectedAvatar && selectedAvatar !== user.avatar) {
        const res = await fetch('/api/users/avatar', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ avatar: selectedAvatar })
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to update avatar.');
          setLoading(false);
          return;
        }
        updatedUser = data.user;
      }
      
      // 1. Update username if changed
      if (trimmedUsername && trimmedUsername !== user.username) {
        const res = await fetch('/api/users/username', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ newUsername: trimmedUsername })
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to update username.');
          setLoading(false);
          return;
        }
        updatedUser = data.user;
      }

      // 2. Update phone number if changed
      if (trimmedPhone && trimmedPhone !== user.phoneNumber) {
        const res = await fetch('/api/users/phone', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ phoneNumber: trimmedPhone })
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to update phone number.');
          setLoading(false);
          return;
        }
        updatedUser = data.user;
      }

      onSuccess(updatedUser);
      onClose();
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className={`max-w-md w-full p-8 rounded-3xl border shadow-2xl relative max-h-[90vh] overflow-y-auto ${
          theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black italic tracking-tighter uppercase">Edit Profile</h3>
            <p className={`text-xs font-bold ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>Update avatar, handle and phone number</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>
              Select Avatar
            </label>
            <AvatarPicker selectedAvatarId={selectedAvatar} onSelectAvatar={setSelectedAvatar} />
          </div>
          <div>
            <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>
              Username
            </label>
            <div className="relative">
              <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`} />
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter new username"
                className={`w-full border rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
                }`}
                maxLength={20}
                required
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>
              Phone Number
            </label>
            <div className="relative">
              <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`} />
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className={`w-full border rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
                }`}
                maxLength={10}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`flex-1 py-3.5 rounded-2xl font-black italic text-xs uppercase tracking-wider transition-all ${
                theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-white/50' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-black italic text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Sub-Views
const LandingView = ({ onStart, onPractice, theme }: any) => (
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    exit={{ opacity: 0 }}
    className="relative z-10 min-h-screen flex flex-col items-center justify-between p-6 text-center overflow-hidden"
  >
    {/* Animated Background Racing Accents */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div 
        animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-blue-600/30 to-purple-600/10 blur-[140px] rounded-full"
      />
      <motion.div 
        animate={{ opacity: [0.1, 0.3, 0.1], y: [0, -30, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-blue-500/10 blur-[120px] rounded-full"
      />
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]" />
    </div>

    {/* Brand Header */}
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="w-full max-w-7xl flex items-center justify-between py-6 relative z-20"
    >
      <div className="flex items-center gap-3 group cursor-pointer">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:rotate-12 transition-transform">
          <Zap className="w-6 h-6 text-white fill-white" />
        </div>
        <div className="text-left">
          <span className="text-2xl font-black italic tracking-tighter uppercase block leading-none">Type Racer</span>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Pro Arena</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={onStart}
          className="text-xs font-black uppercase tracking-wider text-white/70 hover:text-white px-4 py-2 rounded-xl transition-colors"
        >
          Sign In
        </button>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPractice}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-black italic text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all"
        >
          Create Account
        </motion.button>
      </div>
    </motion.div>

    {/* Hero Main Content */}
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.8 }}
      className="max-w-5xl my-auto py-12 relative z-20 flex flex-col items-center"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-black uppercase tracking-widest mb-8 backdrop-blur-md"
      >
        <Flame className="w-4 h-4 animate-pulse text-orange-400" />
        <span>World's #1 Competitive Typing Circuit</span>
      </motion.div>

      <h1 className="text-6xl sm:text-7xl md:text-[8.5rem] font-black italic tracking-tighter leading-[0.85] mb-8 uppercase drop-shadow-2xl">
        <span className="block text-white">Speed.</span>
        <span className="block bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">Precision.</span>
        <span className="block text-white">Glory.</span>
      </h1>
      
      <p className={`text-base sm:text-lg md:text-xl font-bold mb-10 max-w-2xl mx-auto leading-relaxed ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
        Dominate the racetrack with millisecond accuracy. Race real opponents globally in zero-latency private rooms or challenge adaptive AI bots.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-5 justify-center w-full max-w-md">
        <motion.button 
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={onStart}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-10 py-5 rounded-2xl font-black italic text-xl flex items-center justify-center gap-3 transition-all shadow-[0_15px_40px_rgba(37,99,235,0.4)] border border-blue-400/30"
        >
          <span>ENTER THE TRACK</span>
          <ChevronRight className="w-6 h-6" />
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.04, backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(243,244,246,1)' }}
          whileTap={{ scale: 0.96 }}
          onClick={onPractice}
          className={`px-10 py-5 rounded-2xl font-black italic text-xl transition-all border-2 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white/80' : 'bg-white border-gray-200 text-gray-800 shadow-xl'}`}
        >
          PRACTICE MODE
        </motion.button>
      </div>
    </motion.div>

    {/* Features Section */}
    <div className="w-full max-w-6xl py-12 relative z-20">
      <div className="text-center mb-10">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400 mb-2">Engineered For Champions</h2>
        <h3 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight">Built For Millisecond Competition</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        <FeatureCard theme={theme} icon={<Users />} title="Multiplayer Rooms" desc="Host private lobbies with custom 6-digit room codes." />
        <FeatureCard theme={theme} icon={<Bot />} title="Adaptive AI" desc="Train against bots calibrated from 10 to 100+ WPM." />
        <FeatureCard theme={theme} icon={<BarChart2 />} title="Telemetry & Heatmap" desc="Track key latency and mistake errors on every race." />
        <FeatureCard theme={theme} icon={<Award />} title="Global Ranks" desc="Level up, earn coins, and climb live leaderboards." />
      </div>
    </div>

    {/* Testimonials Section */}
    <div className="w-full max-w-6xl py-12 relative z-20">
      <div className="text-center mb-10">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400 mb-2">Community Reviews</h2>
        <h3 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight">Loved By Competitive Typists</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <TestimonialCard 
          quote="The live telemetry heatmap helped me isolate my weak keystrokes and jump from 110 to 142 WPM in three weeks!"
          author="Alex 'SpeedDemon' V."
          wpm="142 WPM"
          theme={theme}
        />
        <TestimonialCard 
          quote="The multiplayer room code system makes organizing typing tournaments with friends ridiculously fast and seamless."
          author="Maya 'ApexTyper' K."
          wpm="128 WPM"
          theme={theme}
        />
        <TestimonialCard 
          quote="Racing against the 100 WPM Bot felt like playing an arcade game. Super smooth, addicting, and accurate WPM stats!"
          author="Rohan 'KeyMaster' S."
          wpm="115 WPM"
          theme={theme}
        />
      </div>
    </div>

    {/* Call-To-Action Banner */}
    <div className={`w-full max-w-5xl my-12 p-10 md:p-14 rounded-[3rem] border relative overflow-hidden text-center z-20 ${
      theme === 'dark' ? 'bg-gradient-to-r from-blue-900/40 via-blue-900/20 to-purple-900/40 border-blue-500/30' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xl'
    }`}>
      <div className="relative z-10 max-w-2xl mx-auto">
        <h3 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-4 leading-none">Ready To Claim Your Spot?</h3>
        <p className={`text-sm md:text-base font-bold mb-8 ${theme === 'dark' ? 'text-white/70' : 'text-blue-100'}`}>
          Join tens of thousands of competitive racers on the world's most responsive typing circuit.
        </p>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          className="bg-white text-blue-600 px-10 py-5 rounded-2xl font-black italic text-xl uppercase tracking-wider shadow-2xl hover:bg-gray-100 transition-all inline-flex items-center gap-3"
        >
          <span>START RACING NOW</span>
          <ArrowRight className="w-6 h-6 text-blue-600" />
        </motion.button>
      </div>
    </div>
  </motion.div>
);

const StatPill = ({ label, value, icon, theme }: any) => (
  <div className={`p-4 rounded-2xl border backdrop-blur-md flex flex-col items-center justify-center ${
    theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-md'
  }`}>
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <span className="text-xl font-black italic tracking-tight">{value}</span>
    </div>
    <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>
      {label}
    </span>
  </div>
);

const TestimonialCard = ({ quote, author, wpm, theme }: any) => (
  <div className={`p-6 rounded-3xl border flex flex-col justify-between ${
    theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-lg'
  }`}>
    <Quote className="w-6 h-6 text-blue-500/40 mb-3" />
    <p className={`text-xs font-bold leading-relaxed mb-6 italic ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>
      "{quote}"
    </p>
    <div className="flex items-center justify-between border-t pt-4 border-white/5">
      <div className="font-black italic text-sm">{author}</div>
      <div className="bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase">
        {wpm}
      </div>
    </div>
  </div>
);

const FeatureCard = ({ icon, title, desc, theme }: any) => (
  <motion.div 
    whileHover={{ y: -6 }}
    className={`p-6 rounded-3xl border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-blue-500/30' : 'bg-white border-gray-100 shadow-xl hover:border-blue-500/30'}`}
  >
    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500 mb-5">{icon}</div>
    <h3 className="text-lg font-black italic tracking-tighter mb-2 uppercase">{title}</h3>
    <p className={`font-bold text-xs leading-relaxed ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>{desc}</p>
  </motion.div>
);

const LoginView = ({ 
  onLogin, onSwitch, theme, error
}: any) => {
  return (
    <AuthContainer theme={theme} title="SIGN IN" subtitle="Return to the racing circuit">
      {error && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest text-center"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={onLogin} className="space-y-6">
        <AuthInput name="email" icon={<Mail className="w-5 h-5" />} type="email" placeholder="Email Address" theme={theme} required />
        <AuthInput name="password" icon={<Lock className="w-5 h-5" />} type="password" placeholder="Password" theme={theme} required />
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-blue-600 hover:bg-blue-700 py-5 rounded-2xl font-black italic tracking-tighter transition-all text-white text-xl shadow-2xl"
        >
          LOGIN
        </motion.button>
      </form>
      <div className={`mt-10 text-center text-xs font-bold ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>
        NEW TO THE TRACK? <button onClick={onSwitch} className="text-blue-500 font-black hover:underline uppercase ml-1">Create Account</button>
      </div>
    </AuthContainer>
  );
};

const RegisterView = ({ onRegister, onSwitch, theme, isRegistering, error, onTermsClick, onPrivacyClick }: any) => {
  const [accepted, setAccepted] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('avatar_boy_1');

  return (
    <AuthContainer theme={theme} title="REGISTER" subtitle="Start your professional career">
      {error && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest text-center"
        >
          {error}
        </motion.div>
      )}
      <form onSubmit={onRegister} className="space-y-6">
        <div>
          <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>
            Choose Avatar
          </label>
          <AvatarPicker selectedAvatarId={selectedAvatar} onSelectAvatar={setSelectedAvatar} />
          <input type="hidden" name="avatar" value={selectedAvatar} />
        </div>
        <AuthInput name="username" icon={<User className="w-5 h-5" />} type="text" placeholder="Username" theme={theme} disabled={isRegistering} required />
        <AuthInput name="email" icon={<Mail className="w-5 h-5" />} type="email" placeholder="Email Address" theme={theme} disabled={isRegistering} required />
        <AuthInput name="phone_number" icon={<Phone className="w-5 h-5" />} type="tel" placeholder="Phone Number (10 digits)" theme={theme} disabled={isRegistering} required />
        <AuthInput name="password" icon={<Lock className="w-5 h-5" />} type="password" placeholder="Password" theme={theme} disabled={isRegistering} required />
        <AuthInput name="confirm_password" icon={<Lock className="w-5 h-5" />} type="password" placeholder="Confirm Password" theme={theme} disabled={isRegistering} required />
        
        {/* Terms checkbox */}
        <div className={`flex flex-col gap-3 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input 
              type="checkbox" 
              name="accept_terms"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              disabled={isRegistering}
              required
              className="mt-1 w-4 h-4 rounded border bg-transparent text-blue-600 focus:ring-0 cursor-pointer"
            />
            <span className={`text-[11px] font-bold tracking-tight leading-tight ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>
              I agree to the{' '}
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); onTermsClick(); }}
                className="text-blue-500 hover:underline inline-block font-black"
              >
                Terms & Conditions
              </button>{' '}
              and{' '}
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); onPrivacyClick(); }}
                className="text-blue-500 hover:underline inline-block font-black"
              >
                Privacy Policy
              </button>.
            </span>
          </label>
          <div className={`text-[9px] font-medium leading-normal tracking-tight border-t pt-2 ${theme === 'dark' ? 'border-white/5 text-white/30' : 'border-gray-200 text-gray-400'}`}>
            This is a SaaS application. By creating an account, you consent to storing your account information. We may contact you regarding account updates, security notifications, product improvements, and occasional promotional offers. We do not sell your personal information.
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isRegistering || !accepted}
          className="w-full bg-blue-600 hover:bg-blue-700 py-5 rounded-2xl font-black italic tracking-tighter transition-all text-white text-xl shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isRegistering ? (
            <>
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="uppercase">Creating...</span>
            </>
          ) : (
            'START CAREER'
          )}
        </motion.button>
      </form>
      <div className={`mt-10 text-center text-xs font-bold ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>
        ALREADY REGISTERED? <button onClick={onSwitch} className="text-blue-500 font-black hover:underline uppercase ml-1" disabled={isRegistering}>Login</button>
      </div>
    </AuthContainer>
  );
};

const AuthContainer = ({ children, title, subtitle, theme }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -40 }}
    className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] p-6"
  >
    <div className={`w-full max-w-xl p-12 md:p-16 rounded-[3.5rem] border backdrop-blur-3xl shadow-[0_40px_80px_rgba(0,0,0,0.5)] ${theme === 'dark' ? 'bg-black/40 border-white/10' : 'bg-white border-gray-100'}`}>
      <div className="text-center mb-12">
        <h2 className="text-5xl font-black italic tracking-tighter mb-3 uppercase leading-none">{title}</h2>
        <p className={`font-bold italic uppercase tracking-[0.2em] text-[10px] ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>{subtitle}</p>
      </div>
      {children}
    </div>
  </motion.div>
);

const AuthInput = ({ icon, theme, ...props }: any) => (
  <div className="relative">
    <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>{icon}</div>
    <input 
      {...props} 
      className={`w-full border rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-blue-500/50 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'}`} 
    />
  </div>
);

const DashboardView = ({ 
  user, onCreateRoom, onBotSelect, onLogout, onDeleteAccount, onChangeUsername, theme, onPracticeMode,
  multiplayerAction, setMultiplayerAction, roomCodeInput, setRoomCodeInput, onJoinRoom,
  onShowGuide, pointsAnimating
}: any) => {
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const currentLevelPoints = 250 * user.level * (user.level - 1);
  const nextLevelPoints = 250 * (user.level + 1) * user.level;
  const levelProgress = Math.min(100, Math.max(0, ((user.points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100));

  const winRate = user.races_played > 0 ? Math.round(((user.wins || 0) / user.races_played) * 100) : 0;
  const wpmProgress = Math.min(100, Math.round(((user.best_wpm || 0) / 150) * 100));
  const accuracyProgress = Math.round(user.avg_accuracy || 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 p-6 md:p-8 pt-10 max-w-7xl mx-auto"
    >
      {/* Profile Header & Top Control Bar */}
      <div className={`p-8 md:p-10 rounded-[3rem] border mb-10 transition-all backdrop-blur-xl relative overflow-visible shadow-2xl ${
        theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-xl'
      }`}>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          
          {/* User Details */}
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left w-full lg:w-auto">
            <div className="relative shrink-0">
              <AvatarDisplay avatarId={user.avatar} size="lg" />
              <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white text-[10px] font-black px-2.5 py-1 rounded-xl uppercase tracking-wider border-2 border-neutral-900 shadow-md">
                LVL {user.level}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                <h2 className="text-3xl sm:text-4xl font-black italic tracking-tighter uppercase leading-none truncate max-w-xs md:max-w-md" title={user.username}>
                  {user.username}
                </h2>
                <motion.div 
                  animate={pointsAnimating ? { scale: [1, 1.2, 1] } : {}}
                  className="inline-flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-xl text-yellow-500 font-black text-xs shrink-0"
                >
                  <Coins className="w-4 h-4" />
                  <span>{user.points || 0} POINTS</span>
                </motion.div>
              </div>

              {/* Phone Number Display */}
              <div className={`flex items-center justify-center sm:justify-start gap-2 text-xs font-bold mb-4 ${
                theme === 'dark' ? 'text-white/40' : 'text-gray-500'
              }`}>
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                <span>{user.phoneNumber || user.phone_number || 'No phone linked'}</span>
              </div>

              {/* Animated Level XP Progress Bar */}
              <div className="w-full max-w-md">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider mb-1.5">
                  <span className={theme === 'dark' ? 'text-white/40' : 'text-gray-400'}>Level Progress</span>
                  <span className="text-blue-400">{Math.round(levelProgress)}% to LVL {user.level + 1}</span>
                </div>
                <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${levelProgress}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={onShowGuide} 
              className={`px-5 py-3.5 rounded-2xl border transition-all flex items-center gap-2 group ${
                theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black italic uppercase tracking-wider">Guide</span>
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowSettingsDropdown(!showSettingsDropdown)} 
                className={`p-3.5 rounded-2xl border transition-all flex items-center gap-2 group ${
                  showSettingsDropdown 
                    ? (theme === 'dark' ? 'bg-white/15 border-white/20 text-blue-400' : 'bg-gray-100 border-gray-300 text-blue-600')
                    : (theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm')
                }`}
              >
                <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              </button>
              
              <AnimatePresence>
                {showSettingsDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 cursor-default" 
                      onClick={() => setShowSettingsDropdown(false)} 
                    />
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className={`absolute right-0 mt-3 w-[300px] max-w-[calc(100vw-2rem)] p-5 rounded-3xl border shadow-2xl z-50 text-left ${
                        theme === 'dark' 
                          ? 'bg-neutral-950 border-white/10 text-white shadow-black/80' 
                          : 'bg-white border-gray-200 text-gray-900 shadow-gray-200'
                      }`}
                    >
                      <h4 className="text-xs font-black uppercase tracking-widest text-blue-500 mb-3 px-1">Settings</h4>
                      
                      <div className="space-y-1.5">
                        <button
                          onClick={() => {
                            setShowSettingsDropdown(false);
                            onChangeUsername();
                          }}
                          className="w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3 transition-all hover:bg-blue-500/10 text-blue-400 font-bold text-xs"
                        >
                          <User className="w-4 h-4 shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-bold">EDIT PROFILE</span>
                            <span className="text-[10px] text-blue-400/60 font-medium">Change avatar & username</span>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setShowSettingsDropdown(false);
                            onDeleteAccount();
                          }}
                          className="w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3 transition-all hover:bg-red-500/10 text-red-500 font-bold text-xs"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-bold">DELETE ACCOUNT</span>
                            <span className="text-[10px] text-red-400/60 font-medium">Permanently erase profile</span>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={onLogout} 
              className={`p-3.5 rounded-2xl border transition-all ${
                theme === 'dark' ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100 shadow-sm'
              }`}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Section - Career Races Only */}
      <div className="mb-12 max-w-sm">
        <div className={`p-6 rounded-3xl border relative overflow-hidden transition-all ${
          theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-lg'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>Career Races</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl font-black italic tracking-tight mb-2 leading-none">
            {user.races_played ?? user.matchesPlayed ?? user.racesPlayed ?? 0}
          </div>
          <p className={`text-[10px] font-bold ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Total Circuits Completed</p>
        </div>
      </div>

      {/* Game Modes Circuit */}
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatePresence mode="wait">
            {multiplayerAction === 'none' ? (
              <motion.div
                key="multiplayer-default"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <GameModeCard 
                  title="MULTIPLAYER" 
                  desc="Race real typists in zero-latency private rooms."
                  icon={<Users className="w-8 h-8" />}
                  color="bg-blue-600"
                  onClick={() => setMultiplayerAction('select')}
                />
              </motion.div>
            ) : multiplayerAction === 'select' ? (
              <motion.div 
                key="multiplayer-select"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-blue-600 rounded-[2.5rem] p-10 flex flex-col justify-center gap-4 relative overflow-hidden shadow-2xl border border-blue-400/20"
              >
                <button 
                  onClick={() => setMultiplayerAction('join')}
                  className="w-full bg-white/10 hover:bg-white/20 py-5 rounded-2xl font-black italic tracking-tighter flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95"
                >
                  <Users className="w-6 h-6" /> ENTER CODE
                </button>
                <button 
                  onClick={() => { onCreateRoom(); setMultiplayerAction('none'); }}
                  className="w-full bg-white text-blue-600 py-5 rounded-2xl font-black italic tracking-tighter flex items-center justify-center gap-3 transition-all shadow-2xl transform hover:scale-[1.02] active:scale-95"
                >
                  <UserPlus className="w-6 h-6" /> INVITE FRIENDS
                </button>
                <button 
                  onClick={() => setMultiplayerAction('none')}
                  className="text-xs font-black tracking-widest text-white/50 hover:text-white uppercase mt-4 text-center transition-colors"
                >
                  CANCEL
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="multiplayer-join"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-blue-600 rounded-[2.5rem] p-10 flex flex-col justify-center gap-4 relative overflow-hidden shadow-2xl border border-blue-400/20"
              >
                <div className="relative">
                  <input 
                    autoFocus
                    placeholder="ENTER ROOM CODE"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    className="w-full bg-black/30 border-2 border-white/10 rounded-2xl py-5 px-8 text-white font-black italic text-xl placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all text-center tracking-widest"
                  />
                </div>
                <button 
                  onClick={() => { onJoinRoom(roomCodeInput); setMultiplayerAction('none'); setRoomCodeInput(''); }}
                  className="w-full bg-white text-blue-600 py-5 rounded-2xl font-black italic tracking-tighter flex items-center justify-center gap-3 transition-all shadow-2xl transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!roomCodeInput}
                >
                  JOIN ROOM
                </button>
                <button 
                  onClick={() => setMultiplayerAction('select')}
                  className="text-xs font-black tracking-widest text-white/50 hover:text-white uppercase mt-4 text-center transition-colors"
                >
                  BACK
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div 
            whileHover={{ scale: 1.02, rotate: -0.5 }}
            className={`p-10 rounded-[2.5rem] transition-all shadow-2xl relative overflow-hidden flex flex-col justify-between group ${theme === 'dark' ? 'bg-orange-600' : 'bg-orange-500 text-white'}`}
          >
            <div className="relative z-10">
              <div className="mb-6 bg-white/20 w-16 h-16 rounded-[1.25rem] flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-4xl font-black italic tracking-tighter mb-2">PRACTICE</h3>
              <p className="text-white/70 text-sm mb-8 font-bold">Refine your speed with a solo target challenge.</p>
              
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {[10, 20, 30, 40, 50, 60].map(wpm => (
                  <motion.button 
                    key={wpm}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onPracticeMode(wpm)}
                    className="bg-white/20 hover:bg-white/40 py-3 rounded-xl font-black italic text-sm transition-all border border-white/10"
                  >
                    {wpm}
                  </motion.button>
                ))}
              </div>
            </div>
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 blur-3xl rounded-full -mr-24 -mt-24 pointer-events-none" />
          </motion.div>
        </div>

        {/* AI Bot Challenges */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`border rounded-[3rem] p-10 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-2xl'}`}
        >
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Bot Race Challenges</h3>
            <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
              <Gamepad2 className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(BOT_DIFFICULTIES).map(([wpm, diff], idx) => (
              <motion.button 
                key={wpm}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + (idx * 0.05) }}
                whileHover={{ y: -5, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onBotSelect(Number(wpm))}
                className={`border rounded-[2rem] p-6 transition-all group relative overflow-hidden flex flex-col items-center justify-center ${theme === 'dark' ? 'bg-white/5 hover:bg-blue-600 border-white/5 hover:border-blue-500' : 'bg-gray-50 hover:bg-blue-600 border-gray-200 hover:border-blue-500 text-gray-900 hover:text-white shadow-lg'}`}
              >
                <div className="text-3xl font-black italic group-hover:scale-110 transition-transform mb-1 leading-none">{wpm}</div>
                <div className={`text-[10px] font-black uppercase tracking-widest transition-colors ${theme === 'dark' ? 'text-white/30 group-hover:text-blue-100' : 'text-gray-400 group-hover:text-blue-100'}`}>{diff.name}</div>
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 blur-xl rounded-full -mr-8 -mt-8 pointer-events-none" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const GameModeCard = ({ title, desc, icon, color, onClick }: any) => (
  <motion.button 
    whileHover={{ scale: 1.02, rotate: 0.5, y: -4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`${color} rounded-[2.5rem] p-10 text-left transition-all shadow-2xl relative overflow-hidden group w-full h-full min-h-[280px] flex flex-col justify-between border border-white/10`}
  >
    <div className="relative z-10">
      <motion.div 
        initial={false}
        whileHover={{ rotate: 15, scale: 1.1 }}
        className="mb-8 bg-white/20 w-20 h-20 rounded-[1.5rem] flex items-center justify-center shadow-lg backdrop-blur-md"
      >
        {icon}
      </motion.div>
      <h3 className="text-4xl font-black italic tracking-tighter mb-3 uppercase leading-none">{title}</h3>
      <p className="text-white/70 text-sm max-w-[220px] font-bold leading-relaxed">{desc}</p>
    </div>
    <div className="relative z-10 flex items-center gap-2 mt-8 text-white/50 group-hover:text-white transition-colors">
      <span className="text-[10px] font-black tracking-widest uppercase">Start Race</span>
      <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
    </div>
    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[80px] rounded-full -mr-32 -mt-32 pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 blur-[40px] rounded-full -ml-16 -mb-16 pointer-events-none" />
  </motion.button>
);

const LobbyView = ({ room, isHost, onStart, onBack }: any) => {
  const [copied, setCopied] = React.useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8"
    >
      <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[3.5rem] p-12 max-w-4xl w-full shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
          <div>
            <motion.h2 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-6xl font-black italic tracking-tighter mb-4 leading-none"
            >
              LOBBY
            </motion.h2>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 bg-blue-600/20 px-6 py-3 rounded-2xl border border-blue-500/20">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Code</span>
                <span className="text-white text-3xl font-black italic tracking-tighter">{room.id}</span>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyCode}
                className={`px-6 py-4 rounded-2xl text-[10px] font-black tracking-widest transition-all ${copied ? 'bg-green-500 text-white shadow-lg' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'}`}
              >
                {copied ? 'COPIED!' : 'COPY LINK'}
              </motion.button>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            onClick={onBack} 
            className="text-white/40 hover:text-red-500 transition-colors font-black italic tracking-tighter uppercase text-sm border-b-2 border-transparent hover:border-red-500/50"
          >
            Exit Room
          </motion.button>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {room.players.map((player) => (
          <div key={player.id} className="flex items-center gap-4 bg-black/40 border border-white/5 p-6 rounded-2xl">
            <AvatarDisplay avatarId={player.avatar} size="md" />
            <div className="flex-1 min-w-0">
              <div className="font-black italic tracking-tighter truncate max-w-full" title={player.username}>{player.username}</div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                {player.id === room.hostId ? 'HOST' : 'PLAYER'}
              </div>
            </div>
            {player.isReady ? (
              <div className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-[10px] font-bold">READY</div>
            ) : (
              <div className="bg-white/5 text-white/40 px-3 py-1 rounded-full text-[10px] font-bold">WAITING</div>
            )}
          </div>
        ))}
        {Array.from({ length: Math.max(0, 4 - room.players.length) }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 bg-white/5 border border-dashed border-white/10 p-6 rounded-2xl opacity-50">
            <div className="w-12 h-12 rounded-xl bg-white/5" />
            <div className="text-white/20 font-bold italic tracking-tighter uppercase">Waiting for player...</div>
          </div>
        ))}
      </div>

      {isHost ? (
        <button 
          onClick={onStart}
          className="w-full bg-blue-600 hover:bg-blue-700 py-6 rounded-2xl font-black italic text-2xl tracking-tighter shadow-2xl transition-all transform hover:scale-[1.02]"
        >
          START RACE
        </button>
      ) : (
        <div className="text-center p-6 bg-white/5 rounded-2xl font-bold italic text-white/40 tracking-widest animate-pulse">
          WAITING FOR HOST TO START...
        </div>
      )}
    </div>
  </motion.div>
  );
};

const HistoryItem = ({ race, theme }: any) => {
  const [showHeatmap, setShowHeatmap] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col p-6 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:border-blue-500/20 shadow-sm'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-black italic ${race.won ? 'bg-yellow-500 text-black' : 'bg-blue-500/20 text-blue-500'}`}>
            <div className="text-xl leading-none">{Math.round(race.wpm)}</div>
            <div className="text-[8px] uppercase tracking-tighter">WPM</div>
          </div>
          <div>
            <div className="font-black italic tracking-tighter uppercase text-lg">
              {race.mode === 'multiplayer' ? 'Multiplayer Race' : (race.mode === 'bot' ? 'Bot Challenge' : 'Practice Session')}
            </div>
            <div className={`text-xs font-bold ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>
              {new Date(race.timestamp).toLocaleDateString()} at {new Date(race.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex gap-4">
            {race.coins_earned > 0 && (
              <div className="flex items-center gap-1 text-yellow-500 font-bold text-xs">
                <Coins className="w-3 h-3" />
                +{race.coins_earned}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>ACCURACY</div>
            <div className="font-black italic text-xl text-blue-500">{Math.round(race.accuracy)}%</div>
          </div>
          <button 
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-4 py-2 rounded-xl font-black italic text-xs transition-all ${showHeatmap ? 'bg-blue-500 text-white' : (race.won ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/5 text-white/20')}`}
          >
            {showHeatmap ? 'HIDE MAP' : (race.heatmap ? 'VIEW MAP' : (race.won ? 'VICTORY' : 'COMPLETED'))}
          </button>
        </div>
      </div>

      {showHeatmap && race.heatmap && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 pt-6 border-t border-white/5"
        >
          <Heatmap data={race.heatmap} theme={theme} />
        </motion.div>
      )}
    </motion.div>
  );
};

const HistoryView = ({ history, onBack, theme }: any) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
    className="relative z-10 p-8 pt-12 max-w-4xl mx-auto"
  >
    <div className="flex justify-between items-center mb-12">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
          <History className="w-6 h-6" />
        </div>
        <h2 className="text-4xl font-black italic tracking-tighter uppercase">MATCH HISTORY</h2>
      </div>
      <button onClick={onBack} className={`px-6 py-3 rounded-xl font-bold italic transition-all ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white' : 'bg-white border border-gray-200 hover:bg-gray-50 shadow-sm'}`}>
        BACK TO DASHBOARD
      </button>
    </div>

    <div className="space-y-4">
      {history.length === 0 ? (
        <div className={`text-center py-20 rounded-3xl border border-dashed ${theme === 'dark' ? 'border-white/10 text-white/20' : 'border-gray-200 text-gray-400'}`}>
          <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-bold italic tracking-widest">NO RACES RECORDED YET</p>
        </div>
      ) : (
        history.map((race: any) => (
          <HistoryItem key={race.id} race={race} theme={theme} />
        ))
      )}
    </div>
  </motion.div>
);
