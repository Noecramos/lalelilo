-- Create the candidatos table
CREATE TABLE IF NOT EXISTS public.candidatos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    birth_date DATE NOT NULL,
    city TEXT NOT NULL,
    education_level TEXT NOT NULL,
    course_name TEXT,
    interest_area TEXT NOT NULL,
    experience TEXT,
    cv_url TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;

-- Candidates can insert their own application without auth (anonymous submission)
CREATE POLICY "Allow public inserts" ON public.candidatos 
FOR INSERT TO public 
WITH CHECK (true);

-- Only authenticated users (admins) can view
CREATE POLICY "Allow authenticated selects" ON public.candidatos 
FOR SELECT TO authenticated 
USING (true);

-- Create a storage bucket for candidatos files if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('candidatos', 'candidatos', true)
ON CONFLICT (id) DO NOTHING;

-- Grant permissions for storage
CREATE POLICY "Allow public uploads to candidatos bucket" ON storage.objects
FOR INSERT TO public
WITH CHECK (bucket_id = 'candidatos');

CREATE POLICY "Allow public read from candidatos bucket" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'candidatos');

CREATE POLICY "Allow authenticated delete from candidatos bucket" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'candidatos');
