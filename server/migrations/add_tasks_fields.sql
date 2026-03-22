-- Migration: add assigned_by and status to tasks table

ALTER TABLE public.tasks 
ADD COLUMN assigned_by integer REFERENCES public.band_members(band_member_id) ON DELETE SET NULL;

ALTER TABLE public.tasks 
ADD COLUMN status character varying(20) DEFAULT 'pending';

ALTER TABLE public.tasks
ADD CONSTRAINT tasks_status_check
CHECK (status IN ('pending', 'completed'));
