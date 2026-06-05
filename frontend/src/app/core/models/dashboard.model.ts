export interface DashboardMetrics {
    totalPatients: number;
    activePatients: number;
    criticalAlerts: number;
    moderateRisk: number;
    interventionsToday: number;
    adherenceRate: number | null;
    averagePef: number;
    riskDistribution: { level: string; count: number }[];
    predictorOnline?: boolean;
}
