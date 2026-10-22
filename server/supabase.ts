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
      this.config.key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
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
      'profiles',
      'resumes',
      'resume_analyses',
      'jobs',
      'job_matches',
      'skill_goals',
      'interview_sessions',
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
        : 'Credentials accepted, but tables not found. Please execute the SQL migration in Supabase SQL editor.',
    };
  }

  /**
   * Syncs all candidate data from the local store into Supabase tables
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
      profiles: 0,
      resumes: 0,
      resume_analyses: 0,
      jobs: 0,
      job_matches: 0,
      skill_goals: 0,
      interview_sessions: 0,
      interview_questions: 0,
      interview_answers: 0,
      interview_feedback: 0,
      activity_events: 0,
    };

    // 1. Sync Profile
    const profile = db.getProfile(userId);
    if (profile) {
      const { error } = await this.client.from('profiles').upsert([profile]);
      if (error) errors.push(`profiles: ${error.message}`);
      else syncedCounts.profiles += 1;
    }

    // 2. Sync Resumes
    const resumes = db.getResumes(userId);
    if (resumes.length > 0) {
      const { error } = await this.client.from('resumes').upsert(resumes);
      if (error) errors.push(`resumes: ${error.message}`);
      else syncedCounts.resumes += resumes.length;
    }

    // 3. Sync Resume Analyses
    for (const r of resumes) {
      const analysis = db.getResumeAnalysis(r.id, userId);
      if (analysis) {
        const { error } = await this.client.from('resume_analyses').upsert([analysis]);
        if (error) errors.push(`resume_analyses: ${error.message}`);
        else syncedCounts.resume_analyses += 1;
      }
    }

    // 4. Sync Jobs
    const jobs = db.getJobs(userId);
    if (jobs.length > 0) {
      const { error } = await this.client.from('jobs').upsert(jobs);
      if (error) errors.push(`jobs: ${error.message}`);
      else syncedCounts.jobs += jobs.length;
    }

    // 5. Sync Job Matches
    const matches = db.getJobMatches(userId);
    if (matches.length > 0) {
      // Clean computed UI fields before Supabase upsert
      const cleaned = matches.map(m => ({
        id: m.id,
        user_id: m.user_id,
        resume_id: m.resume_id,
        job_id: m.job_id,
        match_score: m.match_score,
        evidenced_skills: m.evidenced_skills,
        missing_skills: m.missing_skills,
        partial_skills: m.partial_skills,
        experience_alignment: m.experience_alignment,
        scoring_breakdown: m.scoring_breakdown,
        recommended_improvements: m.recommended_improvements,
        created_at: m.created_at,
      }));
      const { error } = await this.client.from('job_matches').upsert(cleaned);
      if (error) errors.push(`job_matches: ${error.message}`);
      else syncedCounts.job_matches += matches.length;
    }

    // 6. Sync Skill Goals
    const goals = db.getSkillGoals(userId);
    if (goals.length > 0) {
      const { error } = await this.client.from('skill_goals').upsert(goals);
      if (error) errors.push(`skill_goals: ${error.message}`);
      else syncedCounts.skill_goals += goals.length;
    }

    // 7. Sync Interview Sessions
    const sessions = db.getInterviewSessions(userId);
    if (sessions.length > 0) {
      const { error } = await this.client.from('interview_sessions').upsert(sessions);
      if (error) errors.push(`interview_sessions: ${error.message}`);
      else syncedCounts.interview_sessions += sessions.length;
    }

    // 8. Sync Activity
    const activity = db.getRecentActivity(userId, 50);
    if (activity.length > 0) {
      const { error } = await this.client.from('activity_events').upsert(activity);
      if (error) errors.push(`activity_events: ${error.message}`);
      else syncedCounts.activity_events += activity.length;
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
