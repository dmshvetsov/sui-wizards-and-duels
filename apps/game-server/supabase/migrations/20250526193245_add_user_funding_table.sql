CREATE TABLE user_funding (
  sui_address TEXT PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_funding ENABLE ROW LEVEL SECURITY;
