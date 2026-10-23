import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Dynamic Page Title
  const getPageMeta = () => {
    const path = location.pathname;
    if (path.includes('/app/dashboard')) {
      return { title: 'Executive Readiness Dashboard', subtitle: 'Continuous tracking across resumes, job matches & adaptive interviews' };
    }
    if (path.includes('/app/resume')) {
      return { title: 'Resume Intelligence & ATS Optimization', subtitle: 'Multi-layer document parsing, metric quantifications & actionable suggestions' };
    }
    if (path.includes('/app/job-matching')) {
      return { title: 'Explainable Job Matching Engine', subtitle: 'Deterministic skill verification, transparent weighting & unevidenced gap detection' };
    }
    if (path.includes('/app/skill-gaps')) {
      return { title: 'Personalized Skill-Gap Coach', subtitle: 'Targeted milestones, verifiable micro-projects & progression tracking' };
    }
    if (path.includes('/app/interviews/history')) {
      return { title: 'Mock Interview History & Performance', subtitle: 'Competency evaluations, historical trends and STAR response reviews' };
    }
    if (path.includes('/app/interviews')) {
      return { title: 'AI Mock Interview Studio', subtitle: 'Adaptive questioning, real-time rubric feedback and personalized follow-ups' };
    }
    if (path.includes('/app/settings')) {
      return { title: 'Account Settings & Data Privacy', subtitle: 'Profile preferences, secure database synchronization and privacy controls' };
    }
    return { title: 'CareerPilot AI', subtitle: 'Adaptive Recruitment Readiness Platform' };
  };

  const meta = getPageMeta();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Persistent / Responsive Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title={meta.title}
          subtitle={meta.subtitle}
        />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
