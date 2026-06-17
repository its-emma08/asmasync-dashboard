import { RISK_CONFIG, type RiskLevel, type RiskConfig } from '../constants/risk.config';

export const getRiskConfig = (level?: string): RiskConfig =>
  RISK_CONFIG[(level as RiskLevel)] ?? RISK_CONFIG.unknown;

export const getRiskColor = (level?: string): string => getRiskConfig(level).color;
export const getRiskLabel = (level?: string): string => getRiskConfig(level).label;
export const getRiskClass = (level?: string): string => getRiskConfig(level).cssClass;
export const getRiskIcon = (level?: string): string => getRiskConfig(level).icon;
export const getRiskPriority = (level?: string): number => getRiskConfig(level).priority;
