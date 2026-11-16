-- ============================================================================
-- SnapFramy SaaS Auth (Email + Password + Purchased Redeem Code) & Cloud Sync
-- Paste and run this ENTIRE script in: Supabase Dashboard -> SQL Editor
-- Idempotent: Safe to re-run without losing existing users or codes
-- ============================================================================

create extension if not exists pgcrypto;

-- 1. Timestamp helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- 2. Profiles table (1-to-1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  plan text not null default 'free',
  is_redeemed boolean not null default false,
  redeemed_code text,
  redeemed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles add column if not exists is_redeemed boolean not null default false;
alter table public.profiles add column if not exists redeemed_code text;
alter table public.profiles add column if not exists redeemed_at timestamptz;

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Block direct client updates to profiles so users cannot self-upgrade plan/is_redeemed
drop policy if exists "Users can update own profile" on public.profiles;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set
    email = coalesce(lower(excluded.email), public.profiles.email),
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Private Redeem Codes Table (Zero public RLS policies)
create table if not exists public.redeem_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  tier text not null default 'lifetime',
  max_uses integer not null default 1 check (max_uses > 0),
  uses_count integer not null default 0 check (uses_count >= 0),
  is_active boolean not null default true,
  expires_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.redeem_codes enable row level security;

-- 4. Redemption Audit Ledger
create table if not exists public.code_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.redeem_codes (id) on delete cascade,
  code text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  tier text not null,
  redeemed_at timestamptz not null default timezone('utc', now()),
  unique (code_id, user_id)
);

alter table public.code_redemptions enable row level security;

drop policy if exists "Users can view own redemptions" on public.code_redemptions;
create policy "Users can view own redemptions"
  on public.code_redemptions for select
  using (auth.uid() = user_id);

-- 5. RPC: Pre-check Redeem Code validity BEFORE signUp creates an auth user
create or replace function public.precheck_redeem_access(
  p_email text,
  p_code text default null
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_code text := upper(trim(coalesce(p_code, '')));
  v_profile record;
  v_code_row record;
begin
  if v_email = '' or position('@' in v_email) = 0 then
    return jsonb_build_object(
      'allowed', false,
      'already_redeemed', false,
      'reason', 'Please enter a valid email address.'
    );
  end if;

  -- Check if email already has a redeemed account
  select is_redeemed, plan
  into v_profile
  from public.profiles
  where lower(email) = v_email
  limit 1;

  if found and v_profile.is_redeemed then
    return jsonb_build_object(
      'allowed', true,
      'already_redeemed', true,
      'tier', v_profile.plan
    );
  end if;

  if v_code = '' then
    return jsonb_build_object(
      'allowed', false,
      'already_redeemed', false,
      'reason', 'A purchased redeem code is required to register.'
    );
  end if;

  select id, code, tier, max_uses, uses_count, is_active, expires_at
  into v_code_row
  from public.redeem_codes
  where upper(trim(code)) = v_code
  limit 1;

  if not found then
    return jsonb_build_object(
      'allowed', false,
      'already_redeemed', false,
      'reason', 'Invalid redeem code. Please check your purchase receipt.'
    );
  end if;

  if not v_code_row.is_active then
    return jsonb_build_object(
      'allowed', false,
      'already_redeemed', false,
      'reason', 'This redeem code has already been used or deactivated.'
    );
  end if;

  if v_code_row.expires_at is not null and v_code_row.expires_at <= timezone('utc', now()) then
    return jsonb_build_object(
      'allowed', false,
      'already_redeemed', false,
      'reason', 'This redeem code has expired.'
    );
  end if;

  if v_code_row.uses_count >= v_code_row.max_uses then
    return jsonb_build_object(
      'allowed', false,
      'already_redeemed', false,
      'reason', 'This redeem code has reached its redemption limit.'
    );
  end if;

  return jsonb_build_object(
    'allowed', true,
    'already_redeemed', false,
    'tier', v_code_row.tier
  );
end;
$$;

revoke all on function public.precheck_redeem_access(text, text) from public;
grant execute on function public.precheck_redeem_access(text, text) to anon, authenticated;

-- 6. RPC: Atomically claim a redeem code for the signed-in user
create or replace function public.claim_redeem_code(p_code text)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_code text := upper(trim(coalesce(p_code, '')));
  v_profile record;
  v_code_row record;
  v_new_uses integer;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'reason', 'Please sign in first.');
  end if;

  insert into public.profiles (id, email)
  values (v_user_id, v_email)
  on conflict (id) do nothing;

  select is_redeemed, plan, redeemed_code
  into v_profile
  from public.profiles
  where id = v_user_id
  for update;

  if v_profile.is_redeemed then
    return jsonb_build_object(
      'success', true,
      'already_redeemed', true,
      'tier', v_profile.plan,
      'code', v_profile.redeemed_code
    );
  end if;

  if v_code = '' then
    return jsonb_build_object('success', false, 'reason', 'Please enter a valid redeem code.');
  end if;

  select *
  into v_code_row
  from public.redeem_codes
  where upper(trim(code)) = v_code
  for update;

  if not found then
    return jsonb_build_object('success', false, 'reason', 'Invalid redeem code.');
  end if;

  if not v_code_row.is_active then
    return jsonb_build_object('success', false, 'reason', 'This redeem code has already been redeemed.');
  end if;

  if v_code_row.expires_at is not null and v_code_row.expires_at <= timezone('utc', now()) then
    return jsonb_build_object('success', false, 'reason', 'This redeem code has expired.');
  end if;

  if v_code_row.uses_count >= v_code_row.max_uses then
    return jsonb_build_object('success', false, 'reason', 'This redeem code has reached its usage limit.');
  end if;

  v_new_uses := v_code_row.uses_count + 1;

  update public.redeem_codes
  set
    uses_count = v_new_uses,
    is_active = (v_new_uses < max_uses)
  where id = v_code_row.id;

  insert into public.code_redemptions (code_id, code, user_id, email, tier)
  values (v_code_row.id, v_code_row.code, v_user_id, v_email, v_code_row.tier);

  update public.profiles
  set
    is_redeemed = true,
    plan = v_code_row.tier,
    redeemed_code = v_code_row.code,
    redeemed_at = timezone('utc', now()),
    email = coalesce(nullif(email, ''), v_email)
  where id = v_user_id;

  return jsonb_build_object(
    'success', true,
    'already_redeemed', false,
    'tier', v_code_row.tier,
    'code', v_code_row.code
  );
