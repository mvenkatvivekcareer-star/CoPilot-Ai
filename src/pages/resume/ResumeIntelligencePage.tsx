import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  TrendingUp,
  X,
  Check,
  Edit2,
  Trash2,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  BarChart3,
  Award,
} from 'lucide-react';
import { api } from '../../lib/api';
import type { Resume, ResumeAnalysis } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { ScoreGauge } from '../../components/common/ScoreGauge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { SkillResumeGenerator } from './SkillResumeGenerator';

export const ResumeIntelligencePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'intelligence' | 'generator'>('intelligence');
  const [generatorSuccessBanner, setGeneratorSuccessBanner] = useState<string | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [pasteMode, setPasteMode] = useState(false);
  const [fileName, setFileName] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  // Manual Profile Correction Modal
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [editProfileData, setEditProfileData] = useState<any>(null);

  const loadResumes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getResumes();
      setResumes(res.resumes);
      if (res.resumes.length > 0) {
        loadResumeDetails(res.resumes[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load resumes.');
    } finally {
      setLoading(false);
    }
  };

  const loadResumeDetails = async (resumeId: string) => {
    try {
      const data = await api.getResume(resumeId);
      setSelectedResume(data.resume);
      setAnalysis(data.analysis || null);
    } catch (err: any) {
      console.error('Failed to load resume details:', err);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let rawText = pastedText;
    let base64Data: string | undefined;
    let name = fileName || 'Uploaded_Resume.pdf';
    let size = 0;
    let mimeType = 'text/plain';

    if (!pasteMode && fileToUpload) {
      if (fileToUpload.size > 10 * 1024 * 1024) {
        setError('File size must be under 10MB.');
        return;
      }
      name = fileToUpload.name;
      size = fileToUpload.size;
      mimeType = fileToUpload.type || 'application/pdf';

      // Read as base64 and text
      try {
        const buffer = await fileToUpload.arrayBuffer();
        base64Data = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        // Try simple text decode
        const dec = new TextDecoder('utf-8', { fatal: false });
        rawText = dec.decode(buffer).replace(/[^\x20-\x7E\n\r\t]/g, ' ');
      } catch (err) {
        console.error('File reading failed', err);
      }
    }

    if (!rawText && !base64Data) {
      setError('Please provide a PDF document or paste your resume content.');
      return;
    }

    try {
      setUploading(true);
      const res = await api.uploadResume({
        fileName: name,
        fileSize: size || rawText.length,
        mimeType,
        rawText,
        base64Data,
      });

      setResumes([res.resume, ...resumes]);
      setSelectedResume(res.resume);
      setAnalysis(res.analysis);
      setPastedText('');
      setFileToUpload(null);
      setFileName('');
    } catch (err: any) {
      setError(err.message || 'Failed to analyze resume.');
    } finally {
      setUploading(false);
    }
  };

  const handleSuggestionStatus = async (suggestionId: string, status: 'accepted' | 'rejected') => {
    if (!selectedResume || !analysis) return;
    try {
      await api.updateSuggestionStatus(selectedResume.id, suggestionId, status);
      setAnalysis({
        ...analysis,
        suggestions: analysis.suggestions.map(s =>
          s.id === suggestionId ? { ...s, status } : s
        ),
      });
    } catch (err: any) {
      console.error('Failed to update suggestion status:', err);
    }
  };

  const handleDeleteResume = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume and its analysis?')) return;
    try {
      await api.deleteResume(id);
      const filtered = resumes.filter(r => r.id !== id);
      setResumes(filtered);
      if (selectedResume?.id === id) {
        if (filtered.length > 0) {
          loadResumeDetails(filtered[0].id);
        } else {
          setSelectedResume(null);
          setAnalysis(null);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete resume.');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner label="Loading resume intelligence database..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Resume Management & Intelligence</h2>
          <p className="text-xs text-slate-400">
            Multi-layer ATS scoring, metric quantifications, and AI skill-based resume generation
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('intelligence')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'intelligence'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Analysis & Intelligence</span>
          </button>

          <button
            onClick={() => setActiveTab('generator')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'generator'
                ? 'bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-300" />
            <span>Generate from Skills</span>
            <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.2 rounded font-bold">
              AI
            </span>
          </button>
        </div>
      </div>

      {generatorSuccessBanner && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{generatorSuccessBanner}</span>
          </div>
          <button onClick={() => setGeneratorSuccessBanner(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* When Generator Tab is Active */}
      {activeTab === 'generator' ? (
        <SkillResumeGenerator
          onSavedResume={(newResume, newAnalysis) => {
            setResumes([newResume, ...resumes.filter(r => r.id !== newResume.id)]);
            setSelectedResume(newResume);
            setAnalysis(newAnalysis);
            setGeneratorSuccessBanner(`Successfully generated and saved "${newResume.file_name}" into your workspace!`);
            setActiveTab('intelligence');
          }}
        />
      ) : (
        <>
          {/* Top Resume Selector & Generate Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-300">Active Resume:</span>
              {resumes.length > 0 ? (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedResume?.id || ''}
                    onChange={(e) => loadResumeDetails(e.target.value)}
                    className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
                  >
                    {resumes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.file_name} ({new Date(r.created_at).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                  {selectedResume && (
                    <button
                      onClick={() => handleDeleteResume(selectedResume.id)}
                      className="p-2 bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-xl transition-colors"
                      title="Delete Resume"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-xs text-slate-500 italic">No resumes uploaded yet</span>
              )}
            </div>

            <button
              onClick={() => setActiveTab('generator')}
              className="px-4 py-2 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Generate New Resume from Skills</span>
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Upload Box (Collapsible / Default) */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Upload New Resume Document</h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setPasteMode(false)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                !pasteMode ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              PDF File
            </button>
            <button
              type="button"
              onClick={() => setPasteMode(true)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                pasteMode ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Paste Text
            </button>
          </div>
        </div>

        <form onSubmit={handleFileUpload} className="space-y-4">
          {!pasteMode ? (
            <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 text-center transition-colors bg-slate-950/40">
              <input
                type="file"
                id="resume-file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files?.[0]) setFileToUpload(e.target.files[0]);
                }}
                className="hidden"
              />
              <label htmlFor="resume-file" className="cursor-pointer flex flex-col items-center">
                <FileText className="w-10 h-10 text-indigo-400/80 mb-2" />
                <span className="text-xs font-semibold text-white">
                  {fileToUpload ? fileToUpload.name : 'Click to select PDF resume file (max 10MB)'}
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Private storage with Row-Level Security isolation
                </span>
              </label>
            </div>
          ) : (
            <div>
              <div className="mb-2">
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Document Title (e.g., Software_Engineer_Resume.pdf)"
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 mb-2"
                />
              </div>
              <textarea
                rows={6}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your complete resume text here (Summary, Work Experience, Education, Technical Skills, Projects)..."
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>We never hallucinate imaginary degrees or credentials</span>
            </span>
            <button
              type="submit"
              disabled={uploading || (!fileToUpload && !pastedText)}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <LoadingSpinner size="sm" label="" />
                  <span>Analyzing Resume Intelligence...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Parse & Analyze Resume</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Card>

      {/* Analysis Presentation */}
      {analysis && selectedResume && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Top ATS Score Breakdown Banner */}
          <Card className="p-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/30">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
              <div className="md:col-span-1 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0 md:pr-4">
                <ScoreGauge score={analysis.ats_score} label="ATS Score" size="md" />
              </div>

              <div className="md:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-400">Clarity</span>
                    <span className="font-bold text-indigo-400">{analysis.score_breakdown.clarity}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full" style={{ width: `${analysis.score_breakdown.clarity}%` }} />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-400">Impact</span>
                    <span className="font-bold text-sky-400">{analysis.score_breakdown.impact}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-sky-400 h-full" style={{ width: `${analysis.score_breakdown.impact}%` }} />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-400">Skills Depth</span>
                    <span className="font-bold text-emerald-400">{analysis.score_breakdown.skillsDepth}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full" style={{ width: `${analysis.score_breakdown.skillsDepth}%` }} />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-400">Structure</span>
                    <span className="font-bold text-purple-400">{analysis.score_breakdown.structure}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-purple-400 h-full" style={{ width: `${analysis.score_breakdown.structure}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Identified Document Strengths</h3>
              </div>
              <ul className="space-y-2.5 text-xs">
                {analysis.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-slate-300 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                    <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Recruiter Vulnerabilities & Gaps</h3>
              </div>
              <ul className="space-y-2.5 text-xs">
                {analysis.weaknesses.map((weak, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-slate-300 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                    <span className="text-amber-400 font-bold shrink-0 mt-0.5">!</span>
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Actionable Line-Item Suggestions with Accept/Reject Diff */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Actionable Phrasing & Impact Suggestions</h3>
                <p className="text-xs text-slate-400">
                  Review side-by-side phrasing optimizations. You control whether to accept or decline changes.
                </p>
              </div>
              <Badge variant="purple" size="sm">
                {analysis.suggestions.length} Suggestions
              </Badge>
            </div>

            <div className="space-y-4">
              {analysis.suggestions.map((sugg) => (
                <div
                  key={sugg.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    sugg.status === 'accepted'
                      ? 'bg-emerald-950/15 border-emerald-500/30'
                      : sugg.status === 'rejected'
                      ? 'bg-slate-950/30 border-slate-800/60 opacity-60'
                      : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="neutral" size="sm">
                      {sugg.section}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSuggestionStatus(sugg.id, 'accepted')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                          sugg.status === 'accepted'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{sugg.status === 'accepted' ? 'Accepted' : 'Accept'}</span>
                      </button>
                      <button
                        onClick={() => handleSuggestionStatus(sugg.id, 'rejected')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                          sugg.status === 'rejected'
                            ? 'bg-rose-500/30 text-rose-300'
                            : 'bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{sugg.status === 'rejected' ? 'Rejected' : 'Decline'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-2">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Original Resume</span>
                      <p className="text-slate-300 leading-relaxed font-mono text-[11px]">{sugg.original}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/25">
                      <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-1">Recommended Alternative</span>
                      <p className="text-indigo-200 leading-relaxed font-mono text-[11px]">{sugg.suggested}</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <span className="font-semibold text-slate-300">Why this matters:</span> {sugg.reason}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Quantified Metrics Advisor */}
          {analysis.quantified_improvements?.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Safe Metric Quantification Guidance</h3>
                  <p className="text-xs text-slate-400">
                    How to insert measurable outcomes without fabricating data
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.quantified_improvements.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                    <Badge variant="primary" size="sm">{q.metricType}</Badge>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Before:</span>
                      <p className="text-slate-400">{q.original}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-sky-400 uppercase font-semibold">Suggested Quantification:</span>
                      <p className="text-sky-200 font-medium">{q.improved}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Structured Profile Inspector */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Extracted Candidate Profile Schema</h3>
                <p className="text-xs text-slate-400">
                  Structured representation extracted from your resume. Used across job matching and mock interviews.
                </p>
              </div>
            </div>

            <div className="space-y-6 text-xs">
              {/* Contact & Education */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
                <div>
                  <h4 className="font-bold text-indigo-300 mb-2 uppercase text-[11px]">Contact Facts</h4>
                  <p className="text-white font-semibold">{analysis.parsed_profile.contact?.name || 'Candidate'}</p>
                  <p className="text-slate-400">{analysis.parsed_profile.contact?.email || 'No email detected'}</p>
                  <p className="text-slate-400">{analysis.parsed_profile.contact?.location || 'Location not specified'}</p>
                </div>
                <div>
                  <h4 className="font-bold text-indigo-300 mb-2 uppercase text-[11px]">Education</h4>
                  {analysis.parsed_profile.education?.map((edu, idx) => (
                    <div key={idx} className="mb-1.5">
                      <p className="text-white font-semibold">{edu.degree} in {edu.field}</p>
                      <p className="text-slate-400">{edu.institution} {edu.graduationYear ? `(${edu.graduationYear})` : ''}</p>
                    </div>
                  )) || <p className="text-slate-400">No education extracted</p>}
                </div>
              </div>

              {/* Skills breakdown */}
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
                <h4 className="font-bold text-sky-400 mb-3 uppercase text-[11px]">Extracted Skills Catalog</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">Languages & Core:</span>
                    <div className="flex flex-wrap gap-1">
                      {analysis.parsed_profile.skills?.technical?.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px]">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">Frameworks:</span>
                    <div className="flex flex-wrap gap-1">
                      {analysis.parsed_profile.skills?.frameworks?.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px]">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">Tools & Infrastructure:</span>
                    <div className="flex flex-wrap gap-1">
                      {analysis.parsed_profile.skills?.tools?.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px]">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Projects & Work Experience */}
              {analysis.parsed_profile.work_experience && analysis.parsed_profile.work_experience.length > 0 && (
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
                  <h4 className="font-bold text-purple-400 mb-3 uppercase text-[11px]">Work Experience</h4>
                  <div className="space-y-4">
                    {analysis.parsed_profile.work_experience.map((w, idx) => (
                      <div key={idx} className="border-l-2 border-purple-500/40 pl-3">
                        <p className="font-bold text-white text-xs">{w.title} • <span className="text-purple-300 font-normal">{w.company}</span></p>
                        <p className="text-[11px] text-slate-500 mb-1">{w.duration}</p>
                        <ul className="list-disc list-inside text-slate-300 space-y-1">
                          {w.bulletPoints?.map((bp, bidx) => (
                            <li key={bidx} className="text-[11px]">{bp}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
      </>
      )}
    </div>
  );
};
