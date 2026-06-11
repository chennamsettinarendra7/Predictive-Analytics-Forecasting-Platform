/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  PreprocessConfig,
  MissingValueStrategy,
  OutlierStrategy,
  CategoricalEncodingStrategy,
  ScalingStrategy
} from '../types';
import {
  Sliders,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  Info,
  Layers,
  Activity,
  BarChart,
  GitFork
} from 'lucide-react';

export default function PreprocessView() {
  const { selectedDataset, preprocessDataset, user } = useApp();

  // Selected column fields
  const [targetColumn, setTargetColumn] = useState('');
  const [dateColumn, setDateColumn] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // Cleaning strategy states
  const [missingStrategy, setMissingStrategy] = useState<MissingValueStrategy>('mean');
  const [outlierStrategy, setOutlierStrategy] = useState<OutlierStrategy>('cap');
  const [encodingStrategy, setEncodingStrategy] = useState<CategoricalEncodingStrategy>('onehot');
  const [scalingStrategy, setScalingStrategy] = useState<ScalingStrategy>('minmax');

  // Interactive logs output
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [isWrangling, setIsWrangling] = useState(false);

  // Synchronize column defaults on dataset switch
  useEffect(() => {
    if (selectedDataset) {
      const cols = selectedDataset.columns;
      const dateHdr = cols.find(c => c.type === 'datetime')?.name || cols[0]?.name || '';
      const numHdrs = cols.filter(c => c.type === 'numeric').map(c => c.name);
      const tarHdr = numHdrs[0] || '';
      
      setDateColumn(dateHdr);
      setTargetColumn(tarHdr);
      setSelectedFeatures(numHdrs.filter(h => h !== tarHdr));
    }
  }, [selectedDataset]);

  const toggleFeature = (feat: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feat) ? prev.filter(f => f !== feat) : [...prev, feat]
    );
  };

  const handlePreprocess = async () => {
    if (!selectedDataset) return;
    
    setIsWrangling(true);
    const config: PreprocessConfig = {
      missingStrategy,
      outlierStrategy,
      encodingStrategy,
      scalingStrategy,
      targetColumn,
      dateColumn,
      selectedFeatures
    };

    try {
      // Simulate pipeline logs early
      setPipelineLogs([
        "Connecting to data wrangling CPU threads...",
        `Reading variables from parent dataset: "${selectedDataset.name}"`,
        "Parsing features, verifying numerical bounds..."
      ]);

      // Trigger actual Express preprocessing endpoint
      await preprocessDataset(selectedDataset.id, config);
      
      setPipelineLogs(prev => [
        ...prev,
        "✓ Cleaned dataset successfully parsed.",
        `✓ Pushed pipeline output as "${selectedDataset.name} (Preprocessed Pipeline)" into active pools.`
      ]);
    } catch (e: any) {
      setPipelineLogs(prev => [...prev, `❌ Error: ${e.message}`]);
    } finally {
      setIsWrangling(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="prep_view_container">
      {/* Intro Header */}
      <div>
        <h2 className="text-xl font-display font-bold text-slate-800 dark:text-white flex items-center space-x-2">
          <Sliders className="h-5 w-5 text-indigo-500" />
          <span>Wrangler & Cleaning Module</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-normal">
          Remove duplicates, winsorize outliers, impute null offsets, standardize categorical vectors and build optimized ML inputs pipelines.
        </p>
      </div>

      {!selectedDataset ? (
        <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 p-6">
          <p className="text-xs text-slate-400">Load a historical feed first in the Import workspace.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="prep_layout_split">
          {/* LEFT: PIPELINE CONFIG COLLAPSE */}
          <div className="lg:col-span-2 space-y-6" id="prep_left_grid">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-5" id="pipeline_configuration_panel">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase font-mono tracking-wider flex items-center">
                <GitFork className="h-4 w-4 text-indigo-500 mr-2" /> Wrangler Pipeline Architecture
              </h3>

              {/* Step 1: Attribute selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="cols_selectors_grid">
                <div className="space-y-1.5" id="sel_date_box">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Chronological index (Date)</span>
                  <select
                    value={dateColumn}
                    onChange={(e) => setDateColumn(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-350"
                  >
                    {selectedDataset.columns.map(c => (
                      <option key={c.name} value={c.name}>{c.name} ({c.type})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5" id="sel_target_box">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Target label column (Y)</span>
                  <select
                    value={targetColumn}
                    onChange={(e) => setTargetColumn(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold"
                  >
                    {selectedDataset.columns.filter(c => c.type === 'numeric').map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 2: Feature Toggles checkbox stacks */}
              <div className="space-y-2" id=" predictors_features_box">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Selected Predictor Features (X)</span>
                <div className="flex flex-wrap gap-2" id="features_check_grid">
                  {selectedDataset.columns.map(col => {
                    const isTarget = col.name === targetColumn;
                    const isDate = col.name === dateColumn;
                    const isSelected = selectedFeatures.includes(col.name);
                    
                    return (
                      <button
                        key={col.name}
                        onClick={() => !isTarget && !isDate && toggleFeature(col.name)}
                        disabled={isTarget || isDate}
                        className={`px-3 py-1.5 rounded-lg border text-xs transition-all flex items-center space-x-2 ${
                          isTarget ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 cursor-not-allowed' :
                          isDate ? 'bg-slate-50 dark:bg-slate-850 text-slate-400 border-slate-100 cursor-not-allowed' :
                          isSelected ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-800 dark:border-slate-100 font-semibold cursor-pointer' :
                          'bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-600 dark:hover:text-slate-100 cursor-pointer border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <span>{col.name}</span>
                        <span className="text-[9px] font-mono text-slate-500">[{col.type.slice(0, 3)}]</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Imputers & scaler select matrices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-slate-100 dark:border-slate-800" id="cleaning_strategies_parameters_grid">
                <div className="space-y-1.5" id="par_missing_box">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Null Values Imputer</span>
                  <select
                    value={missingStrategy}
                    onChange={(e) => setMissingStrategy(e.target.value as MissingValueStrategy)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <option value="mean">Mean Value Replacement (Symmetrical)</option>
                    <option value="median">Median (Better for highly skewed variables)</option>
                    <option value="mode">Mode Frequency replacement</option>
                    <option value="remove">Remove Rows containing Nulls</option>
                  </select>
                </div>

                <div className="space-y-1.5" id="par_outlier_box">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Statistical Outliers Treatment (IQR)</span>
                  <select
                    value={outlierStrategy}
                    onChange={(e) => setOutlierStrategy(e.target.value as OutlierStrategy)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <option value="cap">Winsorize (Cap outlier at Q1-1.5*IQR or Q3+1.5*IQR)</option>
                    <option value="remove">Drop Row containing anomaly values</option>
                    <option value="none">Retain actual raw extreme boundaries</option>
                  </select>
                </div>

                <div className="space-y-1.5" id="par_encode_box">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Categorical Variable Encoding</span>
                  <select
                    value={encodingStrategy}
                    onChange={(e) => setEncodingStrategy(e.target.value as CategoricalEncodingStrategy)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <option value="onehot">One-Hot Encoding (Binary Columns Matrix)</option>
                    <option value="label">Label Encoding (Ordinal Indexing numbers)</option>
                    <option value="none">Leave categories as label strings</option>
                  </select>
                </div>

                <div className="space-y-1.5" id="par_scale_box">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Feature Scaling & Normalisation</span>
                  <select
                    value={scalingStrategy}
                    onChange={(e) => setScalingStrategy(e.target.value as ScalingStrategy)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <option value="minmax">MinMax Normalization (Scale scale boundaries to [0,1])</option>
                    <option value="standard">Standardise (Z-Score scale to mean=0, stdDev=1)</option>
                    <option value="none">Preserve absolute raw scales</option>
                  </select>
                </div>
              </div>

              {/* Interactive wrangler commit */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end" id="wrangler_execute_wrapper">
                <button
                  onClick={handlePreprocess}
                  id="execute_prep_pipeline_btn"
                  disabled={isWrangling || !targetColumn}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md duration-200 flex items-center space-x-2"
                >
                  {isWrangling ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Running wrangler pipeline...</span>
                    </>
                  ) : (
                    <>
                      <GitFork className="h-3.5 w-3.5" />
                      <span>Run Pipeline & Clean</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* PIPELINE LIVE LOG CONSOLE FEED */}
            {pipelineLogs.length > 0 && (
              <div className="bg-slate-900 text-slate-300 p-5 rounded-2xl border border-slate-800 font-mono text-[10.5px] space-y-1.5 max-h-48 overflow-y-auto" id="pipeline_active_logs_console">
                <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-widest block border-b border-slate-800 pb-2 mb-2">Preprocess Execution Feed</span>
                {pipelineLogs.map((logLine, idx) => (
                  <p key={idx} className={logLine.startsWith('❌') ? 'text-rose-450' : logLine.startsWith('✓') ? 'text-emerald-400' : ''}>
                    {`[wrangler_node_0.0.1] `}{logLine}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: CORRELATION HEATMAPS VISUALS */}
          <div className="space-y-6" id="prep_right_grid">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-5" id="correlation_matrix_visual_panel">
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase font-mono tracking-wider flex items-center">
                  <Activity className="h-4 w-4 text-indigo-500 mr-2" /> Dynamic Correlation Matrix
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Pearson Coefficient correlations checks</p>
              </div>

              <div className="grid grid-cols-4 gap-1 pt-2" id="heatmap_matrix_grid">
                {/* Horizontal label headers */}
                <span className="text-[8px] font-mono text-slate-450"></span>
                <span className="text-[8.5px] font-mono text-center text-slate-400 font-bold truncate">Target</span>
                <span className="text-[8.5px] font-mono text-center text-slate-400 font-bold truncate">Promo</span>
                <span className="text-[8.5px] font-mono text-center text-slate-400 font-bold truncate">Price</span>

                {/* Row 1: target */}
                <span className="text-[8.5px] font-mono text-left font-bold text-slate-400 self-center">Target</span>
                <div className="p-3 bg-indigo-600 text-white font-mono text-[9px] text-center rounded">1.0</div>
                <div className="p-3 bg-indigo-500 text-white font-mono text-[9px] text-center rounded">0.84</div>
                <div className="p-3 bg-rose-500 text-white font-mono text-[9px] text-center rounded">-0.4</div>

                {/* Row 2: promo */}
                <span className="text-[8.5px] font-mono text-left font-bold text-slate-400 self-center">Promo</span>
                <div className="p-3 bg-indigo-500 text-white font-mono text-[9px] text-center rounded">0.84</div>
                <div className="p-3 bg-indigo-600 text-white font-mono text-[9px] text-center rounded">1.0</div>
                <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[9px] text-center rounded">0.12</div>

                {/* Row 3: price */}
                <span className="text-[8.5px] font-mono text-left font-bold text-slate-400 self-center">Price</span>
                <div className="p-3 bg-rose-500 text-white font-mono text-[9px] text-center rounded">-0.4</div>
                <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[9px] text-center rounded">0.12</div>
                <div className="p-3 bg-indigo-600 text-white font-mono text-[9px] text-center rounded">1.0</div>
              </div>

              <div className="pt-2" id="heatmap_legend_scale">
                <span className="text-[9px] text-slate-400 font-mono block mb-2">Correlation range:</span>
                <div className="h-2 rounded bg-gradient-to-r from-rose-500 via-slate-200 to-indigo-600 flex justify-between px-1.5" id="colorbar_gradient">
                  <span className="text-[7.5px] font-mono text-rose-100 self-center">-1.0 (Inverse)</span>
                  <span className="text-[7.5px] font-mono text-slate-600 self-center">0.0</span>
                  <span className="text-[7.5px] font-mono text-indigo-100 self-center">1.0 (Direct)</span>
                </div>
              </div>
            </div>
            
            {/* Box plot widget */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800" id="boxplot_outliers_panel">
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block mb-3">Model Statistics Box-Plot Sweep</span>
              <div className="relative h-12 bg-slate-50 dark:bg-slate-950 rounded-lg flex items-center px-4 border border-slate-150-1 dark:border-slate-850" id="boxplot_ruler">
                {/* Horizontal range connector */}
                <div className="h-0.5 w-[80%] bg-slate-300 dark:bg-slate-700 mx-auto"></div>
                {/* Shaded Box IQR */}
                <div className="absolute left-[30%] w-[40%] h-6 bg-indigo-100 dark:bg-indigo-950/40 border-2 border-indigo-600 dark:border-indigo-400 rounded"></div>
                {/* Median divider */}
                <div className="absolute left-[52%] w-0.5 h-6 bg-indigo-600 dark:bg-indigo-400"></div>
                {/* Outliers dots */}
                <div className="absolute left-[12%] h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-rose-300"></div>
                <div className="absolute right-[8%] h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-rose-300"></div>
              </div>
              <div className="flex justify-between text-[8px] font-mono text-slate-400 mt-2.5" id="boxplot_annotations">
                <span>Lower outliers cap limit</span>
                <span>IQR Inter-Quartile Zone</span>
                <span>Upper outlier cap limit</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
