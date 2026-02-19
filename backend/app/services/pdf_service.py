import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from app.models.patient import Patient
from app.models.medical import ClinicalHistory, PhysicalExam

class PDFService:
    @staticmethod
    def generate_clinical_history_pdf(patient: Patient, history: ClinicalHistory, exams: list[PhysicalExam]) -> bytes:
        """
        Generates a PDF buffer containing the patient's complete clinical history.
        Compliant with NOM-004-SSA3-2012 for digital document representation.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(name='Justify', alignment=1, spaceAfter=12))
        
        # Content Container
        elements = []
        
        # 1. Header
        elements.append(Paragraph(f"HISTORIA CLÍNICA - ASMASYNC", styles['Title']))
        elements.append(Spacer(1, 12))
        elements.append(Paragraph(f"Fecha de Impresión: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 24))
        
        # 2. Patient Data
        data_patient = [
            ["ID Paciente:", str(patient.id), "Edad:", str(patient.age)],
            ["Nombre:", str(patient.full_name), "Género:", str(patient.gender or "N/A")],
            ["Email:", str(patient.email or "N/A"), "Nivel Riesgo:", str(patient.risk_level.value if hasattr(patient.risk_level, 'value') else patient.risk_level)]
        ]
        
        t_patient = Table(data_patient, colWidths=[1*inch, 2.5*inch, 1*inch, 1.5*inch])
        t_patient.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.black),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 12),
            ('GRID', (0,0), (-1,-1), 1, colors.black)
        ]))
        elements.append(Paragraph("Datos del Paciente", styles['Heading2']))
        elements.append(t_patient)
        elements.append(Spacer(1, 24))
        
        # 3. Clinical History (Background)
        if history:
            elements.append(Paragraph("Antecedentes Heredofamiliares (AHF)", styles['Heading2']))
            elements.append(Paragraph(history.ahf or "Sin datos registrados.", styles['Normal']))
            
            elements.append(Paragraph("Antecedentes Personales No Patológicos (APNP)", styles['Heading2']))
            elements.append(Paragraph(history.apnp or "Sin datos registrados.", styles['Normal']))
            
            elements.append(Paragraph("Antecedentes Personales Patológicos (APP)", styles['Heading2']))
            elements.append(Paragraph(history.app or "Sin datos registrados.", styles['Normal']))
        else:
            elements.append(Paragraph("Nota: No se ha inicializado la historia clínica para este paciente.", styles['Italic']))
        
        elements.append(Spacer(1, 24))
        
        # 4. Physical Exams (Recent)
        elements.append(Paragraph("Últimos Exámenes Físicos", styles['Heading2']))
        if exams:
            data_exams = [["Fecha", "FC (bpm)", "FR (rpm)", "SatO2 (%)", "Temp (°C)"]]
            for exam in exams[:5]:  # Show last 5
                data_exams.append([
                    exam.encounter_date.strftime('%d/%m/%Y') if exam.encounter_date else "N/A",
                    str(exam.heart_rate),
                    str(exam.respiratory_rate),
                    str(exam.oxygen_saturation),
                    str(exam.temperature)
                ])
            
            t_exams = Table(data_exams)
            t_exams.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.whitesmoke),
                ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
                ('ALIGN', (1,1), (-1,-1), 'CENTER'),
            ]))
            elements.append(t_exams)
        else:
            elements.append(Paragraph("Sin exámenes físicos registrados.", styles['Normal']))
            
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()
