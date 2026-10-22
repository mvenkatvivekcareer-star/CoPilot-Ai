import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Compass,
  TrendingUp,
  CheckCircle2,
  Clock,
  Target,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sliders,
  Layers,
  Award,
  RefreshCw,
  Plus,
  BarChart3,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const PRESET_SCENARIOS = [
  { id: 'sc-1', title: 'Master Advanced System Design & Microservices', category: 'Architecture', impact: 'High' },
  { id: 'sc-2', title: 'Complete Cloud Architecture & DevOps Certification', category: 'Cloud/DevOps', impact: 'High' },
  { id: 'sc-3', title: 'Build Full-Stack Production Capstone Project', category: 'Portfolio', impact: 'Critical' },
  { id: 'sc-4', title: 'Open Source Contribution & Code Reviews', category: 'Community', impact: 'Medium' },
  { id: 'sc-5', title: 'Advanced Automated Testing & CI/CD Pipelines', category: 'Engineering Practice', impact: 'High' },
];

export const CareerDigitalTwinPage: React.FC = () => {
  const { profile } = useAuth();
  const [targetRole, setTargetRole] = useState(profile?.target_roles?.[0] || 'Senior Full Stack Engineer');
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([
    'Master Advanced System Design & Microservices',
    'Build Full-Stack Production Capstone Project',
  ]);
  const [customScenario, setCustomScenario] = useState('');
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulationData, setSimulationData] = useState<any>(null);

  const runSimulation = async (scenariosToRun = selectedScenarios) => {
    try {
      setSimulating(true);
      setError(null);
      const res = await api.simulateCareerTwin(targetRole, scenariosToRun);
      setSimulationData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to execute Career Digital Twin simulation.');
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, []);

  const handleToggleScenario = (title: string) => {
    if (selectedScenarios.includes(title)) {
      setSelectedScenarios(selectedScenarios.filter(s => s !== title));
    } else {
      setSelectedScenarios([...selectedScenarios, title]);
    }
  };

  const handleAddCustomScenario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customScenario.trim()) return;
    const newScen = customScenario.trim();
    if (!selectedScenarios.includes(newScen)) {
      setSelectedScenarios([...selectedScenarios, newScen]);
    }
    setCustomScenario('');
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Digital Twin AI
            </span>
            <span className="text-xs font-medium text-slate-400">Interactive Career Simulator</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Compass className="w-7 h-7 text-indigo-400 animate-pulse" />
            Career Digital Twin & What-If Simulator
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Simulate your career trajectory in real-time. Test skill investments, project completions, and role switches to visualize your readiness delta and roadmap.
          </p>
        </div>
        <button
          onClick={() => runSimulation()}
          disabled={simulating}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50"
        >
          {simulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>Re-Run Simulation</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
          <span>{error}</span>
        </div>
      )}

      {/* Target Role & Scenario Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-slate-900/60 border-slate-800/80 p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Target Career Role
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="e.g. Principal AI Engineer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Select "What If?" Scenarios
            </label>
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {PRESET_SCENARIOS.map((sc) => {
                const isSelected = selectedScenarios.includes(sc.title);
                return (
                  <div
                    key={sc.id}
                    onClick={() => handleToggleScenario(sc.title)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500/50 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{sc.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300">{sc.category}</span>
                        <span className="text-emerald-400 font-medium">Impact: {sc.impact}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleAddCustomScenario} className="space-y-2 pt-2 border-t border-slate-800/80">
            <label className="block text-xs font-semibold text-slate-300">Add Custom Scenario</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customScenario}
                onChange={(e) => setCustomScenario(e.target.value)}
                placeholder="e.g. Master Rust for Systems"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>

          <button
            onClick={() => runSimulation()}
            disabled={simulating}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {simulating ? <LoadingSpinner size="sm" /> : <Zap className="w-4 h-4" />}
            <span>Simulate Digital Twin Impact</span>
          </button>
        </Card>

        {/* Simulation Results & Comparisons */}
        <div className="lg:col-span-2 space-y-6">
          {simulating && !simulationData ? (
            <Card className="bg-slate-900/60 border-slate-800/80 p-16 flex flex-col items-center justify-center text-center">
              <LoadingSpinner size="lg" label="Running Digital Twin trajectory simulation..." />
            </Card>
          ) : simulationData ? (
            <>
              {/* Score Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-slate-900/60 border-slate-800/80 p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
                  <p className="text-xs font-medium text-slate-400">Career Readiness Score</p>
                  <div className="flex items-baseline gap-3 mt-2">
                    <span className="text-3xl font-extrabold text-white">{simulationData.simulated_readiness_score}%</span>
                    <span className="text-xs font-bold text-emerald-400 flex items-center bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +{simulationData.readiness_delta}% delta
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Baseline was {simulationData.current_readiness_score}% before scenario execution.
                  </p>
                </Card>

                <Card className="bg-slate-900/60 border-slate-800/80 p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />
                  <p className="text-xs font-medium text-slate-400">Target Role Skill Match</p>
                  <div className="flex items-baseline gap-3 mt-2">
                    <span className="text-3xl font-extrabold text-white">{simulationData.simulated_skill_match}%</span>
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      Optimized
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    {simulationData.skill_gaps_resolved?.length || 3} major skill gaps resolved.
                  </p>
                </Card>

                <Card className="bg-slate-900/60 border-slate-800/80 p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl" />
                  <p className="text-xs font-medium text-slate-400">Time-to-Job-Ready</p>
                  <div className="flex items-baseline gap-3 mt-2">
                    <span className="text-3xl font-extrabold text-white">{simulationData.simulated_timeline_months} mos</span>
                    <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      Fast-tracked
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Reduced from {simulationData.current_timeline_months} months baseline.
                  </p>
                </Card>
              </div>

              {/* Impact Analysis & Salary Potential */}
              <Card className="bg-slate-900/60 border-slate-800/80 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    AI Digital Twin Trajectory Analysis
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {simulationData.projected_salary_boost}
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {simulationData.impact_analysis}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Resolved Skill Gaps
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {simulationData.skill_gaps_resolved?.map((gap: string, idx: number) => (
                        <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-200 border border-emerald-500/20">
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> Remaining Skill Gaps
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {simulationData.remaining_skill_gaps?.map((gap: string, idx: number) => (
                        <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-200 border border-amber-500/20">
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Scenario Recommendations & Roadmap */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-900/60 border-slate-800/80 p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-400" />
                    Recommended Milestones
                  </h3>
                  <div className="space-y-3">
                    {simulationData.scenario_recommendations?.map((rec: any, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{rec.title}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                            {rec.timeline}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="bg-slate-900/60 border-slate-800/80 p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    Actionable Roadmap Adjustments
                  </h3>
                  <div className="space-y-3">
                    {simulationData.roadmap_adjustments?.map((step: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <div className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-500/30">
                          {step.step || idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{step.title}</span>
                            <span className="text-[10px] font-medium text-emerald-400">{step.status}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
