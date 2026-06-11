/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dataset, DatasetColumn } from './types';

// Helper to calculate statistics of numeric rows
function getNumericStats(data: any[], colName: string) {
  const vals = data.map(d => Number(d[colName])).filter(v => !isNaN(v));
  if (vals.length === 0) return { mean: 0, min: 0, max: 0, stdDev: 0 };
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const sum = vals.reduce((a, b) => a + b, 0);
  const mean = sum / vals.length;
  const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
  const stdDev = Math.sqrt(variance);
  return { mean, min, max, stdDev };
}

// Generate Sales & Marketing Forecasting Dataset
// 36 months of historical data (monthly, ending just before the current date: May 2026)
export function generateSalesDataset(): Dataset {
  const data: any[] = [];
  const startYear = 2023;
  
  // High-fidelity sales data with seasonality (summer slump, Q4 surge) and marketing budget impacts
  for (let m = 0; m < 42; m++) {
    const year = startYear + Math.floor(m / 12);
    const monthVal = (m % 12) + 1;
    const monthStr = monthVal < 10 ? `0${monthVal}` : `${monthVal}`;
    const dateStr = `${year}-${monthStr}-01`;
    
    // Trend increasing over time
    const trend = 150 + m * 3.5;
    
    // Seasonality factors: Q4 has huge peaks (Christmas/holidays), July/August is summer dip
    let seasonality = 1.0;
    if (monthVal === 11 || monthVal === 12) {
      seasonality = 1.25; // +25% in Nov/Dec
    } else if (monthVal === 7 || monthVal === 8) {
      seasonality = 0.85; // -15% in Jul/Aug
    } else if (monthVal === 3 || monthVal === 4) {
      seasonality = 1.05; // Spring mild bump
    }
    
    // Marketing budget fluctuates between $10k and $25k, with some upward trend
    const marketingBudget = 10000 + (m * 200) + (Math.sin(m) * 3000) + (m % 5 === 0 ? 4000 : 0);
    const marketingImpact = (marketingBudget - 10000) * 0.005; 
    
    // Price Index (slightly rising due to inflation, baseline index 100)
    const priceIndex = +(100 + (m * 0.3) + Math.cos(m * 0.5) * 2).toFixed(1);
    const priceImpactByDemandLaw = (100 - priceIndex) * 0.8; // higher price lowers sales slightly
    
    // Competitor Score (1 to 10, lower is better competitor status, or can mean our market share)
    const competitorScore = +(5 + Math.sin(m * 0.8) * 1.5).toFixed(1);
    const competitorImpact = (5 - competitorScore) * 3.5;
    
    // Multiplicative noise with anomalies (e.g. Month 18 was a supply chain disruption, Month 28 had marketing campaign viral burst)
    let noise = 1 + (Math.random() * 0.06 - 0.03); // +/- 3%
    if (m === 17) noise -= 0.15; // Supply chain strike! -15%
    if (m === 27) noise += 0.18; // Viral video! +18%
    
    const sales = +( (trend * seasonality + marketingImpact + priceImpactByDemandLaw + competitorImpact) * noise ).toFixed(2);
    const isHolidayMonth = (monthVal === 11 || monthVal === 12 || monthVal === 5);
    
    // Missing values simulation (we can introduce 2 missing values on priceIndex to let clients test data cleaning!)
    const processedPriceIndex = (m === 12 || m === 25) ? null : priceIndex;
    
    data.push({
      Date: dateStr,
      Sales_Revenue_K: sales,
      Marketing_Budget_K: +(marketingBudget / 1000).toFixed(1),
      Price_Index: processedPriceIndex,
      Competitor_Score: competitorScore,
      Holiday_Season: isHolidayMonth ? 'Yes' : 'No',
      Region: m % 3 === 0 ? 'North' : m % 3 === 1 ? 'South' : 'West',
    });
  }

  const columns: DatasetColumn[] = [
    { name: 'Date', type: 'datetime', missingCount: 0, uniqueCount: data.length },
    { 
      name: 'Sales_Revenue_K', 
      type: 'numeric', 
      missingCount: 0, 
      uniqueCount: new Set(data.map(d => d.Sales_Revenue_K)).size,
      ...getNumericStats(data, 'Sales_Revenue_K')
    },
    { 
      name: 'Marketing_Budget_K', 
      type: 'numeric', 
      missingCount: 0, 
      uniqueCount: new Set(data.map(d => d.Marketing_Budget_K)).size,
      ...getNumericStats(data, 'Marketing_Budget_K')
    },
    { 
      name: 'Price_Index', 
      type: 'numeric', 
      missingCount: 2, 
      uniqueCount: new Set(data.map(d => d.Price_Index)).size,
      ...getNumericStats(data, 'Price_Index')
    },
    { 
      name: 'Competitor_Score', 
      type: 'numeric', 
      missingCount: 0, 
      uniqueCount: new Set(data.map(d => d.Competitor_Score)).size,
      ...getNumericStats(data, 'Competitor_Score')
    },
    { name: 'Holiday_Season', type: 'categorical', missingCount: 0, uniqueCount: 2 },
    { name: 'Region', type: 'categorical', missingCount: 0, uniqueCount: 3 }
  ];

  return {
    id: 'sales_marketing_monthly',
    name: 'Sales & Marketing Historical Feed',
    description: '42 months of historical corporate sales metrics aggregated monthly by business region, featuring advertising budget and competitive performance trackers.',
    rowCount: data.length,
    columns,
    data,
    createdAt: new Date().toISOString(),
    dataQualityScore: 94, // Out of 100 because of 2 missing prices
  };
}

