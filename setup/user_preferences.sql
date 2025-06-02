-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT,
  usage TEXT,
  theme TEXT DEFAULT 'dark',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create Row Level Security policies
-- Allow users to read their own preferences
CREATE POLICY user_preferences_select ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to update their own preferences
CREATE POLICY user_preferences_update ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow service role to insert preferences for any user
CREATE POLICY user_preferences_service_insert ON public.user_preferences
  FOR INSERT WITH CHECK (TRUE);

-- Allow service role to read all preferences
CREATE POLICY user_preferences_service_select ON public.user_preferences
  FOR SELECT USING (TRUE);

-- Allow service role to update all preferences
CREATE POLICY user_preferences_service_update ON public.user_preferences
  FOR UPDATE USING (TRUE);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to create user preferences when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user(); 