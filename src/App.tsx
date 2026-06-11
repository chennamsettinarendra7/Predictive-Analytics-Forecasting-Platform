/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import UploadView from './components/UploadView';
import PreprocessView from './components/PreprocessView';
import ModelTrainingView from './components/ModelTrainingView';
import ScenarioSimulationView from './components/ScenarioSimulationView';
import ReportsView from './components/ReportsView';
import AdminPanel from './components/AdminPanel';
import AICopilotPanel from './components/AICopilotPanel';
import LoginView from './components/LoginView';

function AppContent() {
  const { user, currentView, theme } = useApp();

  // If session is unauthenticated, redirect to sign-in terminal grid
  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans" id="app_frame">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Container Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#020617]" id="workspace_viewport">
        {/* Navbar */}
        <Navbar />

        {/* Dynamic Navigating View Content Panels */}
        <main className="flex-1 overflow-y-auto p-8" id="scrolling_canvas">
          <div className="max-w-7xl mx-auto pb-10">
            {currentView === 'dashboard' && <DashboardView />}
            {currentView === 'upload' && <UploadView />}
            {currentView === 'preprocess' && <PreprocessView />}
            {currentView === 'models' && <ModelTrainingView />}
            {currentView === 'scenario' && <ScenarioSimulationView />}
            {currentView === 'reports' && <ReportsView />}
            {currentView === 'admin' && <AdminPanel />}
          </div>
        </main>
      </div>

      {/* Floating Sparkle AI Copilot Assistant */}
      <AICopilotPanel />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
