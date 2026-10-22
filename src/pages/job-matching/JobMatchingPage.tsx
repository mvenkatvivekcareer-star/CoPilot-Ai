import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  Plus,
  Trash2,
  Briefcase,
  Layers,
  Calculator,
  ShieldCheck,
  Bot,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../lib/api';
import type { Resume, Job, JobMatch } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { ScoreGauge } from '../../components/common/ScoreGauge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';

export const JobMatchingPage: React.FC = () => {
  const navigate = useNavigate();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<JobMatch | null>(null);

  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Job Input Modal
  const [newJobModalOpen, setNewJobModalOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [resumesRes, jobsRes, matchesRes] = await Promise.all([
        api.getResumes(),
        api.getJobs(),
        api.getMatches(),
      ]);

      setResumes(resumesRes.resumes);
      setJobs(jobsRes.jobs);
      setMatches(matchesRes.matches);

      if (resumesRes.resumes.length > 0) {
        setSelectedResumeId(resumesRes.resumes[0].id);
      }
      if (jobsRes.jobs.length > 0) {
        setSelectedJobId(jobsRes.jobs[0].id);
      }
      if (matchesRes.matches.length > 0) {
        setSelectedMatch(matchesRes.matches[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load matching data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateJobAndMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle || !jobDescription) {
      setError('Please provide the job title and description.');
      return;
    }
    if (!selectedResumeId) {
      setError('Please upload a resume first to run job matching.');
      return;
    }

    try {
      setMatching(true);
      setError(null);

      // 1. Create and extract job requirements
      const jobRes = await api.createJob({
        title: jobTitle,
        company: jobCompany || 'Target Employer',
        description: jobDescription,
      });

      // 2. Run deterministic matching against selected resume
      const matchRes = await api.runMatch(selectedResumeId, jobRes.job.id);

      setJobs([jobRes.job, ...jobs]);
      setMatches([matchRes.match, ...matches]);
      setSelectedMatch(matchRes.match);
      setNewJobModalOpen(false);
      setJobTitle('');
      setJobCompany('');
      setJobDescription('');
    } catch (err: any) {
      setError(err.message || 'Failed to analyze and match job description.');
    } finally {
      setMatching(false);
    }
  };

  const handleRunExistingMatch = async () => {
    if (!selectedResumeId || !selectedJobId) {
      setError('Select both a resume and a job.');
      return;
    }

    try {
      setMatching(true);
      setError(null);
      const res = await api.runMatch(selectedResumeId, selectedJobId);
      setMatches([res.match, ...matches.filter(m => m.id !== res.match.id)]);
      setSelectedMatch(res.match);
    } catch (err: any) {
      setError(err.message || 'Failed to run matching.');
    } finally {
      setMatching(false);
    }
  };

  const handleDeleteMatch = async (id: string) => {
    try {
      await api.deleteMatch(id);
      const filtered = matches.filter(m => m.id !== id);
      setMatches(filtered);
      if (selectedMatch?.id === id) {
        setSelectedMatch(filtered[0] || null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete match.');
    }
  };

  const handleSendToSkillCoach = async () => {
    if (!selectedMatch) return;
    try {
      await api.generateSkillRoadmap({
        missingSkills: selectedMatch.missing_skills,
        targetRole: selectedMatch.job_title || 'Software Engineer',
        jobId: selectedMatch.job_id,
      });
      navigate('/app/skill-gaps');
    } catch (err: any) {
      setError(err.message || 'Failed to populate skill goals.');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner label="Loading explainable job matching engine..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Explainable Resume–Job Matching</h2>
          <p className="text-xs text-slate-400">
            Deterministic evidence scoring with transparent formula: 55% Required + 20% Preferred + 25% Experience
          </p>
        </div>

        <button
          onClick={() => setNewJobModalOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Compare New Job Posting</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Select Existing Resume & Job Bar */}
      {resumes.length > 0 && jobs.length > 0 && (
        <Card className="p-4 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Resume:</span>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
              >
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>{r.file_name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Target Job:</span>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
              >
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>{j.title} ({j.company})</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleRunExistingMatch}
            disabled={matching}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Target className="w-3.5 h-3.5" />
            <span>{matching ? 'Calculating Evidence...' : 'Re-compute Match'}</span>
          </button>
        </Card>
      )}

      {/* Match Results View */}
      {selectedMatch ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Main Score Banner */}
          <Card className="p-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-sky-950/30">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
              <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0 md:pr-4">
                <ScoreGauge score={selectedMatch.match_score} label="Deterministic Match" size="md" />
                <span className="text-[11px] text-slate-400 mt-2 text-center">
                  Informational estimate, not a hiring prediction
                </span>
              </div>

              <div className="md:col-span-3 space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">{selectedMatch.job_title}</h3>
                    <Badge variant="primary">{selectedMatch.company}</Badge>
                  </div>
                  <p className="text-xs text-slate-300 mt-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                    {selectedMatch.experience_alignment}
                  </p>
                </div>

                {/* Mathematical Formula Sub-Breakdown */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Required Skills (55%)</span>
                    <span className="text-sm font-bold text-indigo-400">
                      {selectedMatch.scoring_breakdown.required_skills_score}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Preferred Skills (20%)</span>
                    <span className="text-sm font-bold text-sky-400">
                      {selectedMatch.scoring_breakdown.preferred_skills_score}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Experience / Projects (25%)</span>
                    <span className="text-sm font-bold text-purple-400">
                      {selectedMatch.scoring_breakdown.experience_score}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Row */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSendToSkillCoach}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Convert Missing Skills to Skill-Gap Roadmap</span>
            </button>

            <button
              onClick={() =>
                navigate('/app/interviews', {
                  state: { targetRole: selectedMatch.job_title, jobId: selectedMatch.job_id },
                })
              }
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-2 transition-all"
            >
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>Launch Mock Interview for this Job</span>
            </button>
          </div>

          {/* Skills Categorization Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Evidenced Skills */}
            <Card className="p-5 border-emerald-500/20 bg-emerald-950/5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Evidenced in Resume ({selectedMatch.evidenced_skills.length})
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Explicit proof found in candidate's skills, work experience, or projects.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedMatch.evidenced_skills.map(s => (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </Card>

            {/* Partially Evidenced */}
            <Card className="p-5 border-amber-500/20 bg-amber-950/5">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Partially Evidenced ({selectedMatch.partial_skills?.length || 0})
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Adjacent or foundational competencies evidenced without direct naming.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedMatch.partial_skills?.map(s => (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-medium"
                  >
                    {s}
                  </span>
                )) || <span className="text-xs text-slate-500">None</span>}
              </div>
            </Card>

            {/* Missing in Resume */}
            <Card className="p-5 border-rose-500/20 bg-rose-950/5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Not Evidenced in Resume ({selectedMatch.missing_skills.length})
                </h4>
              </div>
              <p className="text-[11px] text-rose-300/80 mb-3 font-medium">
                IMPORTANT: Labeled as unevidenced in document, NOT proof that you lack the skill.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedMatch.missing_skills.map(s => (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          {/* Recommended Resume Customizations */}
          {selectedMatch.recommended_improvements?.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Recommended Role-Specific Tweaks</h3>
              </div>
              <ul className="space-y-2 text-xs">
                {selectedMatch.recommended_improvements.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-indigo-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Comparison History List */}
          {matches.length > 1 && (
            <Card className="p-6">
              <h3 className="text-sm font-bold text-white mb-3">Other Saved Match Comparisons</h3>
              <div className="divide-y divide-slate-800">
                {matches
                  .filter(m => m.id !== selectedMatch.id)
                  .map(m => (
                    <div key={m.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">{m.job_title}</p>
                        <p className="text-slate-400">{m.company} • {m.match_score}% Match</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedMatch(m)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteMatch(m.id)}
                          className="p-1 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card className="p-12 text-center border-dashed border-slate-800">
          <Target className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No job matches run yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Compare your resume against any job description to discover evidenced strengths, unevidenced gaps, and transparent fit formulas.
          </p>
          <button
            onClick={() => setNewJobModalOpen(true)}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
          >
            Paste Job Description
          </button>
        </Card>
      )}

      {/* New Job Modal */}
      <Modal
        isOpen={newJobModalOpen}
        onClose={() => setNewJobModalOpen(false)}
        title="Compare Target Job Description"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateJobAndMatch} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Resume for Comparison</label>
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {resumes.map(r => (
                <option key={r.id} value={r.id}>{r.file_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Job Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company / Organization</label>
              <input
                type="text"
                value={jobCompany}
                onChange={(e) => setJobCompany(e.target.value)}
                placeholder="e.g. Stripe, OpenAI, Tech Startup"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Job Description & Requirements</label>
            <textarea
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job posting text including responsibilities, required qualifications, and preferred tools..."
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Deterministic Scoring Engine:</span>
            <span>• Automatically parses required vs preferred skills</span>
            <br />
            <span>• Checks for explicit resume proof vs unevidenced items</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setNewJobModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={matching}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {matching ? <LoadingSpinner size="sm" label="" /> : <Target className="w-4 h-4" />}
              <span>{matching ? 'Extracting & Matching...' : 'Run Explainable Match'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