// Generate Supply Chain & Operations Demand Dataset (Daily, 90 days of records)
export function generateOperationsDataset(): Dataset {
  const data: any[] = [];
  const startYear = 2026;
  const startMonth = 1; // Jan 2026
  
  // Base Date generator
  const dateSeed = new Date(startYear, startMonth, 1);
  
  for (let d = 0; d < 120; d++) {
    const curDate = new Date(dateSeed);
    curDate.setDate(dateSeed.getDate() + d);
    const dateStr = curDate.toISOString().split('T')[0];
    
    // Midweek busy trend, weekend slump
    const dayOfWeek = curDate.getDay(); // 0 is Sunday, 6 is Saturday
    let weekFactor = 1.0;
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekFactor = 0.65; // lower logistics on weekends
    } else if (dayOfWeek === 2 || dayOfWeek === 3 || dayOfWeek === 4) {
      weekFactor = 1.15; // Peak operations
    }
    
    const baseDemand = 450 + d * 0.4;
    const weatherTemp = +(15 + Math.sin(d * 0.1) * 12 + (Math.random() * 4 - 2)).toFixed(1);
    
    // Higher temp lowers demand slightly (simulating autumn heating products demand)
    const tempImpact = (15 - weatherTemp) * 2.5;
    
    // Staff metrics (typically between 12 and 18 workers on shift)
    const staffCount = dayOfWeek === 0 || dayOfWeek === 6 ? 8 : (12 + (d % 4) + (d % 7 === 0 ? 2 : 0));
    const staffImpact = (staffCount - 12) * 12.0;

    let noise = 1 + (Math.random() * 0.08 - 0.04);
    // Outlier simulation: Day 44 has a massive anomaly due to backup grid breakdown (Demand plummeted, Machine temp spiked!)
    if (d === 44) {
      noise = 0.45; // -55% drop in processed demand
    }
    
    const operationalDemand = Math.round((baseDemand * weekFactor + tempImpact + staffImpact) * noise);
    const inventoryLevel = Math.max(0, 5000 - (operationalDemand * 2) + Math.round(Math.cos(d * 0.2) * 500));
    
    data.push({
      Date: dateStr,
      Warehouse_Demand: operationalDemand,
      Inventory_On_Hand: inventoryLevel,
      Active_Staff: staffCount,
      Avg_Machine_Temp: d === 44 ? 98.2 : +(42 + (operationalDemand * 0.03) + Math.sin(d * 0.3) * 3).toFixed(1),
      Weather_Temp_C: weatherTemp,
    });
  }

  const columns: DatasetColumn[] = [
    { name: 'Date', type: 'datetime', missingCount: 0, uniqueCount: data.length },
    { 
      name: 'Warehouse_Demand', 
      type: 'numeric', 
      missingCount: 0, 
      uniqueCount: new Set(data.map(d => d.Warehouse_Demand)).size,
      ...getNumericStats(data, 'Warehouse_Demand')
    },
    { 
      name: 'Inventory_On_Hand', 
      type: 'numeric', 
      missingCount: 0, 
      uniqueCount: new Set(data.map(d => d.Inventory_On_Hand)).size,
      ...getNumericStats(data, 'Inventory_On_Hand')
    },
    { 
      name: 'Active_Staff', 
      type: 'numeric', 
      missingCount: 0, 
      uniqueCount: new Set(data.map(d => d.Active_Staff)).size,
      ...getNumericStats(data, 'Active_Staff')
    },
    { 
      name: 'Avg_Machine_Temp', 
      type: 'numeric', 
      missingCount: 0, 
      uniqueCount: new Set(data.map(d => d.Avg_Machine_Temp)).size,
      ...getNumericStats(data, 'Avg_Machine_Temp')
    },
    { 
      name: 'Weather_Temp_C', 
      type: 'numeric', 
      missingCount: 0, 
      uniqueCount: new Set(data.map(d => d.Weather_Temp_C)).size,
      ...getNumericStats(data, 'Weather_Temp_C')
    }
  ];

  return {
    id: 'supply_chain_operations_daily',
    name: 'Enterprise Supply Chain & Demand Feed',
    description: '120 days of detailed operational warehousing records including daily shipment volume demands, inventories on-hand, weather temperatures, and staff capacity metrics.',
    rowCount: data.length,
    columns,
    data,
    createdAt: new Date().toISOString(),
    dataQualityScore: 97, // Slightly reduced because of day 44 massive outlier
  };
}

