/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  LineChart,
  Lock,
  Mail,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Eye,
  UserCheck
} from 'lucide-react';

export default function LoginView() {
  const { loginUser, registerUser, currentView, setView } = useApp();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Analyst');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePreFill = (preEmail: string) => {
    setEmail(preEmail);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    if (isSignUp) {
      await registerUser(email, fullName || 'Dr. Guest User', selectedRole);
    } else {
      await loginUser(email);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-slate-300" id="login_screen_container">
      {/* Visual background ambient circles */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-blue-600/15 blur-3xl animate-pulse -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl animate-pulse delay-700 -z-10"></div>

      <div className="w-full max-w-md bg-[#0b1120] border border-slate-800/60 rounded-3xl p-8 shadow-2xl space-y-8 animate-fade-in" id="login_card_wrap">
        {/* Core Branding logo */}
        <div className="text-center space-y-3" id="login_header_logo">
          <div className="inline-flex bg-blue-600 p-3 rounded-2xl shadow-lg text-white">
            <LineChart className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display font-black text-xl text-white tracking-widest uppercase">PREDICT.AI</h1>
            <span className="text-[10px] text-blue-400 font-mono tracking-widest block uppercase mt-1">Enterprise Analytics Platform</span>
          </div>
        </div>

        {/* Form fields */}
        <form onSubmit={handleSubmit} className="space-y-4" id="login_auth_form">
          {isSignUp && (
            <div className="space-y-1.5" id="form_field_fullname">
              <span className="text-[10px] uppercase font-mono text-slate-400">Full Name</span>
              <div className="relative">
                <UserCheck className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Frank Poole"
                  className="w-full bg-[#020617] border border-slate-800 rounded-xl pl-9.5 pr-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500/55"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5" id="form_field_email">
            <span className="text-[10px] uppercase font-mono text-slate-400">Corporate Email Account</span>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. scientist@enterprise.ai"
                className="w-full bg-[#020617] border border-[#1e293b] rounded-xl pl-9.5 pr-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500/55"
              />
            </div>
          </div>

          {isSignUp && (
            <div className="space-y-1.5" id="form_field_role">
              <span className="text-[10px] uppercase font-mono text-slate-400">Default Access rank Permissions</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full bg-[#020617] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500/55"
              >
                <option value="Admin">Admin (Core controls and logs)</option>
                <option value="Data Scientist">Data Scientist (Create, clean & train)</option>
                <option value="Analyst">Analyst (Wrangle, simulation & reports)</option>
                <option value="Viewer">Viewer (Executive dashboard & export PDF)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            id="auth_submit_btn"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white font-semibold text-xs py-3 rounded-xl shadow-lg duration-150 cursor-pointer flex items-center justify-center space-x-2 focus:ring-2 focus:ring-blue-500/70"
          >
            <span>{isSignUp ? 'Generate Corporate Profile' : 'Authenticate Console Session'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Sandbox Pre-Fills Shortcuts */}
        {!isSignUp && (
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2.5 text-center" id="demo_accounts_suggestions">
            <span className="text-[9px] font-mono tracking-wider uppercase text-slate-500 block">Demonstration Pre-Fill shortcuts</span>
            <div className="grid grid-cols-3 gap-1.5" id="suggested_fills_box">
              <button
                type="button"
                onClick={() => handlePreFill('scientist@enterprise.ai')}
                className="p-1 px-1 rounded bg-[#020617] border border-slate-800 text-[10px] font-mono text-blue-400 hover:bg-slate-800 cursor-pointer text-center truncate"
              >
                Data Scientist
              </button>
              <button
                type="button"
                onClick={() => handlePreFill('analyst@enterprise.ai')}
                className="p-1 px-1 rounded bg-[#020617] border border-slate-800 text-[10px] font-mono text-blue-400 hover:bg-[#1e293b] cursor-pointer text-center truncate"
              >
                Analyst
              </button>
              <button
                type="button"
                onClick={() => handlePreFill('admin@enterprise.ai')}
                className="p-1 px-1 rounded bg-[#020617] border border-slate-800 text-[10px] font-mono text-blue-400 hover:bg-slate-800 cursor-pointer text-center truncate"
              >
                Core Admin
              </button>
            </div>
          </div>
        )}

        {/* Tab switch info */}
        <div className="text-center pt-2" id="auth_toggle_tab_box">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-slate-400 hover:text-blue-400 text-xs font-medium cursor-pointer"
          >
            {isSignUp ? 'Already enrolled? Return to login' : 'Enroll a custom Analytical Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
