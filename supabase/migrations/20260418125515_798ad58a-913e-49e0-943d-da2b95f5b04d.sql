CREATE TABLE public.comics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  vibe TEXT NOT NULL DEFAULT 'mixed',
  degen_score INTEGER NOT NULL DEFAULT 0,
  verdict TEXT,
  panels JSONB NOT NULL DEFAULT '[]'::jsonb,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_comics_wallet ON public.comics(wallet_address);
CREATE INDEX idx_comics_created ON public.comics(created_at DESC);

ALTER TABLE public.comics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comics"
  ON public.comics FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create comics"
  ON public.comics FOR INSERT
  WITH CHECK (true);