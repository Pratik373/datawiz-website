create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  created_at timestamptz not null default now()
);

insert into public.admin_users (email, display_name)
values ('adminspp@datawiz.com', 'Primary Admin')
on conflict (email) do nothing;

create table if not exists public.user_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'basic', 'pro', 'premium')),
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('basic', 'pro', 'premium')),
  amount numeric(10, 2) not null check (amount >= 0),
  currency text not null default 'INR',
  status text not null default 'completed' check (status in ('completed', 'pending', 'failed', 'refunded')),
  payment_date timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.test_papers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null check (type in ('manual', 'file')),
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  questions_count integer not null default 0 check (questions_count >= 0),
  file_path text,
  original_filename text,
  mime_type text,
  file_size_bytes bigint,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.test_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.test_papers(id) on delete cascade,
  position integer not null check (position > 0),
  section text not null default 'A',
  topic text,
  question text not null,
  code text,
  options jsonb not null check (
    jsonb_typeof(options) = 'array'
    and jsonb_array_length(options) >= 2
  ),
  correct_answer integer not null check (correct_answer >= 0),
  created_at timestamptz not null default now(),
  unique (test_id, position)
);

create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_payments_created_at on public.payments(created_at desc);
create index if not exists idx_test_papers_created_at on public.test_papers(created_at desc);
create index if not exists idx_test_questions_test_id on public.test_questions(test_id);

alter table public.admin_users enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.test_papers enable row level security;
alter table public.test_questions enable row level security;

insert into storage.buckets (id, name, public)
values ('test-papers', 'test-papers', false)
on conflict (id) do nothing;
