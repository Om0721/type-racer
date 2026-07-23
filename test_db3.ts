import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
let supabaseUrl = rawUrl;
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  if (!supabaseUrl.includes('.')) supabaseUrl = `${supabaseUrl}.supabase.co`;
  supabaseUrl = `https://${supabaseUrl}`;
}
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function test() {
  const { data: hData, error: hError } = await supabase.from('race_history').select('coins_earned').limit(1);
  console.log('race_history error:', hError);
  
  const { data: hData2, error: hError2 } = await supabase.from('race_history').select('xp_earned').limit(1);
  console.log('race_history xp error:', hError2);
  
  const { data: hData3, error: hError3 } = await supabase.from('race_history').select('points_earned').limit(1);
  console.log('race_history points error:', hError3);
}
test();
