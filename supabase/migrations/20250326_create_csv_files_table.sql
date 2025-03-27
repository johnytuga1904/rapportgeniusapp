-- Create CSV files table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.csv_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  report_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  -- Check if the foreign key constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'csv_files_user_id_fkey' AND conrelid = 'public.csv_files'::regclass
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE public.csv_files 
    ADD CONSTRAINT csv_files_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Check if the report_id foreign key constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'csv_files_report_id_fkey' AND conrelid = 'public.csv_files'::regclass
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE public.csv_files 
    ADD CONSTRAINT csv_files_report_id_fkey 
    FOREIGN KEY (report_id) REFERENCES public.reports(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- Add RLS policies if they don't exist
ALTER TABLE public.csv_files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can only see their own CSV files" ON public.csv_files;
DROP POLICY IF EXISTS "Users can only insert their own CSV files" ON public.csv_files;
DROP POLICY IF EXISTS "Users can only update their own CSV files" ON public.csv_files;
DROP POLICY IF EXISTS "Users can only delete their own CSV files" ON public.csv_files;

-- Create new policies
CREATE POLICY "Users can only see their own CSV files"
  ON public.csv_files
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own CSV files"
  ON public.csv_files
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own CSV files"
  ON public.csv_files
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own CSV files"
  ON public.csv_files
  FOR DELETE
  USING (auth.uid() = user_id);
