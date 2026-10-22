import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Target,
  Sparkles,
  Bot,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  Zap,
  Briefcase,
  Layers,
  ChevronRight,
  Play,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { DashboardStats } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { ScoreGauge } from '../../components/common/ScoreGauge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

export const DashboardPage: React.FC = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner label="Compiling verified career intelligence metrics..." />
      </div>
    );
  }

  const hasNoData =
    !stats ||
    (stats.counts.resumes === 0 &&
      stats.counts.jobs === 0 &&
      stats.counts.interviews === 0);

  // Transform interview feedback trend for charts
  const interviewTrendData = (stats?.recentInterviews || [])
    .filter(i => i.status === 'completed')
    .map((session, idx) => ({
      name: `Session ${idx + 1}`,
      role: session.target_role,
      score: session.overall_score || 0,
    }));

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span>Adaptive Intelligence Dashboard</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {profile?.full_name || user?.email?.split('@')[0]}
            </h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              Targeting{' '}
              <span className="text-indigo-300 font-semibold">
                {profile?.target_roles?.[0] || 'Software Engineering'}
              </span>
              . Continuously track verified evidence across your resume, job matches, and adaptive interview sessions.
            </p>
          </div>

          <div className="flex flex-row items-center gap-6 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 shrink-0">
            <ScoreGauge
              score={stats?.readinessScore || 35}
              label="Readiness Index"
              size="md"
              showSubtext={true}
            />
          </div>
        </div>
      </div>

      {/* Fresh Account Empty State */}
      {hasNoData ? (
        <EmptyState
          icon={FileText}
          title="No career artifacts uploaded yet"
          description="Upload your current resume or choose target roles to initiate the continuous readiness loop: Resume ATS Analysis → Explainable Matching → Skill-Gap Coaching → Adaptive Mock Interview."
          actionLabel="Upload & Analyze Resume"
          onAction={() => navigate('/app/resume')}
          secondaryActionLabel="Analyze a Target Job"
          onSecondaryAction={() => navigate('/app/job-matching')}
        />
      ) : (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card hoverEffect onClick={() => navigate('/app/resume')} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400">Resumes Analyzed</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-white">{stats?.counts.resumes || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span>ATS & Metric Breakdown</span>
                <ChevronRight className="w-3 h-3 text-slate-600" />
              </p>
            </Card>

            <Card hoverEffect onClick={() => navigate('/app/job-matching')} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400">Target Matches</span>
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-white">{stats?.counts.matches || 0}</p>
              <p className="text-[11px] text-sky-400/90 mt-1 font-medium">
                {stats?.topMatch ? `Top Match: ${stats.topMatch.match_score}%` : 'No matches calculated yet'}
              </p>
            </Card>

            <Card hoverEffect onClick={() => navigate('/app/skill-gaps')} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400">Skill Goals</span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-white">
                {stats?.counts.completedGoals || 0} / {stats?.counts.goals || 0}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {stats?.counts.goals ? `${Math.round(((stats.counts.completedGoals || 0) / stats.counts.goals) * 100)}% completed` : '0 active goals'}
              </p>
            </Card>

            <Card hoverEffect onClick={() => navigate('/app/interviews')} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400">Mock Interviews</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-white">{stats?.counts.completedInterviews || 0}</p>
              <p className="text-[11px] text-emerald-400/90 mt-1 font-medium">
                {stats?.avgInterviewScore ? `Avg Score: ${stats.avgInterviewScore}%` : 'Ready to start first session'}
              </p>
            </Card>
          </div>

          {/* Main 2-column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Best Match & Interview History Trend */}
            <div className="lg:col-span-2 space-y-8">
              {/* Top Job Match Spotlight */}
              {stats?.topMatch ? (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">Best Role Alignment</h3>
                        <p className="text-xs text-slate-400">{stats.topMatch.job_title} • {stats.topMatch.company}</p>
                      </div>
                    </div>
                    <Badge variant="primary" size="md">
                      {stats.topMatch.match_score}% Deterministic Match
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    {stats.topMatch.experience_alignment}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-semibold text-emerald-400 block mb-1.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Evidenced Skills ({stats.topMatch.evidenced_skills.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {stats.topMatch.evidenced_skills.slice(0, 6).map(s => (
                          <span key={s} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-amber-400 block mb-1.5 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Not Evidenced in Resume ({stats.topMatch.missing_skills.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {stats.topMatch.missing_skills.slice(0, 4).map(s => (
                          <span key={s} className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Informational estimate based on transparent formula (55% req, 20% pref, 25% exp)
                    </span>
                    <button
                      onClick={() => navigate('/app/job-matching')}
                      className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                    >
                      View Full Breakdown
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Card>
              ) : null}

              {/* Interview Competency Trend Chart */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Interview Competency Trend</h3>
                    <p className="text-xs text-slate-400">Feedback score progression across completed mock sessions</p>
                  </div>
                  <Link
                    to="/app/interviews"
                    className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-semibold text-xs rounded-xl border border-indigo-500/30 flex items-center gap-1.5 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-indigo-300" />
                    <span>Start Mock Interview</span>
                  </Link>
                </div>

                {interviewTrendData.length > 0 ? (
                  <div className="h-60 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={interviewTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" domain={[0, 100]} fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            borderRadius: '0.75rem',
                            color: '#fff',
                            fontSize: '12px',
                          }}
                        />
                        <Area type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#scoreGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl my-2">
                    <Bot className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 mb-3">No completed mock interview sessions yet.</p>
                    <button
                      onClick={() => navigate('/app/interviews')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl transition-all shadow-md"
                    >
                      Take Your First Adaptive Interview
                    </button>
                  </div>
                )}
              </Card>
            </div>

            {/* Right Column: Priority Skill Gaps & Activity Timeline */}
            <div className="space-y-8">
              {/* Priority Skill Gaps */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-white">Priority Skill Roadmaps</h3>
                  </div>
                  <Link to="/app/skill-gaps" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                    View All
                  </Link>
                </div>

                {stats?.priorityGaps && stats.priorityGaps.length > 0 ? (
                  <div className="space-y-3">
                    {stats.priorityGaps.map(goal => (
                      <div
                        key={goal.id}
                        className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">{goal.skill_name}</span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${
                              goal.priority === 'critical'
                                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                                : goal.priority === 'high'
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {goal.priority}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {goal.learning_objective}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/60">
                    No active skill gaps identified. Run a job match to generate targeted roadmap goals.
                  </div>
                )}
              </Card>

              {/* Verified Activity Feed */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">Recent Activity</h3>
                </div>

                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  <div className="space-y-3.5">
                    {stats.recentActivity.map(event => (
                      <div key={event.id} className="flex items-start gap-3 text-xs">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-200">{event.event_title}</p>
                          <p className="text-[11px] text-slate-400">
                            {new Date(event.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No activity logged yet.</p>
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
