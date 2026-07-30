import { RISK_CONFIG, type RiskLevel, type RiskConfig } from '../constants/risk.config';

const RISK_MAP: Record<string, RiskLevel> = {
  green: 'low',
  low: 'low',
  bajo: 'low',
  estable: 'low',
  yellow: 'moderate',
  moderate: 'moderate',
  medio: 'moderate',
  moderado: 'moderate',
  red: 'high',
  high: 'high',
  alto: 'high',
  critico: 'high',
  crítico: 'high'
};

export const getRiskConfig = (level?: string): RiskConfig => {
  if (!level) return RISK_CONFIG.unknown;
  const normalized = RISK_MAP[String(level).trim().toLowerCase()] ?? (level as RiskLevel);
  return RISK_CONFIG[normalized] ?? RISK_CONFIG.unknown;
};

export const getRiskColor = (level?: string): string => getRiskConfig(level).color;
export const getRiskLabel = (level?: string): string => getRiskConfig(level).label;
export const getRiskClass = (level?: string): string => getRiskConfig(level).cssClass;
export const getRiskIcon = (level?: string): string => getRiskConfig(level).icon;
export const getRiskPriority = (level?: string): number => getRiskConfig(level).priority;
