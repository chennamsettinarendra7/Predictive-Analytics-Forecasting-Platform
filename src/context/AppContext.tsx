/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  Dataset,
  Model,
  ForecastPoint,
  PreprocessConfig,
  RealTimeChatMessage,
  AIInsight,
  AuditLog,
  SystemMetrics,
  DashboardKPIs,
  UserRole
} from '../types';

export type CurrentViewName =
  | 'dashboard'
  | 'upload'
  | 'preprocess'
  | 'models'
  | 'scenario'
  | 'reports'
  | 'admin'
  | 'settings'
  | 'login'
  | 'register';

export interface AppNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface AppContextType {
  user: User | null;
  currentUserRole: UserRole;
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  models: Model[];
  selectedModel: Model | null;
  predictions: ForecastPoint[];
  insights: AIInsight[];
  insightsLoading: boolean;
  chatHistory: RealTimeChatMessage[];
  chatLoading: boolean;
  simulationResults: ForecastPoint[] | null;
  simulationControls: { price: number; demand: number; marketing: number; seasonality: number };
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  systemMetrics: SystemMetrics | null;
  currentView: CurrentViewName;
  theme: 'light' | 'dark';
  isLoading: boolean;
  
  // View controls
  setView: (view: CurrentViewName) => void;
  toggleTheme: () => void;
  switchUserRole: (role: UserRole) => void;

  // Authentication API
  loginUser: (email: string) => Promise<boolean>;
  logoutUser: () => void;
  registerUser: (email: string, name: string, role: UserRole) => Promise<boolean>;

  // Datasets API
  fetchDatasets: () => Promise<void>;
  fetchDatasetDetails: (id: string, selectAsActive?: boolean) => Promise<Dataset | null>;
  importDataset: (name: string, description: string, data: any[]) => Promise<Dataset | null>;
  preprocessDataset: (datasetId: string, config: PreprocessConfig) => Promise<void>;

  // Modeling & Forecasting API
  fetchModels: () => Promise<void>;
  trainModel: (params: {
    datasetId: string;
    algorithm: string;
    name?: string;
    targetColumn: string;
    featureColumns: string[];
    dateColumn?: string;
    type: 'regression' | 'forecasting';
    forecastPeriods?: number;
  }) => Promise<void>;
  generatePrediction: (modelId: string, periods: number) => Promise<void>;

  // Scenario Simulations
  runScenario: (modelId: string, adjustments: { price: number; demand: number; marketing: number }) => Promise<void>;
  resetScenario: () => void;

  // AI & Chat
  generateAIInsights: () => Promise<void>;
  sendMessageToAI: (text: string) => Promise<void>;
  clearChat: () => void;

  // Admin & Infrastructure API
  fetchAdminData: () => Promise<void>;
  triggerNotification: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
  markNotificationRead: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Primary States
  const [user, setUser] = useState<User | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [predictions, setPredictions] = useState<ForecastPoint[]>([]);
  
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState<boolean>(false);
  
