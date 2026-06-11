/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  Bell,
  Sun,
  Moon,
  ShieldAlert,
  ChevronDown,
  LogOut,
  User,
  Activity,
  CheckCircle2,
  Info,
  Database
} from 'lucide-react';

export default function Navbar() {
  const {
    user,
    currentUserRole,
    switchUserRole,
    logoutUser,
    notifications,
    markNotificationRead,
    theme,
    toggleTheme,
    selectedDataset
  } = useApp();

  const [isOpenProfile, setIsOpenProfile] = useState(false);
  const [isOpenNotif, setIsOpenNotif] = useState(false);

  const unreadNotifs = notifications.filter(n => !n.read);
  const roles: UserRole[] = ['Admin', 'Data Scientist', 'Analyst', 'Viewer'];

  return (
    <header className="h-16 border-b border-slate-800/50 bg-[#020617]/80 backdrop-blur-sm sticky top-0 z-50 flex items-center justify-between px-8" id="master_navbar">
      {/* Left side: Active Dataset context banner */}
      <div className="flex items-center space-x-4" id="nav_left_container">
        {selectedDataset ? (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-blue-950/20 text-xs font-medium text-blue-400 border border-blue-500/20" id="dataset_indicator">
            <Database className="h-3.5 w-3.5 text-blue-500" />
            <span className="font-semibold">{selectedDataset.name}</span>
            <span className="text-slate-500 font-normal">| {selectedDataset.rowCount} rows</span>
          </div>
        ) : (
          <span className="text-xs text-slate-500 font-mono">Select data source to begin</span>
        )}
      </div>

      {/* Right side controls */}
      <div className="flex items-center space-x-4" id="nav_right_container">
        {/* Role Switcher Selector */}
        <div className="flex items-center space-x-2 text-xs" id="role_switcher_box">
          <span className="text-slate-550 hidden sm:inline font-medium">Security Clearance:</span>
          <select
            value={currentUserRole}
            onChange={(e) => switchUserRole(e.target.value as UserRole)}
            id="role_dropdown_nav"
            className="bg-slate-900 text-slate-300 border border-slate-800 rounded-lg px-2 py-1.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500/50"
          >
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          id="toggle_theme_btn"
          className="p-2 text-slate-500 hover:text-slate-350 rounded-lg cursor-pointer hover:bg-slate-800/40 transition-colors"
          title="Toggle system theme"
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        {/* Notifications Alert Bell */}
        <div className="relative" id="notif_wrapper">
          <button
            onClick={() => setIsOpenNotif(!isOpenNotif)}
            id="notif_bell_btn"
            className="p-2 text-slate-500 hover:text-slate-350 rounded-lg cursor-pointer hover:bg-slate-800/40 transition-colors"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isOpenNotif && (
            <div className="absolute right-0 mt-2.5 w-80 bg-[#0b1120] border border-slate-800/60 rounded-xl shadow-xl z-50 text-xs p-4 overflow-hidden" id="notif_menu">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-white">Workspace Notifications</span>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded">
                  {unreadNotifs.length} new
                </span>
              </div>

              <div className="divide-y divide-slate-800/50 max-h-60 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="text-slate-550 py-3 text-center">No analytical alerts pending.</p>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationRead(notif.id)}
                      className={`py-2.5 flex items-start space-x-2.5 hover:bg-slate-800/20 cursor-pointer ${!notif.read ? 'bg-blue-950/10 font-medium' : ''}`}
                    >
                      {notif.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : notif.type === 'warning' ? (
                        <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      ) : (
                        <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-slate-200 text-[11px] leading-tight-1">{notif.title}</p>
                        <p className="text-slate-500 text-[10px] line-clamp-2 mt-0.5 leading-normal">{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Controls */}
        {user && (
          <div className="relative" id="profile_wrapper">
            <button
              onClick={() => setIsOpenProfile(!isOpenProfile)}
              id="user_profile_btn"
              className="flex items-center space-x-2.5 text-slate-400 hover:text-white cursor-pointer"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-[1px] shadow-lg" id="avatar_box">
                <div className="w-full h-full rounded-full bg-[#0b1120] flex items-center justify-center text-[10px] font-bold text-white">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
              </div>
              <div className="hidden md:block text-left" id="user_labels">
                <p className="text-xs font-semibold leading-none">{user.name}</p>
                <p className="text-[9px] text-blue-400 font-mono mt-0.5">{user.role}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
            </button>

            {/* Profile Dropdown Menu */}
            {isOpenProfile && (
              <div className="absolute right-0 mt-3 w-56 bg-[#0b1120] border border-slate-800/60 rounded-xl shadow-xl z-50 text-xs p-2" id="profile_menu">
                <div className="p-3 border-b border-slate-800/50">
                  <p className="font-semibold text-white">{user.name}</p>
                  <p className="text-slate-450 text-[10.5px] mt-0.5">{user.email}</p>
                </div>
                
                <div className="p-1 space-y-1">
                  <div className="flex items-center space-x-2 p-2 hover:bg-slate-800/40 rounded text-slate-300">
                    <Activity className="h-4 w-4 shrink-0 text-slate-500" />
                    <span>Scope: {user.role === 'Admin' ? 'Wide Admin' : 'Analytical'}</span>
                  </div>
                  <button
                    onClick={logoutUser}
                    id="logout_action_btn"
                    className="w-full text-left flex items-center space-x-2 p-2 text-rose-450 hover:bg-rose-950/20 rounded cursor-pointer transition-colors"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
