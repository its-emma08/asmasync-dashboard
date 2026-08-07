export interface ChartPalette {
    gridColor: string;
    tickColor: string;
    axisTitleColor: string;
    pointBorder: string;
}

export function chartPalette(isDark: boolean): ChartPalette {
    return isDark
        ? {
            gridColor: 'rgba(255, 255, 255, 0.07)',
            tickColor: 'rgba(148, 163, 184, 0.9)',
            axisTitleColor: 'rgba(148, 163, 184, 0.9)',
            pointBorder: '#1c2333'
        }
        : {
            gridColor: 'rgba(226, 232, 240, 0.6)',
            tickColor: '#64748b',
            axisTitleColor: '#94a3b8',
            pointBorder: '#ffffff'
        };
}