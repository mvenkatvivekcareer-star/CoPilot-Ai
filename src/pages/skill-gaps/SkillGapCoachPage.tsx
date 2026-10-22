import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Circle,
  Plus,
  Trash2,
  Edit2,
  ArrowRight,
  BookOpen,
  Code2,
  Award,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { api } from '../../lib/api';
import type { SkillGoal } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';

export const SkillGapCoachPage: React.FC = () => {
  const [goals, setGoals] = useState<SkillGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Goal Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('high');
  const [whyMatters, setWhyMatters] = useState('');
  const [learningObjective, setLearningObjective] = useState('');
  const [recommendedExercise, setRecommendedExercise] = useState('');

  const loadGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSkillGoals();
      setGoals(res.goals);
    } catch (err: any) {
      setError(err.message || 'Failed to load skill goals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'not_started' | 'in_progress' | 'completed') => {
    try {
      const res = await api.updateSkillGoal(id, { status });
      setGoals(goals.map(g => (g.id === id ? res.goal : g)));
    } catch (err: any) {
      setError(err.message || 'Failed to update goal status.');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await api.deleteSkillGoal(id);
      setGoals(goals.filter(g => g.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete goal.');
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName || !learningObjective) {
      setError('Skill name and learning objective are required.');
      return;
    }

    try {
      const res = await api.createSkillGoal({
        skill_name: skillName,
        priority,
        why_matters: whyMatters || 'Essential competency for target engineering positions.',
        candidate_evidence: 'Self-directed milestone',
        learning_objective: learningObjective,
        recommended_exercise: recommendedExercise || 'Build a verifiable mini module demonstrating this capability.',
      });
      setGoals([...goals, res.goal]);
      setModalOpen(false);
      setSkillName('');
      setWhyMatters('');
      setLearningObjective('');
      setRecommendedExercise('');
    } catch (err: any) {
      setError(err.message || 'Failed to create skill goal.');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner label="Loading personalized skill-gap roadmaps..." />
      </div>
    );
  }

  const completedCount = goals.filter(g => g.status === 'completed').length;
  const inProgressCount = goals.filter(g => g.status === 'in_progress').length;
  const progressPct = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Personalized Skill-Gap Coach</h2>
          <p className="text-xs text-slate-400">
            Actionable learning objectives and verifiable micro-projects tailored to your target roles
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Learning Goal</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Progress Overview Card */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-purple-950/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Roadmap Progress</span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              {completedCount} of {goals.length} Goals Mastered ({progressPct}%)
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Circle className="w-3.5 h-3.5 text-slate-500" />
              <span>{goals.length - completedCount - inProgressCount} Not Started</span>
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{inProgressCount} In Progress</span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{completedCount} Completed</span>
            </span>
          </div>
        </div>

        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </Card>

      {/* Goals List */}
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal, idx) => (
            <Card
              key={goal.id}
              className={`p-6 transition-all ${
                goal.status === 'completed'
                  ? 'border-emerald-500/25 bg-emerald-950/5'
                  : goal.status === 'in_progress'
                  ? 'border-indigo-500/30 bg-slate-900'
                  : 'bg-slate-900/80'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-500">#{idx + 1}</span>
                  <h3 className="text-base font-bold text-white tracking-tight">{goal.skill_name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      goal.priority === 'critical'
                        ? 'danger'
                        : goal.priority === 'high'
                        ? 'warning'
                        : 'primary'
                    }
                    size="sm"
                  >
                    {goal.priority}
                  </Badge>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                    title="Delete Goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Status Picker */}
              <div className="flex items-center gap-1.5 mb-4 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                {(['not_started', 'in_progress', 'completed'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(goal.id, st)}
                    className={`flex-1 py-1 px-2 rounded-lg font-medium text-[11px] capitalize transition-colors ${
                      goal.status === st
                        ? st === 'completed'
                          ? 'bg-emerald-500 text-white font-bold'
                          : st === 'in_progress'
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Details */}
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase text-indigo-400 block mb-1 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    Concrete Learning Objective
                  </span>
                  <p className="text-slate-200 leading-relaxed font-medium">{goal.learning_objective}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase text-sky-400 block mb-1 flex items-center gap-1">
                    <Code2 className="w-3.5 h-3.5" />
                    Practical Micro-Project / Exercise
                  </span>
                  <p className="text-slate-300 leading-relaxed">{goal.recommended_exercise}</p>
                </div>

                <div className="pt-2 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Why recruiters evaluate this:</span> {goal.why_matters}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border-dashed border-slate-800">
          <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No skill roadmaps generated yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Compare your resume against a target job description in the Job Matching module to auto-generate personalized goals, or add custom goals manually.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
          >
            Create Your First Learning Goal
          </button>
        </Card>
      )}

      {/* Add Custom Goal Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Custom Skill Objective"
        maxWidth="md"
      >
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Skill Name</label>
            <input
              type="text"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="e.g. Distributed Caching with Redis"
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Priority Level</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="critical">Critical (Blocking Core Requirements)</option>
              <option value="high">High (Strong Market Standard)</option>
              <option value="medium">Medium (Valuable Differentiator)</option>
              <option value="low">Low (Bonus Competency)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Why this Skill Matters</label>
            <input
              type="text"
              value={whyMatters}
              onChange={(e) => setWhyMatters(e.target.value)}
              placeholder="e.g. Used for high-traffic session storage and query caching in modern backends."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Concrete Learning Objective</label>
            <textarea
              rows={2}
              value={learningObjective}
              onChange={(e) => setLearningObjective(e.target.value)}
              placeholder="e.g. Master cache-aside and write-through caching patterns in Node.js/TypeScript."
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Practical Hands-On Exercise / Project</label>
            <textarea
              rows={2}
              value={recommendedExercise}
              onChange={(e) => setRecommendedExercise(e.target.value)}
              placeholder="e.g. Implement a Redis cache layer for the users endpoints with 60-second TTL invalidation."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              Save Goal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
