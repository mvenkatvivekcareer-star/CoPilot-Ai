import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Bot,
  Award,
  ChevronRight,
  Play,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { api } from '../../lib/api';
import type { InterviewSession, InterviewQuestion, InterviewFeedback } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';

export const InterviewHistoryPage: React.FC = () => {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drill-down session detail modal
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getInterviewSessions();
      setSessions(res.sessions);
    } catch (err: any) {
      setError(err.message || 'Failed to load interview history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const openSessionDetail = async (id: string) => {
    try {
      setSelectedSessionId(id);
      setDetailLoading(true);
      const data = await api.getInterviewSession(id);
      setSessionDetail(data.session);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner label="Loading interview session history..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Interview History & Reviews</h2>
          <p className="text-xs text-slate-400">
            Inspect past answers, recruiter STAR rubric evaluations, and score trends
          </p>
        </div>

        <button
          onClick={() => navigate('/app/interviews')}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Launch New Interview</span>
        </button>
      </div>

      {sessions.length > 0 ? (
        <div className="space-y-4">
          {sessions.map(s => (
            <Card
              key={s.id}
              hoverEffect
              onClick={() => openSessionDetail(s.id)}
              className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center justify-center text-indigo-400 font-extrabold text-sm shrink-0">
                  <span>{s.overall_score ? `${Math.round(s.overall_score)}%` : '—'}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white">{s.target_role}</h3>
                    <Badge variant={s.status === 'completed' ? 'success' : 'warning'} size="sm">
                      {s.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-3">
                    <span className="capitalize">{s.interview_type} • {s.difficulty} difficulty</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(s.created_at).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-indigo-400 font-semibold self-end sm:self-center">
                <span>View Full Review</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border-dashed border-slate-800">
          <History className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No completed interviews yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Practice adaptive mock interviews to generate detailed response evaluations and competency trends.
          </p>
          <button
            onClick={() => navigate('/app/interviews')}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
          >
            Start Your First Practice Session
          </button>
        </Card>
      )}

      {/* Drill-Down Review Modal */}
      <Modal
        isOpen={Boolean(selectedSessionId)}
        onClose={() => {
          setSelectedSessionId(null);
          setSessionDetail(null);
        }}
        title="Interview Session Review"
        maxWidth="2xl"
      >
        {detailLoading || !sessionDetail ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner label="Loading session Q&A review..." />
          </div>
        ) : (
          <div className="space-y-6 text-xs animate-in fade-in duration-200">
            {/* Header info */}
            <div className="flex items-center justify-between p-4 bg-slate-950/70 rounded-2xl border border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white">{sessionDetail.target_role}</h4>
                <p className="text-slate-400 capitalize">{sessionDetail.interview_type} • {sessionDetail.difficulty} level</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Score</span>
                <span className="text-xl font-extrabold text-emerald-400">{sessionDetail.overall_score}%</span>
              </div>
            </div>

            {sessionDetail.summary && (
              <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl">
                <span className="text-[11px] font-bold text-indigo-300 block mb-1">Recruiter Evaluation:</span>
                <p className="text-slate-300 leading-relaxed">{sessionDetail.summary}</p>
              </div>
            )}

            {/* Questions and candidate answers */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Question & Response Log ({sessionDetail.questions?.length || 0})
              </h4>

              {sessionDetail.questions?.map((q: InterviewQuestion, idx: number) => {
                const ans = sessionDetail.answers?.find((a: any) => a.question_id === q.id);
                const fb = sessionDetail.feedback?.find((f: any) => f.session_id === sessionDetail.id && f.answer_id === ans?.id) ||
                  sessionDetail.feedback?.[idx];

                return (
                  <div key={q.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase">Question {q.question_number}</span>
                        <p className="font-bold text-white text-xs mt-0.5">{q.question_text}</p>
                      </div>
                      {fb && (
                        <Badge variant="primary" size="sm">
                          {fb.score}/100
                        </Badge>
                      )}
                    </div>

                    {ans ? (
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold mb-1">Your Response:</span>
                        <p className="text-slate-300 leading-relaxed font-sans">{ans.answer_text}</p>
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">No answer submitted</p>
                    )}

                    {fb && (
                      <div className="space-y-2 pt-2 border-t border-slate-800/80 text-[11px]">
                        <p className="text-emerald-300">
                          <span className="font-semibold text-emerald-400">Strengths:</span> {fb.what_went_well}
                        </p>
                        <p className="text-amber-300">
                          <span className="font-semibold text-amber-400">To Improve:</span> {fb.what_to_improve}
                        </p>
                        {fb.suggested_approach && (
                          <div className="p-2.5 bg-indigo-950/20 border border-indigo-500/20 rounded-lg text-slate-300">
                            <span className="font-semibold text-indigo-300 block mb-0.5">Model Answer Framework:</span>
                            <span>{fb.suggested_approach}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
