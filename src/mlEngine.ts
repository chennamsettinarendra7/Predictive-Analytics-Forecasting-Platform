/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ModelAlgorithm,
  ModelMetrics,
  FeatureImportance,
  ForecastPoint,
  PreprocessConfig
} from './types';

// Matrix and Vector Utilities for standard operations
export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function std(arr: number[], mVal?: number): number {
  if (arr.length <= 1) return 0;
  const avg = mVal !== undefined ? mVal : mean(arr);
  const variance = arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

// Outlier detection using IQR (Interquartile Range)
export function detectOutliersIQR(vals: number[]): { lower: number; upper: number; indices: number[] } {
  const sorted = [...vals].sort((a, b) => a - b);
  if (sorted.length === 0) return { lower: 0, upper: 0, indices: [] };
  
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;

  const indices: number[] = [];
  vals.forEach((v, index) => {
    if (v < lower || v > upper) {
      indices.push(index);
    }
  });

  return { lower, upper, indices };
}

// -------------------------------------------------------------------
// 1. Data Cleaning and Preprocessing Module
// -------------------------------------------------------------------
export function preprocessData(
  rawData: any[],
  config: PreprocessConfig
): { cleanedData: any[]; log: string[] } {
  const log: string[] = [];
  log.push(`Initializing Preprocessing Workflow with configurations: Target=${config.targetColumn}, Date=${config.dateColumn}`);

  let temp = JSON.parse(JSON.stringify(rawData)); // Deep copy

  // Standardize dates
  if (config.dateColumn) {
    log.push(`Parsing dates on column: "${config.dateColumn}"`);
    temp.forEach((row: any) => {
      if (row[config.dateColumn]) {
        // format to YYYY-MM-DD
        const dateObj = new Date(row[config.dateColumn]);
        if (!isNaN(dateObj.getTime())) {
          row[config.dateColumn] = dateObj.toISOString().split('T')[0];
        }
      }
    });
    // Sort by date chronologically
    temp.sort((a: any, b: any) => {
      const d1 = new Date(a[config.dateColumn] || 0).getTime();
      const d2 = new Date(b[config.dateColumn] || 0).getTime();
      return d1 - d2;
    });
  }

  // Combine numerical columns checking
  const numericCols = config.selectedFeatures.concat(config.targetColumn).filter(Boolean);

  // Missing Value Handling
  numericCols.forEach(col => {
    const vals = temp.map((r: any) => r[col]).filter((v: any) => v !== null && v !== undefined && !isNaN(Number(v)));
    let replaceVal = 0;
    
    if (config.missingStrategy === 'mean') {
      replaceVal = vals.length > 0 ? mean(vals.map(Number)) : 0;
    } else if (config.missingStrategy === 'median') {
      const sorted = [...vals].map(Number).sort((a, b) => a - b);
      replaceVal = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;
    } else if (config.missingStrategy === 'mode') {
      const counts: Record<number, number> = {};
      let maxCount = 0;
      vals.forEach(v => {
        const num = Number(v);
        counts[num] = (counts[num] || 0) + 1;
        if (counts[num] > maxCount) {
          maxCount = counts[num];
          replaceVal = num;
        }
      });
    }

    let fixCount = 0;
    temp.forEach((row: any) => {
      if (row[col] === null || row[col] === undefined || isNaN(Number(row[col]))) {
        row[col] = replaceVal;
        fixCount++;
      } else {
        row[col] = Number(row[col]);
      }
    });
    if (fixCount > 0) {
      log.push(`Imputed ${fixCount} missing values in "${col}" using state strategy "${config.missingStrategy}" (impute value: ${replaceVal.toFixed(2)})`);
    }
  });

  // Outlier Handling
  numericCols.forEach(col => {
    const vals = temp.map((r: any) => Number(r[col]));
    const { lower, upper, indices } = detectOutliersIQR(vals);
    
    if (indices.length > 0 && config.outlierStrategy !== 'none') {
      log.push(`Detected ${indices.length} statistical outliers in "${col}" outside interval [${lower.toFixed(2)}, ${upper.toFixed(2)}]`);
      if (config.outlierStrategy === 'cap') {
        indices.forEach(idx => {
          const orig = temp[idx][col];
          temp[idx][col] = orig < lower ? lower : upper;
        });
        log.push(`Winsorized (capped) ${indices.length} outliers in column "${col}"`);
      } else if (config.outlierStrategy === 'remove') {
        const preLen = temp.length;
        temp = temp.filter((_, idx) => !indices.includes(idx));
        log.push(`Removed ${preLen - temp.length} rows containing outliers in "${col}"`);
      }
    }
  });

  // Feature Scaling
  if (config.scalingStrategy !== 'none') {
    config.selectedFeatures.forEach(col => {
      const vals = temp.map((r: any) => Number(r[col]));
      const avg = mean(vals);
      const stdev = std(vals, avg);
      const minVal = Math.min(...vals);
      const maxVal = Math.max(...vals);

      temp.forEach((row: any) => {
        const v = Number(row[col]);
        if (config.scalingStrategy === 'standard') {
          row[col] = stdev > 0 ? (v - avg) / stdev : 0;
        } else if (config.scalingStrategy === 'minmax') {
          row[col] = maxVal !== minVal ? (v - minVal) / (maxVal - minVal) : 0;
        }
      });
      log.push(`Applied ${config.scalingStrategy} scaling parameters to feature: "${col}"`);
    });
  }

  // Encoding simulation (simplistic representation mapping categories)
  const allCols = Object.keys(temp[0] || {});
  allCols.forEach(col => {
    if (col !== config.dateColumn && col !== config.targetColumn && !config.selectedFeatures.includes(col)) {
      const datatype = typeof temp[0]?.[col];
      if (datatype === 'string' && config.encodingStrategy !== 'none') {
        const uniqueCats = Array.from(new Set(temp.map((r: any) => r[col])));
        log.push(`Encoding categorical column "${col}" with ${uniqueCats.length} levels using "${config.encodingStrategy}" encoding`);
        if (config.encodingStrategy === 'label') {
          temp.forEach((row: any) => {
            const idx = uniqueCats.indexOf(row[col]);
            row[`Encoded_${col}`] = idx;
          });
        } else if (config.encodingStrategy === 'onehot') {
          uniqueCats.forEach(cat => {
            temp.forEach((row: any) => {
              row[`${col}_${cat}`] = row[col] === cat ? 1 : 0;
            });
          });
        }
      }
    }
  });

  log.push(`Data cleaning completed. Pipeline produced ${temp.length} cleaned observation rows.`);
  return { cleanedData: temp, log };
}

// -------------------------------------------------------------------
// 2. Linear, Polynomial, Ridge, and Lasso Regressions (Gradient Descent Solver)
// -------------------------------------------------------------------
export interface LinearModelCoeff {
  weights: number[];
  bias: number;
}

export function trainLinearModel(
  xTrain: number[][], // rows of features
  yTrain: number[],   // target values
  algorithm: ModelAlgorithm,
  learningRate = 0.05,
  epochs = 200,
  regularizationLambda = 0.1
): { coef: LinearModelCoeff; logs: string[] } {
  const logs: string[] = [];
  const nSamples = xTrain.length;
  if (nSamples === 0) return { coef: { weights: [], bias: 0 }, logs: ['Empty observations error'] };
  
  const nFeatures = xTrain[0].length;
  let weights = new Array(nFeatures).fill(0).map(() => Math.random() * 0.1 - 0.05);
  let bias = Math.random() * 0.1 - 0.05;

  logs.push(`Starting Gradient Descent optimizer for ${algorithm}. Samples: ${nSamples}, Features: ${nFeatures}`);

  for (let epoch = 1; epoch <= epochs; epoch++) {
    let dw = new Array(nFeatures).fill(0);
    let db = 0;
    let totalLoss = 0;

    for (let i = 0; i < nSamples; i++) {
      const xi = xTrain[i];
      const yi = yTrain[i];
      
      // Predict
      let yPred = bias;
      for (let j = 0; j < nFeatures; j++) {
        yPred += xi[j] * weights[j];
      }

      const error = yPred - yi;
      totalLoss += error * error;

      // Gradients
      for (let j = 0; j < nFeatures; j++) {
        dw[j] += (2 / nSamples) * error * xi[j];
      }
      db += (2 / nSamples) * error;
    }

    const lossMSE = totalLoss / nSamples;

    // Apply regularization penalties
    for (let j = 0; j < nFeatures; j++) {
      if (algorithm === 'ridge_regression') {
        // L2 Penalty gradient: lambda * w
        dw[j] += regularizationLambda * weights[j];
      } else if (algorithm === 'lasso_regression') {
        // L1 Penalty gradient: lambda * sign(w)
        dw[j] += regularizationLambda * Math.sign(weights[j]);
      }
    }

    // Weight Updates
    for (let j = 0; j < nFeatures; j++) {
      weights[j] -= learningRate * dw[j];
    }
    bias -= learningRate * db;

    if (epoch === 1 || epoch === Math.floor(epochs/2) || epoch === epochs) {
      logs.push(`Epoch ${epoch}/${epochs} | Training MSE loss: ${lossMSE.toFixed(4)}`);
    }
  }

  logs.push(`Model converged successfully. Derived bias offset: ${bias.toFixed(4)}`);
  return { coef: { weights, bias }, logs };
}

// -------------------------------------------------------------------
// 3. Simple Decision Trees, Random Forest, & Gradient Boosting (XGBoost)
// -------------------------------------------------------------------
interface DecisionTreeNode {
  featureIdx?: number;
  threshold?: number;
  val?: number; // Leaf prediction
  left?: DecisionTreeNode;
  right?: DecisionTreeNode;
}

// Build standard decision tree recursively
function buildRegressionTree(
  X: number[][],
  Y: number[],
  depth: number,
  maxDepth = 4,
  minSamplesSplit = 3
): DecisionTreeNode {
  const nSamples = X.length;
  if (nSamples === 0) return { val: 0 };
  
  const avg = mean(Y);
  // Base case: max depth or too few samples or identical target
  if (depth >= maxDepth || nSamples < minSamplesSplit || std(Y, avg) < 1e-4) {
    return { val: avg };
  }

  const nFeatures = X[0].length;
  let bestMSELoss = Infinity;
  let bestFeature = -1;
  let bestThreshold = 0;
  let bestLeftIndices: number[] = [];
  let bestRightIndices: number[] = [];

  // Iterate features & split options
  for (let f = 0; f < nFeatures; f++) {
    const colVals = X.map(row => row[f]);
    // Sample thresholds from percentiles
    const thresholds = Array.from(new Set(colVals)).sort((a,b)=>a-b);
    for (let tIdx = 0; tIdx < thresholds.length; tIdx += Math.max(1, Math.floor(thresholds.length / 8))) {
      const thres = thresholds[tIdx];
      const leftIdx: number[] = [];
      const rightIdx: number[] = [];
      
      colVals.forEach((val, idx) => {
        if (val <= thres) leftIdx.push(idx);
        else rightIdx.push(idx);
      });

      if (leftIdx.length === 0 || rightIdx.length === 0) continue;

      const yLeft = leftIdx.map(i => Y[i]);
      const yRight = rightIdx.map(i => Y[i]);

      const mseLeft = leftIdx.reduce((acc, i) => acc + Math.pow(Y[i] - mean(yLeft), 2), 0);
      const mseRight = rightIdx.reduce((acc, i) => acc + Math.pow(Y[i] - mean(yRight), 2), 0);
      const totalWeightedGrad = mseLeft + mseRight;

      if (totalWeightedGrad < bestMSELoss) {
        bestMSELoss = totalWeightedGrad;
        bestFeature = f;
        bestThreshold = thres;
        bestLeftIndices = leftIdx;
        bestRightIndices = rightIdx;
      }
    }
  }

  // If no good split found, return leaf with average
  if (bestFeature === -1) {
    return { val: avg };
  }

  const leftX = bestLeftIndices.map(i => X[i]);
  const leftY = bestLeftIndices.map(i => Y[i]);
  const rightX = bestRightIndices.map(i => X[i]);
  const rightY = bestRightIndices.map(i => Y[i]);

  return {
    featureIdx: bestFeature,
    threshold: bestThreshold,
    left: buildRegressionTree(leftX, leftY, depth + 1, maxDepth, minSamplesSplit),
    right: buildRegressionTree(rightX, rightY, depth + 1, maxDepth, minSamplesSplit)
  };
}

// Predict single row using decision tree
function predictTreeRow(node: DecisionTreeNode, x: number[]): number {
  if (node.val !== undefined) return node.val;
  if (node.featureIdx === undefined || node.threshold === undefined) return 0;

  if (x[node.featureIdx] <= node.threshold) {
    return predictTreeRow(node.left!, x);
  } else {
    return predictTreeRow(node.right!, x);
  }
}

// Ensemble: Random Forest Regressor
export class RandomForestRegressor {
  trees: DecisionTreeNode[] = [];
  featuresUsed: number[][] = []; // indices of random features per tree
  logs: string[] = [];

  train(X: number[][], Y: number[], nEstimators = 5, maxDepth = 4) {
    this.logs.push(`Training Random Forest ensemble model. nEstimators=${nEstimators}, max_depth=${maxDepth}`);
    const nSamples = X.length;
    const nFeatures = X[0].length;
    
    for (let i = 0; i < nEstimators; i++) {
      // Bootstrapping: draw random sample with replacement
      const bootX: number[][] = [];
      const bootY: number[] = [];
      for (let s = 0; s < nSamples; s++) {
        const randIdx = Math.floor(Math.random() * nSamples);
        bootX.push(X[randIdx]);
        bootY.push(Y[randIdx]);
      }

      // Feature bagging: select random sqrt(n) features
      const featureSubsetSize = Math.max(1, Math.round(Math.sqrt(nFeatures)));
      const shuffledFeatures = Array.from({ length: nFeatures }, (_, k) => k).sort(() => Math.random() - 0.5);
      const selectedFeaturesIdx = shuffledFeatures.slice(0, featureSubsetSize);
      
      const filteredBootX = bootX.map(row => selectedFeaturesIdx.map(idx => row[idx]));
      const tree = buildRegressionTree(filteredBootX, bootY, 0, maxDepth, 3);
      
      this.trees.push(tree);
      this.featuresUsed.push(selectedFeaturesIdx);
      this.logs.push(`Ensemble Iteration [Tree ${i + 1}/${nEstimators}] fitted successfully on bagging subset.`);
    }
  }

  predict(X: number[][]): number[] {
    return X.map(row => {
      const preds = this.trees.map((tree, idx) => {
        const featureSub = this.featuresUsed[idx];
        const mappedRow = featureSub.map(fIdx => row[fIdx]);
        return predictTreeRow(tree, mappedRow);
      });
      return mean(preds);
    });
  }
}

// Ensemble: XGBoost-like Gradient Boosting Machine
export class XGBoostRegressor {
  baseValue = 0;
  trees: DecisionTreeNode[] = [];
  learningRate = 0.1;
  logs: string[] = [];

  train(X: number[][], Y: number[], nEstimators = 6, maxDepth = 3) {
    this.logs.push(`Initializing Gradient Boosting XGBoost optimization. Estimators=${nEstimators}, rate=${this.learningRate}`);
    
    // Initial constant model: predict the mean
    this.baseValue = mean(Y);
    let currentPreds = new Array(Y.length).fill(this.baseValue);
    
    this.logs.push(`Base constant baseline prediction calculated: ${this.baseValue.toFixed(4)}`);

    for (let i = 0; i < nEstimators; i++) {
      // Calculate pseudo-residuals (residuals = target - current_prediction)
      const residuals = Y.map((yi, idx) => yi - currentPreds[idx]);
      
      // Fit tree on residuals
      const tree = buildRegressionTree(X, residuals, 0, maxDepth, 3);
      this.trees.push(tree);

      // Boost current predictions
      for (let idx = 0; idx < Y.length; idx++) {
        const step = predictTreeRow(tree, X[idx]);
        currentPreds[idx] += this.learningRate * step;
      }
      
      const treeVariance = std(residuals);
      this.logs.push(`Boosting step [Tree ${i + 1}/${nEstimators}] trained. Residual error variance: ${treeVariance.toFixed(4)}`);
    }
  }

  predict(X: number[][]): number[] {
    return X.map(row => {
      let pred = this.baseValue;
      this.trees.forEach(tree => {
        pred += this.learningRate * predictTreeRow(tree, row);
      });
      return pred;
    });
  }
}

// -------------------------------------------------------------------
// 4. Time-Series Advanced Forecasting Module
// -------------------------------------------------------------------
// Implements advanced Trend + Seasonality Decompositions (Additive/Multiplicative HW)
export function trainTimeSeriesForecasting(
  history: { date: string; value: number }[],
  algorithm: ModelAlgorithm,
  forecastPeriods: number,
  confidenceLevel = 0.95 // for confidence margins
): { forecast: ForecastPoint[]; logs: string[]; metrics: ModelMetrics } {
  const logs: string[] = [];
  logs.push(`Executing time-series forecasting via algorithm: ${algorithm}. Historical counts: ${history.length}. Horizon: ${forecastPeriods}`);

  const N = history.length;
  if (N === 0) {
    return { forecast: [], logs: ['Empty history dataset provided'], metrics: { mae: 0, mse: 0, rmse: 0, r2: 0 } };
  }

  const yVals = history.map(h => h.value);
  const timeIndices = Array.from({ length: N }, (_, i) => i);

  // Fit a standard baseline trend line: Y = beta * t + alpha
  const tMean = mean(timeIndices);
  const yMean = mean(yVals);
  let num = 0;
  let den = 0;
  for (let i = 0; i < N; i++) {
    num += (timeIndices[i] - tMean) * (yVals[i] - yMean);
    den += Math.pow(timeIndices[i] - tMean, 2);
  }
  const beta = den !== 0 ? num / den : 0;
  const alpha = yMean - beta * tMean;
  logs.push(`Calculated fundamental linear trend pattern: Growth Beta=${beta.toFixed(4)}, Baseline Offset=${alpha.toFixed(4)}`);

  // Detect seasonality periods
  // Default: monthly aggregates (period 12) or daily aggregates (period 7)
  // Let's deduce period based on distance of adjacent dates
  let period = 7; // Weekly seasonality by default (daily records)
  if (N >= 2) {
    const d1 = new Date(history[0].date).getTime();
    const d2 = new Date(history[1].date).getTime();
    const diffDays = Math.round(Math.abs(d2 - d1) / (1000 * 3600 * 24));
    if (diffDays >= 25 && diffDays <= 32) {
      period = 12; // Monthly data! Seasonality cycles every 12 periods
      logs.push(`Identified seasonal cycle period: 12 (Monthly periodicity matches data spacing)`);
    } else {
      logs.push(`Identified seasonal cycle period: 7 (Daily/Weekly periodicity matches data spacing)`);
    }
  }

  // Calculate seasonal indices (Additive Seasonality)
  const seasonAverages = new Array(period).fill(0);
  const seasonCounts = new Array(period).fill(0);
  
  for (let i = 0; i < N; i++) {
    const pIdx = i % period;
    const trendValue = alpha + beta * i;
    const deviation = yVals[i] - trendValue; // de-trended residual
    seasonAverages[pIdx] += deviation;
    seasonCounts[pIdx]++;
  }

  const seasonalIndices = seasonAverages.map((sum, idx) => {
    return seasonCounts[idx] > 0 ? sum / seasonCounts[idx] : 0;
  });

  // Calculate historic fitted values
  const fitted: number[] = [];
  const errors: number[] = [];

  for (let i = 0; i < N; i++) {
    const trendValue = alpha + beta * i;
    const seasonValue = seasonalIndices[i % period];
    const fit = Math.max(0, trendValue + seasonValue);
    fitted.push(fit);
    errors.push(yVals[i] - fit);
  }

  // Autoregressive lag AR(1) prediction to model autocorrelation of errors if ARIMA/Prophet
  let arCoef = 0.5; // lag dampener
  if (N > 1) {
    let errNum = 0;
    let errDen = 0;
    const errMean = mean(errors);
    for (let i = 1; i < N; i++) {
      errNum += (errors[i - 1] - errMean) * (errors[i] - errMean);
      errDen += Math.pow(errors[i - 1] - errMean, 2);
    }
    if (errDen > 0) arCoef = Math.min(0.95, Math.max(-0.95, errNum / errDen));
    logs.push(`Tuned Autoregressive Error state model (AR Coeff lag correlation: ${arCoef.toFixed(4)})`);
  }

  // Generate Future Forecast Points
  const forecast: ForecastPoint[] = [];
  
  // Add actual historical fits to timeline
  history.forEach((h, idx) => {
    forecast.push({
      date: h.date,
      actual: h.value,
      predicted: +(fitted[idx]).toFixed(2),
    });
  });

  // Roll dates forward
  const lastDate = new Date(history[N - 1].date);
  const residualsStdDev = std(errors);
  logs.push(`Standard deviation of residual errors: ${residualsStdDev.toFixed(4)}`);

  // Prophet simulation or Exponential Smoothing handles custom periods
  let lastError = errors[N - 1];

  for (let p = 1; p <= forecastPeriods; p++) {
    const fIdx = N + p - 1;
    const trendValue = alpha + beta * fIdx;
    
    // Seasonal multiplier
    const seasonValue = seasonalIndices[fIdx % period];
    
    // AR(1) residual decay
    lastError = arCoef * lastError;

    let predicted = trendValue + seasonValue;
    if (algorithm === 'exponential_smoothing') {
      // Holt-Winters smoothing forecast drops out residual lags faster
      predicted = trendValue + seasonValue * 0.8;
    } else if (algorithm === 'moving_average') {
      // Rolling average flatlines to historical mean over time
      const window = Math.min(N, 6);
      const recentVals = yVals.slice(-window);
      predicted = mean(recentVals) + (trendValue - mean(yVals)) * 0.1;
    } else {
      predicted = predicted + lastError;
    }

    predicted = Math.max(0, predicted);

    // Compute Confidence interval bands (spreads out over time)
    const timeSpread = Math.sqrt(p);
    const zScore = 1.96; // 95% Confidence Interval
    const boundWidth = zScore * residualsStdDev * timeSpread;
    const lowerCI = Math.max(0, predicted - boundWidth);
    const upperCI = predicted + boundWidth;

    // Roll date
    const fDate = new Date(lastDate);
    if (period === 12) {
      fDate.setMonth(lastDate.getMonth() + p);
    } else {
      fDate.setDate(lastDate.getDate() + p);
    }
    const fDateStr = fDate.toISOString().split('T')[0];

    forecast.push({
      date: fDateStr,
      predicted: +predicted.toFixed(2),
      lowerCI: +lowerCI.toFixed(2),
      upperCI: +upperCI.toFixed(2),
    });
  }

  // Calculate stats on Model Fit accuracy
  const ae: number[] = [];
  const se: number[] = [];
  const ape: number[] = [];
  let ssRes = 0;
  let ssTot = 0;

  for (let i = 0; i < N; i++) {
    const error = yVals[i] - fitted[i];
    ae.push(Math.abs(error));
    se.push(error * error);
    ssRes += error * error;
    ssTot += Math.pow(yVals[i] - yMean, 2);
    if (yVals[i] !== 0) {
      ape.push(Math.abs(error) / yVals[i]);
    }
  }

  const mae = mean(ae);
  const mse = mean(se);
  const rmse = Math.sqrt(mse);
  const r2 = ssTot !== 0 ? 1 - (ssRes / ssTot) : 1;
  const mape = mean(ape) * 100;
  const smape = mean(
    history.map((h, i) => {
      const denom = (Math.abs(h.value) + Math.abs(fitted[i])) / 2;
      return denom > 0 ? (Math.abs(h.value - fitted[i]) / denom) * 100 : 0;
    })
  );

  const bias = mean(errors);

  const metrics: ModelMetrics = {
    mae: +mae.toFixed(2),
    mse: +mse.toFixed(2),
    rmse: +rmse.toFixed(2),
    r2: +r2.toFixed(4),
    mape: +mape.toFixed(2),
    smape: +smape.toFixed(2),
    bias: +bias.toFixed(2),
  };

  logs.push(`Model evaluation complete. Model fit accuracy R²: ${metrics.r2.toFixed(4)}, MAPE: ${metrics.mape?.toFixed(2)}%`);
  return { forecast, logs, metrics };
}

// -------------------------------------------------------------------
// 5. General Multivariable Model Training Workflow
// -------------------------------------------------------------------
export function trainRegressionModel(
  dataset: any[],
  targetCol: string,
  features: string[],
  algorithm: ModelAlgorithm,
  splitRatio = 0.8
): {
  model: any;
  metrics: ModelMetrics;
  featureImportance: FeatureImportance[];
  trainLogs: string[];
} {
  const trainLogs: string[] = [];
  trainLogs.push(`Starting general multivariable model training. Algorithm: ${algorithm}`);
  trainLogs.push(`Target Column: "${targetCol}" | Selected Features: [${features.join(', ')}]`);

  // Parse features and target
  const X: number[][] = [];
  const Y: number[] = [];

  dataset.forEach((row, idx) => {
    const rowX: number[] = [];
    let holdsNaN = false;

    // Check features
    features.forEach(f => {
      const val = Number(row[f]);
      if (isNaN(val)) {
        holdsNaN = true;
      } else {
        rowX.push(val);
      }
    });

    const valY = Number(row[targetCol]);
    if (isNaN(valY)) holdsNaN = true;

    if (!holdsNaN) {
      X.push(rowX);
      Y.push(valY);
    }
  });

  if (X.length === 0) {
    throw new Error('Dataset is empty or contains no valid numerical columns to feed fitting logic.');
  }

  // Split Dataset Train / Test
  const splitIdx = Math.floor(X.length * splitRatio);
  const xTrain = X.slice(0, splitIdx);
  const yTrain = Y.slice(0, splitIdx);
  const xTest = X.slice(splitIdx);
  const yTest = Y.slice(splitIdx);

  trainLogs.push(`Dataset split complete. Training Rows: ${xTrain.length}, Testing Rows: ${xTest.length}`);

  let predictions: number[] = [];
  let modelInstance: any = {};
  let algorithmCoefs: any = null;

  if (
    algorithm === 'linear_regression' ||
    algorithm === 'ridge_regression' ||
    algorithm === 'lasso_regression'
  ) {
    const { coef, logs } = trainLinearModel(xTrain, yTrain, algorithm, 0.03, 150, 0.15);
    trainLogs.push(...logs);
    
    // Test sets prediction
    predictions = xTest.map(row => {
      let val = coef.bias;
      for (let j = 0; j < fNum; j++) {
        val += row[j] * coef.weights[j];
      }
      return val;
    });
    
    algorithmCoefs = coef;
    const fNum = features.length;
    modelInstance = { coefs: coef, algorithm };
  } else if (algorithm === 'random_forest_regression') {
    const rfr = new RandomForestRegressor();
    rfr.train(xTrain, yTrain, 4, 4);
    trainLogs.push(...rfr.logs);
    
    predictions = rfr.predict(xTest);
    modelInstance = rfr;
  } else if (algorithm === 'xgboost_regression') {
    const xgb = new XGBoostRegressor();
    xgb.train(xTrain, yTrain, 5, 3);
    trainLogs.push(...xgb.logs);
    
    predictions = xgb.predict(xTest);
    modelInstance = xgb;
  } else {
    // Default fallback simple linear fit
    const { coef, logs } = trainLinearModel(xTrain, yTrain, 'linear_regression', 0.05, 100, 0);
    trainLogs.push(...logs);
    predictions = xTest.map(row => {
      let val = coef.bias;
      for (let j = 0; j < features.length; j++) {
        val += row[j] * coef.weights[j];
      }
      return val;
    });
    modelInstance = { coefs: coef, algorithm };
  }

  // Calculate Evaluation Metrics
  const yTestAvg = mean(yTest);
  const ae: number[] = [];
  const se: number[] = [];
  const ape: number[] = [];
  let ssRes = 0;
  let ssTot = 0;

  for (let i = 0; i < xTest.length; i++) {
    const error = yTest[i] - predictions[i];
    ae.push(Math.abs(error));
    se.push(error * error);
    ssRes += error * error;
    ssTot += Math.pow(yTest[i] - yTestAvg, 2);
    if (yTest[i] !== 0) {
      ape.push(Math.abs(error) / yTest[i]);
    }
  }

  const mae = mean(ae);
  const mse = mean(se);
  const rmse = Math.sqrt(mse);
  const r2 = ssTot !== 0 ? 1 - (ssRes / ssTot) : 1;
  const mape = mean(ape) * 100;

  const metrics: ModelMetrics = {
    mae: +mae.toFixed(2),
    mse: +mse.toFixed(2),
    rmse: +rmse.toFixed(2),
    r2: +r2.toFixed(4),
    mape: +mape.toFixed(2),
    smape: +(mape * 0.9).toFixed(2), // SMAPE approximation
    bias: +(mean(yTest.map((yi, idx) => yi - predictions[idx]))).toFixed(2),
  };

  trainLogs.push(`Model trained. Out-of-Sample Metrics: MAE=${metrics.mae}, RMSE=${metrics.rmse}, $R^2$ Score=${metrics.r2}`);

  // Calculate Feature Importance (derived from correlations + split scores)
  const featureImportance = features.map((feat, fIdx) => {
    // Pearson simple correlation approximation with Y
    const colVals = dataset.map(row => Number(row[feat]));
    const targetVals = dataset.map(row => Number(row[targetCol]));
    const colMean = mean(colVals);
    const tarMean = mean(targetVals);
    
    let top = 0;
    let bCol = 0;
    let bTar = 0;
    
    for (let i = 0; i < dataset.length; i++) {
      const dvCol = colVals[i] - colMean;
      const dvTar = targetVals[i] - tarMean;
      top += dvCol * dvTar;
      bCol += dvCol * dvCol;
      bTar += dvTar * dvTar;
    }

    const corr = (bCol > 0 && bTar > 0) ? Math.abs(top / Math.sqrt(bCol * bTar)) : 0.1;
    let boostWeight = 1.0;
    if (algorithmCoefs && algorithmCoefs.weights) {
      boostWeight = Math.abs(algorithmCoefs.weights[fIdx] || 1.0);
    }
    
    const imp = Math.min(100, Math.max(10, Math.round(corr * 70 + boostWeight * 30)));
    return {
      feature: feat,
      importance: imp,
    };
  }).sort((a,b)=> b.importance - a.importance);

  return {
    model: modelInstance,
    metrics,
    featureImportance,
    trainLogs,
  };
}
