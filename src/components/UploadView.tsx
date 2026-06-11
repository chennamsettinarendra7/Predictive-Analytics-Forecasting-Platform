/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Upload,
  Database,
  Grid,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Play,
  FileCheck,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Dot
} from 'lucide-react';

export default function UploadView() {
  const { importDataset, user } = useApp();
  
  // Tab control inside Import View
  const [importTab, setImportTab] = useState<'file' | 'db'>('file');

  // Local state for parsed records
  const [fileName, setFileName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [columnsDetected, setColumnsDetected] = useState<string[]>([]);
  const [missingStats, setMissingStats] = useState<Record<string, number>>({});
  const [duplicateCount, setDuplicateCount] = useState(0);

  // DB States
  const [dbType, setDbType] = useState<'postgres' | 'mysql' | 'sqlserver'>('postgres');
  const [dbHost, setDbHost] = useState('10.0.12.82');
  const [dbName, setDbName] = useState('analytical_warehouse');
  const [dbTable, setDbTable] = useState('sales_monthly_aggregates');
  const [isSyncing, setIsSyncing] = useState(false);

  // Mapping columns states (e.g. which is Date, which is Target)
  const [mappings, setMappings] = useState({
    dateCol: '',
    targetCol: '',
    featureCols: [] as string[]
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simple CSV text parser helper
  const parseCSVText = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return;

    // Split headers
    const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim());
    setColumnsDetected(headers);

    const dataRows: any[] = [];
    let duplicates = 0;
    const seenRows = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length === headers.length) {
        const rowObj: Record<string, any> = {};
        headers.forEach((hdr, idx) => {
          const val = parts[idx].replace(/^["']|["']$/g, '').trim();
          // Convert to number if numeric
          rowObj[hdr] = isNaN(Number(val)) || val === '' ? val : Number(val);
        });

        // Detect duplicate
        const stringified = JSON.stringify(rowObj);
        if (seenRows.has(stringified)) {
          duplicates++;
        } else {
          seenRows.add(stringified);
          dataRows.push(rowObj);
        }
      }
    }

    // Compute missing stats
    const counts: Record<string, number> = {};
    headers.forEach(hdr => {
      counts[hdr] = dataRows.filter(row => row[hdr] === null || row[hdr] === undefined || String(row[hdr]).trim() === '').length;
    });

    setParsedData(dataRows);
    setDuplicateCount(duplicates);
    setMissingStats(counts);

    // Initial default mapping selections
    const dateCandidate = headers.find(h => h.toLowerCase().includes('date') || h.toLowerCase().includes('time')) || '';
    const numericCandidates = headers.filter(h => h !== dateCandidate && typeof dataRows[0]?.[h] === 'number');
    const targetCandidate = numericCandidates[0] || '';

    setMappings({
      dateCol: dateCandidate,
      targetCol: targetCandidate,
      featureCols: numericCandidates.filter(h => h !== targetCandidate)
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelected(files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setUploadProgress(10);

    const reader = new FileReader();
    
    // Simulate upload timer
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 100);

    reader.onload = (e) => {
      clearInterval(interval);
      setUploadProgress(100);
      const text = e.target?.result as string;
      parseCSVText(text);
    };

    reader.readAsText(file);
  };

  // Preset Template Loader helper
  const loadPresetTemplate = (type: 'sales' | 'ops' | 'users') => {
    setUploadProgress(100);
    let csvData = "";
    if (type === 'sales') {
      setFileName("corporate_financial_feed.csv");
      csvData = `Date,Sales_Revenue_K,Promo_Budget,Price_Index,Category
2026-01-01,154.2,21.0,103.5,Enterprise
2026-02-01,168.9,25.0,102.4,Retail
2026-03-01,179.5,23.5,104.1,Retail
2026-04-01,142.1,18.0,106.5,Enterprise
2026-05-01,192.3,30.5,101.9,Enterprise`;
    } else if (type === 'ops') {
      setFileName("supply_chain_logistics.csv");
      csvData = `Date,Logistics_Demand,Warehouse_Staff,Overtime_Hours,Region
2026-01-01,489,14,24.5,North
2026-01-02,512,15,31.0,North
2026-01-03,472,12,18.0,South
2026-01-04,395,11,8.0,West
2026-01-05,528,16,35.5,East`;
    } else {
      setFileName("user_engagements.csv");
      csvData = `Date,Daily_Active_Users,Bounce_Rate,Page_Views,Referral
2026-01-01,1840,42.5,4100,Organic
2026-01-02,1920,41.2,4650,Direct
2026-01-03,1710,48.0,3800,Referral
2026-01-04,2210,38.5,5900,Organic
2026-01-05,2540,35.0,6800,Ads`;
    }
    parseCSVText(csvData);
  };

  const handleDBSync = async () => {
    setIsSyncing(true);
    // Simulate query sync delay
    setTimeout(() => {
      setIsSyncing(false);
      setFileName(`${dbTable}_table_sync.csv`);
      const mockDBCSV = `Date,Sales_Revenue_K,Promo_Budget,Price_Index,Category
2026-01-01,185.2,42.0,100.2,SaaS
2026-02-01,212.4,45.5,101.5,SaaS
2026-03-01,241.0,52.0,103.1,Enterprise
2026-04-01,225.8,38.0,104.5,SaaS
2026-05-01,268.3,60.2,102.8,Enterprise`;
      parseCSVText(mockDBCSV);
    }, 1500);
  };

  // Commit dataset to Context
  const handleCommitDataset = async () => {
    if (parsedData.length === 0) return;
    
    const formattedName = fileName.replace(/\.[^/.]+$/, "");
    await importDataset(
      formattedName,
      `Excel Data import containing ${columnsDetected.join(', ')} attributes.`,
      parsedData
    );

    // Reset local
    setFileName('');
    setParsedData([]);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="upload_view_container">
      {/* Intro Header */}
      <div>
        <h2 className="text-xl font-display font-bold text-slate-800 dark:text-white flex items-center space-x-2">
          <Database className="h-5 w-5 text-indigo-500" />
          <span>Historical Feed Ingestion System</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-normal">
          Wrangle multi-variate business logs. Integrate custom CSV files, synchronise direct SQL pools and inspect dataset audits.
        </p>
      </div>

      {/* Selector Tabs: Local File vs Direct DB */}
      <div className="flex border-b border-brand-100 dark:border-slate-800 text-xs font-medium space-x-4 pr-4" id="upload_tabs_bar">
        <button
          onClick={() => setImportTab('file')}
          className={`pb-3 px-1 border-b-2 hover:text-slate-850 dark:hover:text-white duration-150 cursor-pointer ${
            importTab === 'file' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400'
          }`}
        >
          Spreadsheet Upload (.csv)
        </button>
        <button
          onClick={() => setImportTab('db')}
          className={`pb-3 px-1 border-b-2 hover:text-slate-850 dark:hover:text-white duration-150 cursor-pointer ${
            importTab === 'db' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400'
          }`}
        >
          Direct Database Integration (SQL Connect)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="upload_grid_layout">
        <div className="lg:col-span-2 space-y-6" id="uploader_left_grid">
          {importTab === 'file' ? (
            /* Tab 1: Local File Uploader */
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-500/80 p-10 bg-white dark:bg-slate-900/60 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-50/50"
              id="file_dropzone"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelected(e.target.files[0]);
                  }
                }}
                accept=".csv"
                className="hidden"
                id="file_native_input"
              />
              <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 text-slate-400 shrink-0 mb-4 animate-pulse">
                <Upload className="h-6 w-6" />
              </div>
              <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-xs">Drag and Drop CSV File Here</h4>
              <p className="text-[10px] text-slate-400 mt-1">Accepts standard text delimited .csv format up to 50MB</p>
              
              {/* Preset template builders */}
              <div className="mt-6 flex flex-wrap gap-2.5" onClick={(e) => e.stopPropagation()} id="preset_templates_stack">
                <span className="text-[9px] text-slate-400 font-mono self-center pr-1.5 border-r border-slate-200 dark:border-slate-800">Or use a high-fidelity template:</span>
                <button
                  onClick={() => loadPresetTemplate('sales')}
                  className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 px-2.5 py-1.5 rounded-lg text-[10px] font-mono hover:bg-indigo-100 cursor-pointer"
                >
                  Sales Forecasting Feed
                </button>
                <button
                  onClick={() => loadPresetTemplate('ops')}
                  className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-2.5 py-1.5 rounded-lg text-[10px] font-mono hover:bg-emerald-100 cursor-pointer"
                >
                  Demand Operations Feed
                </button>
                <button
                  onClick={() => loadPresetTemplate('users')}
                  className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 px-2.5 py-1.5 rounded-lg text-[10px] font-mono hover:bg-amber-100 cursor-pointer"
                >
                  Web User Engagements
                </button>
              </div>
            </div>
          ) : (
            /* Tab 2: Database Connectors */
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4" id="db_connector_port">
              <div className="grid grid-cols-3 gap-2" id="db_brand_selectors">
                {['postgres', 'mysql', 'sqlserver'].map(brand => (
                  <button
                    key={brand}
                    onClick={() => setDbType(brand as any)}
                    className={`p-3 rounded-xl border text-center font-semibold text-xs transition-all cursor-pointer ${
                      dbType === brand
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                        : 'border-slate-150 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {brand.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="db_inputs_grid">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Database Server Host</span>
                  <input
                    type="text"
                    value={dbHost}
                    onChange={(e) => setDbHost(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-350"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Database Schema Name</span>
                  <input
                    type="text"
                    value={dbName}
                    onChange={(e) => setDbName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-350"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Query Target table</span>
                  <input
                    type="text"
                    value={dbTable}
                    onChange={(e) => setDbTable(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-400 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400">PostgreSQL Credentials</span>
                  <input
                    type="password"
                    value="**************"
                    disabled
                    className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={handleDBSync}
                  id="db_sync_query_btn"
                  disabled={isSyncing}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md duration-200 cursor-pointer flex items-center space-x-2"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Fetching relational tables...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Fetch Schema & Data</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TABLE PREVIEW PANEL */}
          {parsedData.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden" id="parsed_file_preview_table">
              <div className="p-5 border-b border-light-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                <div>
                  <h4 className="font-display font-semibold text-xs text-slate-850 dark:text-white flex items-center space-x-2">
                    <Grid className="h-4 w-4 text-indigo-500" />
                    <span>Table Grid Preview: {fileName}</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">Showing first 5 rows for validation</p>
                </div>
                <span className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-bold">
                  {parsedData.length} records parsed
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400" id="preview_data_grid">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase tracking-widest text-[9px] font-mono border-b border-slate-100 dark:border-slate-850">
                    <tr>
                      {columnsDetected.map(col => (
                        <th key={col} className="px-4 py-3">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {parsedData.slice(0, 5).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10">
                        {columnsDetected.map(col => (
                          <td key={col} className="px-4 py-3 font-mono text-[10.5px] whitespace-nowrap">
                            {row[col] === null || row[col] === undefined ? 'NaN' : String(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: AUDITS & MAPPINGS WRAPPER */}
        <div className="space-y-6" id="uploader_right_grid">
          {parsedData.length > 0 ? (
            /* Quality Audit block & Commit Action */
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-5 animate-fade-in" id="file_audit_dashboard_sidebar">
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase font-mono tracking-wider flex items-center">
                  <FileCheck className="h-4 w-4 text-emerald-500 mr-2" /> Data Quality Audit
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Statistical anomaly checks</p>
              </div>

              <div className="space-y-3" id="audit_factors">
                <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400" id="audit_factor_duplicates">
                  <span className="flex items-center"><Dot className="text-indigo-500 h-6 w-6 -ml-2 shrink-0" /> Duplicated rows</span>
                  <span className={`font-mono font-bold ${duplicateCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {duplicateCount}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400" id="audit_factor_missing">
                  <span className="flex items-center"><Dot className="text-indigo-500 h-6 w-6 -ml-2 shrink-0" /> Columns missing vals</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {(Object.values(missingStats) as number[]).filter(v => v > 0).length} columns
                  </span>
                </div>

                {/* Listing of missing fields */}
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-850 space-y-1 max-h-24 overflow-y-auto" id="missing_column_audit_listing">
                  {Object.entries(missingStats).map(([hdr, count]) => (
                    <div key={hdr} className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>{hdr}</span>
                      <span className={(count as number) > 0 ? 'text-amber-500 font-semibold' : 'text-slate-500'}>
                        {count} missing
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Ingestion commit button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800" id="import_commit_wrapper">
                <button
                  onClick={handleCommitDataset}
                  id="final_commit_csv_btn"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-3 rounded-xl shadow-lg duration-150 cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Commit Data to Predictive Suite</span>
                </button>
              </div>
            </div>
          ) : (
            /* Uploader Info Placeholder screen */
            <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-4" id="uploader_instruction_sidebar">
              <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                <HelpCircle className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-slate-750 dark:text-slate-200">How to load datasets</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-2.5">
                  Select clean business logs aggregating values chronologically by Date. Your datasets can include categories, multiple numeric predictors, and target outputs.
                </p>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4" id="sample_requirements">
                <span className="text-[9px] text-slate-400 font-mono block">Required CSV Mapping format:</span>
                <span className="inline-block bg-slate-100 dark:bg-slate-850 px-2 py-1 rounded text-[10px] font-mono text-slate-600 dark:text-slate-400 mt-2">
                  Date, Sales_Metric, Promo_Index, Region
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
