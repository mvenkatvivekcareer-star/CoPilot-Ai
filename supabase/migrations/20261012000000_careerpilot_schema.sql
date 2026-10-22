-- ==============================================================================
-- CAREERPILOT AI: PostgreSQL Schema & Supabase Row Level Security (RLS)
-- Version: 20261012000000
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Upgrade existing profiles table if it already existed
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists education_level text;
alter table public.profiles add column if not exists current_role text;
alter table public.profiles add column if not exists experience_level text default 'entry';
alter table public.profiles add column if not exists target_roles text[] default '{}';
alter table public.profiles add column if not exists preferred_skills text[] default '{}';
alter table public.profiles add column if not exists career_goals text;
alter table public.profiles add column if not exists onboarding_completed boolean default false;
alter table public.profiles add column if not exists readiness_score numeric default 0;
alter table public.profiles add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

-- 2. RESUMES TABLE
create table if not exists public.resumes (
  id text primary key,
  user_id text not null,
  file_name text not null,
  file_size integer not null,
  storage_path text not null,
  mime_type text not null default 'application/pdf',
  raw_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. RESUME ANALYSES TABLE
create table if not exists public.resume_analyses (
  id text primary key,
  resume_id text not null,
  user_id text not null,
  parsed_profile jsonb not null default '{}'::jsonb,
  strengths text[] default '{}',
  weaknesses text[] default '{}',
  suggestions jsonb default '[]'::jsonb,
  quantified_improvements jsonb default '[]'::jsonb,
  score_breakdown jsonb default '{}'::jsonb,
  ats_score numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. JOBS TABLE
create table if not exists public.jobs (
  id text primary key,
  user_id text not null,
  title text not null,
  company text,
  description text not null,
  parsed_requirements jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. JOB MATCHES TABLE
create table if not exists public.job_matches (
  id text primary key,
  user_id text not null,
  resume_id text not null,
  job_id text not null,
  match_score numeric not null default 0,
  evidenced_skills text[] default '{}',
  missing_skills text[] default '{}',
  partial_skills text[] default '{}',
  experience_alignment text,
  scoring_breakdown jsonb default '{}'::jsonb,
  recommended_improvements text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. SKILL GOALS TABLE
create table if not exists public.skill_goals (
  id text primary key,
  user_id text not null,
  job_id text,
  skill_name text not null,
  priority text default 'medium',
  why_matters text,
  candidate_evidence text,
  learning_objective text not null,
  recommended_exercise text,
  status text default 'not_started',
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. INTERVIEW SESSIONS TABLE
create table if not exists public.interview_sessions (
  id text primary key,
  user_id text not null,
  resume_id text,
  job_id text,
  target_role text not null,
  interview_type text not null,
  difficulty text not null,
  total_questions integer not null default 5,
  status text default 'in_progress',
  overall_score numeric default 0,
  summary text,
  strengths text[] default '{}',
  areas_to_improve text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- 8. INTERVIEW QUESTIONS TABLE
create table if not exists public.interview_questions (
  id text primary key,
  session_id text not null,
  user_id text not null,
  question_number integer not null,
  question_text text not null,
  question_type text default 'technical',
  target_competency text,
  context_clue text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. INTERVIEW ANSWERS TABLE
create table if not exists public.interview_answers (
  id text primary key,
  question_id text not null,
  session_id text not null,
  user_id text not null,
  answer_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. INTERVIEW FEEDBACK TABLE
create table if not exists public.interview_feedback (
  id text primary key,
  answer_id text not null,
  session_id text not null,
  user_id text not null,
  score numeric not null default 0,
  what_went_well text not null,
  what_to_improve text not null,
  missing_points text[] default '{}',
  suggested_approach text not null,
  star_breakdown jsonb default '{}'::jsonb,
  follow_up_tip text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. ACTIVITY EVENTS TABLE
create table if not exists public.activity_events (
  id text primary key,
  user_id text not null,
  event_type text not null,
  event_title text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
create index if not exists idx_resumes_user on public.resumes(user_id);
create index if not exists idx_resume_analyses_user on public.resume_analyses(user_id);
create index if not exists idx_resume_analyses_resume on public.resume_analyses(resume_id);
create index if not exists idx_jobs_user on public.jobs(user_id);
create index if not exists idx_job_matches_user on public.job_matches(user_id);
create index if not exists idx_job_matches_job on public.job_matches(job_id);
create index if not exists idx_skill_goals_user on public.skill_goals(user_id);
create index if not exists idx_interview_sessions_user on public.interview_sessions(user_id);
create index if not exists idx_interview_questions_session on public.interview_questions(session_id);
create index if not exists idx_interview_answers_session on public.interview_answers(session_id);
create index if not exists idx_interview_feedback_session on public.interview_feedback(session_id);
create index if not exists idx_activity_events_user on public.activity_events(user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict isolation: Users can ONLY access their own records
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.resume_analyses enable row level security;
alter table public.jobs enable row level security;
alter table public.job_matches enable row level security;
alter table public.skill_goals enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.interview_questions enable row level security;
alter table public.interview_answers enable row level security;
alter table public.interview_feedback enable row level security;
alter table public.activity_events enable row level security;

-- Profiles: select, insert, update own
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Resumes: CRUD own
create policy "Users can view own resumes" on public.resumes
  for select using (auth.uid() = user_id);
create policy "Users can insert own resumes" on public.resumes
  for insert with check (auth.uid() = user_id);
create policy "Users can update own resumes" on public.resumes
  for update using (auth.uid() = user_id);
create policy "Users can delete own resumes" on public.resumes
  for delete using (auth.uid() = user_id);

-- Resume Analyses: CRUD own
create policy "Users can view own resume analyses" on public.resume_analyses
  for select using (auth.uid() = user_id);
create policy "Users can insert own resume analyses" on public.resume_analyses
  for insert with check (auth.uid() = user_id);
create policy "Users can update own resume analyses" on public.resume_analyses
  for update using (auth.uid() = user_id);
create policy "Users can delete own resume analyses" on public.resume_analyses
  for delete using (auth.uid() = user_id);

-- Jobs: CRUD own
create policy "Users can view own jobs" on public.jobs
  for select using (auth.uid() = user_id);
create policy "Users can insert own jobs" on public.jobs
  for insert with check (auth.uid() = user_id);
create policy "Users can update own jobs" on public.jobs
  for update using (auth.uid() = user_id);
create policy "Users can delete own jobs" on public.jobs
  for delete using (auth.uid() = user_id);

-- Job Matches: CRUD own
create policy "Users can view own job matches" on public.job_matches
  for select using (auth.uid() = user_id);
create policy "Users can insert own job matches" on public.job_matches
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own job matches" on public.job_matches
  for delete using (auth.uid() = user_id);

-- Skill Goals: CRUD own
create policy "Users can view own skill goals" on public.skill_goals
  for select using (auth.uid() = user_id);
create policy "Users can insert own skill goals" on public.skill_goals
  for insert with check (auth.uid() = user_id);
create policy "Users can update own skill goals" on public.skill_goals
  for update using (auth.uid() = user_id);
create policy "Users can delete own skill goals" on public.skill_goals
  for delete using (auth.uid() = user_id);

-- Interview Sessions: CRUD own
create policy "Users can view own interview sessions" on public.interview_sessions
  for select using (auth.uid() = user_id);
create policy "Users can insert own interview sessions" on public.interview_sessions
  for insert with check (auth.uid() = user_id);
create policy "Users can update own interview sessions" on public.interview_sessions
  for update using (auth.uid() = user_id);
create policy "Users can delete own interview sessions" on public.interview_sessions
  for delete using (auth.uid() = user_id);

-- Interview Questions: CRUD own
create policy "Users can view own interview questions" on public.interview_questions
  for select using (auth.uid() = user_id);
create policy "Users can insert own interview questions" on public.interview_questions
  for insert with check (auth.uid() = user_id);

-- Interview Answers: CRUD own
create policy "Users can view own interview answers" on public.interview_answers
  for select using (auth.uid() = user_id);
create policy "Users can insert own interview answers" on public.interview_answers
  for insert with check (auth.uid() = user_id);

-- Interview Feedback: CRUD own
create policy "Users can view own interview feedback" on public.interview_feedback
  for select using (auth.uid() = user_id);
create policy "Users can insert own interview feedback" on public.interview_feedback
  for insert with check (auth.uid() = user_id);

-- Activity Events: CRUD own
create policy "Users can view own activity events" on public.activity_events
  for select using (auth.uid() = user_id);
create policy "Users can insert own activity events" on public.activity_events
  for insert with check (auth.uid() = user_id);

-- ==============================================================================
-- STORAGE CONFIGURATION (Supabase Storage for Private Resume Files)
-- ==============================================================================
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

create policy "Users can upload resumes to their own folder"
on storage.objects for insert with check (
  bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can read own resume files"
on storage.objects for select using (
  bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own resume files"
on storage.objects for delete using (
  bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text
);
