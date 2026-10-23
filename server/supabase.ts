import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { db } from './db.ts';

const CONFIG_FILE = path.resolve(process.cwd(), 'data', 'supabase-config.json');

interface SupabaseConfig {
  url?: string;
  key?: string;
  serviceRoleKey?: string;
}

class SupabaseService {
  private client: SupabaseClient | null = null;
  private config: SupabaseConfig = {};

  constructor() {
    this.loadConfig();
    this.initClient();
  }

  private loadConfig() {
    // Priority: 1. File config, 2. Environment variables
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        this.config = JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error loading supabase config file:', e);
    }

    if (!this.config.url) {
      this.config.url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    }
    if (!this.config.key) {
      this.config.key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    }
  }

  public saveConfig(url: string, key: string, serviceRoleKey?: string) {
    this.config = { url: url.trim(), key: key.trim(), serviceRoleKey: serviceRoleKey?.trim() };
    try {
      const dataDir = path.dirname(CONFIG_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save supabase config file:', e);
    }
    this.initClient();
  }

  public getRawConfig() {
    return {
      url: this.config.url || '',
      hasKey: Boolean(this.config.key),
      keyPreview: this.config.key ? `${this.config.key.slice(0, 10)}...${this.config.key.slice(-4)}` : '',
      projectRef: this.extractProjectRef(this.config.url || ''),
    };
  }

  private getCleanUrl(url: string): string {
    return url.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  }

  private extractProjectRef(url: string): string {
    try {
      const parsed = new URL(this.getCleanUrl(url));
      const hostParts = parsed.hostname.split('.');
      return hostParts[0] || '';
    } catch {
      return '';
    }
  }

  private initClient() {
    if (this.config.url && this.config.key && this.config.url.startsWith('http')) {
      const cleanUrl = this.getCleanUrl(this.config.url);
      try {
        this.client = createClient(cleanUrl, this.config.key, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
      } catch (err) {
        console.error('Failed to create Supabase client:', err);
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  public async getStatus(): Promise<{
    configured: boolean;
    connected: boolean;
    url: string;
    projectRef: string;
    dashboardUrl: string;
    tables: Record<string, { exists: boolean; count: number; error?: string }>;
    message?: string;
  }> {
    const projectRef = this.extractProjectRef(this.config.url || '');
    const dashboardUrl = projectRef
      ? `https://supabase.com/dashboard/project/${projectRef}/editor`
      : 'https://supabase.com/dashboard';

    if (!this.client || !this.config.url || !this.config.key) {
      return {
        configured: false,
        connected: false,
        url: this.config.url || '',
        projectRef,
        dashboardUrl,
        tables: {},
        message: 'Supabase credentials not yet configured.',
      };
    }

    const tableNames = [
      'candidate_profiles',
      'resumes_and_analyses',
      'jobs_and_matches',
      'mock_interviews',
      'profiles',
      'resumes',
    ];

    const tablesStatus: Record<string, { exists: boolean; count: number; error?: string }> = {};
    let anyTableSuccess = false;

    for (const table of tableNames) {
      try {
        const { count, error } = await this.client
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          tablesStatus[table] = {
            exists: false,
            count: 0,
            error: error.message,
          };
        } else {
          anyTableSuccess = true;
          tablesStatus[table] = {
            exists: true,
            count: count || 0,
          };
        }
      } catch (e: any) {
        tablesStatus[table] = {
          exists: false,
          count: 0,
          error: e.message || 'Unknown network error',
        };
      }
    }

    return {
      configured: true,
      connected: anyTableSuccess,
      url: this.getCleanUrl(this.config.url),
      projectRef,
      dashboardUrl,
      tables: tablesStatus,
      message: anyTableSuccess
        ? 'Connected to Supabase PostgreSQL database.'
        : 'Credentials accepted. Run the 4-table SQL schema in your Supabase SQL editor.',
    };
  }

  /**
   * Syncs all candidate data from local store into Supabase's 4 consolidated tables
   */
  public async syncAllData(userId: string): Promise<{
    success: boolean;
    syncedCounts: Record<string, number>;
    errors: string[];
  }> {
    if (!this.client) {
      throw new Error('Supabase client is not configured. Provide Supabase URL and API Key first.');
    }

    const errors: string[] = [];
    const syncedCounts: Record<string, number> = {
      candidate_profiles: 0,
      resumes_and_analyses: 0,
      jobs_and_matches: 0,
      mock_interviews: 0,
    };

    // 1. Sync candidate_profiles (Profiles + Activity Events)
    const profile = db.getProfile(userId);
    const activity = db.getRecentActivity(userId, 50);
    if (profile) {
      const payload = {
        id: profile.id,
        full_name: profile.full_name,
        education_level: profile.education_level,
        current_role: profile.current_role,
        experience_level: profile.experience_level,
        target_roles: profile.target_roles || [],
        preferred_skills: profile.preferred_skills || [],
        career_goals: profile.career_goals,
        onboarding_completed: profile.onboarding_completed,
        readiness_score: profile.readiness_score,
        activity_events: activity || [],
        updated_at: new Date().toISOString(),
      };

      // Try 4-table candidate_profiles first, fallback to legacy profiles
      const { error: profErr } = await this.client.from('candidate_profiles').upsert([payload]);
      if (profErr) {
        // Fallback to legacy profiles
        const { error: legErr } = await this.client.from('profiles').upsert([profile]);
        if (legErr) errors.push(`profiles: ${legErr.message}`);
        else syncedCounts.candidate_profiles += 1;
      } else {
        syncedCounts.candidate_profiles += 1;
      }
    }

    // 2. Sync resumes_and_analyses (Resumes + Resume Analyses)
    const resumes = db.getResumes(userId);
    for (const r of resumes) {
      const analysis = db.getResumeAnalysis(r.id, userId);
      const payload = {
        id: r.id,
        user_id: r.user_id,
        file_name: r.file_name,
        file_size: r.file_size,
        storage_path: r.storage_path,
        mime_type: r.mime_type,
        raw_text: r.raw_text,
        ats_score: analysis?.ats_score || 0,
        parsed_profile: analysis?.parsed_profile || {},
        strengths: analysis?.strengths || [],
        weaknesses: analysis?.weaknesses || [],
        suggestions: analysis?.suggestions || [],
        quantified_improvements: analysis?.quantified_improvements || [],
        score_breakdown: analysis?.score_breakdown || {},
        created_at: r.created_at,
        updated_at: r.updated_at,
      };

      const { error: resErr } = await this.client.from('resumes_and_analyses').upsert([payload]);
      if (resErr) {
        // Fallback to legacy resumes
        const { error: legErr } = await this.client.from('resumes').upsert([r]);
        if (legErr) errors.push(`resumes: ${legErr.message}`);
        else syncedCounts.resumes_and_analyses += 1;
      } else {
        syncedCounts.resumes_and_analyses += 1;
      }
    }

    // 3. Sync jobs_and_matches (Jobs + Job Matches + Skill Goals)
    const jobs = db.getJobs(userId);
    for (const j of jobs) {
      const match = db.getJobMatches(userId).find(m => m.job_id === j.id);
      const goals = db.getSkillGoals(userId).filter(g => g.job_id === j.id || !g.job_id);
      const payload = {
        id: j.id,
        user_id: j.user_id,
        title: j.title,
        company: j.company,
        description: j.description,
        parsed_requirements: j.parsed_requirements || {},
        match_analysis: match ? {
          match_score: match.match_score,
          resume_id: match.resume_id,
          evidenced_skills: match.evidenced_skills,
          missing_skills: match.missing_skills,
          partial_skills: match.partial_skills,
          experience_alignment: match.experience_alignment,
          scoring_breakdown: match.scoring_breakdown,
          recommended_improvements: match.recommended_improvements,
        } : null,
        skill_goals: goals || [],
        created_at: j.created_at,
      };

      const { error: jobErr } = await this.client.from('jobs_and_matches').upsert([payload]);
      if (jobErr) {
        const { error: legErr } = await this.client.from('jobs').upsert([j]);
        if (legErr) errors.push(`jobs: ${legErr.message}`);
        else syncedCounts.jobs_and_matches += 1;
      } else {
        syncedCounts.jobs_and_matches += 1;
      }
    }

    // 4. Sync mock_interviews (Sessions + Questions + Answers + Feedback)
    const sessions = db.getInterviewSessions(userId);
    for (const s of sessions) {
      const full = db.getInterviewSession(s.id, userId);
      const qaInteractions = (full?.questions || []).map(q => {
        const ans = full?.answers.find(a => a.question_id === q.id);
        const fb = full?.feedback.find(f => f.answer_id === ans?.id);
        return {
          question_number: q.question_number,
          question_id: q.id,
          question_text: q.question_text,
          target_competency: q.target_competency,
          context_clue: q.context_clue,
          answer_text: ans?.answer_text || '',
          score: fb?.score || 0,
          what_went_well: fb?.what_went_well || '',
          what_to_improve: fb?.what_to_improve || '',
          missing_points: fb?.missing_points || [],
          suggested_approach: fb?.suggested_approach || '',
          star_breakdown: fb?.star_breakdown || {},
        };
      });

      const payload = {
        id: s.id,
        user_id: s.user_id,
        resume_id: s.resume_id,
        job_id: s.job_id,
        target_role: s.target_role,
        interview_type: s.interview_type,
        difficulty: s.difficulty,
        total_questions: s.total_questions,
        status: s.status,
        overall_score: s.overall_score,
        summary: s.summary,
        strengths: s.strengths || [],
        areas_to_improve: s.areas_to_improve || [],
        qa_interactions: qaInteractions,
        created_at: s.created_at,
        completed_at: s.completed_at,
      };

      const { error: intErr } = await this.client.from('mock_interviews').upsert([payload]);
      if (intErr) {
        const { error: legErr } = await this.client.from('interview_sessions').upsert([s]);
        if (legErr) errors.push(`interview_sessions: ${legErr.message}`);
        else syncedCounts.mock_interviews += 1;
      } else {
        syncedCounts.mock_interviews += 1;
      }
    }

    return {
      success: errors.length === 0,
      syncedCounts,
      errors,
    };
  }

  /**
   * Fetches real live data directly from Supabase tables for visualization
   */
  public async fetchSupabaseData(userId: string): Promise<Record<string, any[]>> {
    if (!this.client) {
      return {};
    }

    const results: Record<string, any[]> = {};
    const tables = [
      'profiles',
      'resumes',
      'resume_analyses',
      'jobs',
      'job_matches',
      'skill_goals',
      'interview_sessions',
      'activity_events',
    ];

    for (const table of tables) {
      try {
        const { data, error } = await this.client
          .from(table)
          .select('*')
          .limit(20);

        if (!error && data) {
          results[table] = data;
        } else {
          results[table] = [];
        }
      } catch {
        results[table] = [];
      }
    }

    return results;
  }

  /**
   * Deletes a specific record by ID from a Supabase table
   */
  public async deleteRecord(table: string, id: string): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      throw new Error('Supabase client not initialized.');
    }
    const { error } = await this.client.from(table).delete().eq('id', id);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  /**
   * Purges all fake/sample accounts from Supabase profiles
   */
  public async purgeFakeAccounts(): Promise<{ deletedCount: number; deletedIds: string[] }> {
    if (!this.client) {
      throw new Error('Supabase client not initialized.');
    }

    const { data: allProfiles, error } = await this.client.from('profiles').select('*');
    if (error || !allProfiles) {
      throw new Error(error?.message || 'Failed to query profiles.');
    }

    const fakeProfiles = allProfiles.filter((p: any) => {
      const email = (p.email || '').toLowerCase().trim();
      const id = (p.id || '').toLowerCase().trim();

      return (
        id.startsWith('usr-') ||
        email.includes('@example.com') ||
        email.includes('tasks@') ||
        id.includes('demo')
      );
    });

    const fakeIds = fakeProfiles.map((p: any) => p.id);
    if (fakeIds.length > 0) {
      await this.client.from('profiles').delete().in('id', fakeIds);
    }

    return { deletedCount: fakeIds.length, deletedIds: fakeIds };
  }
}

export const supabaseService = new SupabaseService();
