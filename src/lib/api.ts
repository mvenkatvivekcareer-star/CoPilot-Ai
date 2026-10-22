import type {
  User,
  Profile,
  Resume,
  ResumeAnalysis,
  Job,
  JobMatch,
  SkillGoal,
  InterviewSession,
  InterviewQuestion,
  InterviewFeedback,
  AnswerAccuracyPrediction,
  DashboardStats,
  GenerateResumePayload,
  GeneratedResumeResult,
} from '../types';

const TOKEN_KEY = 'careerpilot_auth_token';

class ApiService {
  private getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore
    }
  }

  public clearToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(endpoint, {
        ...options,
        headers,
      });
    } catch (networkErr: any) {
      throw new Error(networkErr.message || 'Network connection failed. Please check your connection or backend status.');
    }

    if (response.status === 401) {
      // If unauthorized, clear token
      this.clearToken();
      window.dispatchEvent(new CustomEvent('careerpilot_unauthorized'));
    }

    if (!response.ok) {
      let errorMsg = '';
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorData.message || '';
      } catch {
        // Response is not JSON
      }

      if (!errorMsg) {
        if (response.status === 404) {
          errorMsg = 'API endpoint not reachable (404). Please ensure backend is active.';
        } else if (response.status === 504) {
          errorMsg = 'Request timed out (504). Please try again.';
        } else if (response.status >= 500) {
          errorMsg = `Server error (${response.status}).`;
        } else {
          errorMsg = response.statusText || `Request failed with status ${response.status}`;
        }
      }
      throw new Error(errorMsg);
    }

    return response.json();
  }

  // --- Auth ---
  public async register(email: string, password: string): Promise<{ token: string; user: User; profile: Profile }> {
    const data = await this.request<{ token: string; user: User; profile: Profile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  public async login(email: string, password: string): Promise<{ token: string; user: User; profile: Profile }> {
    const data = await this.request<{ token: string; user: User; profile: Profile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  public async demoLogin(): Promise<{ token: string; user: User; profile: Profile; isDemo: boolean }> {
    try {
      const data = await this.request<{ token: string; user: User; profile: Profile; isDemo: boolean }>('/api/auth/demo', {
        method: 'POST',
      });
      this.setToken(data.token);
      return data;
    } catch (err: any) {
      console.warn('API /api/auth/demo unreachable or offline, using client-side demo session fallback:', err);
      const fallbackToken = 'demo-session-' + Date.now();
      const demoUser: User = {
        id: 'c25d1ce5-e611-4db6-abda-f15e0e040dde',
        email: 'demo.candidate@careerpilot.ai',
      };
      const demoProfile: Profile = {
        id: 'c25d1ce5-e611-4db6-abda-f15e0e040dde',
        full_name: 'Alex Rivera',
        education_level: 'B.S. in Computer Science, State University (2024)',
        current_role: 'Associate Software Engineer',
        experience_level: 'entry',
        target_roles: ['Full Stack Engineer', 'Backend Software Engineer', 'AI Application Developer'],
        preferred_skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Python', 'Docker'],
        career_goals: 'Accelerate readiness for Mid-Level Software Engineer positions at modern product companies.',
        onboarding_completed: true,
        readiness_score: 68,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.setToken(fallbackToken);
      return { token: fallbackToken, user: demoUser, profile: demoProfile, isDemo: true };
    }
  }

  public async quickAccess(email?: string): Promise<{ token: string; user: User; profile: Profile }> {
    const data = await this.request<{ token: string; user: User; profile: Profile }>('/api/auth/quick-access', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    this.setToken(data.token);
    return data;
  }

  public async getCurrentUser(): Promise<{ user: User; profile: Profile }> {
    try {
      return await this.request<{ user: User; profile: Profile }>('/api/auth/me');
    } catch (err) {
      const token = this.getToken();
      if (token && token.startsWith('demo-session-')) {
        return {
          user: {
            id: 'c25d1ce5-e611-4db6-abda-f15e0e040dde',
            email: 'demo.candidate@careerpilot.ai',
          },
          profile: {
            id: 'c25d1ce5-e611-4db6-abda-f15e0e040dde',
            full_name: 'Alex Rivera',
            education_level: 'B.S. in Computer Science, State University (2024)',
            current_role: 'Associate Software Engineer',
            experience_level: 'entry',
            target_roles: ['Full Stack Engineer', 'Backend Software Engineer', 'AI Application Developer'],
            preferred_skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Python', 'Docker'],
            career_goals: 'Accelerate readiness for Mid-Level Software Engineer positions at modern product companies.',
            onboarding_completed: true,
            readiness_score: 68,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        };
      }
      throw err;
    }
  }

  public async updateProfile(profileData: Partial<Profile>): Promise<{ profile: Profile }> {
    return this.request<{ profile: Profile }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // --- Resumes ---
  public async getResumes(): Promise<{ resumes: Resume[] }> {
    try {
      return await this.request<{ resumes: Resume[] }>('/api/resumes');
    } catch (err) {
      if (this.getToken()?.startsWith('demo-session-')) {
        return {
          resumes: [
            {
              id: 'demo-resume-1',
              user_id: 'c25d1ce5-e611-4db6-abda-f15e0e040dde',
              file_name: 'Alex_Rivera_Software_Engineer_Resume.pdf',
              file_size: 48200,
              storage_path: 'demo_resume.pdf',
              mime_type: 'application/pdf',
              raw_text: 'Alex Rivera\nEmail: alex.rivera@example.com | Phone: (555) 234-5678 | Location: San Francisco, CA\nLinkedIn: linkedin.com/in/alex-rivera-dev | GitHub: github.com/alexrivera\n\nPROFESSIONAL SUMMARY\nResults-driven software engineer with 1.5 years of experience building responsive full-stack applications with React, TypeScript, Node.js, and PostgreSQL. Passionate about clean architecture, test-driven development, and cloud deployments.\n\nWORK EXPERIENCE\nAssociate Software Engineer | CloudVibe Systems | June 2024 - Present\n• Designed and shipped RESTful API microservices in Node.js and TypeScript serving 40,000 daily requests.\n• Refactored customer onboarding flow using React and Tailwind CSS, increasing sign-up completion rate by 18%.\n• Collaborated in bi-weekly Agile sprints, writing Jest unit tests with 84% code coverage across core payment modules.\n• Worked with PostgreSQL database schema migrations and query optimizations to reduce response time.\n\nTECHNICAL SKILLS\nLanguages: TypeScript, JavaScript, Python, SQL\nFrameworks: React, Node.js, Express, Tailwind CSS\nDatabases: PostgreSQL, Docker, Git',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        };
      }
      throw err;
    }
  }

  public async getResume(id: string): Promise<{ resume: Resume; analysis?: ResumeAnalysis }> {
    try {
      return await this.request<{ resume: Resume; analysis?: ResumeAnalysis }>(`/api/resumes/${id}`);
    } catch (err) {
      if (this.getToken()?.startsWith('demo-session-')) {
        const demoRes: Resume = {
          id: 'demo-resume-1',
          user_id: 'c25d1ce5-e611-4db6-abda-f15e0e040dde',
          file_name: 'Alex_Rivera_Software_Engineer_Resume.pdf',
          file_size: 48200,
          storage_path: 'demo_resume.pdf',
          mime_type: 'application/pdf',
          raw_text: 'Alex Rivera\nEmail: alex.rivera@example.com | Phone: (555) 234-5678 | Location: San Francisco, CA\nLinkedIn: linkedin.com/in/alex-rivera-dev | GitHub: github.com/alexrivera\n\nPROFESSIONAL SUMMARY\nResults-driven software engineer with 1.5 years of experience building responsive full-stack applications with React, TypeScript, Node.js, and PostgreSQL.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const demoAnalysis: ResumeAnalysis = {
          id: 'demo-analysis-1',
          resume_id: 'demo-resume-1',
          user_id: 'c25d1ce5-e611-4db6-abda-f15e0e040dde',
          parsed_profile: {
            contact: { name: 'Alex Rivera', email: 'alex.rivera@example.com', location: 'San Francisco, CA' },
            summary: 'Results-driven software engineer with 1.5 years of experience building responsive full-stack applications.',
            education: [{ institution: 'State University', degree: 'B.S.', field: 'Computer Science', graduationYear: '2024' }],
            skills: {
              technical: ['TypeScript', 'JavaScript', 'Python', 'SQL'],
              frameworks: ['React', 'Node.js', 'Express', 'Tailwind CSS'],
              tools: ['Git', 'Docker', 'PostgreSQL'],
              soft: ['Agile/Scrum', 'Collaboration', 'Problem Solving'],
            },
          },
          strengths: ['Strong full-stack stack alignment with TypeScript, React, and Node.js microservices.', 'Quantified impact demonstrated in onboarding flow optimization (18% boost).'],
          weaknesses: ['Could highlight more distributed systems experience or asynchronous message queues.'],
          suggestions: [
            {
              id: 'sug-1',
              section: 'Work Experience',
              original: 'Worked with PostgreSQL database schema migrations and query optimizations to reduce response time.',
              suggested: 'Optimized PostgreSQL queries and normalized schema structures, lowering database latency by 25% across high-traffic endpoints.',
              reason: 'Replaces passive wording with active technical impact and specific optimization metrics.',
              status: 'pending',
            },
          ],
          quantified_improvements: [
            {
              original: 'Built an internal reporting dashboard in React and Express',
              improved: 'Delivered reporting dashboard in React/Express adopted by 15+ internal engineers for daily server telemetry',
              metricType: 'Adoption / User Reach',
            },
          ],
          score_breakdown: { clarity: 90, impact: 82, skillsDepth: 85, structure: 88 },
          ats_score: 86,
          created_at: new Date().toISOString(),
        };
        return { resume: demoRes, analysis: demoAnalysis };
      }
      throw err;
    }
  }

  public async uploadResume(payload: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    rawText: string;
    base64Data?: string;
  }): Promise<{ resume: Resume; analysis: ResumeAnalysis }> {
    return this.request<{ resume: Resume; analysis: ResumeAnalysis }>('/api/resumes/upload', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async reanalyzeResume(resumeId: string, targetRole?: string): Promise<{ analysis: ResumeAnalysis }> {
    return this.request<{ analysis: ResumeAnalysis }>(`/api/resumes/${resumeId}/analyze`, {
      method: 'POST',
      body: JSON.stringify({ targetRole }),
    });
  }

  public async updateSuggestionStatus(resumeId: string, suggestionId: string, status: 'accepted' | 'rejected'): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/resumes/${resumeId}/suggestions/${suggestionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  public async deleteResume(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/resumes/${id}`, {
      method: 'DELETE',
    });
  }

  public async generateResumeFromSkills(payload: GenerateResumePayload): Promise<{ data: GeneratedResumeResult }> {
    return this.request<{ data: GeneratedResumeResult }>('/api/resumes/generate-from-skills', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async saveGeneratedResume(payload: {
    fileName: string;
    rawText: string;
    parsedProfile?: any;
    atsScore?: number;
  }): Promise<{ resume: Resume; analysis: ResumeAnalysis }> {
    return this.request<{ resume: Resume; analysis: ResumeAnalysis }>('/api/resumes/save-generated', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Jobs & Matches ---
  public async getJobs(): Promise<{ jobs: Job[] }> {
    try {
      return await this.request<{ jobs: Job[] }>('/api/jobs');
    } catch (err) {
      if (this.getToken()?.startsWith('demo-session-')) {
        return {
          jobs: [
            {
              id: 'demo-job-1',
              user_id: 'c25d1ce5-e611-4db6-abda-f15e0e040dde',
              title: 'Full Stack Engineer (TypeScript & Cloud)',
              company: 'Veloce Data Labs',
              description: 'We are seeking an energetic Full Stack Engineer to build next-generation data applications.',
              parsed_requirements: {
                required_skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'Git'],
                preferred_skills: ['GraphQL', 'Redis', 'AWS'],
                experience_years: '1-3 years',
                education_level: 'B.S. in Computer Science',
                responsibilities: ['Build modular React interfaces and robust Node.js microservices', 'Design performant PostgreSQL schemas'],
                competencies: ['System Design', 'Code Reviews', 'Collaborative Problem Solving'],
              },
              created_at: new Date().toISOString(),
            },
          ],
        };
      }
      throw err;
    }
  }

  public async createJob(jobData: { title: string; company?: string; description: string }): Promise<{ job: Job }> {
    return this.request<{ job: Job }>('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  public async deleteJob(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/jobs/${id}`, {
      method: 'DELETE',
    });
  }

  public async getMatches(): Promise<{ matches: JobMatch[] }> {
    try {
      return await this.request<{ matches: JobMatch[] }>('/api/matches');
    } catch (err) {
      if (this.getToken()?.startsWith('demo-session-')) {
        return {
          matches: [
            {
              id: 'demo-match-1',
              user_id: 'c25d1ce5-e611-4db6-abda-f15e0e040dde',
              resume_id: 'demo-resume-1',
              job_id: 'demo-job-1',
              job_title: 'Full Stack Engineer (TypeScript & Cloud)',
              company: 'Veloce Data Labs',
              match_score: 82,
              evidenced_skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'Git'],
              missing_skills: ['GraphQL', 'Redis'],
              partial_skills: ['AWS', 'CI/CD'],
              experience_alignment: 'Strong direct match with 1.5 years experience in React/Node/PostgreSQL.',
              scoring_breakdown: {
                required_skills_score: 100,
                preferred_skills_score: 50,
                experience_score: 85,
                formula_explanation: 'Formula: (Required Skills × 55%) + (Preferred Skills × 20%) + (Experience Alignment × 25%).',
              },
              recommended_improvements: ['Add a project demonstrating Redis caching or GraphQL querying.'],
              created_at: new Date().toISOString(),
            },
          ],
        };
      }
      throw err;
    }
  }

  public async getMatch(id: string): Promise<{ match: JobMatch }> {
    return this.request<{ match: JobMatch }>(`/api/matches/${id}`);
  }

  public async runMatch(resumeId: string, jobId: string): Promise<{ match: JobMatch }> {
    return this.request<{ match: JobMatch }>('/api/matches', {
      method: 'POST',
      body: JSON.stringify({ resumeId, jobId }),
    });
  }

  public async deleteMatch(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/matches/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Skill-Gap Goals ---
  public async getSkillGoals(): Promise<{ goals: SkillGoal[] }> {
    try {
      return await this.request<{ goals: SkillGoal[] }>('/api/skills/goals');
    } catch (err) {
      if (this.getToken()?.startsWith('demo-session-')) {
        return {
          goals: [
            {
              id: 'demo-goal-1',
              user_id: 'c25d1ce5-e611-4db6-abda-f15e0e040dde',
              skill_name: 'Redis In-Memory Caching',
              priority: 'high',
              why_matters: 'Essential for high-throughput microservices and reducing PostgreSQL read load.',
              candidate_evidence: 'Solid understanding of backend request life cycles and relational databases.',
              learning_objective: 'Implement Redis cache-aside pattern with TTL invalidation on REST endpoints.',
              recommended_exercise: 'Build a Node.js caching middleware using ioredis for frequent database queries.',
              status: 'in_progress',
              sort_order: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'demo-goal-2',
              user_id: 'c25d1ce5-e611-4db6-abda-f15e0e040dde',
              skill_name: 'GraphQL API Design',
              priority: 'medium',
              why_matters: 'Enables flexible data fetching and minimizes network over-fetching in complex UI views.',
              candidate_evidence: 'Deep proficiency in RESTful design and TypeScript typing.',
              learning_objective: 'Create a GraphQL schema with Apollo Server and TypeScript resolvers.',
              recommended_exercise: 'Expose a GraphQL endpoint querying existing PostgreSQL tables with field-level resolvers.',
              status: 'not_started',
              sort_order: 2,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        };
      }
      throw err;
    }
  }

  public async generateSkillRoadmap(payload: { missingSkills: string[]; targetRole: string; jobId?: string }): Promise<{ goals: SkillGoal[] }> {
    return this.request<{ goals: SkillGoal[] }>('/api/skills/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async createSkillGoal(goal: Partial<SkillGoal>): Promise<{ goal: SkillGoal }> {
    return this.request<{ goal: SkillGoal }>('/api/skills/goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    });
  }

  public async updateSkillGoal(id: string, updates: Partial<SkillGoal>): Promise<{ goal: SkillGoal }> {
    return this.request<{ goal: SkillGoal }>(`/api/skills/goals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  public async deleteSkillGoal(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/skills/goals/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Mock Interviews ---
  public async getInterviewSessions(): Promise<{ sessions: InterviewSession[] }> {
    try {
      return await this.request<{ sessions: InterviewSession[] }>('/api/interviews/sessions');
    } catch (err) {
      if (this.getToken()?.startsWith('demo-session-')) {
        return {
          sessions: [
            {
              id: 'demo-session-1',
              user_id: 'c25d1ce5-e611-4db6-abda-f15e0e040dde',
              target_role: 'Full Stack Engineer',
              interview_type: 'technical',
              difficulty: 'mid',
              total_questions: 3,
              status: 'completed',
              overall_score: 88,
              summary: 'Strong technical communication with practical system debugging experience.',
              strengths: ['Clear explanation of database diagnostics and indexing', 'Structured answers'],
              areas_to_improve: ['Expand on distributed state handling and asynchronous task queues'],
              created_at: new Date().toISOString(),
            },
          ],
        };
      }
      throw err;
    }
  }

  public async getInterviewSession(id: string): Promise<{
    session: InterviewSession & {
      questions: InterviewQuestion[];
      answers: any[];
      feedback: InterviewFeedback[];
    };
  }> {
    return this.request<any>(`/api/interviews/sessions/${id}`);
  }

  public async createInterviewSession(payload: {
    targetRole: string;
    interviewType: string;
    difficulty: string;
    totalQuestions: number;
    resumeId?: string;
    jobId?: string;
  }): Promise<{ session: InterviewSession; question: InterviewQuestion }> {
    return this.request<{ session: InterviewSession; question: InterviewQuestion }>('/api/interviews/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async submitInterviewAnswer(
    sessionId: string,
    questionId: string,
    answerText: string
  ): Promise<{
    answer: any;
    feedback: InterviewFeedback;
    nextQuestion: InterviewQuestion | null;
    isCompleted: boolean;
  }> {
    return this.request<any>(`/api/interviews/sessions/${sessionId}/submit-answer`, {
      method: 'POST',
      body: JSON.stringify({ questionId, answerText }),
    });
  }

  public async predictAnswerAccuracy(payload: {
    questionText: string;
    answerText: string;
    targetRole: string;
    interviewType?: string;
    difficulty?: string;
    targetCompetency?: string;
  }): Promise<{ prediction: AnswerAccuracyPrediction }> {
    try {
      return await this.request<{ prediction: AnswerAccuracyPrediction }>('/api/interviews/predict-accuracy', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      if (this.getToken()?.startsWith('demo-session-')) {
        const len = (payload.answerText || '').trim().length;
        const score = len < 80 ? 54 : len < 200 ? 72 : len < 400 ? 86 : 92;
        return {
          prediction: {
            accuracyScore: score,
            accuracyLevel: score >= 85 ? 'Strong Fit / High Readiness' : score >= 70 ? 'Moderate / Needs Specifics' : 'Incomplete / Needs Work',
            technicalAccuracy: Math.min(95, score + 4),
            completeness: Math.max(45, score - 6),
            structureClarity: Math.min(92, score + 2),
            interviewerPerception: score >= 80
              ? `Interviewer Takeaway: The candidate directly addresses core engineering principles for ${payload.targetRole} with good technical confidence.`
              : `Interviewer Takeaway: The candidate understands the basic idea, but misses critical production trade-offs and quantitative details.`,
            strengthsIdentified: [
              'Clear identification of the main technical mechanism',
              'Structured logical explanation'
            ],
            missingKeywords: [
              'Latency & throughput trade-offs',
              'Failure recovery & resilience',
              'Measurable production impact'
            ],
            improvementSuggestions: [
              'Mention concrete metrics (e.g. reduced response times by 30%) to demonstrate business value',
              'Explicitly address edge cases and how the system recovers when downstream services fail'
            ],
            elevatedAnswerSnippet: `To optimize this architecture, I established a circuit breaker pattern combined with Redis distributed caching, which stabilized peak p99 latencies under 45ms.`,
          },
        };
      }
      throw err;
    }
  }

  public async completeInterviewSession(
    sessionId: string,
    summary?: string,
    strengths?: string[],
    areasToImprove?: string[]
  ): Promise<{ session: InterviewSession }> {
    return this.request<{ session: InterviewSession }>(`/api/interviews/sessions/${sessionId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ summary, strengths, areasToImprove }),
    });
  }

  // --- Dashboard ---
  public async getDashboardStats(): Promise<DashboardStats> {
    try {
      return await this.request<DashboardStats>('/api/dashboard/stats');
    } catch (err) {
      const token = this.getToken();
      if (token && token.startsWith('demo-session-')) {
        return {
          profile: {
            id: 'c25d1ce5-e611-4db6-abda-f15e0e040dde',
            full_name: 'Alex Rivera',
            education_level: 'B.S. in Computer Science, State University (2024)',
            current_role: 'Associate Software Engineer',
            experience_level: 'entry',
            target_roles: ['Full Stack Engineer', 'Backend Software Engineer', 'AI Application Developer'],
            preferred_skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Python', 'Docker'],
            career_goals: 'Accelerate readiness for Mid-Level Software Engineer positions at modern product companies.',
            onboarding_completed: true,
            readiness_score: 68,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          readinessScore: 68,
          counts: {
            resumes: 1,
            jobs: 1,
            matches: 1,
            goals: 2,
            completedGoals: 0,
            interviews: 1,
            completedInterviews: 1,
          },
          topMatch: {
            id: 'demo-match-1',
            user_id: 'c25d1ce5-e611-4db6-abda-f15e0e040dde',
            resume_id: 'demo-resume-1',
            job_id: 'demo-job-1',
            job_title: 'Full Stack Engineer (TypeScript & Cloud)',
            company: 'Veloce Data Labs',
            match_score: 82,
            evidenced_skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'Git'],
            missing_skills: ['GraphQL', 'Redis'],
            partial_skills: ['AWS', 'CI/CD'],
            experience_alignment: 'Strong direct match with 1.5 years experience in React/Node/PostgreSQL.',
            scoring_breakdown: {
              required_skills_score: 100,
              preferred_skills_score: 50,
              experience_score: 85,
              formula_explanation: 'Formula: (Required Skills × 55%) + (Preferred Skills × 20%) + (Experience Alignment × 25%).',
            },
            recommended_improvements: [
              'Add a project demonstrating Redis caching or GraphQL querying.',
            ],
            created_at: new Date().toISOString(),
          },
          avgInterviewScore: 88,
          priorityGaps: [
            {
              id: 'demo-goal-1',
              user_id: 'c25d1ce5-e611-4db6-abda-f15e0e040dde',
              skill_name: 'Redis In-Memory Caching',
              priority: 'high',
              why_matters: 'Essential for high-throughput microservices and reducing database read load.',
              candidate_evidence: 'Solid understanding of backend request life cycles and relational databases.',
              learning_objective: 'Implement Redis cache-aside pattern with TTL invalidation on REST endpoints.',
              recommended_exercise: 'Build a Node.js caching middleware using ioredis for frequent database queries.',
              status: 'in_progress',
              sort_order: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          recentInterviews: [],
          recentActivity: [
            {
              id: 'demo-act-1',
              user_id: 'c25d1ce5-e611-4db6-abda-f15e0e040dde',
              event_type: 'interview_completed',
              event_title: 'Completed technical mock interview for Full Stack Engineer',
              created_at: new Date().toISOString(),
            },
          ],
        };
      }
      throw err;
    }
  }

  public async getSystemHealth(): Promise<{ status: string; hasGeminiKey: boolean; timestamp: string }> {
    return this.request<{ status: string; hasGeminiKey: boolean; timestamp: string }>('/api/system/health');
  }
  // --- Supabase Direct Integration ---
  public async getSupabaseStatus(): Promise<{
    configured: boolean;
    connected: boolean;
    url: string;
    projectRef: string;
    dashboardUrl: string;
    tables: Record<string, { exists: boolean; count: number; error?: string }>;
    message?: string;
    config?: { url: string; hasKey: boolean; keyPreview: string; projectRef: string };
  }> {
    return this.request('/api/supabase/status');
  }

  public async saveSupabaseConfig(payload: { url: string; key: string; serviceRoleKey?: string }): Promise<{
    success: boolean;
    status: any;
  }> {
    return this.request('/api/supabase/config', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async syncToSupabase(): Promise<{
    success: boolean;
    syncedCounts: Record<string, number>;
    errors: string[];
  }> {
    return this.request('/api/supabase/sync', {
      method: 'POST',
    });
  }

  public async getSupabaseData(): Promise<{
    data: Record<string, any[]>;
  }> {
    return this.request('/api/supabase/data');
  }
  public async simulateCareerTwin(targetRole: string, scenarios: string[]): Promise<any> {
    return this.request<any>('/api/career-twin/simulate', {
      method: 'POST',
      body: JSON.stringify({ targetRole, scenarios }),
    });
  }
}

export const api = new ApiService();
