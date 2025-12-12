-- =============================================
-- WMSI Database Schema for Supabase
-- Run this in Supabase SQL Editor
-- =============================================

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
  ip_address TEXT
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_domain ON analysis_sessions(domain);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_created_at ON analysis_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_webqual_score ON analysis_sessions(webqual_score DESC);

-- Enable Row Level Security (optional - for public access)
ALTER TABLE analysis_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for simple setup)
-- For production, you may want to restrict this
CREATE POLICY "Allow all operations" ON analysis_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant access to anonymous users (for public API)
GRANT ALL ON analysis_sessions TO anon;
GRANT ALL ON analysis_sessions TO authenticated;

-- Create a view for statistics
CREATE OR REPLACE VIEW analysis_statistics AS
SELECT 
  COUNT(*) as total_analyses,
  COUNT(DISTINCT domain) as unique_domains,
  AVG(webqual_score) as avg_webqual_score,
  AVG(seo_score) as avg_seo_score,
  AVG(ui_score) as avg_ui_score,
  AVG(ux_score) as avg_ux_score,
  AVG(marketing_score) as avg_marketing_score,
  MIN(created_at) as first_analysis,
  MAX(created_at) as last_analysis
FROM analysis_sessions;

-- Grant access to the view
GRANT SELECT ON analysis_statistics TO anon;
GRANT SELECT ON analysis_statistics TO authenticated;
