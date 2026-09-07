-- PostgreSQL grants new functions to PUBLIC unless explicitly revoked.
-- Preset creation and log maintenance are server-only operations.
REVOKE ALL ON FUNCTION public.create_system_track(text, text, integer, text, text[])
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_system_track(text, text, integer, text, text[])
  TO service_role;

REVOKE ALL ON FUNCTION public.cleanup_old_request_logs()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_request_logs() TO service_role;

ALTER FUNCTION public.create_system_track(text, text, integer, text, text[])
  SET search_path = public, pg_temp;
ALTER FUNCTION public.cleanup_old_request_logs() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_track_like_count() SET search_path = public, pg_temp;
