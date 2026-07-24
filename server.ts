/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { Room, PlayerProgress } from './src/types';
import { supabase, supabaseAnon } from './src/lib/supabase';

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

const PORT = 3000;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// API routes FIRST
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    supabase: !!supabase,
    supabaseAuth: !!supabase?.auth,
    supabaseAnon: !!supabaseAnon,
    env: process.env.NODE_ENV,
    urlSet: !!process.env.SUPABASE_URL
  });
});

// In-memory data store for rooms (multiplayer state)
const rooms = new Map<string, Room>();

// Middleware to authenticate Supabase User
async function authenticate(req: any, res: any, next: any) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token || token === 'null' || token === 'undefined') return res.status(401).json({ error: 'Unauthorized' });

  if (!supabase) {
    console.error('AUTHENTICATION ERROR: Supabase client not initialized');
    return res.status(503).json({ error: 'Database connection not available' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Check if user is marked as deleted in user metadata
    if (user.user_metadata?.deleted || user.app_metadata?.deleted) {
      return res.status(401).json({ error: 'This account has been deleted' });
    }

    req.user = user;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

// Helper to fetch user profile from DB
async function getProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error || !data) return null;
    
    let isDeleted = false;
    let phone = data.phone_number || '';
    let avatar = data.avatar || 'avatar_boy_1';

    if (supabase) {
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(userId);
        if (authUser?.user) {
          if (authUser.user.user_metadata?.phone_number) {
            phone = authUser.user.user_metadata.phone_number;
          }
          if (authUser.user.user_metadata?.avatar) {
            avatar = authUser.user.user_metadata.avatar;
          }
          if (authUser.user.user_metadata?.deleted || authUser.user.app_metadata?.deleted) {
            isDeleted = true;
          }
        }
      } catch (e) {
        // Ignore
      }
    }

    if (data.deleted) isDeleted = true;

    return {
      id: data.id,
      username: data.username,
      email: data.email || '', // Email might not be in profiles
      avatar: avatar || 'avatar_boy_1',
      phoneNumber: phone || data.phone_number || '',
      phone_number: phone || data.phone_number || '',
      deleted: isDeleted,
      points: data.coins || 0,
      level: data.level || 1,
      bestWpm: data.best_wpm || 0,
      lastWpm: data.avg_wpm || 0, // Using avg_wpm as lastWpm mapping
      avgAccuracy: data.avg_accuracy || 0,
      matchesPlayed: data.races_played || 0,
      racesPlayed: data.races_played || 0,
      races_played: data.races_played || 0,
      wins: data.wins || 0
    };
  } catch (err) {
    console.error('getProfile error:', err);
    return null;
  }
}

// Consolidate stats update logic
async function updateStats(userId: string, wpm: number, accuracy: number, won: boolean, mode: string = 'practice', heatmap?: any, incrementRaces: boolean = true) {
  try {
    const profile = await getProfile(userId);
    if (!profile) {
      console.log(`UpdateStats: No profile found for ${userId}`);
      return null;
    }

    const safeWpm = isFinite(wpm) ? Math.max(0, Math.min(300, wpm)) : 0;
    const safeAccuracy = isFinite(accuracy) ? Math.max(0, Math.min(100, accuracy)) : 0;

    const currentRaces = profile.racesPlayed || profile.matchesPlayed || profile.races_played || 0;
    const matchesPlayed = incrementRaces ? currentRaces + 1 : currentRaces;
    const wins = won ? (profile.wins || 0) + 1 : (profile.wins || 0);
    const bestWpm = Math.max(profile.bestWpm || 0, safeWpm);
    
    const currentAvgWpm = profile.lastWpm || 0; 
    const avgWpm = matchesPlayed > 0 ? Math.round(((currentAvgWpm * Math.max(0, matchesPlayed - 1)) + safeWpm) / matchesPlayed) : safeWpm;
    
    const currentAvgAcc = profile.avgAccuracy || 0;
    const avgAccuracy = matchesPlayed > 0 ? Math.round(((currentAvgAcc * Math.max(0, matchesPlayed - 1)) + safeAccuracy) / matchesPlayed) : safeAccuracy;

    // Calculate dynamic rewards
    let pointsGained = 50;

    if (won) {
      pointsGained += 50;
    }

    if (mode === 'bot') {
      pointsGained += 20;
    }

    const points = (profile.points || 0) + pointsGained;
    // Level formula: Points required for level L = 250 * L * (L - 1)
    // Level 1: 0, Level 2: 500, Level 3: 1500, Level 4: 3000...
    const level = Math.floor((1 + Math.sqrt(1 + 8 * points / 500)) / 2);

    // Update Profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        races_played: matchesPlayed,
        wins: wins,
        best_wpm: bestWpm,
        avg_accuracy: avgAccuracy,
        avg_wpm: avgWpm,
        coins: points,
        xp: points,
        level: level
      })
      .eq('id', userId);

    if (updateError) throw updateError;
    
    // Record History
    const { error: historyError } = await supabase
      .from('race_history')
      .insert({
        user_id: userId,
        wpm: safeWpm,
        accuracy: safeAccuracy,
        mode: mode,
        won: won
      });

    if (historyError) {
      console.error('Failed to save race history:', historyError.message);
    } else {
      console.log(`Saved history for ${userId} (Mode: ${mode}, WPM: ${safeWpm})`);
    }

    return {
      profile: { 
        ...profile, 
        matchesPlayed, 
        racesPlayed: matchesPlayed, 
        races_played: matchesPlayed, 
        wins, 
        bestWpm, 
        avgAccuracy, 
        lastWpm: avgWpm, 
        points, 
        level,
        phoneNumber: profile.phoneNumber || profile.phone_number || '',
        phone_number: profile.phone_number || profile.phoneNumber || ''
      },
      rewards: {
        points: pointsGained,
        xp: pointsGained,
        totalXp: points,
        coins: pointsGained,
        level: level
      }
    };
  } catch (err: any) {
    console.error('updateStats error:', err.message || err);
    return null;
  }
}

