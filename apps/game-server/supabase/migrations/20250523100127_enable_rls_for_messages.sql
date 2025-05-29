-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE ONLY "public"."messages"
    ADD COLUMN "user_id" UUID NOT NULL DEFAULT auth.uid();

-- Create policies
CREATE POLICY "Allow public read access to messages"
  ON public.messages
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert messages
-- updates are not allowed
CREATE POLICY "Allow authenticated users insert to messages"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

