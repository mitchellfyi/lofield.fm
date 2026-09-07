\set ON_ERROR_STOP on
BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity) THEN
    RAISE EXCEPTION 'Every application table must enforce RLS';
  END IF;
  IF has_function_privilege('anon', 'public.create_system_track(text,text,integer,text,text[])', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.create_system_track(text,text,integer,text,text[])', 'EXECUTE')
     OR has_function_privilege('anon', 'public.cleanup_old_request_logs()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.cleanup_old_request_logs()', 'EXECUTE') THEN
    RAISE EXCEPTION 'Administrative routines must not be callable by public API roles';
  END IF;
  IF NOT has_function_privilege('service_role', 'public.create_system_track(text,text,integer,text,text[])', 'EXECUTE') THEN
    RAISE EXCEPTION 'The service role must retain system-track creation';
  END IF;
END $$;

-- Fixtures never commit, create sessions, or send confirmation email.
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-4000-8000-000000000001', 'ops-fixture-one@example.invalid'),
  ('00000000-0000-4000-8000-000000000002', 'ops-fixture-two@example.invalid');

DO $$
BEGIN
  IF (SELECT count(*) FROM public.profiles WHERE id IN (
    '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002'
  )) <> 2 THEN RAISE EXCEPTION 'Signup must create profiles'; END IF;
END $$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
INSERT INTO public.projects (id, user_id, name) VALUES
  ('00000000-0000-4000-8000-000000000010', auth.uid(), 'Ops isolation fixture');
INSERT INTO public.tracks (id, project_id, name, current_code) VALUES
  ('00000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000010', 'Private fixture', 'silence');
INSERT INTO public.revisions (track_id, code) VALUES ('00000000-0000-4000-8000-000000000020', 'silence');
INSERT INTO public.api_keys (user_id, encrypted_key, key_last_4) VALUES (auth.uid(), 'non-secret-fixture', 'test');
UPDATE public.tracks SET name = 'Updated fixture' WHERE id = '00000000-0000-4000-8000-000000000020';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.tracks WHERE id = '00000000-0000-4000-8000-000000000020' AND name = 'Updated fixture') THEN
    RAISE EXCEPTION 'Owner track CRUD failed';
  END IF;
END $$;

SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.projects WHERE id = '00000000-0000-4000-8000-000000000010')
     OR EXISTS (SELECT 1 FROM public.tracks WHERE id = '00000000-0000-4000-8000-000000000020')
     OR EXISTS (SELECT 1 FROM public.revisions WHERE track_id = '00000000-0000-4000-8000-000000000020')
     OR EXISTS (SELECT 1 FROM public.api_keys WHERE user_id = '00000000-0000-4000-8000-000000000001') THEN
    RAISE EXCEPTION 'Another user can read private data';
  END IF;
  BEGIN
    INSERT INTO public.tracks (project_id, name) VALUES ('00000000-0000-4000-8000-000000000010', 'Forbidden');
    RAISE EXCEPTION 'Another user can write private data';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;

SET LOCAL ROLE service_role;
SELECT public.create_system_track('Ops public fixture', 'silence');
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub', '', true);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.projects WHERE id = '00000000-0000-4000-8000-000000000010')
     OR EXISTS (SELECT 1 FROM public.api_keys WHERE user_id = '00000000-0000-4000-8000-000000000001') THEN
    RAISE EXCEPTION 'Anonymous access exposed private data';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.tracks WHERE name = 'Ops public fixture' AND is_system) THEN
    RAISE EXCEPTION 'Public tracks must remain readable';
  END IF;
END $$;

ROLLBACK;
