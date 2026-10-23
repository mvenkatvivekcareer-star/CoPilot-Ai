import React, { useState, useEffect, useRef } from 'react';
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
  Target,
  TrendingUp,
  Copy,
  Check,
  Lightbulb,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type { Resume, Job, InterviewSession, InterviewQuestion, InterviewFeedback, AnswerAccuracyPrediction } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { ScoreGauge } from '../../components/common/ScoreGauge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';

export const InterviewStudioPage: React.FC = () => {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Speech Recognition refs
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>('');

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

  // Answer Accuracy Prediction State
  const [accuracyPrediction, setAccuracyPrediction] = useState<AnswerAccuracyPrediction | null>(null);
  const [predictingAccuracy, setPredictingAccuracy] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

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

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
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
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    try {
      baseTextRef.current = answerText;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };
      recognition.onerror = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onresult = (event: any) => {
        let sessionTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          sessionTranscript += event.results[i][0].transcript;
        }
        const base = baseTextRef.current.trim();
        const combined = base
          ? `${base} ${sessionTranscript.trim()}`
          : sessionTranscript.trim();
        setAnswerText(combined);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
      recognitionRef.current = null;
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
      setAccuracyPrediction(null);
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

  const handlePredictAccuracy = async () => {
    if (!currentQuestion || !answerText.trim()) {
      setError('Please write or dictate an answer draft first to predict its accuracy.');
      return;
    }

    try {
      setPredictingAccuracy(true);
      setError(null);

      const res = await api.predictAnswerAccuracy({
        questionText: currentQuestion.question_text,
        answerText: answerText.trim(),
        targetRole: activeSession?.target_role || targetRole,
        interviewType: activeSession?.interview_type || interviewType,
        difficulty: activeSession?.difficulty || difficulty,
        targetCompetency: currentQuestion.target_competency,
      });

      setAccuracyPrediction(res.prediction);
    } catch (err: any) {
      setError(err.message || 'Failed to predict answer accuracy.');
    } finally {
      setPredictingAccuracy(false);
    }
  };

  const handleAddKeywordToDraft = (keyword: string) => {
    setAnswerText(prev => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} Specifically regarding ${keyword}, ` : `Regarding ${keyword}, `;
    });
  };

  const handleApplyElevatedSnippet = (snippet: string) => {
    setAnswerText(prev => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n\n${snippet}` : snippet;
    });
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2500);
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
      setAccuracyPrediction(null);

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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Interview Scope & Questions</label>
                <select
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={3}>Top 3 Most Important Questions for Role (Recommended)</option>
                  <option value={5}>5 Questions (Extended Simulation)</option>
                  <option value={7}>7 Questions (Comprehensive Assessment)</option>
                </select>
              </div>
            </div>

            {totalQuestions === 3 && (
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-start gap-3 text-xs">
                <Target className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1 w-full">
                  <div className="font-bold text-indigo-200 flex items-center justify-between">
                    <span>Curated Top 3 High-Impact Questions for {targetRole || 'Your Target Role'}</span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-semibold">Recruiter Priority</span>
                  </div>
                  <div className="text-slate-300 text-[11px] leading-relaxed grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1.5">
                    <span className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                      <strong className="text-indigo-400 block mb-0.5">Q1: Core Architecture</strong>
                      System structure, foundational principles, & technical depth.
                    </span>
                    <span className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                      <strong className="text-sky-400 block mb-0.5">Q2: Production Debugging</strong>
                      Real-world bottlenecks, troubleshooting, & incident trade-offs.
                    </span>
                    <span className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                      <strong className="text-emerald-400 block mb-0.5">Q3: High-Stakes Delivery</strong>
                      STAR scenario handling tight deadlines, leadership, or pushback.
                    </span>
                  </div>
                </div>
              </div>
            )}

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
            {activeSession.total_questions === 3 && (
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                <Target className="w-4 h-4 text-indigo-400" />
                <span>
                  {currentQuestion.question_number === 1 && 'Top 3 Priority #1: Core Architecture & System Foundation'}
                  {currentQuestion.question_number === 2 && 'Top 3 Priority #2: Real-World Production Debugging & Incident Trade-Offs'}
                  {currentQuestion.question_number === 3 && 'Top 3 Priority #3: High-Stakes Leadership, Trade-offs & Delivery (STAR)'}
                </span>
              </div>
            )}

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

            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Draft your answer, then click <strong>Predict Accuracy</strong> to preview recruiter scoring.</span>
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handlePredictAccuracy}
                  disabled={predictingAccuracy || submitting || !answerText.trim()}
                  className="px-4 py-2.5 bg-indigo-500/15 hover:bg-indigo-500/25 active:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 font-bold text-xs rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
                  title="Predict technical accuracy, completeness, and interviewer perception before submitting"
                >
                  {predictingAccuracy ? (
                    <>
                      <LoadingSpinner size="sm" label="" />
                      <span>Predicting Accuracy...</span>
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 text-indigo-400" />
                      <span>Predict Accuracy</span>
                    </>
                  )}
                </button>

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
                      <span>Submit Final Answer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </Card>

          {/* ACCURACY PREDICTION DRAWER */}
          {accuracyPrediction && (
            <Card className="p-6 border-indigo-500/40 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-950 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">Answer Accuracy Prediction</h4>
                      <Badge variant={accuracyPrediction.accuracyScore >= 80 ? 'success' : accuracyPrediction.accuracyScore >= 65 ? 'primary' : 'warning'} size="sm">
                        {accuracyPrediction.accuracyLevel}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Real-time evaluation against top hiring rubrics for {activeSession.target_role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-2xl font-black text-white">
                      {accuracyPrediction.accuracyScore}<span className="text-sm text-indigo-400 font-normal">%</span>
                    </div>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Predicted Accuracy</span>
                  </div>
                </div>
              </div>

              {/* Accuracy Dimension Progress Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400 font-medium">Technical Correctness</span>
                    <span className="font-bold text-sky-400">{accuracyPrediction.technicalAccuracy}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${accuracyPrediction.technicalAccuracy}%` }} />
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400 font-medium">Completeness & Coverage</span>
                    <span className="font-bold text-indigo-400">{accuracyPrediction.completeness}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${accuracyPrediction.completeness}%` }} />
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400 font-medium">Structure & Clarity</span>
                    <span className="font-bold text-emerald-400">{accuracyPrediction.structureClarity}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${accuracyPrediction.structureClarity}%` }} />
                  </div>
                </div>
              </div>

              {/* Interviewer Immediate Perception */}
              <div className="p-3.5 bg-indigo-500/10 rounded-xl border border-indigo-500/25 text-xs mb-4">
                <span className="font-bold text-indigo-300 block mb-1 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5" />
                  Interviewer's Predicted Takeaway:
                </span>
                <p className="text-slate-200 leading-relaxed font-sans">{accuracyPrediction.interviewerPerception}</p>
              </div>

              {/* Strengths & Missing Keywords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="font-bold text-emerald-400 block mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Accurately Covered in Draft:
                  </span>
                  <ul className="space-y-1.5 text-slate-300">
                    {accuracyPrediction.strengthsIdentified?.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="font-bold text-amber-400 block mb-2 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                    Key Concepts to Include (Click to Add):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {accuracyPrediction.missingKeywords?.map((kw, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddKeywordToDraft(kw)}
                        className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1"
                        title="Click to add this concept into your draft"
                      >
                        <span>+ {kw}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Suggestions to Reach 95%+ */}
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs mb-4">
                <span className="font-bold text-sky-400 block mb-1.5 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Recommendations to Reach 95%+ Accuracy:
                </span>
                <ul className="space-y-1 text-slate-300">
                  {accuracyPrediction.improvementSuggestions?.map((sug, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-sky-400 font-bold">{idx + 1}.</span>
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Model Answer Elevated Excerpt */}
              {accuracyPrediction.elevatedAnswerSnippet && (
                <div className="p-3.5 bg-purple-950/20 rounded-xl border border-purple-500/30 text-xs mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      Model High-Accuracy Formulation:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplyElevatedSnippet(accuracyPrediction.elevatedAnswerSnippet!)}
                      className="text-[11px] font-semibold text-purple-300 hover:text-purple-200 flex items-center gap-1"
                    >
                      {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSnippet ? 'Appended to Answer!' : 'Append to My Answer'}</span>
                    </button>
                  </div>
                  <p className="text-slate-300 italic font-sans leading-relaxed">
                    "{accuracyPrediction.elevatedAnswerSnippet}"
                  </p>
                </div>
              )}

              {/* Drawer Bottom Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <span className="text-[11px] text-slate-400">
                  You can edit your draft above and click <strong>Predict Accuracy</strong> again to measure your score increase.
                </span>

                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Final Answer</span>
                </button>
              </div>
            </Card>
          )}

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
