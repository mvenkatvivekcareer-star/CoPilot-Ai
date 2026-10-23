-- ==============================================================================
-- CAREERPILOT AI: Simplified 4-Table PostgreSQL Schema & Supabase RLS
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. CANDIDATE PROFILES (Profiles + Activity Events)
create table if not exists public.candidate_profiles (
  id text primary key,
  full_name text,
  education_level text,
  current_role text,
  experience_level text default 'entry',
  target_roles text[] default '{}',
  preferred_skills text[] default '{}',
  career_goals text,
  onboarding_completed boolean default false,
  readiness_score numeric default 0,
  activity_events jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. RESUMES AND ANALYSES (Resumes + ATS Analyses)
create table if not exists public.resumes_and_analyses (
  id text primary key,
  user_id text not null,
  file_name text not null,
  file_size integer not null,
  storage_path text not null,
  mime_type text not null default 'application/pdf',
  raw_text text,
  ats_score numeric default 0,
  parsed_profile jsonb default '{}'::jsonb,
  strengths text[] default '{}',
  weaknesses text[] default '{}',
  suggestions jsonb default '[]'::jsonb,
  quantified_improvements jsonb default '[]'::jsonb,
  score_breakdown jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. JOBS AND MATCHES (Jobs + Job Matches + Skill Goals)
create table if not exists public.jobs_and_matches (
  id text primary key,
  user_id text not null,
  title text not null,
  company text,
  description text not null,
  parsed_requirements jsonb default '{}'::jsonb,
  match_analysis jsonb default '{}'::jsonb,
  skill_goals jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. MOCK INTERVIEWS (Interview Sessions + Questions + Answers + Feedback)
create table if not exists public.mock_interviews (
  id text primary key,
  user_id text not null,
  resume_id text,
  job_id text,
  target_role text not null,
  interview_type text not null,
  difficulty text not null,
  total_questions integer not null default 3,
  status text default 'in_progress',
  overall_score numeric default 0,
  summary text,
  strengths text[] default '{}',
  areas_to_improve text[] default '{}',
  qa_interactions jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- Indexes for fast querying
create index if not exists idx_resumes_analyses_user on public.resumes_and_analyses(user_id);
create index if not exists idx_jobs_matches_user on public.jobs_and_matches(user_id);
create index if not exists idx_mock_interviews_user on public.mock_interviews(user_id);

-- Enable Row Level Security (RLS) on all 4 tables
alter table public.candidate_profiles enable row level security;
alter table public.resumes_and_analyses enable row level security;
alter table public.jobs_and_matches enable row level security;
alter table public.mock_interviews enable row level security;

-- RLS Policies
create policy "Users manage own candidate_profile" on public.candidate_profiles
  for all using (auth.uid() = id);

create policy "Users manage own resumes_and_analyses" on public.resumes_and_analyses
  for all using (auth.uid() = user_id);

create policy "Users manage own jobs_and_matches" on public.jobs_and_matches
  for all using (auth.uid() = user_id);

create policy "Users manage own mock_interviews" on public.mock_interviews
  for all using (auth.uid() = user_id);