// Helper to create or ensure profile exists (Idempotent)
async function ensureProfile(userId: string, username: string, email: string, phoneNumber?: string, avatar: string = 'avatar_boy_1') {
  const profileToUpsert: any = {
    id: userId,
    username,
    avatar_url: avatar || 'avatar_boy_1',
    best_wpm: 0,
    avg_wpm: 0,
    avg_accuracy: 0,
    coins: 100,
    level: 1,
    races_played: 0,
    wins: 0
  };

  if (phoneNumber) {
    profileToUpsert.phone_number = phoneNumber;
  }

  let { data, error } = await supabase
    .from('profiles')
    .upsert(profileToUpsert, { onConflict: 'id' })
    .select()
    .single();
  
  if (error && (error.message?.includes('phone_number') || error.message?.includes('avatar'))) {
    if (error.message?.includes('phone_number')) delete profileToUpsert.phone_number;
    if (error.message?.includes('avatar')) {
      delete profileToUpsert.avatar;
      delete profileToUpsert.avatar_url;
    }
    const retry = await supabase
      .from('profiles')
      .upsert(profileToUpsert, { onConflict: 'id' })
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }
  
  if (error) {
    console.error(`Failed to ensure profile for ${userId}:`, error.message);
    throw error;
  }

  let phone = phoneNumber || '';
  let userAvatar = avatar || 'avatar_boy_1';
  let isDeleted = false;

  if (supabase) {
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      if (authUser?.user) {
        if (authUser.user.user_metadata?.phone_number) {
          phone = authUser.user.user_metadata.phone_number;
        }
        if (authUser.user.user_metadata?.avatar) {
          userAvatar = authUser.user.user_metadata.avatar;
        }
        if (authUser.user.user_metadata?.deleted || authUser.user.app_metadata?.deleted) {
          isDeleted = true;
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  return {
    id: data.id,
    username: data.username,
    email: email, // Return passed email
    avatar: data.avatar || userAvatar || 'avatar_boy_1',
    phoneNumber: phone || data.phone_number || '',
    phone_number: phone || data.phone_number || '',
    deleted: isDeleted,
    points: data.coins || 0,
    level: data.level || 1,
    bestWpm: data.best_wpm || 0,
    lastWpm: data.avg_wpm || 0,
    avgAccuracy: data.avg_accuracy || 0,
    matchesPlayed: data.races_played || 0,
    racesPlayed: data.races_played || 0,
    races_played: data.races_played || 0,
    wins: data.wins || 0
  };
}

// Helper for generating room codes
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Sample texts for racing
const RACE_TEXTS = [
  "The quick brown fox jumps over the lazy dog.",
  "Programming is the art of telling another human being what one wants the computer to do.",
  "In a world of constant change, the only strategy that is guaranteed to fail is not taking risks.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The only way to do great work is to love what you do.",
  "Type as fast as you can, but remember that accuracy is what wins the race in the end.",
  "Racing is life. Anything before or after is just waiting.",
  "Gentlemen, start your engines and may the fastest fingers win this intense typing battle.",
  "Every strike brings me closer to the next home run.",
  "Don't let the fear of striking out keep you from playing the game.",
  "Believe you can and you're halfway there.",
  "Your time is limited, so don't waste it living someone else's life.",
  "If you want to live a happy life, tie it to a goal, not to people or things.",
  "The best way to predict the future is to invent it."
];

// Auth Routes
app.get('/api/users/profile', authenticate, async (req: any, res) => {
  const userProfile = await getProfile(req.user.id);
  if (!userProfile) return res.status(404).json({ error: 'Profile not found' });
  res.json(userProfile);
});

app.put('/api/users/username', authenticate, async (req: any, res) => {
  try {
    let { newUsername } = req.body;
    if (!newUsername) return res.status(400).json({ error: 'Username is required' });
    
    newUsername = newUsername.trim();

    if (newUsername.length < 3 || newUsername.length > 20) {
      return res.status(400).json({ error: 'Username must be between 3 and 20 characters long' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }

    // Check uniqueness
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', newUsername)
      .neq('id', req.user.id)
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Update profiles table
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ username: newUsername })
      .eq('id', req.user.id);

    if (updateErr) throw updateErr;

    // Update user metadata in Supabase Auth
    if (supabase) {
      try {
        await supabase.auth.admin.updateUserById(req.user.id, {
          user_metadata: { ...req.user.user_metadata, username: newUsername }
        });
      } catch (authErr) {
        console.error('Failed to update user_metadata in auth:', authErr);
      }
    }

    const updatedProfile = await getProfile(req.user.id);
    res.json({ success: true, user: updatedProfile });
  } catch (err: any) {
    console.error('Change username error:', err);
    res.status(500).json({ error: err.message || 'Failed to change username' });
  }
});

app.put('/api/users/phone', authenticate, async (req: any, res) => {
  try {
    let { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: 'Phone number is required' });

    const cleanedPhone = phoneNumber.replace(/\s+/g, '');
    if (!/^\d{10}$/.test(cleanedPhone)) {
      return res.status(400).json({ error: 'Phone number must be a 10-digit mobile number' });
    }

    // Check if phone number is already registered
    const existing = await findUserByPhone(cleanedPhone);
    if (existing && existing.id !== req.user.id) {
      return res.status(400).json({ error: 'Phone number is already registered to another user' });
    }

    // Update profiles table if possible
    try {
      await supabase.from('profiles').update({ phone_number: cleanedPhone }).eq('id', req.user.id);
    } catch (e) {
      // Ignore if column doesn't exist
    }

    // Update user_metadata in Supabase Auth
    if (supabase) {
      await supabase.auth.admin.updateUserById(req.user.id, {
        user_metadata: { ...req.user.user_metadata, phone_number: cleanedPhone }
      });
    }

    const updatedProfile = await getProfile(req.user.id);
    res.json({ success: true, user: updatedProfile });
  } catch (err: any) {
    console.error('Update phone error:', err);
    res.status(500).json({ error: err.message || 'Failed to update phone number' });
  }
});

app.put('/api/users/avatar', authenticate, async (req: any, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ error: 'Avatar identifier is required' });

    // Update profiles table if possible
    try {
      await supabase.from('profiles').update({ avatar_url: avatar }).eq('id', req.user.id);
    } catch (e) {
      // Ignore if column doesn't exist
    }

    // Update user_metadata in Supabase Auth
    if (supabase) {
      await supabase.auth.admin.updateUserById(req.user.id, {
        user_metadata: { ...req.user.user_metadata, avatar }
      });
    }

    const updatedProfile = await getProfile(req.user.id);
    res.json({ success: true, user: updatedProfile });
  } catch (err: any) {
    console.error('Update avatar error:', err);
    res.status(500).json({ error: err.message || 'Failed to update avatar' });
  }
});

