import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  FileText,
  Target,
  Sparkles,
  Bot,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Layers,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ScoreGauge } from '../components/common/ScoreGauge';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = React.useState(false);
  const [demoError, setDemoError] = React.useState<string | null>(null);

  const handleDemo = async () => {
    if (demoLoading) return;
    try {
      setDemoError(null);
      setDemoLoading(true);
      await demoLogin();
      navigate('/app/dashboard');
    } catch (err: any) {
      console.error('Demo login error:', err);
      setDemoError(err.message || 'Failed to start demo workspace. Please try again.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navbar */}
      <header className="h-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-white tracking-tight">CareerPilot</span>
                <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">AI</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Recruitment Readiness</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDemo}
              disabled={demoLoading}
              className="px-4 py-2 text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-60"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{demoLoading ? 'Starting Workspace...' : 'Explore Live Demo'}</span>
            </button>

            {isAuthenticated ? (
              <Link
                to="/app/dashboard"
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-1.5"
              >
                Go to Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-all hidden sm:block"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Glow backdrop decoration */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-indigo-600/20 via-sky-500/15 to-purple-600/10 blur-[130px] pointer-events-none -z-10 rounded-full" />

        <div className="text-center max-w-3xl mx-auto">
          {demoError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {demoError}
            </div>
          )}

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>The Continuous Career Readiness Loop</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] mb-6">
            Adaptive Career Intelligence for <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">Modern Candidates</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto">
            Bridge the gap between your resume and high-demand roles. Powered by explainable ATS analysis, transparent job requirement matching, personalised skill roadmaps, and adaptive AI mock interviews.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleDemo}
              disabled={demoLoading}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white font-bold text-sm rounded-xl shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              <span>{demoLoading ? 'Starting Interactive Workspace...' : 'Instant Interactive Demo'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              to="/register"
              className="w-full sm:w-auto px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm rounded-xl border border-slate-800 transition-all flex items-center justify-center gap-2"
            >
              Create Free Account
            </Link>
          </div>

          <p className="text-xs text-slate-500 mt-4 flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Private Document Storage • Explainable Deterministic Formulas • No Fake Metrics</span>
          </p>
        </div>

        {/* Continuous Improvement Flow Diagram */}
        <div className="mt-20 p-6 md:p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">End-to-End Recruitment Architecture</span>
            <h2 className="text-xl md:text-2xl font-bold text-white mt-1">The Closed-Loop Readiness Engine</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-indigo-400 uppercase">Phase 1</span>
              <h3 className="text-sm font-bold text-white mt-1">Resume Intelligence</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Extracts structured facts, flags passive statements, suggests quantifiable impact without fabrication.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-3">
                <Target className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-sky-400 uppercase">Phase 2</span>
              <h3 className="text-sm font-bold text-white mt-1">Explainable Matching</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Transparent deterministic score formula based on required, preferred, and evidenced competencies.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-purple-400 uppercase">Phase 3</span>
              <h3 className="text-sm font-bold text-white mt-1">Skill-Gap Coach</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Converts non-evidenced job skills into prioritized micro-projects, objectives, and milestone tracking.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <Bot className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase">Phase 4</span>
              <h3 className="text-sm font-bold text-white mt-1">Adaptive Mock Studio</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Interrogates candidate on actual resume projects. Adapts follow-ups and scores answers with STAR feedback.
              </p>
            </div>

            {/* Step 5 */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-amber-400 uppercase">Phase 5</span>
              <h3 className="text-sm font-bold text-white mt-1">Readiness Dashboard</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Aggregates candidate metrics into a single verified readiness index reflecting real persisted accomplishments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-20 border-t border-slate-800/80 bg-slate-900/30 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Built for Transparency, Safety & Real Outcomes
            </h2>
            <p className="text-sm text-slate-400 mt-3">
              Unlike generic chatbot wrappers, CareerPilot AI enforces strict verification standards so you never deceive recruiters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Deterministic Match Formula</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                We never ask an LLM to guess an arbitrary match percentage. Our explainable engine weights: (Required Skills × 55%) + (Preferred Skills × 20%) + (Experience Alignment × 25%).
              </p>
              <div className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 p-2.5 rounded-lg border border-indigo-500/20">
                Score = Σ(W_i * Evidence_i)
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Zero-Hallucination Integrity</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                CareerPilot AI never invents degrees, companies, GPA, or imaginary credentials. When suggesting bullet improvements, it provides templates for genuine metrics that you verify.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Strict recruiter compliance</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Adaptive Mock Studio</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Dynamic follow-up questions tailored to your past answers. Includes STAR method behavioural feedback, technical rubric scoring, and optional text-to-speech voice playback.
              </p>
              <div className="flex items-center gap-2 text-xs text-purple-300 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Real-time answer rubric</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">CareerPilot AI</p>
              <p className="text-xs text-slate-400">Adaptive Career Intelligence & Recruitment Readiness Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleDemo}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Interactive Demo
            </button>
            <Link to="/login" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
