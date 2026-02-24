ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS setlist_id integer;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_events_setlist') THEN
        ALTER TABLE public.events
        ADD CONSTRAINT fk_events_setlist
        FOREIGN KEY (setlist_id) REFERENCES public.setlists(setlist_id) ON DELETE SET NULL;
    END IF;
END $$;