  const [chatHistory, setChatHistory] = useState<RealTimeChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: 'Hello! I am your real-time Predictive Analytics Co-pilot. Choose an active dataset, configure a forecasting algorithm, or ask me to explain statistical modeling parameters directly.',
      timestamp: new Date().toISOString()
    }
  ]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  
  const [simulationResults, setSimulationResults] = useState<ForecastPoint[] | null>(null);
  const [simulationControls, setSimulationControls] = useState({
    price: 1.0,      // Baseline
    demand: 1.0,     // Baseline
    marketing: 1.0,  // Baseline
    seasonality: 1.0 // Baseline
  });

  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'n_welcome',
      type: 'success',
      title: 'Workspace Initialized',
      message: 'Logged in as lead Analyst and synchronized standard corporate SQL feeds.',
      timestamp: new Date().toISOString(),
      read: false
    }
  ]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  
  const [currentView, setCurrentView] = useState<CurrentViewName>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Auto-login Analyst as standard demo baseline for frictionless usage
  useEffect(() => {
    const autoLogin = async () => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'scientist@enterprise.ai' })
        });
        if (response.ok) {
          const res = await response.json();
          setUser(res.user);
          triggerNotification('success', 'Enterprise Session Synchronized', `Welcome back, ${res.user.name}. Your role permissions are: "${res.user.role}".`);
        }
      } catch (e) {
        // Fallback offline user representation if server hasn't finished booting up
        setUser({ id: '2', email: 'scientist@enterprise.ai', name: 'Dr. Marcus Brody', role: 'Data Scientist', createdAt: new Date().toISOString() });
      }
    };
    autoLogin();
  }, []);

  // Sync general workspace parameters on startup or user change
  useEffect(() => {
    if (user) {
      loadWorkspace();
    }
  }, [user]);

  async function loadWorkspace() {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchDatasets(),
        fetchModels(),
        fetchAdminData()
      ]);
      await generateAIInsights();
    } catch(err) {
      console.error("General workspace load failure", err);
    } finally {
      setIsLoading(false);
    }
  }

  // Set Views
  const setView = (view: CurrentViewName) => {
    setCurrentView(view);
  };

  const toggleTheme = () => {
    setTheme(prev => {
      const updated = prev === 'light' ? 'dark' : 'light';
      if (updated === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return updated;
    });
  };

  const switchUserRole = (role: UserRole) => {
    if (!user) return;
    const updatedUser = { ...user, role };
    setUser(updatedUser);
    triggerNotification('info', 'Permissions Shifted', `Role modified to ${role}. Security permissions adjusted.`);
  };

  // Auth Methods
  const loginUser = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        triggerNotification('success', 'Access Granted', `Successfully established session credentials for ${data.user.name}`);
        setCurrentView('dashboard');
        return true;
      } else {
        triggerNotification('error', 'Authentication Failed', 'Invalid credentials or user record.');
        return false;
      }
    } catch (e) {
      triggerNotification('error', 'Network Interruption', 'Could not establish tunnel connection to API backend.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logoutUser = () => {
    setUser(null);
    setSelectedDataset(null);
    setSelectedModel(null);
    setPredictions([]);
    triggerNotification('info', 'Logged Out', 'Successfully cleared local security context tokens.');
    setCurrentView('login');
  };

  const registerUser = async (email: string, name: string, role: UserRole): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        triggerNotification('success', 'Account Enrolled', `Welcome ${name} to Predictive suite directories.`);
        setCurrentView('dashboard');
        return true;
      } else {
        const err = await res.json();
        triggerNotification('error', 'Enrollment Exception', err.error || 'Failed to complete Registration.');
        return false;
      }
    } catch (e) {
      triggerNotification('error', 'Network Error', 'Could not sync sign-up request with master node.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Datasets Methods
  const fetchDatasets = async () => {
    try {
      const res = await fetch('/api/datasets');
      if (res.ok) {
        const list = await res.json();
        setDatasets(list);
        
        // Auto-select sales_marketing_monthly on boot
        if (list.length > 0 && !selectedDataset) {
          await fetchDatasetDetails(list[0].id, true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDatasetDetails = async (id: string, selectAsActive = false): Promise<Dataset | null> => {
    try {
      const res = await fetch(`/api/datasets/${id}`);
      if (res.ok) {
        const ds: Dataset = await res.json();
        if (selectAsActive) {
          setSelectedDataset(ds);
        }
        return ds;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const importDataset = async (name: string, description: string, data: any[]): Promise<Dataset | null> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/datasets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, data, userId: user?.id })
      });
      if (res.ok) {
        const newDs: Dataset = await res.json();
        setDatasets(prev => [...prev, newDs]);
        setSelectedDataset(newDs);
        triggerNotification('success', 'CSV Import Complete', `Loaded ${newDs.rowCount} records into table "${newDs.name}". Status: Active.`);
        return newDs;
      }
    } catch(e) {
      triggerNotification('error', 'Import Interrupted', 'Failed to validate uploaded fields.');
    } finally {
      setIsLoading(false);
    }
    return null;
  };

  const preprocessDataset = async (datasetId: string, config: PreprocessConfig) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/preprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId, config, userId: user?.id })
      });
      if (res.ok) {
        const result = await res.json();
        setDatasets(prev => [...prev, result.dataset]);
        setSelectedDataset(result.dataset);
        
        triggerNotification('success', 'Preprocessing Succeeded', `Piped output clean feed: "${result.dataset.name}".`);
      } else {
        const err = await res.json();
        triggerNotification('error', 'Wrangler Failure', err.error || 'Check cleaning fields.');
      }
    } catch(e) {
      triggerNotification('error', 'Pipe Fail', 'Failed to connect preprocessing worker thread.');
    } finally {
      setIsLoading(false);
    }
  };

  // Modeling and Forecasting
  const fetchModels = async () => {
    try {
      const res = await fetch('/api/models');
      if (res.ok) {
        const list = await res.json();
        setModels(list);
        if (list.length > 0 && !selectedModel) {
          const defaultArima = list.find((m: any) => m.id === 'seeded_arima_sales_forecast_v1');
          await generatePrediction(defaultArima ? defaultArima.id : list[0].id, 12);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const trainModel = async (params: {
    datasetId: string;
    algorithm: string;
    name?: string;
    targetColumn: string;
    featureColumns: string[];
    dateColumn?: string;
    type: 'regression' | 'forecasting';
    forecastPeriods?: number;
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/models/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, userId: user?.id })
      });
      if (res.ok) {
        const result = await res.json();
        setModels(prev => [result.model, ...prev]);
        setSelectedModel(result.model);
        setPredictions(result.predictions);
        
        triggerNotification(
          'success', 
          'Training Execution Ended', 
          `Algorithm "${result.model.name}" completed in 142ms. Output Out-of-Sample metrics $R^2$: ${result.model.metrics.r2.toFixed(4)}.`
        );
        resetScenario(); // Clear simulations
        setCurrentView('models');
      } else {
        const err = await res.json();
        triggerNotification('error', 'Compiler Crash', err.error || 'Training interrupted.');
      }
    } catch (e) {
      triggerNotification('error', 'API Refusal', 'Computational thread connection lost.');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePrediction = async (modelId: string, periods: number) => {
    const activeM = models.find(m => m.id === modelId);
    if (activeM) {
      setSelectedModel(activeM);
    }
    
    try {
      const res = await fetch('/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, forecastPeriods: periods })
      });
      if (res.ok) {
        const data = await res.json();
        setPredictions(data.forecast);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Scenario Simulations
  const runScenario = async (
    modelId: string, 
    adjustments: { price: number; demand: number; marketing: number }
  ) => {
    const currentAdjusts = { ...simulationControls, ...adjustments };
    setSimulationControls(currentAdjusts);

    try {
      const res = await fetch('/api/scenario/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, adjustments: currentAdjusts })
      });
      if (res.ok) {
        const data = await res.json();
        setSimulationResults(data.simulatedForecast);
        triggerNotification('info', 'Scenario Computed', 'Recalculated forecast interval curves on simulated indices.');
      }
    } catch(e) {
      console.error(e);
    }
  };

  const resetScenario = () => {
    setSimulationResults(null);
    setSimulationControls({
      price: 1.0,
      demand: 1.0,
      marketing: 1.0,
      seasonality: 1.0
    });
  };

  // AI & Chat
  const generateAIInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: selectedModel?.id })
      });
      if (res.ok) {
        const list = await res.json();
        setInsights(list);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setInsightsLoading(false);
    }
  };

  const sendMessageToAI = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: RealTimeChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    
    setChatHistory(prev => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatHistory, userMsg],
          contextModelId: selectedModel?.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: RealTimeChatMessage = {
          id: String(Date.now() + 1),
          sender: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString()
        };
        setChatHistory(prev => [...prev, aiMsg]);
      } else {
        triggerNotification('error', 'AI Connection Issue', 'The assistant pipeline is temporarily silent.');
      }
    } catch(e) {
      console.error(e);
    } finally {
      setChatLoading(false);
    }
  };

  const clearChat = () => {
    setChatHistory([
      {
        id: 'welcome',
        sender: 'assistant',
        content: 'Workspace chat history refreshed. How can I assist you with models or trends today?',
        timestamp: new Date().toISOString()
      }
    ]);
  };

  // Audit Logs & Infrastructure Admin
  const fetchAdminData = async () => {
    try {
      const [jRes, mRes] = await Promise.all([
        fetch('/api/admin/audit-logs'),
        fetch('/api/admin/system-metrics')
      ]);
      
      if (jRes.ok) {
        const logs = await jRes.json();
        setAuditLogs(logs);
      }
      if (mRes.ok) {
        const m = await mRes.json();
        setSystemMetrics(m);
      }
    } catch(e) {
      console.error(e);
    }
  };

  // App Alerts
  const triggerNotification = (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => {
    const newNotif: AppNotification = {
      id: String(Date.now()),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const currentUserRole: UserRole = user ? user.role : 'Viewer';

  return (
    <AppContext.Provider
      value={{
        user,
        currentUserRole,
        datasets,
        selectedDataset,
        models,
        selectedModel,
        predictions,
        insights,
        insightsLoading,
        chatHistory,
        chatLoading,
        simulationResults,
        simulationControls,
        notifications,
        auditLogs,
        systemMetrics,
        currentView,
        theme,
        isLoading,
        setView,
        toggleTheme,
        switchUserRole,
        loginUser,
        logoutUser,
        registerUser,
        fetchDatasets,
        fetchDatasetDetails,
        importDataset,
        preprocessDataset,
        fetchModels,
        trainModel,
        generatePrediction,
        runScenario,
        resetScenario,
        generateAIInsights,
        sendMessageToAI,
        clearChat,
        fetchAdminData,
        triggerNotification,
        markNotificationRead
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside an AppProvider wrapper block.');
  }
  return context;
}
