export interface DashboardMetrics {
    totalPatients: number;
    criticalAlerts: number;
    moderateRisk: number;
    interventionsToday: number;
    riskDistribution: { level: string; count: number }[];
}
