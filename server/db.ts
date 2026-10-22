import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Profile {
  id: string; // matches user id
  full_name: string;
  education_level: string;
  current_role: string;
  experience_level: 'student' | 'entry' | 'mid' | 'senior' | 'lead';
  target_roles: string[];
  preferred_skills: string[];
  career_goals: string;
  onboarding_completed: boolean;
  readiness_score: number;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  storage_path: string;
  mime_type: string;
  raw_text: string;
  created_at: string;
  updated_at: string;
}

export interface ResumeAnalysis {
  id: string;
  resume_id: string;
  user_id: string;
  parsed_profile: {
    contact?: { name?: string; email?: string; phone?: string; location?: string; linkedin?: string; github?: string };
    summary?: string;
    education?: Array<{ institution: string; degree: string; field: string; graduationYear?: string; gpa?: string }>;
    skills?: {
      technical?: string[];
      frameworks?: string[];
      tools?: string[];
      soft?: string[];
    };
    work_experience?: Array<{ title: string; company: string; duration: string; bulletPoints: string[] }>;
    projects?: Array<{ name: string; description: string; technologies: string[]; link?: string }>;
    certifications?: string[];
    achievements?: string[];
  };
  strengths: string[];
  weaknesses: string[];
  suggestions: Array<{
    id: string;
    section: string;
    original: string;
    suggested: string;
    reason: string;
    status: 'pending' | 'accepted' | 'rejected';
  }>;
  quantified_improvements: Array<{
    original: string;
    improved: string;
    metricType: string;
  }>;
  score_breakdown: {
    clarity: number;
    impact: number;
    skillsDepth: number;
    structure: number;
  };
  ats_score: number;
  created_at: string;
}

export interface Job {
  id: string;
  user_id: string;
  title: string;
  company: string;
  description: string;
  parsed_requirements: {
    required_skills: string[];
    preferred_skills: string[];
    experience_years?: string;
    education_level?: string;
    responsibilities?: string[];
    competencies?: string[];
  };
  created_at: string;
}

export interface JobMatch {
  id: string;
  user_id: string;
  resume_id: string;
  job_id: string;
  job_title?: string;
  company?: string;
  match_score: number;
  evidenced_skills: string[];
  missing_skills: string[];
  partial_skills: string[];
  experience_alignment: string;
  scoring_breakdown: {
    required_skills_score: number;
    preferred_skills_score: number;
    experience_score: number;
    formula_explanation: string;
  };
  recommended_improvements: string[];
  created_at: string;
}

