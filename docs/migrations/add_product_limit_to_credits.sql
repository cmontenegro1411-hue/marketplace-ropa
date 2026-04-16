-- Agrega un limite de subida de productos asociado al plan
ALTER TABLE public.listing_credits ADD COLUMN IF NOT EXISTS product_limit INTEGER NOT NULL DEFAULT 50;
