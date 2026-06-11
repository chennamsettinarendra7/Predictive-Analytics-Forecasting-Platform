/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp, CurrentViewName } from '../context/AppContext';
import {
  BarChart3,
  Upload,
  Sliders,
  Cpu,
  Bookmark,
  TrendingUp,
  ShieldCheck,
  Settings,
  HelpCircle,
  TrendingDown,
  LineChart,
  Grid
} from 'lucide-react';

interface SidebarItem {
  id: CurrentViewName;
  label: string;
  icon: React.ComponentType<any>;
  rolesAllowed: string[];
}

export default function Sidebar() {
  const { currentView, setView, currentUserRole } = useApp();

  const items: SidebarItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, rolesAllowed: ['Admin', 'Data Scientist', 'Analyst', 'Viewer'] },
    { id: 'upload', label: 'Data Import', icon: Upload, rolesAllowed: ['Admin', 'Data Scientist', 'Analyst'] },
    { id: 'preprocess', label: 'Wrangler & Cleaning', icon: Sliders, rolesAllowed: ['Admin', 'Data Scientist', 'Analyst'] },
    { id: 'models', label: 'Model Training', icon: Cpu, rolesAllowed: ['Admin', 'Data Scientist'] },
    { id: 'scenario', label: 'Scenario Simulation', icon: TrendingUp, rolesAllowed: ['Admin', 'Data Scientist', 'Analyst'] },
    { id: 'reports', label: 'Executive Reports', icon: Bookmark, rolesAllowed: ['Admin', 'Data Scientist', 'Analyst', 'Viewer'] },
    { id: 'admin', label: 'Admin Hub', icon: ShieldCheck, rolesAllowed: ['Admin'] },
  ];

  const filteredItems = items.filter(item => item.rolesAllowed.includes(currentUserRole));

  return (
    <aside className="w-68 bg-[#020617] border-r border-slate-800/50 text-slate-300 flex flex-col justify-between h-screen sticky top-0" id="sidebar_container">
      <div>
        {/* App Title Header */}
        <div className="p-6 border-b border-slate-800/50 flex items-center space-x-3" id="sidebar_logo_box">
          <div className="bg-blue-600 text-white p-2 rounded-lg shadow-md hover:scale-105 transition-transform">
            <LineChart className="h-5 w-5" id="brand_icon" />
          </div>
          <div>
            <h1 className="font-display font-bold text-sm text-white tracking-widest uppercase leading-none" id="brand_text_main">
              PREDICT.AI
            </h1>
            <span className="text-[10px] text-blue-400 font-mono" id="brand_text_sub">Enterprise Mode</span>
          </div>
        </div>

        {/* Dataset Selection Status */}
        <nav className="p-4 space-y-1 mt-4" id="sidebar_navigation_container">
          <span className="px-3 text-[10px] font-mono tracking-widest text-[#556987] uppercase block mb-3" id="nav_label">Navigation</span>
          {filteredItems.map(item => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                id={`sidebar_btn_${item.id}`}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer transition-colors duration-150 ${
                  active
                    ? 'bg-slate-800/50 text-white border border-white/5'
                    : 'hover:bg-slate-800/30 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Branding Info */}
      <div className="mt-auto p-4 space-y-2 text-[10px] text-slate-500 font-mono" id="sidebar_footer_block">
        <div className="px-2" id="enterprise_credit_box">
          <div className="p-4 bg-gradient-to-br from-blue-900/40 to-slate-800/20 border border-blue-500/20 rounded-2xl">
            <p className="text-xs text-blue-400 font-medium mb-1 uppercase tracking-wider">ENTERPRISE PLAN</p>
            <p className="text-sm text-slate-300">2.4M credits remaining</p>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
              <div className="bg-blue-500 h-full w-3/4"></div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors cursor-pointer py-1.5 px-2" onClick={() => setView('settings')}>
          <Settings className="h-4 w-4 shrink-0 text-slate-500" />
          <span className="text-xs">Preferences & Config</span>
        </div>
        <div className="border-t border-slate-800/50 pt-3 flex items-center justify-between px-2">
          <span>Engine: TypeScript 5.8</span>
          <span className="flex items-center text-emerald-400 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>
            ACTIVE
          </span>
        </div>
        <p className="text-[9px] text-slate-600 px-2">Enterprise AI Engine • Cloud-Native</p>
      </div>
    </aside>
  );
}