// Generate SaaS Traffic & User Growth Dataset (Daily, 150 days of records)
export function generateUsersDataset(): Dataset {
  const data: any[] = [];
  const startYear = 2025;
  const startMonth = 10; // Oct 2025
  const dateSeed = new Date(startYear, startMonth, 1);
  
  for (let d = 0; d < 150; d++) {
    const curDate = new Date(dateSeed);
    curDate.setDate(dateSeed.getDate() + d);
    const dateStr = curDate.toISOString().split('T')[0];
    
    // Constant upward trend (growth phase)
    const baseDAU = 1500 + d * 12.5;
    
    // Weekly cyclical behavior (weekends are low for B2B portal sessions, typical in SaaS)
    const dayOfWeek = curDate.getDay();
    let cycle = 1.0;
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      cycle = 0.55; // 45% less traffic on weekends
    } else {
      cycle = 1.12; // business weekdays
    }
    
    // Incorporate some marketing campaign boosts on days 30-35, 90-95
    let campaignEffort = 0;
    if ((d >= 30 && d <= 35) || (d >= 90 && d <= 95)) {
      campaignEffort = 450;
    }
    
    const noise = 1 + (Math.random() * 0.05 - 0.025);
    const dau = Math.round((baseDAU * cycle + campaignEffort) * noise);
    
    // Sessions usually 1.4-1.6x of DAU
    const sessions = Math.round(dau * (1.4 + Math.cos(d * 0.1) * 0.05));
    // Bounce rate averages 45% with mild randomness (between 40 and 52)
    const bounceRate = +(45 - (d * 0.02) + Math.sin(d) * 3).toFixed(2);
    // User signups (usually correlates strongly with high sessions and low bounce)
    const signups = Math.round(sessions * 0.035 * (1 - bounceRate/100) * (1.2 + Math.random() * 0.2));
    
    data.push({
      Date: dateStr,
      Daily_Active_Users: dau,
      Web_Sessions: sessions,
      Bounce_Rate_Percentage: bounceRate,
      New_User_Signups: signups,
      Platform_Source: d % 4 === 0 ? 'Enterprise_InBound' : d % 4 === 1 ? 'Organic_Search' : d % 4 === 2 ? 'Direct' : 'Social_Media',
    });
  }

  const columns: DatasetColumn[] = [
    { name: 'Date', type: 'datetime', missingCount: 0, uniqueCount: data.length },
    { 
      name: 'Daily_Active_Users', 
      type: 'numeric', 
      missingCount: 0, 
      uniqueCount: new Set(data.map(d => d.Daily_Active_Users)).size,
      ...getNumericStats(data, 'Daily_Active_Users')
    },
    { 
      name: 'Web_Sessions', 
      type: 'numeric', 
      missingCount: 0, 
      uniqueCount: new Set(data.map(d => d.Web_Sessions)).size,
      ...getNumericStats(data, 'Web_Sessions')
    },
    { 
      name: 'Bounce_Rate_Percentage', 
      type: 'numeric', 
      missingCount: 0, 
      uniqueCount: new Set(data.map(d => d.Bounce_Rate_Percentage)).size,
      ...getNumericStats(data, 'Bounce_Rate_Percentage')
    },
    { 
      name: 'New_User_Signups', 
      type: 'numeric', 
      missingCount: 0, 
      uniqueCount: new Set(data.map(d => d.New_User_Signups)).size,
      ...getNumericStats(data, 'New_User_Signups')
    },
    { name: 'Platform_Source', type: 'categorical', missingCount: 0, uniqueCount: 4 }
  ];

  return {
    id: 'saas_user_growth_daily',
    name: 'SaaS Platform Analytics & Growth Feed',
    description: '150 days of digital engagement metrics detailing Daily Active Users (DAU), web hits, platform source groupings, bounce percentages, and successful trial user conversions.',
    rowCount: data.length,
    columns,
    data,
    createdAt: new Date().toISOString(),
    dataQualityScore: 100, // Perfect clean dataset
  };
}
