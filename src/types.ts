/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Admin' | 'Data Scientist' | 'Analyst' | 'Viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface DatasetColumn {
  name: string;
  type: 'numeric' | 'categorical' | 'datetime' | 'text';
  missingCount: number;
  uniqueCount: number;
  mean?: number;
  min?: number;
  max?: number;
  stdDev?: number;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  rowCount: number;
  columns: DatasetColumn[];
  data: Record<string, any>[];
  createdAt: string;
  dataQualityScore: number; // 0 to 100
}

export type OutlierStrategy = 'remove' | 'cap' | 'none';
export type MissingValueStrategy = 'mean' | 'median' | 'mode' | 'remove';
export type CategoricalEncodingStrategy = 'onehot' | 'label' | 'none';
export type ScalingStrategy = 'minmax' | 'standard' | 'none';

export interface PreprocessConfig {
  missingStrategy: MissingValueStrategy;
  outlierStrategy: OutlierStrategy;
  encodingStrategy: CategoricalEncodingStrategy;
  scalingStrategy: ScalingStrategy;
  targetColumn: string;
  dateColumn: string;
  selectedFeatures: string[];
}

export type ModelAlgorithm =
  | 'linear_regression'
  | 'polynomial_regression'
  | 'ridge_regression'
  | 'lasso_regression'
  | 'random_forest_regression'
  | 'xgboost_regression'
  | 'arima'
  | 'sarima'
  | 'prophet'
  | 'exponential_smoothing'
  | 'moving_average';

export interface ModelMetrics {
  mae: number;
  mse: number;
  rmse: number;
  r2: number;
  mape?: number;
  smape?: number;
  bias?: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface Model {
  id: string;
  name: string;
  datasetId: string;
  algorithm: ModelAlgorithm;
  type: 'regression' | 'forecasting';
  version: string;
  status: 'trained' | 'failed' | 'training';
  createdAt: string;
  metrics: ModelMetrics;
  featureImportance: FeatureImportance[];
  columnsUsed: { features: string[]; target: string; date?: string };
  hyperparameters: Record<string, any>;
  trainLogs: string[];
  isBest?: boolean;
}

export interface ForecastPoint {
  date: string;
  actual?: number;
  predicted?: number;
  lowerCI?: number;
  upperCI?: number;
}

export interface ScenarioSimulation {
  metricAdjustments: {
    price: number;       // percentage multiplier (e.g. 1.10 = +10%)
    demand: number;      // percentage multiplier
    marketing: number;   // percentage multiplier
    seasonality: number; // extra seasonal adjustment multiplier
  };
}

export interface RealTimeChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIInsight {
  id: string;
  type: 'trend' | 'risk' | 'recommendation' | 'opportunity';
  title: string;
  summary: string;
  details: string;
  confidence: number; // 0 to 100
  createdAt: string;
}

export interface DashboardKPIs {
  totalRecords: number;
  forecastAccuracy: number; // Percentage
  predictedGrowth: number;  // Percentage
  bestPerformingModel: string;
  predictionConfidence: number; // Percentage
  trendDirection: 'up' | 'down' | 'flat';
  dataQualityScore: number; // 0 to 100
  recentRevenueTrend: { date: string; value: number }[];
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  targetType: string;
  targetName: string;
  timestamp: string;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  activeModels: number;
  datasetCount: number;
  forecastRunCount: number;
}
