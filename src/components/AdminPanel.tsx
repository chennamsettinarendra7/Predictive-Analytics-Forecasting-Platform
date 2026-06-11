/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Server,
  Terminal,
  Download,
  Search,
  RefreshCw,
  Activity,
  Cpu,
  Database,
  Lock,
  UserCheck
} from 'lucide-react';

export default function AdminPanel() {
  const {
    auditLogs,
    systemMetrics,
    fetchAdminData,
    currentUserRole
  } = useApp();

  const [isLoading, setIsLoading] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  const refreshData = async () => {
    setIsLoading(true);
    await fetchAdminData();
    setIsLoading(false);
  };

  // Auto-refresh metrics logs on startup
  useEffect(() => {
    refreshData();
  }, []);

  const filteredLogs = auditLogs.filter(log =>
    log.action.toLowerCase().includes(filterQuery.toLowerCase()) ||
    log.userEmail.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const exportLogsAsJSON = () => {
    if (auditLogs.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(auditLogs, null, 2))}`;
    const element = document.createElement('a');
    element.setAttribute('href', jsonString);
    element.setAttribute('download', `predictive_security_audit_logs_${Date.now()}.json`);
    document.body.appendChild(element);
    element.click();
    element.removeChild(element);
  };

  // Only allow Admin roles
  if (currentUserRole !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-4 animate-fade-in" id="admin_unauthorized_screen">
        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-full shrink-0 border border-rose-100">
          <Lock className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-display font-bold text-xs text-slate-850 dark:text-white uppercase font-mono tracking-widest">Access Denied</h3>
          <p className="text-[10px] text-slate-400 mt-2 leading-relaxed max-w-sm">
            You require "Admin" permissions to inspect core telemetry indices, allocate server hardware threads, or export raw compliance security audits.
          </p>
        </div>
        <div className="text-[10px] font-mono text-slate-400">
          Your active role is: <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-indigo-500 font-semibold">{currentUserRole}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" id="admin_workspace_container">
      {/* Intro Header */}
      <div className="flex justify-between items-center" id="admin_header_row">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-800 dark:text-white flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-indigo-500" />
            <span>Admin Hub & Telemetry Portal</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-normal">
            Inspect hardware node usage metrics, audit relational action journals and manage workspace role permissions.
          </p>
        </div>

        <button
          onClick={refreshData}
          id="refresh_admin_metrics_btn"
          disabled={isLoading}
          className="p-2 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer flex items-center space-x-2 border border-slate-205 duration-100"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="text-xs font-semibold">Sync node</span>
        </button>
      </div>

      {/* TELEMETRY CARDS METRICS */}
      {systemMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="telemetry_metrics_grid">
          {/* Card 1: CPU load */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 hover:border-indigo-150 transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-mono uppercase text-slate-450">CPU load vector</p>
                <h4 className="text-xl font-display font-bold text-slate-800 dark:text-white mt-1">{systemMetrics.cpuLoad.toFixed(1)}%</h4>
              </div>
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 border border-indigo-100/40">
                <Cpu className="h-4 w-4" />
              </div>
            </div>
            {/* ProgressBar */}
            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600" style={{ width: `${systemMetrics.cpuLoad}%` }}></div>
            </div>
            <span className="text-[8.5px] font-mono text-slate-400 block tracking-wider uppercase">8 Cores active</span>
          </div>

          {/* Card 2: Memory Load */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 hover:border-indigo-150 transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-mono uppercase text-slate-450 font-medium">Memory Allocation</p>
                <h4 className="text-xl font-display font-bold text-slate-800 dark:text-white mt-1">{systemMetrics.memoryLoad.toFixed(1)}%</h4>
              </div>
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 border border-indigo-100/40">
                <Server className="h-4 w-4" />
              </div>
            </div>
            {/* ProgressBar */}
            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600" style={{ width: `${systemMetrics.memoryLoad}%` }}></div>
            </div>
            <span className="text-[8.5px] font-mono text-slate-400 block uppercase">16GB RAM configured</span>
          </div>

          {/* Card 3: Memory details */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 hover:border-indigo-150 transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-mono uppercase text-slate-450">Active SQL Threads</p>
                <h4 className="text-xl font-display font-bold text-slate-800 dark:text-white mt-1">
                  {systemMetrics.activeConnections}
                </h4>
              </div>
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 border border-indigo-100/40">
                <Database className="h-4 w-4" />
              </div>
            </div>
            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600" style={{ width: '40%' }}></div>
            </div>
            <span className="text-[8.5px] font-mono text-slate-400 block uppercase">Relational connection pooling</span>
          </div>

          {/* Card 4: REST Latency */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 hover:border-indigo-150 transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-mono uppercase text-slate-450">Engine Feed Latency</p>
                <h4 className="text-xl font-display font-bold text-slate-800 dark:text-white mt-1">{systemMetrics.apiLatencyMs.toFixed(0)} ms</h4>
              </div>
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 border border-indigo-100/40">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: '15%' }}></div>
            </div>
            <span className="text-[8.5px] font-mono text-emerald-500 block uppercase font-bold">✓ Sub-second compliance</span>
          </div>
        </div>
      )}

      {/* COMPLIANCE AUDIT JAL DATA TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden" id="compliance_journal_table_panel">
        <div className="p-5 border-b border-light-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 dark:bg-slate-950/20 gap-4" id="table_header_search_box">
          <div>
            <h4 className="font-display font-semibold text-xs text-slate-850 dark:text-white flex items-center space-x-2">
              <Terminal className="h-4 w-4 text-indigo-500" />
              <span>Full Regulatory Compliance Journals</span>
            </h4>
            <p className="text-[10px] text-slate-400 font-mono mt-1">Chronological history of workspace processes and uploads</p>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto" id="search_log_controls">
            <div className="relative flex-1 sm:flex-none" id="search_input_wrap">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                id="search_audit_logs"
                placeholder="Search audit journals..."
                className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-xs rounded-lg pl-8.5 pr-3 py-1.5 text-slate-700 dark:text-slate-350 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={exportLogsAsJSON}
              id="export_audit_json_btn"
              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded cursor-pointer duration-100 flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-2 shrink-0 shadow-md shadow-indigo-600/5"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Export JSON</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto" id="logs_scroller_body">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400" id="audit_logs_grid">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-450 font-mono uppercase tracking-widest text-[9px] border-b border-slate-100 dark:border-slate-850">
              <tr>
                <th className="px-6 py-3">Timestamp (UTC)</th>
                <th className="px-6 py-3">Security Access level</th>
                <th className="px-6 py-3">Analyst Node User</th>
                <th className="px-6 py-3">Procedural Action</th>
                <th className="px-6 py-3">Remote Host Node</th>
                <th className="px-6 py-3">Workflow State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400">No matching journals found.</td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10" id={`audit_row_${log.id}`}>
                    <td className="px-6 py-3 font-mono text-[10.5px] whitespace-nowrap text-slate-400">{log.timestamp}</td>
                    <td className="px-6 py-3 font-mono text-[10.5px]">
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                        log.role === 'Admin' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20' : 'bg-slate-50 text-slate-500'
                      }`}>
                        {log.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-semibold text-slate-800 dark:text-slate-300">{log.userEmail}</td>
                    <td className="px-6 py-3 text-slate-700 dark:text-slate-350 font-mono font-medium">{log.action}</td>
                    <td className="px-6 py-3 font-mono text-[10px] text-slate-400">{log.ipAddress}</td>
                    <td className="px-6 py-3 font-mono text-[10px]">
                      <span className="text-emerald-500 font-bold">✓ Success</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
