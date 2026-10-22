import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Target,
  Sparkles,
  Bot,
  History,
  Settings,
  ChevronRight,
  Compass,
  Database,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
    { name: 'Resume Intelligence', path: '/app/resume', icon: FileText, badge: 'ATS AI' },
    { name: 'Career Digital Twin', path: '/app/career-twin', icon: Activity, badge: 'Twin AI' },
    { name: 'Job Matching', path: '/app/job-matching', icon: Target },
    { name: 'Skill-Gap Coach', path: '/app/skill-gaps', icon: Sparkles },
    { name: 'Mock Interview Studio', path: '/app/interviews', icon: Bot, badge: 'Adaptive' },
    { name: 'Interview History', path: '/app/interviews/history', icon: History },
    { name: 'Supabase Data', path: '/app/supabase', icon: Database, badge: 'Live' },
    { name: 'Profile & Settings', path: '/app/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80 bg-slate-950/50">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white tracking-tight text-base">CareerPilot</span>
              <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">AI</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">Recruitment Readiness</p>
          </div>
        </div>

        {/* User Mini Bar */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-md">
            {profile?.full_name?.charAt(0).toUpperCase() || 'C'}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-semibold text-white truncate">{profile?.full_name || 'Candidate'}</p>
            <p className="text-[11px] text-slate-400 truncate">{profile?.current_role || 'Job Seeker'}</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-200 border border-indigo-500/30 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Readiness Meter Footer */}
        <div className="p-4 m-3 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-300">Career Readiness</span>
            <span className="text-xs font-extrabold text-indigo-400">{profile?.readiness_score || 35}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-sky-400 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(10, profile?.readiness_score || 35))}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            Complete mock interviews & resolve skill gaps to reach 85%+ readiness.
          </p>
        </div>
      </aside>
    </>
  );
};
