import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AnalysisSession {
  id?: string;
  created_at?: string;
  url: string;
  domain: string;
  seo_score: number;
  ui_score: number;
  ux_score: number;
  marketing_score: number;
  webqual_score: number;
  duration_ms: number;
  desktop_count: number;
  mobile_count: number;
  seo_data: object;
  uiux_data: object;
  marketing_data: object;
  webqual_data: object;
  user_agent?: string;
  ip_address?: string;
  user_id?: string | null;
}

// 1. Save analysis session
export async function saveAnalysisSession(session: AnalysisSession) {
  // Bersihkan data sebelum kirim: Pastikan user_id null jika undefined
  const cleanSession = {
    ...session,
    user_id: session.user_id || null
  };

  const { data, error } = await supabase
    .from('analysis_sessions')
    .insert([cleanSession])
    .select()
    .single();

  if (error) {
    console.error('SUPABASE SAVE ERROR:', error.message, error.details);
    throw new Error(error.message); // Throw agar UI tau ada error
  }

  return data;
}

// 2. Get User History
export async function getUserHistory(userId: string) {
  if (!userId) return []; // Jangan fetch jika tidak ada user

  const { data, error } = await supabase
    .from('analysis_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('HISTORY FETCH ERROR:', error);
    return []; // Return array kosong biar tidak crash "map is not function"
  }

  return data || [];
}

// 3. Detach User History
export async function detachUserHistory(userId: string) {
  const { error } = await supabase
    .from('analysis_sessions')
    .update({ user_id: null }) 
    .eq('user_id', userId);

  if (error) {
    console.error('DETACH ERROR:', error);
    throw error;
  }
  return true;
}