end;
$$;

revoke all on function public.claim_redeem_code(text) from public;
grant execute on function public.claim_redeem_code(text) to authenticated;

-- 7. Admin Generator Function (Run from Supabase SQL Editor only)
create or replace function public.generate_redeem_codes(
  p_count integer default 10,
  p_tier text default 'lifetime',
  p_max_uses integer default 1,
  p_prefix text default 'SNAP'
)
returns table(generated_code text, tier text, max_uses integer)
language plpgsql
security definer set search_path = public
as $$
declare
  i integer := 0;
  v_raw text;
  v_candidate text;
begin
  while i < p_count loop
    v_raw := upper(encode(gen_random_bytes(4), 'hex'));
    v_candidate := upper(trim(p_prefix)) || '-' || substr(v_raw, 1, 4) || '-' || substr(v_raw, 5, 4);
    begin
      insert into public.redeem_codes (code, tier, max_uses, is_active)
      values (v_candidate, p_tier, p_max_uses, true);
      generated_code := v_candidate;
      tier := p_tier;
      max_uses := p_max_uses;
      return next;
      i := i + 1;
    exception when unique_violation then
    end;
  end loop;
end;
$$;

revoke all on function public.generate_redeem_codes(integer, text, integer, text) from public, anon, authenticated;

-- 8. Ready-to-Sell Batch of 30 Single-Use Redeem Codes (20 Lifetime + 10 Agency)
insert into public.redeem_codes (code, tier, max_uses, notes)
values
  ('SNAP-LIFE-7K2M', 'lifetime', 1, 'Lifetime Pro License #01'),
  ('SNAP-LIFE-9P4Q', 'lifetime', 1, 'Lifetime Pro License #02'),
  ('SNAP-LIFE-3X8N', 'lifetime', 1, 'Lifetime Pro License #03'),
  ('SNAP-LIFE-5R6T', 'lifetime', 1, 'Lifetime Pro License #04'),
  ('SNAP-LIFE-8W2V', 'lifetime', 1, 'Lifetime Pro License #05'),
  ('SNAP-LIFE-4D9H', 'lifetime', 1, 'Lifetime Pro License #06'),
  ('SNAP-LIFE-6F3J', 'lifetime', 1, 'Lifetime Pro License #07'),
  ('SNAP-LIFE-2M7C', 'lifetime', 1, 'Lifetime Pro License #08'),
  ('SNAP-LIFE-9B5L', 'lifetime', 1, 'Lifetime Pro License #09'),
  ('SNAP-LIFE-1Z4G', 'lifetime', 1, 'Lifetime Pro License #10'),
  ('SNAP-LIFE-7N8P', 'lifetime', 1, 'Lifetime Pro License #11'),
  ('SNAP-LIFE-3Q6K', 'lifetime', 1, 'Lifetime Pro License #12'),
  ('SNAP-LIFE-5H9R', 'lifetime', 1, 'Lifetime Pro License #13'),
  ('SNAP-LIFE-8T2M', 'lifetime', 1, 'Lifetime Pro License #14'),
  ('SNAP-LIFE-4V7X', 'lifetime', 1, 'Lifetime Pro License #15'),
  ('SNAP-LIFE-6C3D', 'lifetime', 1, 'Lifetime Pro License #16'),
  ('SNAP-LIFE-2L9W', 'lifetime', 1, 'Lifetime Pro License #17'),
  ('SNAP-LIFE-9G5F', 'lifetime', 1, 'Lifetime Pro License #18'),
  ('SNAP-LIFE-1J8B', 'lifetime', 1, 'Lifetime Pro License #19'),
  ('SNAP-LIFE-7K4Z', 'lifetime', 1, 'Lifetime Pro License #20'),
  ('SNAP-AGCY-4M9P', 'agency',   1, 'Agency Team License #01'),
  ('SNAP-AGCY-8R2K', 'agency',   1, 'Agency Team License #02'),
  ('SNAP-AGCY-3T7V', 'agency',   1, 'Agency Team License #03'),
  ('SNAP-AGCY-6W5N', 'agency',   1, 'Agency Team License #04'),
  ('SNAP-AGCY-9D3Q', 'agency',   1, 'Agency Team License #05'),
  ('SNAP-AGCY-2H8X', 'agency',   1, 'Agency Team License #06'),
  ('SNAP-AGCY-5F4L', 'agency',   1, 'Agency Team License #07'),
  ('SNAP-AGCY-7C9B', 'agency',   1, 'Agency Team License #08'),
  ('SNAP-AGCY-1G6J', 'agency',   1, 'Agency Team License #09'),
  ('SNAP-AGCY-8Z2M', 'agency',   1, 'Agency Team License #10')
