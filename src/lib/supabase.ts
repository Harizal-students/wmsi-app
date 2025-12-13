import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database
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
  user_id?: string | null; // NEW: Added user_id
}

// Save analysis session to database
export async function saveAnalysisSession(session: AnalysisSession) {
  const { data, error } = await supabase
    .from('analysis_sessions')
    .insert([session])
    .select()
    .single();

  if (error) {
    console.error('Error saving session:', error);
    throw error;
  }

  return data;
}

// Get analysis sessions by User ID (History)
export async function getUserHistory(userId: string) {
  const { data, error } = await supabase
    .from('analysis_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching history:', error);
    throw error;
  }

  return data;
}

// Get analysis session by ID
export async function getAnalysisSessionById(id: string) {
  const { data, error } = await supabase
    .from('analysis_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching session:', error);
    throw error;
  }

  return data;
}