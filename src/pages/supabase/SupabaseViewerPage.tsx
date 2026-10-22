import React, { useState, useEffect } from 'react';
import {
  Database,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  UploadCloud,
  Layers,
  Table as TableIcon,
  ShieldCheck,
  Key,
  Globe,
  ArrowRight,
  Code2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const SupabaseViewerPage: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [supabaseData, setSupabaseData] = useState<Record<string, any[]>>({});
  const [activeTable, setActiveTable] = useState<string>('profiles');

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<any>(null);

  // Configuration fields
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [copiedMigration, setCopiedMigration] = useState(false);

  // Table search & inspection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const loadStatusAndData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSupabaseStatus();
      setStatus(res);
      setSupabaseUrl(res.config?.url || res.url || '');

      if (res.connected) {
        const dataRes = await api.getSupabaseData();
        setSupabaseData(dataRes.data || {});
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check Supabase status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatusAndData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl || !supabaseKey) {
      setError('Please provide both your Supabase Project URL and API Key.');
      return;
    }

    try {
      setSavingConfig(true);
      setError(null);
      const res = await api.saveSupabaseConfig({
        url: supabaseUrl,
        key: supabaseKey,
      });
      setStatus(res.status);
      setShowConfigForm(false);
      // Auto-load data if connected
      if (res.status.connected) {
        const dataRes = await api.getSupabaseData();
        setSupabaseData(dataRes.data || {});
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Supabase instance.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSyncData = async () => {
    try {
      setSyncing(true);
      setError(null);
      setSyncResult(null);
      const res = await api.syncToSupabase();
      setSyncResult(res);

      // Refresh live table data from Supabase
      const dataRes = await api.getSupabaseData();
      setSupabaseData(dataRes.data || {});

      // Refresh status counts
      const statusRes = await api.getSupabaseStatus();
      setStatus(statusRes);
    } catch (err: any) {
      setError(err.message || 'Failed to sync data into Supabase.');
    } finally {
      setSyncing(false);
    }
  };

  const copySqlMigration = async () => {
    try {
      const resp = await fetch('/supabase/migrations/20261012000000_careerpilot_schema.sql');
      const text = await resp.text();
      await navigator.clipboard.writeText(text);
      setCopiedMigration(true);
      setTimeout(() => setCopiedMigration(false), 2500);
    } catch {
      navigator.clipboard.writeText('-- Run schema migration in Supabase SQL Editor --');
      setCopiedMigration(true);
      setTimeout(() => setCopiedMigration(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner label="Connecting to Supabase PostgreSQL database..." />
      </div>
    );
  }

  const tableList = [
    { id: 'profiles', name: 'profiles', label: 'Candidate Profiles' },
    { id: 'resumes', name: 'resumes', label: 'Resumes' },
    { id: 'resume_analyses', name: 'resume_analyses', label: 'Resume Analyses' },
    { id: 'jobs', name: 'jobs', label: 'Target Jobs' },
    { id: 'job_matches', name: 'job_matches', label: 'Explainable Matches' },
    { id: 'skill_goals', name: 'skill_goals', label: 'Skill Roadmaps' },
    { id: 'interview_sessions', name: 'interview_sessions', label: 'Mock Interviews' },
    { id: 'activity_events', name: 'activity_events', label: 'Activity Log' },
  ];

  const currentRows = supabaseData[activeTable] || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Supabase PostgreSQL Live Explorer</h2>
            <Badge variant={status?.connected ? 'success' : 'warning'} size="sm">
              {status?.connected ? 'Connected' : 'Setup Required'}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            View live rows, manage credentials, synchronize candidate records, or open the Supabase dashboard
          </p>
        </div>

        <div className="flex items-center gap-2">
          {status?.connected && (
            <button
              onClick={handleSyncData}
              disabled={syncing}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{syncing ? 'Syncing Records...' : 'Push Local Data to Supabase'}</span>
            </button>
          )}

          {status?.dashboardUrl && (
            <a
              href={status.dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
            >
              <span>Open Supabase Table Editor</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">✕</button>
        </div>
      )}

      {syncResult && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Successfully synchronized data to Supabase!</span>
          </div>
          <p className="text-[11px] text-emerald-400/90">
            Synced: {Object.entries(syncResult.syncedCounts || {})
              .map(([tbl, cnt]) => `${tbl}: ${cnt}`)
              .join(' • ')}
          </p>
          {syncResult.errors?.length > 0 && (
            <p className="text-amber-300 text-[11px]">Warnings: {syncResult.errors.join(', ')}</p>
          )}
        </div>
      )}

      {/* Connection & Configuration Overview */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Supabase Project Connection</h3>
              <p className="text-xs text-slate-400">
                {status?.url ? (
                  <span className="font-mono text-emerald-300">{status.url}</span>
                ) : (
                  'Not yet connected to an external Supabase project'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfigForm(!showConfigForm)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              {showConfigForm ? 'Cancel Credentials Edit' : status?.configured ? 'Update Credentials' : 'Connect Supabase'}
            </button>
            <button
              onClick={loadStatusAndData}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
              title="Refresh connection"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Credentials Form (Collapsible) */}
        {showConfigForm && (
          <form onSubmit={handleSaveConfig} className="pt-4 space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Supabase Project URL
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzprojectref.supabase.co"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Supabase API Key (Anon / Service Role)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJh..."
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Found in Supabase Dashboard &gt; Project Settings &gt; API
              </span>
              <button
                type="submit"
                disabled={savingConfig}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                {savingConfig ? <LoadingSpinner size="sm" label="" /> : <Check className="w-4 h-4" />}
                <span>{savingConfig ? 'Connecting...' : 'Save & Test Connection'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Quick Migration Instructions */}
        {!status?.connected && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Step 1: Run PostgreSQL Schema in Supabase</span>
                <span className="text-slate-400 text-[11px]">
                  Copy the full migration script and paste it into Supabase SQL Editor to initialize all tables and RLS security policies.
                </span>
              </div>
              <button
                onClick={copySqlMigration}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copiedMigration ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMigration ? 'Copied Full SQL!' : 'Copy SQL Script'}</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-900 p-2.5 rounded-xl font-mono">
              supabase/migrations/20261012000000_careerpilot_schema.sql
            </div>
          </div>
        )}
      </Card>

      {/* Live Table Explorer */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">Supabase Live Database Tables</h3>
          </div>
          {status?.connected && (
            <span className="text-xs text-slate-400">
              Showing rows live from Supabase
            </span>
          )}
        </div>

        {/* Table Selector Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tableList.map(tab => {
            const rowCount = supabaseData[tab.id]?.length || 0;
            const isSelected = activeTable === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTable(tab.id);
                  setSearchQuery('');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {rowCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-indigo-900/60 text-white' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {rowCount} rows
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Bar & Table Header Info */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${activeTable} table (name, email, ID...)...`}
              className="w-full max-w-sm px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">
              Showing <span className="font-bold text-white">
                {currentRows.filter(r => JSON.stringify(r).toLowerCase().includes(searchQuery.toLowerCase())).length}
              </span> of {currentRows.length} rows
            </span>

            {status?.projectRef && (
              <a
                href={`https://supabase.com/dashboard/project/${status.projectRef}/editor/${activeTable}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <span>Open in Supabase</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Active Table Data View */}
        {currentRows.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  {Object.keys(currentRows[0]).slice(0, 6).map(col => (
                    <th key={col} className="px-4 py-3">{col}</th>
                  ))}
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {currentRows
                  .filter(r => JSON.stringify(r).toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((row, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setSelectedRecord(row)}
                      className="hover:bg-slate-900/60 transition-colors cursor-pointer"
                    >
                      {Object.entries(row).slice(0, 6).map(([key, val]: [string, any], vidx) => (
                        <td key={vidx} className="px-4 py-2.5 truncate max-w-[200px]">
                          {typeof val === 'object' && val !== null ? (
                            <span className="text-indigo-300 font-sans text-[10px] bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-500/20">
                              {Array.isArray(val) ? `[${val.length} items]` : '{object}'}
                            </span>
                          ) : key === 'role' ? (
                            <Badge variant={val === 'taskmate' ? 'primary' : val === 'customer' ? 'purple' : 'success'} size="sm">
                              {String(val)}
                            </Badge>
                          ) : (
                            String(val ?? '—')
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-2.5 text-right font-sans">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(row);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium rounded-lg transition-colors"
                        >
                          Inspect Row
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
            <Database className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-white mb-1">
              {status?.connected
                ? `No records found in table "${activeTable}" in Supabase.`
                : 'Connect Supabase credentials to inspect live tables.'}
            </p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto mb-4">
              {status?.connected
                ? 'Click "Push Local Data to Supabase" above to sync all existing profiles, resumes, matches, and mock interview sessions into your Supabase database.'
                : 'Provide your Project URL & API Key in the panel above to view data live in Supabase.'}
            </p>
            {status?.connected && (
              <button
                onClick={handleSyncData}
                disabled={syncing}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-1.5"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{syncing ? 'Syncing...' : 'Sync Records to Supabase Now'}</span>
              </button>
            )}
          </div>
        )}
      </Card>

      {/* Record Inspection Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Record Details ({activeTable})</h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-3 text-xs font-mono">
              {Object.entries(selectedRecord).map(([k, v]) => (
                <div key={k} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">{k}</span>
                  <pre className="text-slate-200 text-xs whitespace-pre-wrap break-all font-sans">
                    {typeof v === 'object' && v !== null ? JSON.stringify(v, null, 2) : String(v ?? 'null')}
                  </pre>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
