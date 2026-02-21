ALTER TABLE public.setlists
ADD COLUMN IF NOT EXISTS band_id integer,
ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- First add the constraint, but only if all existing records can be satisfied, otherwise we leave it nullable temporarily
-- Alternatively, assuming no setlists exist without a band currently used, or they will be orphaned
-- Add FK constraint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_setlists_band') THEN
        ALTER TABLE public.setlists
        ADD CONSTRAINT fk_setlists_band
        FOREIGN KEY (band_id) REFERENCES public.bands(band_id) ON DELETE CASCADE;
    END IF;
END $$;
