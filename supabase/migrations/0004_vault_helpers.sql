-- Enhanced Vault helper functions for provider-specific secret management

-- Store a secret for the current user's provider (called via service role)
-- Inserts into vault (encrypted), returns secret_id
-- Provider must be 'openai' or 'elevenlabs'
create or replace function public.store_user_secret(
  p_user_id uuid,
  p_provider text,
  p_secret text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret_id uuid;
  v_old_secret_id uuid;
begin
  -- Validate provider
  if p_provider not in ('openai', 'elevenlabs') then
    raise exception 'Invalid provider: %', p_provider;
  end if;

  -- Get existing secret_id to delete old vault entry
  if p_provider = 'openai' then
    select openai_secret_id into v_old_secret_id
    from user_secrets where user_id = p_user_id;
  else
    select elevenlabs_secret_id into v_old_secret_id
    from user_secrets where user_id = p_user_id;
  end if;

  -- Delete old vault secret if exists
  if v_old_secret_id is not null then
    delete from vault.secrets where id = v_old_secret_id;
  end if;

  -- Create new secret in vault
  v_secret_id := vault.create_secret(p_secret);

  -- Update user_secrets table
  if p_provider = 'openai' then
    insert into user_secrets (user_id, openai_secret_id)
    values (p_user_id, v_secret_id)
    on conflict (user_id)
    do update set openai_secret_id = v_secret_id;
  else
    insert into user_secrets (user_id, elevenlabs_secret_id)
    values (p_user_id, v_secret_id)
    on conflict (user_id)
    do update set elevenlabs_secret_id = v_secret_id;
  end if;

  return v_secret_id;
end;
$$;

-- Delete a user's secret for a specific provider
create or replace function public.delete_user_secret(
  p_user_id uuid,
  p_provider text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret_id uuid;
begin
  -- Validate provider
  if p_provider not in ('openai', 'elevenlabs') then
    raise exception 'Invalid provider: %', p_provider;
  end if;

  -- Get existing secret_id
  if p_provider = 'openai' then
    select openai_secret_id into v_secret_id
    from user_secrets where user_id = p_user_id;
  else
    select elevenlabs_secret_id into v_secret_id
    from user_secrets where user_id = p_user_id;
  end if;

  -- Delete vault secret if exists
  if v_secret_id is not null then
    delete from vault.secrets where id = v_secret_id;
  end if;

  -- Clear the reference in user_secrets
  if p_provider = 'openai' then
    update user_secrets set openai_secret_id = null where user_id = p_user_id;
  else
    update user_secrets set elevenlabs_secret_id = null where user_id = p_user_id;
  end if;
end;
$$;

-- Get secret_id for a user's provider (optional helper)
create or replace function public.get_user_secret_id(
  p_user_id uuid,
  p_provider text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret_id uuid;
begin
  if p_provider not in ('openai', 'elevenlabs') then
    raise exception 'Invalid provider: %', p_provider;
  end if;

  if p_provider = 'openai' then
    select openai_secret_id into v_secret_id
    from user_secrets where user_id = p_user_id;
  else
    select elevenlabs_secret_id into v_secret_id
    from user_secrets where user_id = p_user_id;
  end if;

  return v_secret_id;
end;
$$;
