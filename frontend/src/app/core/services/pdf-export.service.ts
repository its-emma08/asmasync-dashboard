import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfOptions {
    filename?: string;
    paperSize?: 'letter' | 'a4' | 'legal';
    scale?: number;
}

@Injectable({ providedIn: 'root' })
export class PdfExportService {

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

    /**
     * Captures a specific HTMLElement and exports it as a PDF.
     * Uses high-res html2canvas → jsPDF pipeline.
     */
    async exportElement(element: HTMLElement, options: PdfOptions = {}): Promise<void> {
        if (!isPlatformBrowser(this.platformId)) {
            console.warn('PDF export is not supported on the server.');
            return;
        }

        const {
            filename = `AsmaSync_Export_${Date.now()}.pdf`,
            paperSize = 'letter',
            scale = 2
        } = options;

        const canvas = await html2canvas(element, {
            scale,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
            scrollX: 0,
            scrollY: 0
        });

        const imgData = canvas.toDataURL('image/png');

        let pdfWidth: number, pdfPageHeight: number;
        switch (paperSize) {
            case 'a4': pdfWidth = 210; pdfPageHeight = 297; break;
            case 'legal': pdfWidth = 215.9; pdfPageHeight = 355.6; break;
            default: pdfWidth = 215.9; pdfPageHeight = 279.4; break; // letter
        }

        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: paperSize as any });

        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfPageHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfPageHeight;
        }

        // Force download via anchor
        const blob = pdf.output('blob');
        const typedBlob = new Blob([blob], { type: 'application/pdf' });
        const url = URL.createObjectURL(typedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 60000);
    }

    /**
     * Creates a temporary off-screen container from HTML string, renders it,
     * and exports as PDF. Used for patient & profile exports.
     */
    async exportFromHtml(html: string, options: PdfOptions = {}): Promise<void> {
        if (!isPlatformBrowser(this.platformId)) return;
        const container = document.createElement('div');
        container.style.cssText = `
            position: absolute; left: 0; top: 0; opacity: 0; pointer-events: none;
            width: 216mm; background: white;
            font-family: 'Quicksand', 'Inter', sans-serif;
            font-size: 12px; color: #1e293b; line-height: 1.5;
            padding: 20mm 15mm;
        `;
        container.innerHTML = html;
        document.body.appendChild(container);

        try {
            // Give the browser time to render and load fonts
            await new Promise(resolve => setTimeout(resolve, 500));
            await this.exportElement(container, options);
        } catch (error) {
            console.error('Error in PDF Generation rendering:', error);
            throw error;
        } finally {
            document.body.removeChild(container);
        }
    }

    /** Sanitize a name into a safe filename fragment */
    sanitizeName(name: string): string {
        return (name || 'Export')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]/g, '_')
            .slice(0, 40);
    }
}
