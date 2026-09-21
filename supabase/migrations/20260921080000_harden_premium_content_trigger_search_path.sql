-- Harden the Premium content timestamp trigger.
-- Applied in production on 2026-09-21 and kept here for reproducibility.
CREATE OR REPLACE FUNCTION public.premium_content_pages_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
