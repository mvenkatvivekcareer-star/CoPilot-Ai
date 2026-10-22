import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  Check,
  Copy,
  Download,
  Save,
  Plus,
  X,
  RefreshCw,
  Award,
  ShieldCheck,
  Eye,
  Code2,
  GraduationCap,
  Briefcase,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { GenerateResumePayload, GeneratedResumeResult, Resume, ResumeAnalysis } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

const POPULAR_SKILL_CATEGORIES: { name: string; skills: string[] }[] = [
  {
    name: 'Frontend',
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'JavaScript', 'HTML5/CSS3', 'Redux', 'Vue.js'],
  },
  {
    name: 'Backend & APIs',
    skills: ['Node.js', 'Express', 'Python', 'FastAPI', 'PostgreSQL', 'REST APIs', 'Java', 'Go', 'GraphQL'],
  },
  {
    name: 'Cloud, Data & DevOps',
    skills: ['Docker', 'AWS', 'PostgreSQL', 'Redis', 'MongoDB', 'Supabase', 'Git', 'CI/CD', 'Linux'],
  },
  {
    name: 'AI, Systems & Testing',
    skills: ['Gemini API', 'Jest', 'System Design', 'Agile/Scrum', 'Microservices', 'PyTorch', 'Data Analysis'],
  },
];

const TARGET_ROLE_PRESETS = [
  'Full Stack Software Engineer',
  'Frontend Engineer',
  'Backend Software Engineer',
  'AI / Machine Learning Engineer',
  'Cloud & DevOps Engineer',
  'Data Engineer',
  'Mobile Application Developer',
];

interface SkillResumeGeneratorProps {
  onSavedResume?: (newResume: Resume, newAnalysis: ResumeAnalysis) => void;
}