on conflict (code) do nothing;

-- 9. Cloud-Synced Brand Kit DNA
create table if not exists public.user_brand_kits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  brand_kit jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.user_brand_kits enable row level security;

drop policy if exists "Users can view own brand kit" on public.user_brand_kits;
create policy "Users can view own brand kit"
  on public.user_brand_kits for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own brand kit" on public.user_brand_kits;
create policy "Users can insert own brand kit"
  on public.user_brand_kits for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own brand kit" on public.user_brand_kits;
create policy "Users can update own brand kit"
  on public.user_brand_kits for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists user_brand_kits_set_updated_at on public.user_brand_kits;
create trigger user_brand_kits_set_updated_at
  before update on public.user_brand_kits for each row execute function public.set_updated_at();

-- 10. Saved Cloud Studio Projects
create table if not exists public.studio_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  studio_state jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists studio_projects_user_id_idx
  on public.studio_projects (user_id, updated_at desc);

alter table public.studio_projects enable row level security;

drop policy if exists "Users can view own studio projects" on public.studio_projects;
create policy "Users can view own studio projects"
  on public.studio_projects for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own studio projects" on public.studio_projects;
create policy "Users can insert own studio projects"
  on public.studio_projects for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own studio projects" on public.studio_projects;
create policy "Users can update own studio projects"
  on public.studio_projects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own studio projects" on public.studio_projects;
create policy "Users can delete own studio projects"
  on public.studio_projects for delete using (auth.uid() = user_id);

drop trigger if exists studio_projects_set_updated_at on public.studio_projects;
create trigger studio_projects_set_updated_at
  before update on public.studio_projects for each row execute function public.set_updated_at();
