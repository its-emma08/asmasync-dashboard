import { Chart } from 'chart.js';

export const externalTooltipHandler = (context: any) => {
    // Tooltip Element
    let tooltipEl = document.getElementById('chartjs-tooltip');

    // Create element on first render
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'chartjs-tooltip';
        tooltipEl.style.opacity = '0';
        tooltipEl.style.pointerEvents = 'none';
        tooltipEl.style.position = 'absolute';
        tooltipEl.style.transition = 'all .1s ease';
        tooltipEl.style.zIndex = '100';

        // Glassmorphism Styles
        tooltipEl.style.background = 'rgba(255, 255, 255, 0.9)';
        tooltipEl.style.backdropFilter = 'blur(8px)';
        (tooltipEl.style as any).webkitBackdropFilter = 'blur(8px)';
        tooltipEl.style.borderRadius = '16px';
        tooltipEl.style.border = '1px solid rgba(255, 255, 255, 0.6)';
        tooltipEl.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        tooltipEl.style.padding = '12px 16px';
        tooltipEl.style.fontFamily = "'Quicksand', sans-serif";
        tooltipEl.style.transform = 'translate(-50%, 0)';

        document.body.appendChild(tooltipEl);
    }

    const tooltipModel = context.tooltip;

    // Hide if no tooltip
    if (tooltipModel.opacity === 0) {
        tooltipEl.style.opacity = '0';
        return;
    }

    // Set caret Position
    tooltipEl.classList.remove('above', 'below', 'no-transform');
    if (tooltipModel.yAlign) {
        tooltipEl.classList.add(tooltipModel.yAlign);
    } else {
        tooltipEl.classList.add('no-transform');
    }

    function getBody(bodyItem: any) {
        return bodyItem.lines;
    }

    // Set Text
    if (tooltipModel.body) {
        const titleLines = tooltipModel.title || [];
        const bodyLines = tooltipModel.body.map(getBody);

        let innerHtml = '<thead>';

        titleLines.forEach((title: string) => {
            innerHtml += `<tr><th style="color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; padding-bottom: 4px; text-align: left;">${title}</th></tr>`;
        });
        innerHtml += '</thead><tbody>';

        bodyLines.forEach((body: string, i: number) => {
            const colors = tooltipModel.labelColors[i];
            const span = `<span style="background:${colors.backgroundColor}; border-color:${colors.borderColor}; border-width: 2px; margin-right: 8px; height: 10px; width: 10px; display: inline-block; border-radius: 50%;"></span>`;

            // Value styling
            const style = 'color: #0f172a; font-size: 14px; font-weight: 700;';
            innerHtml += `<tr><td style="${style} vertical-align: middle;">${span}${body}</td></tr>`;
        });
        innerHtml += '</tbody>';

        const tableRoot = tooltipEl.querySelector('table');
        if (tableRoot) {
            tableRoot.innerHTML = innerHtml;
        } else {
            tooltipEl.innerHTML = `<table>${innerHtml}</table>`;
        }
    }

    const position = context.chart.canvas.getBoundingClientRect();
    const bodyFont = Chart.defaults.font;

    // Display, position, and set styles for font
    tooltipEl.style.opacity = '1';

    // Position handling
    tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
    tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
};