export const SkillResumeGenerator: React.FC<SkillResumeGeneratorProps> = ({ onSavedResume }) => {
  const { profile, user } = useAuth();

  // Form State
  const [fullName, setFullName] = useState(profile?.full_name || (user?.email ? user.email.split('@')[0] : 'Alex Rivera'));
  const [email, setEmail] = useState(user?.email || 'candidate@example.com');
  const [phone, setPhone] = useState('(555) 234-5678');
  const [location, setLocation] = useState('San Francisco, CA / Remote');
  const [targetRole, setTargetRole] = useState(profile?.target_roles?.[0] || 'Full Stack Software Engineer');
  const [experienceLevel, setExperienceLevel] = useState<'student' | 'entry' | 'mid' | 'senior' | 'lead'>(
    profile?.experience_level || 'entry'
  );
  const [educationLevel, setEducationLevel] = useState(
    profile?.education_level || 'B.S. in Computer Science, State University (2024)'
  );
  const [highlights, setHighlights] = useState(
    profile?.career_goals || 'Built end-to-end full stack web applications with responsive design and PostgreSQL integration.'
  );
  const [templateStyle, setTemplateStyle] = useState<'modern' | 'ats_classic' | 'executive' | 'tech_specialist'>('modern');

  // Skills Tag State
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    profile?.preferred_skills?.length
      ? profile.preferred_skills
      : ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'REST APIs']
  );
  const [customSkillInput, setCustomSkillInput] = useState('');

  // Generation & Results State
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedResumeResult | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<'preview' | 'text' | 'markdown' | 'schema'>('preview');

  // Actions State
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills([...selectedSkills, trimmed]);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== skillToRemove));
  };

  const handleCustomSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (customSkillInput.trim()) {
        addSkill(customSkillInput.trim());
        setCustomSkillInput('');
      }
    }
  };

  const handleGenerate = async () => {
    if (selectedSkills.length === 0) {
      setError('Please select or enter at least 2 skills to generate a resume.');
      return;
    }

    try {
      setError(null);
      setGenerating(true);
      setSavedSuccess(false);

      const payload: GenerateResumePayload = {
        fullName,
        email,
        phone,
        location,
        targetRole,
        experienceLevel,
        skills: selectedSkills,
        education: {
          degree: educationLevel,
          institution: 'State University',
          field: 'Computer Science',
          graduationYear: '2024',
        },
        highlights,
        templateStyle,
      };

      const res = await api.generateResumeFromSkills(payload);
      setResult(res.data);
    } catch (err: any) {
      console.error('Failed to generate resume:', err);
      setError(err.message || 'Failed to generate resume with AI. Please check inputs and try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveToWorkspace = async () => {
    if (!result) return;
    try {
      setSaving(true);
      setError(null);

      const safeRole = targetRole.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${fullName.replace(/[^a-zA-Z0-9]/g, '_')}_${safeRole}_Resume.txt`;

      const saved = await api.saveGeneratedResume({
        fileName,
        rawText: result.rawText,
        parsedProfile: result.parsed_profile,
        atsScore: result.ats_score,
      });

      setSavedSuccess(true);
      if (onSavedResume) {
        onSavedResume(saved.resume, saved.analysis);
      }
    } catch (err: any) {
      console.error('Failed to save resume:', err);
      setError(err.message || 'Failed to save generated resume to workspace.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyText = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.rawText);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.rawText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fullName.replace(/\s+/g, '_')}_${targetRole.replace(/\s+/g, '_')}_Resume.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-950 border border-indigo-500/20 shadow-xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Gemini AI Resume Architect</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Skill-Based Resume Generator
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-2 leading-relaxed">
              Synthesize a tailored, ATS-optimized, high-impact resume on the basis of your skills. Uses industry-standard XYZ bullet point framing, verified technical categories, and seamless 1-click import into your CareerPilot workspace.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 via-indigo-600 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Resume...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-sky-300" />
                  <span>Generate Resume from Skills</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Configuration & Skill Picker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Parameters */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Candidate & Role Profile */}
          <Card className="p-6">
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Target Role & Candidate Information</h3>
                <p className="text-[11px] text-slate-400">Position the resume accurately for recruiter screening algorithms</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Candidate Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.rivera@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Target Job Title</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="Full Stack Software Engineer"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="student">Student / Intern (0 yrs)</option>
                  <option value="entry">Entry-Level / Associate (0-2 yrs)</option>
                  <option value="mid">Mid-Level Engineer (2-5 yrs)</option>
                  <option value="senior">Senior Engineer (5-8 yrs)</option>
                  <option value="lead">Lead / Staff Architect (8+ yrs)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Location / Work Style</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Hyderabad, India / Remote"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Education / Degree</label>
                <input
                  type="text"
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  placeholder="B.Tech in Computer Science (2024)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Quick Role Presets */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">Quick Role Select:</span>
              <div className="flex flex-wrap gap-1.5">
                {TARGET_ROLE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTargetRole(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                      targetRole === preset
                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Section 2: Skills Portfolio */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Skills to Feature on Resume</h3>
                  <p className="text-[11px] text-slate-400">Selected skills are integrated into professional summary, technical stack, and bullet points</p>
                </div>
              </div>
              <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/25">
                {selectedSkills.length} Skills Selected
              </span>
            </div>

            {/* Selected Skills Chips */}
            <div className="min-h-[56px] p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap gap-2 items-center mb-5">
              {selectedSkills.length === 0 ? (
                <span className="text-xs text-slate-500 italic">No skills selected yet. Click any skill below or type to add.</span>
              ) : (
                selectedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-200 text-xs font-medium shadow-sm"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="hover:text-rose-400 transition-colors p-0.5 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Custom Skill Input */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                onKeyDown={handleCustomSkillKeyDown}
                placeholder="Type a skill and press Enter (e.g. Next.js, GraphQL, Redis, PyTorch)..."
                className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (customSkillInput.trim()) {
                    addSkill(customSkillInput.trim());
                    setCustomSkillInput('');
                  }
                }}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Popular Skills Presets by Category */}
            <div className="space-y-3.5">
              <span className="text-xs font-bold text-slate-300 block">Click to Add Common Technical Skills:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {POPULAR_SKILL_CATEGORIES.map((cat) => (
                  <div key={cat.name} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-2">{cat.name}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.skills.map((skill) => {
                        const isAdded = selectedSkills.includes(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => (isAdded ? removeSkill(skill) : addSkill(skill))}
                            className={`px-2 py-0.5 rounded text-[11px] transition-all flex items-center gap-1 ${
                              isAdded
                                ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 font-semibold'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                            }`}
                          >
                            <span>{skill}</span>
                            {isAdded && <Check className="w-2.5 h-2.5 text-indigo-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Section 3: Additional Highlights & Project Context */}
          <Card className="p-6">
            <h3 className="text-sm font-bold text-white mb-1">Career Highlights & Key Projects (Optional)</h3>
            <p className="text-[11px] text-slate-400 mb-3">
              Add any specific achievements, open source repos, or context you'd like woven into the resume.
            </p>
            <textarea
              rows={3}
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              placeholder="e.g. Built a real-time analytics dashboard with React and WebSockets; optimized database queries by 30%..."
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
            />
          </Card>
        </div>

        {/* Right Col: Style, Settings & Actions */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-sm font-bold text-white mb-3">Resume Format & Style</h3>
            <div className="space-y-2.5">
              {[
                {
                  id: 'modern',
                  name: 'Modern Tech ATS',
                  desc: 'High-contrast typography, categorized skills block, and impact bullet points',
                },
                {
                  id: 'ats_classic',
                  name: 'Classic ATS Clean',
                  desc: 'Minimalist layout designed for traditional corporate applicant tracking software',
                },
                {
                  id: 'tech_specialist',
                  name: 'Technical Specialist',
                  desc: 'Emphasizes system architecture, core algorithms, and deep framework mastery',
                },
              ].map((style) => (
                <div
                  key={style.id}
                  onClick={() => setTemplateStyle(style.id as any)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    templateStyle === style.id
                      ? 'bg-indigo-600/15 border-indigo-500/40 text-white shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-200">{style.name}</span>
                    {templateStyle === style.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{style.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Tailored Resume...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-sky-300" />
                    <span>Generate Resume with AI</span>
                  </>
                )}
              </button>
            </div>
          </Card>

          {/* Quick Tips */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>ATS Readiness Standards</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Resumes generated here follow the strict Google XYZ bullet point formula and deterministic ATS parsing rubrics. No phantom certifications or misleading metrics are fabricated.
            </p>
          </div>
        </div>
      </div>

      {/* Generated Resume Output Workspace */}
      {result && (
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Top Bar with Score & Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex flex-col items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <span className="text-xl font-black">{result.ats_score}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider">ATS Score</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">Generated Resume Ready</h3>
                  <Badge variant="success" size="sm">Optimized</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tailored for <span className="text-slate-200 font-semibold">{targetRole}</span> • Ready for workspace import & PDF download
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyText}
                className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSuccess ? 'Copied!' : 'Copy Plaintext'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Download .txt</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToWorkspace}
                disabled={saving || savedSuccess}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Saved to My Resumes!</span>
                  </>
                ) : saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save to Workspace</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Key Highlights Banner */}
          {result.key_highlights?.length > 0 && (
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <span className="text-xs font-bold text-indigo-300 block mb-2">Why This Resume Aligns With Recruiters:</span>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-300">
                {result.key_highlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-relaxed">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* View Tabs */}
          <div className="flex border-b border-slate-800 gap-2">
            {[
              { id: 'preview', label: 'Visual Resume Preview', icon: Eye },
              { id: 'text', label: 'ATS Plaintext Format', icon: FileText },
              { id: 'markdown', label: 'Markdown Source', icon: Code2 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveViewTab(tab.id as any)}
                className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                  activeViewTab === tab.id
                    ? 'border-indigo-500 text-indigo-300 bg-indigo-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab 1: Visual Resume Preview */}
          {activeViewTab === 'preview' && (
            <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 shadow-xl max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div className="text-center border-b border-slate-800/80 pb-6">
                <h1 className="text-2xl font-black text-white tracking-tight">{result.parsed_profile?.contact?.name || fullName}</h1>
                <p className="text-xs text-slate-400 mt-1">
                  {result.parsed_profile?.contact?.email || email} • {result.parsed_profile?.contact?.phone || phone} • {result.parsed_profile?.contact?.location || location}
                </p>
                <div className="inline-block mt-3 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-bold border border-indigo-500/20">
                  {targetRole}
                </div>
              </div>

              {/* Summary */}
              <div>
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">Professional Summary</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{result.parsed_profile?.summary}</p>
              </div>

              {/* Technical Skills */}
              <div>
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-3 border-b border-slate-800 pb-1">Technical Skills</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {result.parsed_profile?.skills?.technical && result.parsed_profile.skills.technical.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase block mb-1">Languages & Core</span>
                      <div className="flex flex-wrap gap-1">
                        {result.parsed_profile.skills.technical.map((s) => (
                          <span key={s} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.parsed_profile?.skills?.frameworks && result.parsed_profile.skills.frameworks.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase block mb-1">Frameworks & Libraries</span>
                      <div className="flex flex-wrap gap-1">
                        {result.parsed_profile.skills.frameworks.map((s) => (
                          <span key={s} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.parsed_profile?.skills?.tools && result.parsed_profile.skills.tools.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase block mb-1">Tools & Platforms</span>
                      <div className="flex flex-wrap gap-1">
                        {result.parsed_profile.skills.tools.map((s) => (
                          <span key={s} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.parsed_profile?.skills?.soft && result.parsed_profile.skills.soft.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase block mb-1">Practices & Soft Skills</span>
                      <div className="flex flex-wrap gap-1">
                        {result.parsed_profile.skills.soft.map((s) => (
                          <span key={s} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Work Experience */}
              {result.parsed_profile?.work_experience && result.parsed_profile.work_experience.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-3 border-b border-slate-800 pb-1">Professional Experience</h4>
                  <div className="space-y-4">
                    {result.parsed_profile.work_experience.map((w, idx) => (
                      <div key={idx} className="border-l-2 border-indigo-500/50 pl-3.5 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between">
                          <span className="text-xs font-bold text-white">{w.title}</span>
                          <span className="text-[11px] text-slate-400">{w.duration}</span>
                        </div>
                        <span className="text-[11px] font-medium text-indigo-300 block">{w.company}</span>
                        <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs">
                          {w.bulletPoints?.map((bp, bidx) => (
                            <li key={bidx} className="leading-relaxed">{bp}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Projects */}
              {result.parsed_profile?.projects && result.parsed_profile.projects.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-3 border-b border-slate-800 pb-1">Technical Projects</h4>
                  <div className="space-y-3">
                    {result.parsed_profile.projects.map((p, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                        <span className="text-xs font-bold text-white">{p.name}</span>
                        <p className="text-xs text-slate-300 mt-1">{p.description}</p>
                        {p.technologies && p.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {p.technologies.map((t) => (
                              <span key={t} className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 text-[10px] border border-indigo-800/60">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {result.parsed_profile?.education && result.parsed_profile.education.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">Education</h4>
                  {result.parsed_profile.education.map((edu, idx) => (
                    <div key={idx} className="text-xs">
                      <span className="font-bold text-white">{edu.degree} in {edu.field}</span>
                      <p className="text-slate-400 text-[11px]">{edu.institution} {edu.graduationYear ? `(${edu.graduationYear})` : ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Plaintext View */}
          {activeViewTab === 'text' && (
            <div className="relative">
              <pre className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[600px]">
                {result.rawText}
              </pre>
            </div>
          )}

          {/* Tab 3: Markdown View */}
          {activeViewTab === 'markdown' && (
            <div className="relative">
              <pre className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[600px]">
                {result.formattedMarkdown}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
