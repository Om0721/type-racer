import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
let supabaseUrl = rawUrl;

if (supabaseUrl) {
  // Handle case where only project ref is provided
  if (!supabaseUrl.includes('.') && !supabaseUrl.startsWith('http')) {
    supabaseUrl = `${supabaseUrl}.supabase.co`;
  }
  // Ensure protocol
  if (!supabaseUrl.startsWith('http')) {
    supabaseUrl = `https://${supabaseUrl}`;
  }
  // Remove trailing slash
  if (supabaseUrl.endsWith('/')) {
    supabaseUrl = supabaseUrl.slice(0, -1);
  }
}

const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('SUPABASE INIT:', {
  url: supabaseUrl,
  hasAnon: !!supabaseAnonKey,
  hasService: !!supabaseServiceKey,
  urlProtocol: supabaseUrl ? (supabaseUrl.startsWith('https') ? 'https' : 'http or missing') : 'missing'
});

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
};

// Client for public actions
export const supabaseAnon = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, clientOptions)
  : null;

// Client for administrative actions
export const supabase = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey, clientOptions)
  : null;

export default supabase;