app.delete('/api/users/profile', authenticate, async (req: any, res) => {
  try {
    if (supabase) {
      await supabase.auth.admin.updateUserById(req.user.id, {
        user_metadata: { ...req.user.user_metadata, deleted: true }
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: err.message || 'Failed to delete account' });
  }
});

// Helper to search for an auth user by email
async function findUserByEmail(email: string) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });
    if (error || !data?.users) {
      console.error('findUserByEmail list error:', error);
      return null;
    }
    return (data.users as any[]).find(u => u.email?.toLowerCase() === email.toLowerCase()) || null;
  } catch (err) {
    console.error('findUserByEmail exception:', err);
    return null;
  }
}

// Helper to search for an auth user by phone number
async function findUserByPhone(phone: string) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });
    if (error || !data?.users) {
      return null;
    }
    return (data.users as any[]).find(u => u.user_metadata?.phone_number === phone) || null;
  } catch (err) {
    return null;
  }
}

app.post('/api/auth/register', async (req, res) => {
  const { username, email, phoneNumber, password, avatar } = req.body;
  if (!username || !email || !phoneNumber || !password) return res.status(400).json({ error: 'Missing fields' });
  
  const selectedAvatar = avatar || 'avatar_boy_1';
  const cleanedPhone = phoneNumber.replace(/\s+/g, '');
  if (!/^\d{10}$/.test(cleanedPhone)) {
    return res.status(400).json({ error: 'Phone number must be a 10-digit mobile number containing only digits' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }
  
  try {
    let userId: string;
    let token: string | undefined;

    if (!supabase) throw new Error('Supabase admin client not initialized. Check your SUPABASE_SERVICE_ROLE_KEY.');
    
    console.log('Checking if user exists:', email);
    const existingUser = await findUserByEmail(email);
    
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ error: 'An account with this email address already exists. Please sign in.' });
    }

    // Check if username already exists
    const { data: existingUsername } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .limit(1);
    
    if (existingUsername && existingUsername.length > 0) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Check if phone number already exists
    const existingPhoneUser = await findUserByPhone(cleanedPhone);
    if (existingPhoneUser) {
      return res.status(400).json({ error: 'Phone number is already registered' });
    }

    console.log('Creating new user:', email);
    // 1. Create the user with admin role to bypass rate limits
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, phone_number: cleanedPhone, avatar: selectedAvatar }
    });

    if (authError) {
      console.error('SUPABASE AUTH ERROR DURING CREATE:', authError);
      throw authError;
    }
    
    if (!authData.user) throw new Error('User creation failed: No user returned');
    userId = authData.user.id;
    
    // Sign in to get the session token
    const client = supabaseAnon || supabase;
    const { data: signInData, error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (signInError) {
      console.error('SIGNIN ERROR AFTER ADMIN CREATE:', signInError);
      throw signInError;
    }
    token = signInData.session?.access_token;

    // 2. Create/Ensure profile in profiles table (Idempotent)
    let profile;
    try {
      profile = await ensureProfile(userId, username, email, cleanedPhone, selectedAvatar);
    } catch (profileError: any) {
      console.error('Registration profile creation failed:', profileError.message);
      return res.status(201).json({ 
        partial: true, 
        message: 'Account created but profile setup failed. Please log in to complete setup.',
        token
      });
    }

    res.json({ user: profile, token });
  } catch (err: any) {
    console.error('Registration error details:', err);
    let errorMsg = err.message || 'Registration failed';
    res.status(err.status || 400).json({ error: errorMsg });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const client = supabaseAnon || supabase;
    if (!client) throw new Error('Supabase client not initialized. Check your environment variables.');
    
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email,
      password
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Login failed');

    // Fetch or lazily create profile
    let profile = await getProfile(authData.user.id);
    
    if (profile && profile.deleted) {
      // Force sign out immediately so their auth session isn't left active
      await client.auth.signOut();
      return res.status(401).json({ error: 'This account has been deleted' });
    }

    if (!profile) {
      console.log(`Profile missing for user ${authData.user.id}, creating lazily...`);
      const username = authData.user.user_metadata?.username || 'Racer';
      const phoneNumber = authData.user.user_metadata?.phone_number || '';
      profile = await ensureProfile(authData.user.id, username, authData.user.email || email, phoneNumber);
    }

    res.json({ user: profile, token: authData.session?.access_token });
  } catch (err: any) {
    console.error('Login error details:', err);
    let errorMsg = err.message || 'Login failed';
    
    if (err.name === 'AuthApiError' && err.status === 400) {
      errorMsg = 'Invalid email or password';
    } else if (err.name === 'AuthApiError' && err.status === 401) {
      errorMsg = 'Invalid login credentials';
    } else if (err.name === 'AuthRetryableFetchError' || errorMsg.includes('fetch')) {
      errorMsg = 'Connection to Supabase Auth Server failed. Please try again.';
    }

    res.status(err.status || 401).json({ error: errorMsg });
  }
});

