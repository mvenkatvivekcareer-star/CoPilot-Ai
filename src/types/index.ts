export interface User {
  id: string;
  email: string;
}

export interface Profile {
  id: string;
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

export interface AnswerAccuracyPrediction {
  accuracyScore: number;
  accuracyLevel: string;
  technicalAccuracy: number;
  completeness: number;
  structureClarity: number;
  interviewerPerception: string;
  strengthsIdentified: string[];
  missingKeywords: string[];
  improvementSuggestions: string[];
  elevatedAnswerSnippet?: string;
}

export interface ActivityEvent {
  id: string;
  user_id: string;
  event_type: 'resume_analyzed' | 'job_matched' | 'interview_completed' | 'goal_completed' | 'profile_updated';
  event_title: string;
  metadata?: any;
  created_at: string;
}

export interface DashboardStats {
  profile: Profile;
  readinessScore: number;
  counts: {
    resumes: number;
    jobs: number;
    matches: number;
    goals: number;
    completedGoals: number;
    interviews: number;
    completedInterviews: number;
  };
  topMatch: JobMatch | null;
  avgInterviewScore: number;
  priorityGaps: SkillGoal[];
  recentInterviews: InterviewSession[];
  recentActivity: ActivityEvent[];
}

export interface GenerateResumePayload {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  targetRole?: string;
  experienceLevel?: 'student' | 'entry' | 'mid' | 'senior' | 'lead';
  skills: string[];
  education?: {
    degree?: string;
    institution?: string;
    field?: string;
    graduationYear?: string;
    gpa?: string;
  };
  highlights?: string;
  templateStyle?: 'modern' | 'ats_classic' | 'executive' | 'tech_specialist';
}

export interface GeneratedResumeResult {
  rawText: string;
  formattedMarkdown: string;
  parsed_profile: ResumeAnalysis['parsed_profile'];
  ats_score: number;
  key_highlights: string[];
  suggested_next_steps: string[];
}

