-- Supabase Schema for FocusGuard

-- 1. Profiles (already exists in auth but good for metadata)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Focus Sessions log
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  start_time timestamp with time zone DEFAULT now() NOT NULL,
  end_time timestamp with time zone,
  type text CHECK (type IN ('focus', 'distraction', 'break')) NOT NULL,
  duration_minutes integer, -- Calculated on completion
  status text -- e.g. completed, interrupted
);

-- 3. Website Activity Log
CREATE TABLE IF NOT EXISTS public.website_activity (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  domain text NOT NULL,
  time_spent_seconds integer DEFAULT 0,
  category text CHECK (category IN ('Productive', 'Distracting', 'Neutral')),
  last_visited timestamp with time zone DEFAULT now(),
  date date DEFAULT current_date NOT NULL,
  referrer_domain text -- For tracking distraction chains
);

-- 4. Daily Metrics (Pre-summarized for performance)
CREATE TABLE IF NOT EXISTS public.daily_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date date DEFAULT current_date NOT NULL,
  focus_time_minutes integer DEFAULT 0,
  distraction_time_minutes integer DEFAULT 0,
  focus_score integer DEFAULT 0,
  sessions_today integer DEFAULT 0,
  longest_streak_minutes integer DEFAULT 0,
  tab_switch_count integer DEFAULT 0, -- Tracked for blocking
  UNIQUE(user_id, date)
);

-- 5. Alerts
CREATE TABLE IF NOT EXISTS public.alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  type text CHECK (type IN ('warning', 'info', 'success', 'error')),
  title text NOT NULL,
  message text NOT NULL,
  is_dismissed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- 6. User Settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  focus_duration integer DEFAULT 25, -- Pomodoro default
  break_duration integer DEFAULT 5,
  distracting_sites text[] DEFAULT '{}'::text[],
  notifications_enabled boolean DEFAULT true,
  focus_mode_enabled boolean DEFAULT false,
  tab_switch_limit integer DEFAULT 10, -- Max switches before block
  distraction_time_limit_minutes integer DEFAULT 5, -- Max time on distracting sites
  extension_settings jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now()
);

-- If table already existed, add new column safely
ALTER TABLE IF EXISTS public.user_settings
  ADD COLUMN IF NOT EXISTS extension_settings jsonb DEFAULT '{}'::jsonb;

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage their own focus sessions" ON public.focus_sessions 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own website activity" ON public.website_activity 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own metrics" ON public.daily_metrics 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own alerts" ON public.alerts 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own settings" ON public.user_settings 
    FOR ALL USING (auth.uid() = id);
