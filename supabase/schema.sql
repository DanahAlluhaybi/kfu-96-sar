-- run this in the supabase sql editor

create extension if not exists "pgcrypto";

create table if not exists public.responses (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  categories  text[] not null check (cardinality(categories) between 1 and 7),
  custom_text text check (custom_text is null or char_length(custom_text) <= 60),
  lang        text not null default 'ar' check (lang in ('ar','en'))
);
create index if not exists responses_created_at_idx on public.responses (created_at desc);
create index if not exists responses_categories_idx on public.responses using gin (categories);

-- "شي ثاني" write-ins, normalized is what we group on
create table if not exists public.custom_answers (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  response_id uuid not null references public.responses(id) on delete cascade,
  text        text not null check (char_length(text) between 1 and 60),
  normalized  text not null,
  lang        text not null default 'ar' check (lang in ('ar','en'))
);
create index if not exists custom_answers_normalized_idx on public.custom_answers (normalized);

create table if not exists public.insights (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  lang        text not null check (lang in ('ar','en')),
  text        text not null,
  source      text not null check (source in ('ai','fallback')),
  model       text,
  total       integer not null default 0,
  payload     jsonb not null default '{}'::jsonb
);
create index if not exists insights_lang_created_idx on public.insights (lang, created_at desc);

-- official national day figures. empty table = use data/national-day-stats.json
create table if not exists public.nd_stats (
  id         text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- RLS on with no policies, so only the server (service key) can touch these
alter table public.responses enable row level security;
alter table public.insights  enable row level security;
alter table public.custom_answers enable row level security;
alter table public.nd_stats enable row level security;
revoke all on public.responses from anon, authenticated;
revoke all on public.insights  from anon, authenticated;
revoke all on public.custom_answers from anon, authenticated;
revoke all on public.nd_stats from anon, authenticated;