app.post('/api/users/stats', authenticate, async (req: any, res) => {
  try {
    const { wpm, accuracy, won, mode, heatmap, incrementRacesPlayed } = req.body;
    const userId = req.user.id;

    const result = await updateStats(userId, wpm, accuracy, won, mode, heatmap, incrementRacesPlayed !== false);
    if (!result) return res.status(404).json({ error: 'Profile not found' });

    res.json({ success: true, user: result.profile, rewards: result.rewards });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/history', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabase
      .from('race_history')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    console.error('getHistory error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Socket.IO Logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', ({ roomId, username, userId, avatar }) => {
    let room = rooms.get(roomId);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    const pId = userId || socket.id;

    // Check if player is already in the room to prevent duplicates
    const existingIndex = room.players.findIndex(p => p.id === pId);

    const player: PlayerProgress = {
      id: pId,
      username,
      avatar: avatar || 'avatar_boy_1',
      wpm: 0,
      accuracy: 0,
      progress: 0,
      isReady: false,
      isFinished: false,
      carId: `car-${Math.floor(Math.random() * 5) + 1}`
    };

    // Store socketId on player object dynamically
    (player as any).socketId = socket.id;

    if (existingIndex !== -1) {
      room.players[existingIndex] = {
        ...room.players[existingIndex],
        ...player,
        // Preserve readiness if they are reconnecting/joining again
        isReady: room.players[existingIndex].isReady
      };
    } else {
      room.players.push(player);
    }

    socket.data.userId = pId;
    socket.data.roomId = roomId;
    socket.join(roomId);
    io.to(roomId).emit('roomUpdate', room);
  });

  socket.on('createRoom', ({ username, userId, avatar }) => {
    const roomId = generateRoomCode();
    const pId = userId || socket.id;
    const player: PlayerProgress = {
      id: pId,
      username,
      avatar: avatar || 'avatar_boy_1',
      wpm: 0,
      accuracy: 0,
      progress: 0,
      isReady: true,
      isFinished: false,
      carId: 'car-1'
    };
    (player as any).socketId = socket.id;

    const room: Room = {
      id: roomId,
      hostId: pId,
      players: [player],
      status: 'waiting',
      text: RACE_TEXTS[Math.floor(Math.random() * RACE_TEXTS.length)]
    };
    rooms.set(roomId, room);
    socket.data.userId = pId;
    socket.data.roomId = roomId;
    socket.join(roomId);
    socket.emit('roomCreated', room);
  });

  socket.on('leaveRoom', ({ roomId, userId }) => {
    const room = rooms.get(roomId);
    if (room) {
      const pId = userId || socket.data.userId || socket.id;
      const index = room.players.findIndex(p => p.id === pId || (p as any).socketId === socket.id);
      if (index !== -1) {
        room.players.splice(index, 1);
        socket.leave(roomId);
        if (room.players.length === 0) {
          // Cancel any scheduled game timeout or countdown
          if ((room as any).timeoutId) {
            clearTimeout((room as any).timeoutId);
          }
          if ((room as any).countdownIntervalId) {
            clearInterval((room as any).countdownIntervalId);
          }
          rooms.delete(roomId);
        } else {
          // If the host left, assign the first remaining player as the host
          if (room.hostId === pId) {
            room.hostId = room.players[0].id;
          }
          io.to(roomId).emit('roomUpdate', room);
        }
      }
    }
  });

  socket.on('updateProgress', ({ roomId, progress, wpm, accuracy, heatmap }) => {
    const room = rooms.get(roomId);
    if (room && room.status === 'racing') {
      const pId = socket.data.userId || socket.id;
      const player = room.players.find(p => p.id === pId);
      if (player) {
        player.progress = progress;
        player.wpm = wpm;
        player.accuracy = accuracy;
        if (progress >= 1 && !player.isFinished) {
          player.isFinished = true;
          player.finishTime = Date.now();
          
          const othersFinished = room.players.filter(p => p.id !== player.id && p.isFinished).length;
          const won = othersFinished === 0;

          // In multiplayer, if any one player completes the race, end it for everyone immediately
          if (room.id !== 'BOT-RACE' && room.id !== 'PRACTICE') {
            room.status = 'finished';
            
            // Cancel the room's 60-second limit timeout
            if ((room as any).timeoutId) {
              clearTimeout((room as any).timeoutId);
            }

            // Mark all other players as finished too and update their stats
            room.players.forEach(p => {
              if (!p.isFinished) {
                p.isFinished = true;
                p.finishTime = Date.now();
                if (p.id && !p.id.startsWith('bot-') && p.id !== player.id) {
                  updateStats(p.id, p.wpm, p.accuracy, false, 'multiplayer').then(res => {
                    if (res) {
                      p.rewards = res.rewards;
                      io.to(roomId).emit('roomUpdate', room);
                    }
                  });
                }
              }
            });
          }

          const userId = socket.data.userId;
          if (userId) {
            const mode = room.id === 'BOT-RACE' ? 'bot' : (room.id === 'PRACTICE' ? 'practice' : 'multiplayer');
            updateStats(userId, wpm, accuracy, won, mode, heatmap).then(result => {
              if (result) {
                player.rewards = result.rewards;
                io.to(roomId).emit('roomUpdate', room);
              }
            });
          }
        }
        io.to(roomId).emit('roomUpdate', room);
      }
    }
  });

  socket.on('startRace', ({ roomId }) => {
    const room = rooms.get(roomId);
    const pId = socket.data.userId || socket.id;
    if (room && room.status === 'waiting' && room.hostId === pId) {
      room.status = 'starting';
      io.to(roomId).emit('roomUpdate', room);
      
      let countdown = 3;
      const interval = setInterval(() => {
        io.to(roomId).emit('countdown', countdown);
        if (countdown === 0) {
          clearInterval(interval);
          if ((room as any).countdownIntervalId) {
            delete (room as any).countdownIntervalId;
          }
          room.status = 'racing';
          room.startTime = Date.now();
          io.to(roomId).emit('roomUpdate', room);

          // Setup server-side timeout of 60 seconds to end the race if nobody completes it in time
          if (room.id !== 'BOT-RACE' && room.id !== 'PRACTICE') {
            const roomTimeoutId = setTimeout(() => {
              const currentRoom = rooms.get(roomId);
              if (currentRoom && currentRoom.status === 'racing') {
                currentRoom.status = 'finished';
                
                // Mark all players as finished and update their stats
                let pendingUpdates = 0;
                currentRoom.players.forEach(p => {
                  if (!p.isFinished) {
                    p.isFinished = true;
                    p.finishTime = Date.now();
                    if (p.id && !p.id.startsWith('bot-')) {
                      pendingUpdates++;
                      updateStats(p.id, p.wpm, p.accuracy, false, 'multiplayer').then(res => {
                        if (res) p.rewards = res.rewards;
                        pendingUpdates--;
                        if (pendingUpdates === 0) {
                          io.to(roomId).emit('roomUpdate', currentRoom);
                        }
                      });
                    }
                  }
                });
                
                io.to(roomId).emit('roomUpdate', currentRoom);
              }
            }, 60000); // 60 seconds limit
            
            (room as any).timeoutId = roomTimeoutId;
          }
        }
        countdown--;
      }, 1000);
      (room as any).countdownIntervalId = interval;
    }
  });

  socket.on('disconnect', () => {
    // Handle player removal from rooms
    rooms.forEach((room, roomId) => {
      const index = room.players.findIndex(p => p.id === socket.data.userId || (p as any).socketId === socket.id || p.id === socket.id);
      if (index !== -1) {
        room.players.splice(index, 1);
        if (room.players.length === 0) {
          // Cancel scheduled timeout or countdown
          if ((room as any).timeoutId) {
            clearTimeout((room as any).timeoutId);
          }
          if ((room as any).countdownIntervalId) {
            clearInterval((room as any).countdownIntervalId);
          }
          rooms.delete(roomId);
        } else {
          // If the host left, assign the first remaining player as the host
          if (room.hostId === socket.data.userId || room.hostId === socket.id) {
            room.hostId = room.players[0].id;
          }
          io.to(roomId).emit('roomUpdate', room);
        }
      }
    });
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Supabase Status:', !!supabase ? 'Initialized' : 'MISSING');
  });
}

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('SERVER UNHANDLED ERROR:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

startServer().catch(err => {
  console.error('FAILED TO START SERVER:', err);
});
