-- Create the main analysis_sessions table
CREATE TABLE IF NOT EXISTS analysis_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Basic info
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  
  -- Scores (0-100)
  seo_score DECIMAL(5,2),
  ui_score DECIMAL(5,2),
  ux_score DECIMAL(5,2),
  marketing_score DECIMAL(5,2),
  webqual_score DECIMAL(5,2),
  
  -- Metadata
  duration_ms INTEGER,
  desktop_count INTEGER,
  mobile_count INTEGER,
  
  -- Full JSON data
  seo_data JSONB,
  uiux_data JSONB,
  marketing_data JSONB,
  webqual_data JSONB,
  
  -- Client info
  user_agent TEXT,
  ip_address TEXT,
  
  -- AUTH CONNECTION (New Feature)
  user_id UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_domain ON analysis_sessions(domain);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_user_id ON analysis_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_webqual_score ON analysis_sessions(webqual_score DESC);

-- Security Policies (RLS)
ALTER TABLE analysis_sessions ENABLE ROW LEVEL SECURITY;

-- 1. Insert: Boleh insert jika anonim atau user login dengan ID sendiri
CREATE POLICY "Enable insert for everyone" ON analysis_sessions FOR INSERT 
WITH CHECK (
  (auth.role() = 'anon') OR 
  (auth.uid() = user_id)
);

-- 2. Select: User hanya bisa lihat datanya sendiri (History Pribadi)
--    ATAU sistem bisa lihat data anonim (untuk AI Learning nanti)
CREATE POLICY "Enable select for owners" ON analysis_sessions FOR SELECT 
USING (
  (auth.uid() = user_id) 
);

-- 3. Update: User bisa update (misal untuk detach saat hapus akun)
CREATE POLICY "Enable update for owners" ON analysis_sessions FOR UPDATE
USING (auth.uid() = user_id);