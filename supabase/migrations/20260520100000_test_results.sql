create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_id uuid not null references public.test_papers(id) on delete cascade,
  score integer not null check (score >= 0),
  total_questions integer not null check (total_questions > 0),
  correct_answers integer not null check (correct_answers >= 0),
  time_taken_seconds integer,
  started_at timestamptz not null default now(),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_test_results_user_id on public.test_results(user_id);
create index if not exists idx_test_results_test_id on public.test_results(test_id);
create index if not exists idx_test_results_created_at on public.test_results(created_at desc);

alter table public.test_results enable row level security;