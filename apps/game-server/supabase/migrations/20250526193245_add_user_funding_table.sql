CREATE TABLE user_funding (
  sui_address TEXT PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT now(),
  tx_digest TEXT NOT NULL
);

-- Enable RLS, table is only accessible via the service role
ALTER TABLE public.user_funding ENABLE ROW LEVEL SECURITY;
