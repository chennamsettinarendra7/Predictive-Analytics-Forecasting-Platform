/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Compass,
  ArrowRight,
  Info,
  Layers,
  Sparkles,
  DollarSign
} from 'lucide-react';

export default function ScenarioSimulationView() {
  const {
    selectedModel,
    models,
    predictions,
    simulationResults,
    simulationControls,
    runScenario,
    resetScenario,
    theme
  } = useApp();

  const activeModel = selectedModel || models[0];

  // Local sliders state initialized to context controls
  const [price, setPrice] = useState(simulationControls.price);
  const [demand, setDemand] = useState(simulationControls.demand);
  const [marketing, setMarketing] = useState(simulationControls.marketing);

  const handleSliderChange = (param: 'price' | 'demand' | 'marketing', val: number) => {
    if (param === 'price') setPrice(val);
    else if (param === 'demand') setDemand(val);
    else if (param === 'marketing') setMarketing(val);
  };

  const executeSimulation = async () => {
    if (!activeModel) return;
    await runScenario(activeModel.id, { price, demand, marketing });
  };

  // Run simulation reactively when sliders adjust with debounce or on button release
  useEffect(() => {
    if (activeModel) {
      executeSimulation();
    }
  }, [price, demand, marketing, activeModel]);

  // Combine baseline and simulation outputs for visual plotting
  const combinedPlots = predictions.map((p, idx) => {
    const simP = simulationResults ? simulationResults[idx] : null;
    return {
      date: p.date,
      baseline: p.predicted ? +p.predicted.toFixed(1) : undefined,
      simulated: simP && simP.predicted ? +simP.predicted.toFixed(1) : undefined
    };
  });

  // Calculate horizon financial metrics
  const sumBaseline = predictions.reduce((acc, p) => acc + (p.predicted || 0), 0);
  const sumSimulated = simulationResults ? simulationResults.reduce((acc, p) => acc + (p.predicted || 0), 0) : sumBaseline;
  const differenceVal = sumSimulated - sumBaseline;
  const differencePct = sumBaseline > 0 ? (differenceVal / sumBaseline) * 100 : 0;

  // Threshold alerts
  const priceAlert = price > 1.25;
  const demandWarning = demand < 0.8;

  return (
    <div className="space-y-8 animate-fade-in" id="simulation_workspace_container">
      {/* Upper header */}
      <div>
        <h2 className="text-xl font-display font-bold text-slate-800 dark:text-white flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-indigo-500" />
          <span>What-If Scenario Simulation Dashboard</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-normal">
          Calibrate economic modifiers relative to trained model weights, evaluate price elasticity thresholds, and overlay simulation paths against baseline trends.
        </p>
      </div>

      {!activeModel ? (
        <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 p-6">
          <p className="text-xs text-slate-400">Train an ML or Forecaster model first to enable scenario analysis.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="simulation_layout_grid">
          {/* LEFT PANEL: ECONOMIC CONTROL SLIDERS */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6" id="sim_controls_panel">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase font-mono tracking-wider flex items-center">
                <Compass className="h-4 w-4 text-indigo-500 mr-2" /> What-if Multipliers Setup
              </h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Adjust inputs to simulate projection elasticity</p>
            </div>

            <div className="space-y-6" id="sliders_stack">
              {/* Slider 1: Promotional Budget */}
              <div className="space-y-2" id="slider_marketing_box">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Promotions & Marketing</span>
                  <span className="font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded text-[10px]">
                    {marketing.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={marketing}
                  onChange={(e) => handleSliderChange('marketing', Number(e.target.value))}
                  id="marketing_slider"
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-[9px] text-slate-400 font-mono flex justify-between">
                  <span>Spend -50%</span>
                  <span>Baseline</span>
                  <span>Spend +100%</span>
                </span>
              </div>

              {/* Slider 2: Unit Pricing */}
              <div className="space-y-2" id="slider_price_box">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Unit Selling Price</span>
                  <span className="font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded text-[10px]">
                    {price.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={price}
                  onChange={(e) => handleSliderChange('price', Number(e.target.value))}
                  id="price_slider"
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-[9px] text-slate-400 font-mono flex justify-between">
                  <span>Price -50%</span>
                  <span>Baseline</span>
                  <span>Price +50%</span>
                </span>
              </div>

              {/* Slider 3: Competitor Pricing & demand shifts */}
              <div className="space-y-2" id="slider_demand_box">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">General Market Demand</span>
                  <span className="font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded text-[10px]">
                    {demand.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={demand}
                  onChange={(e) => handleSliderChange('demand', Number(e.target.value))}
                  id="demand_slider"
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-[9px] text-slate-400 font-mono flex justify-between">
                  <span>Demand -50%</span>
                  <span>Baseline</span>
                  <span>Demand +50%</span>
                </span>
              </div>
            </div>

            {/* Threshold alerts box */}
            {(priceAlert || demandWarning) && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-2 animate-fade-in" id="threshold_warning_panel">
                <span className="text-[10px] font-mono uppercase text-amber-600 dark:text-amber-400 font-bold flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1.5 shrink-0" /> Simulation System Cap Alert
                </span>
                <p className="text-[10px] text-slate-400 leading-normal font-mono">
                  {priceAlert && "• Caution: Price indices above 1.25x trigger unit demand attrition under consumer utility functions."}
                  {priceAlert && demandWarning && <br />}
                  {demandWarning && "• Caution: Demand multipliers below 0.8x drop production load factors close to fixed costs."}
                </p>
              </div>
            )}

            {/* Reset control button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end" id="sim_actions">
              <button
                onClick={resetScenario}
                id="reset_scenario_sliders_btn"
                className="text-xs bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-300 font-semibold px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-200 duration-150 cursor-pointer"
              >
                Reset Multipliers
              </button>
            </div>
          </div>

          {/* RIGHT PANELS (HORIZON COMPARISON PLOTS & METRICS IMPACT) */}
          <div className="lg:col-span-2 space-y-6" id="sim_right_grid">
            {/* Real-time financial delta indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="sim_impact_indicators_grid">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 shrink-0">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase text-slate-400">Simulation Delta</p>
                  <h4 className={`text-lg font-display font-bold ${differenceVal >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {differenceVal >= 0 ? `+${differenceVal.toFixed(1)} Units` : `${differenceVal.toFixed(1)} Units`}
                  </h4>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 shrink-0">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase text-slate-400">Elasticity Change Pct</p>
                  <h4 className={`text-lg font-display font-bold ${differencePct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {differencePct >= 0 ? `+${differencePct.toFixed(2)}%` : `${differencePct.toFixed(2)}%`}
                  </h4>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase text-slate-400">Scenario Feasibility</p>
                  <h4 className="text-lg font-display font-bold text-slate-800 dark:text-white">
                    {differenceVal > 250 ? 'EXPERT RECOMMEND' : 'VIABLE RANGE'}
                  </h4>
                </div>
              </div>
            </div>

            {/* Overlap Recharts Line Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800" id="sim_comparison_chart_panel">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center space-x-2">
                    <Layers className="h-4 w-4 text-indigo-500" />
                    <span>Overlay Projections Comparison</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">Model Basis: {activeModel.name}</p>
                </div>

                <div className="flex items-center space-x-2 text-[10px] font-mono" id="sim_legend">
                  <span className="flex items-center text-slate-400"><span className="h-1 w-4 bg-indigo-500 mr-1 shrink-0"></span>Baseline Forecast</span>
                  <span className="flex items-center text-indigo-500"><span className="h-1 w-4 bg-rose-500 mr-1 shrink-0"></span>Simulated "What-If" curve</span>
                </div>
              </div>

              <div className="h-72" id="sim_chart_render">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={combinedPlots} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        background: theme === 'dark' ? '#0f172a' : '#ffffff',
                        borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0'
                      }}
                    />
                    <Line type="monotone" dataKey="baseline" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 2 }} name="Baseline" />
                    {simulationResults && (
                      <Line type="monotone" dataKey="simulated" stroke="#ec4899" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 2 }} name="Simulated" />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