export interface SkillGoal {
  id: string;
  user_id: string;
  job_id?: string;
  skill_name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  why_matters: string;
  candidate_evidence: string;
  learning_objective: string;
  recommended_exercise: string;
  status: 'not_started' | 'in_progress' | 'completed';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface InterviewSession {
  id: string;
  user_id: string;
  resume_id?: string;
  job_id?: string;
  target_role: string;
  interview_type: 'technical' | 'behavioral' | 'hr' | 'mixed';
  difficulty: 'entry' | 'mid' | 'senior';
  total_questions: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  overall_score: number;
  summary?: string;
  strengths: string[];
  areas_to_improve: string[];
  created_at: string;
  completed_at?: string;
}

export interface InterviewQuestion {
  id: string;
  session_id: string;
  user_id: string;
  question_number: number;
  question_text: string;
  question_type: string;
  target_competency?: string;
  context_clue?: string;
  created_at: string;
}

export interface InterviewAnswer {
  id: string;
  question_id: string;
  session_id: string;
  user_id: string;
  answer_text: string;
  created_at: string;
}

export interface InterviewFeedback {
  id: string;
  answer_id: string;
  session_id: string;
  user_id: string;
  score: number;
  what_went_well: string;
  what_to_improve: string;
  missing_points: string[];
  suggested_approach: string;
  star_breakdown?: {
    situation?: string;
    task?: string;
    action?: string;
    result?: string;
  };
  follow_up_tip?: string;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  user_id: string;
  event_type: 'resume_analyzed' | 'job_matched' | 'interview_completed' | 'goal_completed' | 'profile_updated';
  event_title: string;
  metadata?: any;
  created_at: string;
}

interface DatabaseSchema {
  users: User[];
  profiles: Profile[];
  resumes: Resume[];
  resume_analyses: ResumeAnalysis[];
  jobs: Job[];
  job_matches: JobMatch[];
  skill_goals: SkillGoal[];
  interview_sessions: InterviewSession[];
  interview_questions: InterviewQuestion[];
  interview_answers: InterviewAnswer[];
  interview_feedback: InterviewFeedback[];
  activity_events: ActivityEvent[];
}

const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel
  ? path.resolve('/tmp', 'careerpilot-data')
  : path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class DatabaseService {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } else if (isVercel) {
        // Seed from the bundled project data/db.json if available
        const seedPath = path.resolve(process.cwd(), 'data', 'db.json');
        if (fs.existsSync(seedPath)) {
          const raw = fs.readFileSync(seedPath, 'utf-8');
          const seedData = JSON.parse(raw);
          this.save(seedData);
          return seedData;
        }
      }
    } catch (err) {
      console.error('Failed to load database file:', err);
    }

    const initial: DatabaseSchema = {
      users: [],
      profiles: [],
      resumes: [],
      resume_analyses: [],
      jobs: [],
      job_matches: [],
      skill_goals: [],
      interview_sessions: [],
      interview_questions: [],
      interview_answers: [],
      interview_feedback: [],
      activity_events: [],
    };
    this.save(initial);
    return initial;
  }

  public save(dataToSave?: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
  }

  // --- Password Hashing with built-in Node crypto (PBKDF2) ---
  public hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  public verifyPassword(password: string, combined: string): boolean {
    const [salt, key] = combined.split(':');
    if (!salt || !key) return false;
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === key;
  }

  public updateUserPassword(userId: string, newPassword: string): void {
    const user = this.data.users.find(u => u.id === userId);
    if (user) {
      user.passwordHash = this.hashPassword(newPassword);
      this.save();
    }
  }

  // --- Users & Profiles ---
  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public createUser(email: string, password: string): { user: User; profile: Profile } {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newUser: User = {
      id,
      email: email.toLowerCase(),
      passwordHash: this.hashPassword(password),
      createdAt: now,
    };
    const newProfile: Profile = {
      id,
      full_name: email.split('@')[0],
      education_level: 'Bachelor of Science in Computer Science',
      current_role: 'Software Engineer / Student',
      experience_level: 'entry',
      target_roles: ['Full Stack Engineer', 'Backend Developer'],
      preferred_skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      career_goals: 'Land a software engineering role at a fast-growing tech firm.',
      onboarding_completed: false,
      readiness_score: 35,
      created_at: now,
      updated_at: now,
    };

    this.data.users.push(newUser);
    this.data.profiles.push(newProfile);
    this.save();
    return { user: newUser, profile: newProfile };
  }

  public getProfile(userId: string): Profile | undefined {
    return this.data.profiles.find(p => p.id === userId);
  }

  public updateProfile(userId: string, updates: Partial<Profile>): Profile {
    const idx = this.data.profiles.findIndex(p => p.id === userId);
    if (idx === -1) {
      const now = new Date().toISOString();
      const created: Profile = {
        id: userId,
        full_name: '',
        education_level: '',
        current_role: '',
        experience_level: 'entry',
        target_roles: [],
        preferred_skills: [],
        career_goals: '',
        onboarding_completed: true,
        readiness_score: 50,
        created_at: now,
        updated_at: now,
        ...updates,
      };
      this.data.profiles.push(created);
      this.save();
      return created;
    }

    this.data.profiles[idx] = {
      ...this.data.profiles[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.profiles[idx];
  }

  // --- Resumes ---
  public getResumes(userId: string): Resume[] {
    return this.data.resumes.filter(r => r.user_id === userId);
  }

  public getResume(id: string, userId: string): Resume | undefined {
    return this.data.resumes.find(r => r.id === id && r.user_id === userId);
  }

  public createResume(userId: string, data: Omit<Resume, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Resume {
    const resume: Resume = {
      id: crypto.randomUUID(),
      user_id: userId,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.resumes.push(resume);
    this.save();
    return resume;
  }

  public deleteResume(id: string, userId: string): boolean {
    const initialLen = this.data.resumes.length;
    this.data.resumes = this.data.resumes.filter(r => !(r.id === id && r.user_id === userId));
    this.data.resume_analyses = this.data.resume_analyses.filter(a => !(a.resume_id === id && a.user_id === userId));
    this.save();
    return this.data.resumes.length < initialLen;
  }

  // --- Resume Analysis ---
  public getResumeAnalysis(resumeId: string, userId: string): ResumeAnalysis | undefined {
    return this.data.resume_analyses.find(a => a.resume_id === resumeId && a.user_id === userId);
  }

  public saveResumeAnalysis(userId: string, data: Omit<ResumeAnalysis, 'id' | 'user_id' | 'created_at'>): ResumeAnalysis {
    const existingIdx = this.data.resume_analyses.findIndex(a => a.resume_id === data.resume_id && a.user_id === userId);
    const item: ResumeAnalysis = {
      id: existingIdx !== -1 ? this.data.resume_analyses[existingIdx].id : crypto.randomUUID(),
      user_id: userId,
      ...data,
      created_at: new Date().toISOString(),
    };

    if (existingIdx !== -1) {
      this.data.resume_analyses[existingIdx] = item;
    } else {
      this.data.resume_analyses.push(item);
    }

    // Add activity
    this.logActivity(userId, 'resume_analyzed', `Analyzed resume for target role alignment`, { ats_score: item.ats_score });
    this.recalculateReadiness(userId);
    this.save();
    return item;
  }

  public updateSuggestionStatus(analysisId: string, userId: string, suggestionId: string, status: 'accepted' | 'rejected'): boolean {
    const analysis = this.data.resume_analyses.find(a => a.id === analysisId && a.user_id === userId);
    if (!analysis) return false;
    const sugg = analysis.suggestions.find(s => s.id === suggestionId);
    if (!sugg) return false;
    sugg.status = status;
    this.save();
    return true;
  }

  // --- Jobs ---
  public getJobs(userId: string): Job[] {
    return this.data.jobs.filter(j => j.user_id === userId);
  }

  public getJob(id: string, userId: string): Job | undefined {
    return this.data.jobs.find(j => j.id === id && j.user_id === userId);
  }

  public createJob(userId: string, data: Omit<Job, 'id' | 'user_id' | 'created_at'>): Job {
    const job: Job = {
      id: crypto.randomUUID(),
      user_id: userId,
      ...data,
      created_at: new Date().toISOString(),
    };
    this.data.jobs.push(job);
    this.save();
    return job;
  }

  public deleteJob(id: string, userId: string): boolean {
    const initialLen = this.data.jobs.length;
    this.data.jobs = this.data.jobs.filter(j => !(j.id === id && j.user_id === userId));
    this.data.job_matches = this.data.job_matches.filter(m => !(m.job_id === id && m.user_id === userId));
    this.save();
    return this.data.jobs.length < initialLen;
  }

  // --- Job Matches ---
  public getJobMatches(userId: string): JobMatch[] {
    return this.data.job_matches
      .filter(m => m.user_id === userId)
      .map(m => {
        const job = this.data.jobs.find(j => j.id === m.job_id);
        return {
          ...m,
          job_title: job?.title || m.job_title || 'Software Role',
          company: job?.company || m.company || 'Tech Co.',
        };
      });
  }

  public getJobMatch(id: string, userId: string): JobMatch | undefined {
    const match = this.data.job_matches.find(m => m.id === id && m.user_id === userId);
    if (!match) return undefined;
    const job = this.data.jobs.find(j => j.id === match.job_id);
    return {
      ...match,
      job_title: job?.title,
      company: job?.company,
    };
  }

  public saveJobMatch(userId: string, data: Omit<JobMatch, 'id' | 'user_id' | 'created_at'>): JobMatch {
    const existingIdx = this.data.job_matches.findIndex(m => m.resume_id === data.resume_id && m.job_id === data.job_id && m.user_id === userId);
    const item: JobMatch = {
      id: existingIdx !== -1 ? this.data.job_matches[existingIdx].id : crypto.randomUUID(),
      user_id: userId,
      ...data,
      created_at: new Date().toISOString(),
    };

    if (existingIdx !== -1) {
      this.data.job_matches[existingIdx] = item;
    } else {
      this.data.job_matches.push(item);
    }

    const job = this.data.jobs.find(j => j.id === data.job_id);
    this.logActivity(userId, 'job_matched', `Matched resume against "${job?.title || 'Job Description'}"`, { match_score: item.match_score });
    this.recalculateReadiness(userId);
    this.save();
    return item;
  }

  public deleteJobMatch(id: string, userId: string): boolean {
    const initialLen = this.data.job_matches.length;
    this.data.job_matches = this.data.job_matches.filter(m => !(m.id === id && m.user_id === userId));
    this.save();
    return this.data.job_matches.length < initialLen;
  }

  // --- Skill Goals ---
  public getSkillGoals(userId: string): SkillGoal[] {
    return this.data.skill_goals
      .filter(g => g.user_id === userId)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  public createSkillGoal(userId: string, data: Omit<SkillGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>): SkillGoal {
    const goal: SkillGoal = {
      id: crypto.randomUUID(),
      user_id: userId,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.skill_goals.push(goal);
    this.recalculateReadiness(userId);
    this.save();
    return goal;
  }

  public updateSkillGoal(id: string, userId: string, updates: Partial<SkillGoal>): SkillGoal | undefined {
    const idx = this.data.skill_goals.findIndex(g => g.id === id && g.user_id === userId);
    if (idx === -1) return undefined;
    const oldStatus = this.data.skill_goals[idx].status;
    this.data.skill_goals[idx] = {
      ...this.data.skill_goals[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (updates.status === 'completed' && oldStatus !== 'completed') {
      this.logActivity(userId, 'goal_completed', `Completed skill objective: ${this.data.skill_goals[idx].skill_name}`);
    }

    this.recalculateReadiness(userId);
    this.save();
    return this.data.skill_goals[idx];
  }

  public deleteSkillGoal(id: string, userId: string): boolean {
    const initialLen = this.data.skill_goals.length;
    this.data.skill_goals = this.data.skill_goals.filter(g => !(g.id === id && g.user_id === userId));
    this.recalculateReadiness(userId);
    this.save();
    return this.data.skill_goals.length < initialLen;
  }

  // --- Interview Studio ---
  public getInterviewSessions(userId: string): InterviewSession[] {
    return this.data.interview_sessions.filter(s => s.user_id === userId);
  }

  public getInterviewSession(id: string, userId: string): (InterviewSession & { questions: InterviewQuestion[]; answers: InterviewAnswer[]; feedback: InterviewFeedback[] }) | undefined {
    const session = this.data.interview_sessions.find(s => s.id === id && s.user_id === userId);
    if (!session) return undefined;
    const questions = this.data.interview_questions.filter(q => q.session_id === id);
    const answers = this.data.interview_answers.filter(a => a.session_id === id);
    const feedback = this.data.interview_feedback.filter(f => f.session_id === id);
    return {
      ...session,
      questions,
      answers,
      feedback,
    };
  }

  public createInterviewSession(userId: string, data: Omit<InterviewSession, 'id' | 'user_id' | 'created_at' | 'status' | 'overall_score' | 'strengths' | 'areas_to_improve'>): InterviewSession {
    const session: InterviewSession = {
      id: crypto.randomUUID(),
      user_id: userId,
      ...data,
      status: 'in_progress',
      overall_score: 0,
      strengths: [],
      areas_to_improve: [],
      created_at: new Date().toISOString(),
    };
    this.data.interview_sessions.push(session);
    this.save();
    return session;
  }

  public addInterviewQuestion(userId: string, sessionId: string, data: Omit<InterviewQuestion, 'id' | 'user_id' | 'session_id' | 'created_at'>): InterviewQuestion {
    const q: InterviewQuestion = {
      id: crypto.randomUUID(),
      user_id: userId,
      session_id: sessionId,
      ...data,
      created_at: new Date().toISOString(),
    };
    this.data.interview_questions.push(q);
    this.save();
    return q;
  }

  public submitInterviewAnswer(
    userId: string,
    sessionId: string,
    questionId: string,
    answerText: string,
    feedbackData: Omit<InterviewFeedback, 'id' | 'answer_id' | 'session_id' | 'user_id' | 'created_at'>
  ): { answer: InterviewAnswer; feedback: InterviewFeedback } {
    const answerId = crypto.randomUUID();
    const answer: InterviewAnswer = {
      id: answerId,
      user_id: userId,
      session_id: sessionId,
      question_id: questionId,
      answer_text: answerText,
      created_at: new Date().toISOString(),
    };
    const feedback: InterviewFeedback = {
      id: crypto.randomUUID(),
      answer_id: answerId,
      session_id: sessionId,
      user_id: userId,
      ...feedbackData,
      created_at: new Date().toISOString(),
    };

    this.data.interview_answers.push(answer);
    this.data.interview_feedback.push(feedback);
    this.save();
    return { answer, feedback };
  }

  public completeInterviewSession(
    sessionId: string,
    userId: string,
    summary: string,
    strengths: string[],
    areasToImprove: string[]
  ): InterviewSession | undefined {
    const session = this.data.interview_sessions.find(s => s.id === sessionId && s.user_id === userId);
    if (!session) return undefined;

    const feedbacks = this.data.interview_feedback.filter(f => f.session_id === sessionId);
    const avgScore = feedbacks.length > 0
      ? Math.round((feedbacks.reduce((acc, f) => acc + f.score, 0) / feedbacks.length) * 10) / 10
      : 75;

    session.status = 'completed';
    session.overall_score = avgScore;
    session.summary = summary;
    session.strengths = strengths;
    session.areas_to_improve = areasToImprove;
    session.completed_at = new Date().toISOString();

    this.logActivity(userId, 'interview_completed', `Completed ${session.interview_type} mock interview for ${session.target_role}`, {
      score: avgScore,
    });

    this.recalculateReadiness(userId);
    this.save();
    return session;
  }

  // --- Activity & Dashboard Readiness ---
  public logActivity(userId: string, eventType: ActivityEvent['event_type'], title: string, metadata: any = {}): void {
    const event: ActivityEvent = {
      id: crypto.randomUUID(),
      user_id: userId,
      event_type: eventType,
      event_title: title,
      metadata,
      created_at: new Date().toISOString(),
    };
    this.data.activity_events.unshift(event);
    if (this.data.activity_events.length > 500) {
      this.data.activity_events = this.data.activity_events.slice(0, 500);
    }
  }

  public getRecentActivity(userId: string, limit: number = 10): ActivityEvent[] {
    return this.data.activity_events
      .filter(e => e.user_id === userId)
      .slice(0, limit);
  }

  public recalculateReadiness(userId: string): number {
    const profile = this.data.profiles.find(p => p.id === userId);
    if (!profile) return 0;

    let score = 20; // baseline
    if (profile.onboarding_completed) score += 15;

    // Resumes analyzed
    const hasResume = this.data.resumes.some(r => r.user_id === userId);
    const analyses = this.data.resume_analyses.filter(a => a.user_id === userId);
    if (hasResume) score += 10;
    if (analyses.length > 0) {
      const avgAts = analyses.reduce((acc, a) => acc + (a.ats_score || 70), 0) / analyses.length;
      score += Math.round((avgAts / 100) * 15);
    }

    // Job matching
    const matches = this.data.job_matches.filter(m => m.user_id === userId);
    if (matches.length > 0) {
      score += Math.min(15, matches.length * 5);
    }

    // Skill goals
    const goals = this.data.skill_goals.filter(g => g.user_id === userId);
    const completedGoals = goals.filter(g => g.status === 'completed');
    if (goals.length > 0) {
      const goalRatio = completedGoals.length / goals.length;
      score += Math.round(goalRatio * 15);
    }

    // Mock interviews completed
    const completedInterviews = this.data.interview_sessions.filter(s => s.user_id === userId && s.status === 'completed');
    if (completedInterviews.length > 0) {
      score += Math.min(10, completedInterviews.length * 5);
    }

    const clamped = Math.min(100, Math.max(15, Math.round(score)));
    profile.readiness_score = clamped;
    profile.updated_at = new Date().toISOString();
    return clamped;
  }
}

export const db = new DatabaseService();
