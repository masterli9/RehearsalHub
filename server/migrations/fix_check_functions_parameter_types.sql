-- Fix check_user_bands_limit and check_band_member_limit functions
-- They were incorrectly defined with uuid parameters, but should use integer
-- Also fixes ambiguous column reference by qualifying parameters with function name

-- Drop existing versions (both uuid and integer) to ensure clean recreation
DROP FUNCTION IF EXISTS public.check_user_bands_limit(uuid);
DROP FUNCTION IF EXISTS public.check_user_bands_limit(integer);

-- Recreate check_user_bands_limit with correct parameter type and qualified parameter reference
CREATE FUNCTION public.check_user_bands_limit(user_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM band_members WHERE band_members.user_id = check_user_bands_limit.user_id
  ) >= 5 THEN
    RAISE EXCEPTION 'Maximum bands per user reached';
  END IF;
END;
$$;

-- Drop existing versions (both uuid and integer) to ensure clean recreation
DROP FUNCTION IF EXISTS public.check_band_member_limit(uuid);
DROP FUNCTION IF EXISTS public.check_band_member_limit(integer);

-- Recreate check_band_member_limit with correct parameter type and qualified parameter reference
CREATE FUNCTION public.check_band_member_limit(band_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM band_members WHERE band_members.band_id = check_band_member_limit.band_id
  ) >= 10 THEN
    RAISE EXCEPTION 'Band member limit reached';
  END IF;
END;
$$;
