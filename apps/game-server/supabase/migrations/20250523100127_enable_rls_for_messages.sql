-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to messages"
  ON public.messages
  FOR SELECT
  USING (true);

-- Allow only users to insert messages
-- updates are not allowed
CREATE POLICY "Allow anon insert to messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (true);

ALTER TABLE ONLY "public"."messages"
    ADD COLUMN "user_id" UUID NOT NULL DEFAULT auth.uid();
