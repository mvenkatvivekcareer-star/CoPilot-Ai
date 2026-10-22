import React, { useState } from 'react';
import {
  Settings,
  User,
  Shield,
  Database,
  Key,
  Check,
  Copy,
  ExternalLink,
  Trash2,
  Download,
  AlertTriangle,
  Server,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export const SettingsPage: React.FC = () => {
  const { profile, user, updateProfile, logout } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [educationLevel, setEducationLevel] = useState(profile?.education_level || '');
  const [currentRole, setCurrentRole] = useState(profile?.current_role || '');
  const [experienceLevel, setExperienceLevel] = useState(profile?.experience_level || 'entry');
  const [targetRoles, setTargetRoles] = useState(profile?.target_roles?.join(', ') || '');
  const [preferredSkills, setPreferredSkills] = useState(profile?.preferred_skills?.join(', ') || '');
  const [careerGoals, setCareerGoals] = useState(profile?.career_goals || '');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedMigration, setCopiedMigration] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await updateProfile({
        full_name: fullName,
        education_level: educationLevel,
        current_role: currentRole,
        experience_level: experienceLevel as any,
        target_roles: targetRoles.split(',').map(r => r.trim()).filter(Boolean),
        preferred_skills: preferredSkills.split(',').map(s => s.trim()).filter(Boolean),
        career_goals: careerGoals,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const copyMigrationPath = () => {
    navigator.clipboard.writeText('/supabase/migrations/20261012000000_careerpilot_schema.sql');
    setCopiedMigration(true);
    setTimeout(() => setCopiedMigration(false), 2500);
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
      JSON.stringify({ user, profile, exportDate: new Date().toISOString() }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `careerpilot_export_${user?.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Account & Infrastructure Settings</h2>
        <p className="text-xs text-slate-400">
          Configure your career profile, review Supabase RLS security policies, and manage account data
        </p>
      </div>

      {/* Career Profile Edit Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
          <User className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Career Profile & Preferences</h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Account Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800/60 rounded-xl text-xs text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Education / Degree</label>
              <input
                type="text"
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Current Role</label>
              <input
                type="text"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Roles (Comma-separated)</label>
            <input
              type="text"
              value={targetRoles}
              onChange={(e) => setTargetRoles(e.target.value)}
              placeholder="e.g. Full Stack Engineer, Backend Developer"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Preferred Skills (Comma-separated)</label>
            <input
              type="text"
              value={preferredSkills}
              onChange={(e) => setPreferredSkills(e.target.value)}
              placeholder="e.g. TypeScript, React, PostgreSQL, Docker"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Career Goals & Vision</label>
            <textarea
              rows={2}
              value={careerGoals}
              onChange={(e) => setCareerGoals(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {saveSuccess && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> Profile preferences saved!
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </div>
        </form>
      </Card>

      {/* Supabase & Database Architecture Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">Database & Row Level Security (RLS)</h3>
          </div>
          <Badge variant="success">RLS Enforced</Badge>
        </div>

        <div className="space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            The platform is architected with strict Row Level Security. Every table (<code className="text-indigo-300">resumes</code>, <code className="text-indigo-300">resume_analyses</code>, <code className="text-indigo-300">jobs</code>, <code className="text-indigo-300">job_matches</code>, <code className="text-indigo-300">skill_goals</code>, and <code className="text-indigo-300">interview_sessions</code>) has dedicated policies guaranteeing that users can only read, insert, update, or delete their own data.
          </p>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">Production SQL Migration File:</span>
              <button
                onClick={copyMigrationPath}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {copiedMigration ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMigration ? 'Copied Path!' : 'Copy Path'}</span>
              </button>
            </div>
            <code className="block p-2 bg-slate-900 rounded-lg text-slate-400 font-mono text-[11px]">
              /supabase/migrations/20261012000000_careerpilot_schema.sql
            </code>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="font-bold text-white block mb-0.5">Private File Storage</span>
              <span className="text-slate-400">Resumes bucket isolates files into <code className="text-indigo-300">/resumes/[user_id]/</code></span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="font-bold text-white block mb-0.5">Zero Secret Exposure</span>
              <span className="text-slate-400">Server handles all privileged operations & AI API requests</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <a
              href="/app/supabase"
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Launch Supabase Live Data Explorer</span>
            </a>
          </div>
        </div>
      </Card>

      {/* Account Data Export & Security */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Privacy & Account Data</h3>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div>
            <p className="font-bold text-white">Export Your Career Intelligence Artifacts</p>
            <p className="text-slate-400">Download a verified JSON copy of your profile, assessments, and preferences.</p>
          </div>
          <button
            onClick={handleExportData}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 flex items-center gap-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </Card>
    </div>
  );
};
