export interface DashboardMetrics {
    totalPatients: number;
    activePatients: number;
    criticalAlerts: number;
    moderateRisk: number;
    interventionsToday: number;
    riskDistribution: { level: string; count: number }[];
}
