/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Search,
  Filter,
  Share2,
  Workflow,
  Sparkles,
  Database
} from 'lucide-react';

export default function ReportsView() {
  const {
    selectedDataset,
    selectedModel,
    models,
    predictions,
    insights,
    user
  } = useApp();

  const activeModel = selectedModel || models[0];

  // Reports config selectors
  const [includeKPI, setIncludeKPI] = useState(true);
  const [includePredictions, setIncludePredictions] = useState(true);
  const [includeInsights, setIncludeInsights] = useState(true);

  // Workflow Schedules states
  const [schedules, setSchedules] = useState([
    { id: '1', name: 'Weekly Model Sweep', trigger: 'Every Monday 02:00 UTC', target: 'arima_sales_v1', status: 'active', lastExec: '2026-05-25 02:14' },
    { id: '2', name: 'Transactional Data Sync', trigger: 'Daily 00:00 UTC', target: 'sales_marketing_monthly', status: 'active', lastExec: '2026-05-26 23:58' },
    { id: '3', name: 'Anomaly Drift Webhook Pings', trigger: 'Real-time feed triggers', target: 'all_tables', status: 'paused', lastExec: 'Never' }
  ]);

  // Actual CSV Downloader
  const handleExportCSV = () => {
    if (predictions.length === 0) return;
    
    // Build CSV plain text
    let csvContent = "date,actual_observed,predicted_val,lower_confidence_limit,upper_confidence_limit\n";
    predictions.forEach(p => {
      csvContent += `${p.date},${p.actual || ''},${p.predicted || ''},${p.lowerCI || ''},${p.upperCI || ''}\n`;
    });

    // Create Blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `predictive_forecast_${selectedDataset?.name || 'report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fade-in print:bg-white print:text-black" id="reports_workspace_container">
      {/* Intro Header */}
      <div className="print:hidden">
        <h2 className="text-xl font-display font-bold text-slate-800 dark:text-white flex items-center space-x-2">
          <FileText className="h-5 w-5 text-indigo-500" />
          <span>Automated Reporting & Workflows</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-normal">
          Export spreadsheet deliverables immediately, schedule automated background retrains, observe diagnostic cron jobs and compile pristine business summaries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="reports_layout_grid">
        {/* LEFT COLUMN: REPORT BUILDER PREVIEW & PRINT MODULE */}
        <div className="lg:col-span-2 space-y-6 print:w-full" id="reports_preview_panel">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-8 space-y-6" id="printable_report_layout">
            
            {/* Report Header Logo box */}
            <div className="flex justify-between items-start border-b border-slate-150-1 dark:border-slate-800 pb-5" id="report_invoice_header">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white uppercase tracking-wide">
                  Predictive Platform Analytical Brief
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Report compiled on: {new Date().toLocaleDateString()} UTC</p>
              </div>
              <div className="text-right text-[10px] text-slate-400 font-mono">
                <p>Enterprise AI Platform</p>
                <p>Suite Reference: #{selectedDataset?.id || 'null_feed'}</p>
                <p>Analyst User: {user?.name || 'Dr. Marcus'}</p>
              </div>
            </div>

            {/* Scope description text block */}
            <div className="space-y-2" id="report_executive_summary_block">
              <span className="text-[10px] font-mono uppercase text-indigo-600 font-bold block print:text-indigo-800">1.0 Executive Brief Scope</span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed leading-[1.375rem]">
                This summary represents validation output fitted on table <strong className="text-slate-800 dark:text-slate-200">"{selectedDataset?.name}"</strong> containing historical samples. Evaluated using algorithm model check <strong className="text-slate-800 dark:text-slate-200">"{activeModel?.name || 'baseline'}"</strong> with optimal error metrics residuals boundaries.
              </p>
            </div>

            {/* Dynamic visual KPI summaries overlay */}
            {includeKPI && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-150-1 dark:border-slate-850 grid grid-cols-3 gap-4" id="report_minis_table">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Target Feed</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-display">{selectedDataset?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Fitted $R^2$ Score</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">{activeModel?.metrics.r2.toFixed(4) || '0.940'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Validation MAE</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">{activeModel?.metrics.mae || 'N/A'}</span>
                </div>
              </div>
            )}

            {/* Dynamic tabular prediction intervals */}
            {includePredictions && predictions.length > 0 && (
              <div className="space-y-3" id="report_prediction_records">
                <span className="text-[10px] font-mono uppercase text-indigo-600 font-bold block print:text-indigo-800">2.0 Horizon Forecast Vectors Dataset</span>
                <div className="border border-slate-150-1 dark:border-slate-850 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px] text-slate-600 dark:text-slate-400" id="report_vectors_grid">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-[9px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-850">
                      <tr>
                        <th className="px-4 py-2.5">Forecast Horizon Date</th>
                        <th className="px-4 py-2.5 text-right">Adjusted Prediction (Y-Hat)</th>
                        <th className="px-4 py-2.5 text-right">Lower Bound Limit</th>
                        <th className="px-4 py-2.5 text-right">Upper Bound Limit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono">
                      {predictions.slice(-6).map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2">{p.date}</td>
                          <td className="px-4 py-2 text-right font-semibold text-slate-800 dark:text-slate-200">{p.predicted ? p.predicted.toFixed(2) : '-'}</td>
                          <td className="px-4 py-2 text-right text-slate-400">{p.lowerCI ? p.lowerCI.toFixed(2) : '-'}</td>
                          <td className="px-4 py-2 text-right text-slate-400">{p.upperCI ? p.upperCI.toFixed(2) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* AI summaries list */}
            {includeInsights && insights.length > 0 && (
              <div className="space-y-3" id="report_ai_narratives">
                <span className="text-[10px] font-mono uppercase text-indigo-600 font-bold block print:text-indigo-800 flex items-center">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5 print:hidden" /> 3.0 Real-time System Audit Narratives
                </span>
                <div className="space-y-2.5" id="report_insights_stack">
                  {insights.slice(0, 2).map(ins => (
                    <div key={ins.id} className="p-3 rounded-lg border border-slate-150-1 dark:border-slate-850">
                      <h4 className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">{ins.title}</h4>
                      <p className="text-[10px] text-slate-400 leading-normal mt-1">{ins.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signature sign-off footer line */}
            <div className="pt-8 border-t border-slate-150-1 dark:border-slate-800 flex justify-between text-[9px] text-slate-450 font-mono" id="report_signature_line">
              <span>Predictive platform OLS validation report</span>
              <span>Approval stamp: ________________________</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REVIEWS & BACKGROUND JOBS INTEGRATOR */}
        <div className="space-y-6 print:hidden" id="reports_right_grid">
          {/* Builder togglers box */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4" id="report_parameters_controllers">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase font-mono tracking-wider">Report Layout Customization</h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Toggle indices showing on compile</p>
            </div>

            <div className="space-y-2.5" id="toggles_stack">
              <label className="flex items-center space-x-2.5 text-xs text-slate-650 dark:text-slate-350 cursor-pointer user-select-none" id="toggle_lbl_kpi">
                <input
                  type="checkbox"
                  checked={includeKPI}
                  onChange={(e) => setIncludeKPI(e.target.checked)}
                  className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span>Include Model Evaluation KPIs</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-650 dark:text-slate-350 cursor-pointer user-select-none" id="toggle_lbl_preds">
                <input
                  type="checkbox"
                  checked={includePredictions}
                  onChange={(e) => setIncludePredictions(e.target.checked)}
                  className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span>Include Forecast Vectors Database</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-650 dark:text-slate-350 cursor-pointer user-select-none" id="toggle_lbl_narratives">
                <input
                  type="checkbox"
                  checked={includeInsights}
                  onChange={(e) => setIncludeInsights(e.target.checked)}
                  className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span>Include AI Audit Narratives</span>
              </label>
            </div>

            {/* Trigger actionable PDF / CSV exports download buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col space-y-2" id="report_exports_panel">
              <button
                onClick={handlePrint}
                id="print_report_pdf_btn"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 rounded-lg shadow-md duration-150 cursor-pointer flex items-center justify-center space-x-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print PDF Brief</span>
              </button>

              <button
                onClick={handleExportCSV}
                id="export_forecast_csv_btn"
                disabled={predictions.length === 0}
                className="w-full bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold py-2.5 rounded-lg border border-slate-205 dark:border-slate-800 duration-150 cursor-pointer flex items-center justify-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export Predictions (.csv)</span>
              </button>
            </div>
          </div>

          {/* BACKGROUND TRIGGERS (AUTOMATED WORKFLOW TRACKER) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4" id="cron_jobs_tracker_panel">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase font-mono tracking-wider flex items-center">
                <Workflow className="h-4 w-4 text-indigo-500 mr-2" /> Automated Cron Workflows
              </h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Background fitting triggers status</p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-850 space-y-3.5" id="schedules_listing">
              {schedules.map(sch => (
                <div key={sch.id} className="pt-3" id={`schedule_job_${sch.id}`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-750 dark:text-slate-250 font-display">{sch.name}</span>
                    <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-bold ${
                      sch.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {sch.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 mt-2" id="job_runs_dates">
                    <div>
                      <span className="text-[8px] uppercase text-slate-500 block">Interval Trigger</span>
                      <span>{sch.trigger}</span>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase text-slate-500 block">Last Execute Date</span>
                      <span>{sch.lastExec}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
