/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ModelAlgorithm } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import {
  Cpu,
  TrendingUp,
  Award,
  BookOpen,
  RefreshCw,
  Sliders,
  Play,
  PlayCircle,
  Clock,
  Menu,
  CheckCircle,
  HelpCircle,
  FileCheck,
  Zap,
  Check
} from 'lucide-react';

export default function ModelTrainingView() {
  const {
    selectedDataset,
    models,
    trainModel,
    selectedModel,
    predictions,
    generatePrediction,
    isLoading
  } = useApp();

  // Local state parameters for new model
  const [modelType, setModelType] = useState<'regression' | 'forecasting'>('forecasting');
  const [algorithm, setAlgorithm] = useState<ModelAlgorithm>('arima');
  const [modelName, setModelName] = useState('');
  
  const [targetColumn, setTargetColumn] = useState('');
  const [dateColumn, setDateColumn] = useState('');
  const [featureColumns, setFeatureColumns] = useState<string[]>([]);
  const [splitRatio, setSplitRatio] = useState(0.8);
  const [forecastHorizon, setForecastHorizon] = useState(12);

  const [activeVisualTab, setActiveVisualTab] = useState<'fitting' | 'residuals' | 'importance'>('fitting');

  // Synchronize column options on dataset switch
  useEffect(() => {
    if (selectedDataset) {
      const cols = selectedDataset.columns;
      const dateHdr = cols.find(c => c.type === 'datetime')?.name || cols[0]?.name || '';
      const numHdrs = cols.filter(c => c.type === 'numeric').map(c => c.name);
      
      const tarHdr = numHdrs[0] || '';
      setDateColumn(dateHdr);
      setTargetColumn(tarHdr);
      setFeatureColumns(numHdrs.filter(h => h !== tarHdr));
    }
  }, [selectedDataset]);

  // Adjust algorithm choices based on Type selected
  const handleModelTypeChange = (type: 'regression' | 'forecasting') => {
    setModelType(type);
    if (type === 'forecasting') {
      setAlgorithm('arima');
    } else {
      setAlgorithm('linear_regression');
    }
  };

  const handleToggleFeature = (col: string) => {
    setFeatureColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const handleTrain = async () => {
    if (!selectedDataset) return;
    
    await trainModel({
      datasetId: selectedDataset.id,
      algorithm,
      name: modelName || `${algorithm.toUpperCase()} Pipeline Feed`,
      targetColumn,
      featureColumns,
      dateColumn: modelType === 'forecasting' ? dateColumn : undefined,
      type: modelType,
      forecastPeriods: modelType === 'forecasting' ? forecastHorizon : undefined
    });
  };

  const activeModel = selectedModel || models[0];

  // Helper to construct residual scatter data for graph (residual = true - fit)
  const residualScatterData = predictions
    .filter(p => p.actual && p.predicted)
    .map((p, idx) => {
      const actual = p.actual || 0;
      const pred = p.predicted || 0;
      const res = actual - pred;
      return {
        index: idx + 1,
        predicted: +pred.toFixed(2),
        residual: +res.toFixed(2),
        absRes: Math.abs(res)
      };
    });

  return (
    <div className="space-y-8 animate-fade-in" id="modeller_suite_container">
      {/* Upper header */}
      <div>
        <h2 className="text-xl font-display font-bold text-slate-800 dark:text-white flex items-center space-x-2">
          <Cpu className="h-5 w-5 text-indigo-500" />
          <span>Predictive Modeling Engine</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-normal">
          Train high-performance algorithms on prepared features, fine-tune split matrices, observe evaluation heat sheets and update accuracy leaderboards.
        </p>
      </div>

      {!selectedDataset ? (
        <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 p-6">
          <p className="text-xs text-slate-400">Please seed or upload a dataset first in the Import workspace.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="modeller_layout_grid">
          {/* LEFT: CALIBRATOR PANEL */}
          <div className="lg:col-span-2 space-y-6" id="modeller_left_grid">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-5" id="model_calibrator_card">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase font-mono tracking-wider flex items-center">
                <Sliders className="h-4 w-4 text-indigo-500 mr-2" /> Model Calibration Workspace
              </h3>

              {/* Name and Type Toggle matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="row_name_type_toggle">
                <div className="space-y-1.5" id="form_name_box">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Custom Checkpoint Name</span>
                  <input
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="e.g. Sales Forecast Q3 ARIMA"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-350"
                  />
                </div>

                <div className="space-y-1.5" id="form_type_box">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Modeling Objective Scope</span>
                  <div className="grid grid-cols-2 gap-2" id="toggle_type_btns">
                    <button
                      onClick={() => handleModelTypeChange('forecasting')}
                      className={`p-2 rounded-lg text-center font-semibold text-xs border cursor-pointer ${
                        modelType === 'forecasting'
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-550'
                      }`}
                    >
                      Time-Series Forecast
                    </button>
                    <button
                      onClick={() => handleModelTypeChange('regression')}
                      className={`p-2 rounded-lg text-center font-semibold text-xs border cursor-pointer ${
                        modelType === 'regression'
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-550'
                      }`}
                    >
                      ML Regression
                    </button>
                  </div>
                </div>
              </div>

              {/* Algorithm select & inputs mapping selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-850" id="columns_and_algorithm_selection">
                <div className="space-y-1.5" id="form_algo_box">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Training Core Algorithm</span>
                  <select
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value as ModelAlgorithm)}
                    id="algorithm_training_selector"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-750 dark:text-slate-300 font-mono"
                  >
                    {modelType === 'forecasting' ? (
                      <>
                        <option value="arima">ARIMA AutoRegressive (Prophet-style)</option>
                        <option value="exponential_smoothing">Holt-Winters Exponential Smoothing</option>
                        <option value="moving_average">Rolling Moving Average</option>
                      </>
                    ) : (
                      <>
                        <option value="linear_regression">Ordinary Least Squares Regression (OLS)</option>
                        <option value="ridge_regression">Ridge L2 Regularized Linear</option>
                        <option value="lasso_regression">Lasso L1 Sparsifier Regression</option>
                        <option value="random_forest_regression">Decision Forest Ensemble (RFR)</option>
                        <option value="xgboost_regression">Gradient Boosted Decision Tree (XGB)</option>
                      </>
                    )}
                  </select>
                </div>

                {modelType === 'forecasting' ? (
                  <div className="space-y-1.5" id="form_horizon_box">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Future Forecast Horizon ({forecastHorizon} periods)</span>
                    <input
                      type="number"
                      min="3"
                      max="36"
                      value={forecastHorizon}
                      onChange={(e) => setForecastHorizon(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-755 dark:text-slate-300 font-mono"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5" id="form_split_box">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Training Train/Test Split ({(splitRatio*100).toFixed(0)}%)</span>
                    <input
                      type="range"
                      min="0.5"
                      max="0.95"
                      step="0.05"
                      value={splitRatio}
                      onChange={(e) => setSplitRatio(Number(e.target.value))}
                      className="h-1 bg-slate-200 dark:bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-600 mt-2.5"
                    />
                  </div>
                )}
              </div>

              {/* Dynamic Y label select / X checklists */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3 border-t border-slate-100 dark:border-slate-850" id="columns_target_and_features_mappers">
                {modelType === 'forecasting' && (
                  <div className="space-y-1.5" id="form_date_col_box">
                    <span className="text-[10px] font-mono text-indigo-400 uppercase">1. Date timeline index</span>
                    <select
                      value={dateColumn}
                      onChange={(e) => setDateColumn(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300"
                    >
                      {selectedDataset.columns.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5" id="form_target_col_box">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase">{modelType === 'forecasting' ? '2. Numerical Target (Y)' : '1. Core Regression Target (Y)'}</span>
                  <select
                    value={targetColumn}
                    onChange={(e) => setTargetColumn(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold"
                  >
                    {selectedDataset.columns.filter(c => c.type === 'numeric').map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1.5" id="form_features_box">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Predictor Features (X)</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-150-1 dark:border-slate-850" id="features_check_scroller">
                    {selectedDataset.columns.filter(c => c.name !== targetColumn && c.name !== dateColumn).map(col => (
                      <button
                        key={col.name}
                        onClick={() => handleToggleFeature(col.name)}
                        className={`px-2 py-1 rounded text-[10.5px] font-semibold border cursor-pointer ${
                          featureColumns.includes(col.name)
                            ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-850'
                            : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {col.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action training execution triggers */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end" id="training_execute_wrapper">
                <button
                  onClick={handleTrain}
                  id="run_model_train_btn"
                  disabled={isLoading || !targetColumn}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md duration-200 flex items-center space-x-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Optimizing Hyperparameters...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 fill-white" />
                      <span>Execute Analytical Fit</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* VISUAL VERIFICATION TABS (Actual vs Predicted, residual errors, importance metrics) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800" id="model_verification_visuals_panel">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="font-display font-semibold text-xs text-slate-850 dark:text-white uppercase font-mono tracking-wider">
                    Model Fit Validation Space
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Diagnosing regression residual offsets</p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg text-xs" id="visual_tabs_row">
                  <button
                    onClick={() => setActiveVisualTab('fitting')}
                    className={`px-3 py-1.5 rounded-md font-medium cursor-pointer transition-colors ${
                      activeVisualTab === 'fitting' ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-white shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Actual vs Predicted
                  </button>
                  <button
                    onClick={() => setActiveVisualTab('residuals')}
                    className={`px-3 py-1.5 rounded-md font-medium cursor-pointer transition-colors ${
                      activeVisualTab === 'residuals' ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-white shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Residuals Plot
                  </button>
                </div>
              </div>

              <div className="h-64" id="visual_render_container">
                {activeVisualTab === 'fitting' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={predictions.filter(p => p.actual)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="actual" stroke="#4f46e5" strokeWidth={1.5} dot={{ r: 2 }} name="True Out-of-Sample" />
                      <Line type="monotone" dataKey="predicted" stroke="#10b981" strokeWidth={1.5} dot={{ r: 2 }} name="Regression Fit" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                      <XAxis type="number" dataKey="predicted" name="Predicted value (Y-Hat)" stroke="#94a3b8" />
                      <YAxis type="number" dataKey="residual" name="Residual error (Y-True - Y-Hat)" stroke="#94a3b8" />
                      <ZAxis type="number" dataKey="absRes" range={[20, 100]} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Legend />
                      {/* Standard zero residual line baseline */}
                      <Line type="monotone" dataKey="predicted" stroke="#ff0000" strokeDasharray="3 3" />
                      <Scatter name="Test residuals" data={residualScatterData} fill="#f43f5e" />
                    </ScatterChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR: PERFORMANCE LEADERBOARDS & LOGCONSOLE */}
          <div className="space-y-6" id="modeller_right_grid">
            {/* Model Evaluation leaderboards */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4" id="models_quality_leaderboard_panel">
              <div className="mb-2">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase font-mono tracking-wider flex items-center">
                  <Award className="h-4 w-4 text-indigo-500 mr-2" /> Model Accuracy Leaderboard
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Ranked by lowest validation residual MAE</p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-850 space-y-3" id="leaderboard_entries">
                {models.filter(m => m.datasetId === selectedDataset?.id || m.id.startsWith('seeded')).map((m, idx) => {
                  const isActive = activeModel?.id === m.id;
                  
                  return (
                    <div
                      key={m.id}
                      onClick={() => generatePrediction(m.id, forecastHorizon)}
                      id={`leaderboard_item_${m.id}`}
                      className={`pt-3 flex flex-col hover:bg-slate-50/40 dark:hover:bg-slate-855/20 p-2 rounded-xl transition-all duration-150 cursor-pointer border ${
                        isActive
                          ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/20'
                          : 'border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-display flex items-center">
                          {idx === 0 && <span className="text-amber-500 mr-1 animate-pulse">★</span>}
                          {m.name}
                        </span>
                        <span className="text-[9px] font-mono uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {m.algorithm.split('_')[0]}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1 text-[10px] text-slate-400 font-mono mt-2" id="leader_metrics_row">
                        <div>
                          <span className="text-[8px] uppercase font-mono text-slate-500 block">R² Score</span>
                          <span className="font-bold text-slate-600 dark:text-slate-350">
                            {m.metrics.r2.toFixed(3)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] uppercase font-mono text-slate-500 block">MAE error</span>
                          <span className="font-bold text-slate-600 dark:text-slate-350">
                            {m.metrics.mae}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] uppercase font-mono text-slate-500 block">RMSE deviation</span>
                          <span className="font-bold text-slate-600 dark:text-slate-350">
                            {m.metrics.rmse}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] uppercase font-mono text-slate-500 block">Bias delta</span>
                          <span className="font-bold block text-slate-600 dark:text-slate-350">
                            {m.metrics.bias}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Train Loss Logs */}
            {activeModel && activeModel.trainLogs && (
              <div className="bg-slate-900 text-slate-400 p-5 rounded-2xl border border-slate-800 font-mono text-[10px] space-y-1 max-h-48 overflow-y-auto" id="training_logs_scroller">
                <span className="text-[9px] text-indigo-400 uppercase font-bold tracking-wider block border-b border-slate-800 pb-2 mb-2">
                  Computational Fit Logs: {activeModel.name}
                </span>
                {activeModel.trainLogs.map((log, idx) => (
                  <p key={idx} className="leading-tight">
                    {`[engine_log] `}{log}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
