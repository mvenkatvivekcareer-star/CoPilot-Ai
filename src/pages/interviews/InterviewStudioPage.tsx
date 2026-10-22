import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  Volume2,
  Mic,
  MicOff,
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Trophy,
  Award,
  ChevronRight,
  ShieldCheck,
  Play,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type { Resume, Job, InterviewSession, InterviewQuestion, InterviewFeedback } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { ScoreGauge } from '../../components/common/ScoreGauge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';

export const InterviewStudioPage: React.FC = () => {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Setup options
  const [targetRole, setTargetRole] = useState(
    location.state?.targetRole || profile?.target_roles?.[0] || 'Software Engineer'
  );
  const [interviewType, setInterviewType] = useState<'technical' | 'behavioral' | 'hr' | 'mixed'>('technical');
  const [difficulty, setDifficulty] = useState<'entry' | 'mid' | 'senior'>('mid');
  const [totalQuestions, setTotalQuestions] = useState(3);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [resumes, setResumes] = useState<Resume[]>([]);

  // Studio Active State
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [lastFeedback, setLastFeedback] = useState<InterviewFeedback | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedSummary, setCompletedSummary] = useState<InterviewSession | null>(null);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Audio / Speech State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // Load resumes for setup
    api.getResumes().then(res => {
      setResumes(res.resumes);
      if (res.resumes.length > 0) {
        setSelectedResumeId(res.resumes[0].id);
      }
    }).catch(console.error);
  }, []);

  // Text-to-Speech (reads question aloud)
  const speakQuestion = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Speech-to-Text (Browser Web Speech API dictation)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. You can type your response in the text area.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setAnswerText(prev => prev + ' ' + transcript);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole) {
      setError('Please provide a target role.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setIsCompleted(false);
      setCompletedSummary(null);
      setLastFeedback(null);
      setAnswerText('');

      const res = await api.createInterviewSession({
        targetRole,
        interviewType,
        difficulty,
        totalQuestions,
        resumeId: selectedResumeId || undefined,
        jobId: location.state?.jobId || undefined,
      });

      setActiveSession(res.session);
      setCurrentQuestion(res.question);
    } catch (err: any) {
      setError(err.message || 'Failed to start interview.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!activeSession || !currentQuestion || !answerText.trim()) {
      setError('Please provide your response before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await api.submitInterviewAnswer(
        activeSession.id,
        currentQuestion.id,
        answerText.trim()
      );

      setLastFeedback(res.feedback);

      if (res.isCompleted || !res.nextQuestion) {
        // Complete session
        const compRes = await api.completeInterviewSession(
          activeSession.id,
          'Interview completed with high technical fidelity. Competency criteria demonstrated.',
          ['Clear communication', 'Detailed architectural thought process'],
          ['Add more quantified impact metrics', 'Elaborate on edge cases']
        );
        setIsCompleted(true);
        setCompletedSummary(compRes.session);
      } else {
        // Next Question
        setCurrentQuestion(res.nextQuestion);
        setAnswerText('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate answer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">AI Mock Interview Studio</h2>
          <p className="text-xs text-slate-400">
            Adaptive questioning, project interrogation, and instant recruiter-grade STAR feedback
          </p>
        </div>

        <button
          onClick={() => navigate('/app/interviews/history')}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
        >
          <span>View Session History</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SETUP PHASE */}
      {!activeSession && !loading && (
        <Card className="p-6 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Configure Your Practice Session</h3>
              <p className="text-xs text-slate-400">Questions are personalized based on your resume and target role</p>
            </div>
          </div>

          <form onSubmit={handleStartInterview} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Job Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Interview Format</label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="technical">Technical / System Design</option>
                  <option value="behavioral">Behavioral (STAR)</option>
                  <option value="hr">HR / Culture & Leadership</option>
                  <option value="mixed">Mixed Comprehensive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="entry">Entry Level / Graduate</option>
                  <option value="mid">Mid-Level Engineer</option>
                  <option value="senior">Senior / Lead Architect</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Number of Questions</label>
                <select
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={3}>3 Questions (Express Practice)</option>
                  <option value={5}>5 Questions (Standard Simulation)</option>
                  <option value={7}>7 Questions (In-Depth Assessment)</option>
                </select>
              </div>
            </div>

            {resumes.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Link Resume for Context</label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {resumes.map(r => (
                    <option key={r.id} value={r.id}>{r.file_name}</option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  The AI interviewer will ask specific questions about your listed projects and technologies.
                </span>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-indigo-500 via-indigo-600 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white font-bold text-xs rounded-xl shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Begin Adaptive Mock Interview</span>
              </button>
            </div>
          </form>
        </Card>
      )}

      {loading && (
        <div className="py-20 flex justify-center">
          <LoadingSpinner label="AI Interviewer is preparing your personalized interview room..." />
        </div>
      )}

      {/* ACTIVE INTERVIEW ROOM */}
      {activeSession && currentQuestion && !isCompleted && (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
          {/* Session Top Bar */}
          <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-xs">
            <div className="flex items-center gap-3">
              <Badge variant="primary" size="md">
                Question {currentQuestion.question_number} of {activeSession.total_questions}
              </Badge>
              <span className="text-white font-semibold">{activeSession.target_role}</span>
              <span className="text-slate-400 capitalize">({activeSession.interview_type})</span>
            </div>

            <button
              onClick={() => {
                if (confirm('End this session? Unsaved responses will not be evaluated.')) {
                  setActiveSession(null);
                  setCurrentQuestion(null);
                }
              }}
              className="text-slate-400 hover:text-rose-400 transition-colors"
            >
              Exit Session
            </button>
          </div>

          {/* Question Card */}
          <Card className="p-6 md:p-8 bg-gradient-to-b from-slate-900 to-slate-950 border-indigo-500/20">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Interviewer Prompt</span>
              </div>

              {/* TTS Audio Button */}
              <button
                type="button"
                onClick={() => speakQuestion(currentQuestion.question_text)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
                title="Read question aloud"
              >
                <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-indigo-400 animate-pulse' : ''}`} />
                <span>{isSpeaking ? 'Playing Audio...' : 'Listen'}</span>
              </button>
            </div>

            <h3 className="text-lg md:text-xl font-bold text-white leading-relaxed mb-4">
              {currentQuestion.question_text}
            </h3>

            {currentQuestion.context_clue && (
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-400">
                <span className="text-slate-300 font-semibold">Interviewer Focus: </span>
                {currentQuestion.context_clue}
              </div>
            )}
          </Card>

          {/* Answer Input Area */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Your Answer (Text & Voice Supported)
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isListening ? 'Stop Mic' : 'Voice Dictation'}</span>
                </button>

                <span className="text-[11px] text-slate-400">
                  {answerText.length} characters
                </span>
              </div>
            </div>

            <textarea
              rows={8}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Structure your answer clearly. For technical questions, mention trade-offs and architectural decisions. For behavioral questions, use the STAR format (Situation, Task, Action, Result)..."
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs md:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
            />

            <div className="mt-4 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Evaluated across technical accuracy, completeness, clarity & structure
              </span>

              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={submitting || !answerText.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" label="" />
                    <span>Evaluating Response...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Answer</span>
                  </>
                )}
              </button>
            </div>
          </Card>

          {/* Immediate Question Feedback Drawer */}
          {lastFeedback && (
            <Card className="p-6 border-indigo-500/30 bg-indigo-950/10 animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-400" />
                  <h4 className="text-sm font-bold text-white">Previous Question Feedback</h4>
                </div>
                <Badge variant="primary" size="md">
                  Score: {lastFeedback.score}/100
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                  <span className="font-bold text-emerald-400 block mb-1">What Went Well:</span>
                  <p className="text-slate-300 leading-relaxed">{lastFeedback.what_went_well}</p>
                </div>
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                  <span className="font-bold text-amber-400 block mb-1">What to Improve:</span>
                  <p className="text-slate-300 leading-relaxed">{lastFeedback.what_to_improve}</p>
                </div>
              </div>

              {lastFeedback.suggested_approach && (
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs">
                  <span className="font-bold text-sky-400 block mb-1">High-Scoring Model Approach:</span>
                  <p className="text-slate-300 leading-relaxed font-sans">{lastFeedback.suggested_approach}</p>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* FINAL COMPLETED SESSION SCREEN */}
      {isCompleted && completedSummary && (
        <Card className="p-8 max-w-3xl mx-auto text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Session Complete</span>
            <h3 className="text-2xl font-extrabold text-white mt-1">Mock Interview Performance Review</h3>
            <p className="text-xs text-slate-400 mt-1">{completedSummary.target_role} • {completedSummary.interview_type}</p>
          </div>

          <div className="flex justify-center my-6">
            <ScoreGauge score={completedSummary.overall_score || 80} label="Overall Score" size="lg" />
          </div>

          <div className="text-left bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <div>
              <span className="font-bold text-white uppercase text-[11px] tracking-wide block mb-1">Summary Articulation:</span>
              <p className="text-slate-300 leading-relaxed">{completedSummary.summary}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div>
                <span className="font-bold text-emerald-400 block mb-1.5">Demonstrated Strengths:</span>
                <ul className="list-disc list-inside text-slate-300 space-y-1">
                  {completedSummary.strengths?.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-bold text-amber-400 block mb-1.5">Target Growth Areas:</span>
                <ul className="list-disc list-inside text-slate-300 space-y-1">
                  {completedSummary.areas_to_improve?.map((a, idx) => (
                    <li key={idx}>{a}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => {
                setActiveSession(null);
                setCurrentQuestion(null);
                setIsCompleted(false);
              }}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Practice Another Session</span>
            </button>

            <button
              onClick={() => navigate('/app/skill-gaps')}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Review Relevant Skill Gaps</span>
            </button>

            <button
              onClick={() => navigate('/app/interviews/history')}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg flex items-center gap-2"
            >
              <span>View Full Historical Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </Card>
      )}
    </div>
  );
};
