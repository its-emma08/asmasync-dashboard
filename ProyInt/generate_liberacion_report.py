import os
import docx
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_shading(cell, color):
    shd_xml = f'<w:shd {nsdecls("w")} w:fill="{color}"/>'
    cell._tc.get_or_add_tcPr().append(parse_xml(shd_xml))

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(r'<w:tcMar {}><w:top w:w="{}" w:type="dxa"/><w:bottom w:w="{}" w:type="dxa"/><w:left w:w="{}" w:type="dxa"/><w:right w:w="{}" w:type="dxa"/></w:tcMar>'.format(nsdecls('w'), top, bottom, left, right))
    tcPr.append(tcMar)

def add_justified_indented_paragraph(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.first_line_indent = Inches(0.4)
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(text)
    run.font.name = 'Segoe UI'
    run.font.size = Pt(11)
    run.font.color.rgb = RGBColor(31, 41, 55)
    return p

def add_bullet_point(doc, title, text):
    p = doc.add_paragraph(style='List Bullet')
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    
    run_title = p.add_run(title)
    if title:
        run_title.bold = True
        run_title_colon = p.add_run(": ")
        run_title_colon.bold = True
        run_title_colon.font.name = 'Segoe UI'
        run_title_colon.font.size = Pt(11)
    run_title.font.name = 'Segoe UI'
    run_title.font.size = Pt(11)
    run_title.font.color.rgb = RGBColor(30, 58, 138)
    
    run_text = p.add_run(text)
    run_text.font.name = 'Segoe UI'
    run_text.font.size = Pt(11)
    run_text.font.color.rgb = RGBColor(55, 65, 81)
    return p

def add_heading(doc, text, level=1):
    p = doc.add_paragraph()
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.bold = True
    run.font.name = 'Segoe UI'
    if level == 1:
        p.paragraph_format.space_before = Pt(24)
        p.paragraph_format.space_after = Pt(8)
        run.font.size = Pt(16)
        run.font.color.rgb = RGBColor(30, 58, 138) # UTCV Dark Blue
        
        # Border bottom for H1
        pPr = p._p.get_or_add_pPr()
        pBdr = OxmlElement('w:pBdr')
        bot = OxmlElement('w:bottom')
        bot.set(qn('w:val'), 'single')
        bot.set(qn('w:sz'), '12')
        bot.set(qn('w:space'), '4')
        bot.set(qn('w:color'), '3B82F6') # Light Blue Border
        pBdr.append(bot)
        pPr.append(pBdr)
    else:
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        run.font.size = Pt(12.5)
        run.font.color.rgb = RGBColor(59, 130, 246) # Accent Blue
    return p

def add_tools_table(doc):
    table = doc.add_table(rows=1, cols=3)
    table.alignment = docx.enum.table.WD_TABLE_ALIGNMENT.CENTER
    
    # Table headers
    hdr_cells = table.rows[0].cells
    hdr_cells[0].text = 'Herramienta'
    hdr_cells[1].text = 'Función en el Proyecto'
    hdr_cells[2].text = 'Justificación Técnica'
    
    # Format headers
    for cell in hdr_cells:
        set_cell_shading(cell, "1F2937")  # UTCV Dark Gray
        set_cell_margins(cell)
        for p in cell.paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.bold = True
                r.font.name = 'Segoe UI'
                r.font.size = Pt(10)
                r.font.color.rgb = RGBColor(255, 255, 255)
                
    tools_data = [
        ("Git & GitHub", "Sistema de control de versiones y hosting de repositorios.", "Permite colaboración distribuida, auditoría del historial de cambios e integración fluida con GitHub Actions."),
        ("GitHub Actions", "Automatización de Integración y Despliegue Continuo (CI/CD).", "Ejecuta de manera autónoma las pruebas unitarias y automatiza la construcción y despliegue del ecosistema al detectar commits."),
        ("Docker & Docker Compose", "Contenedorización de microservicios (FastAPI, DBs, Kafka).", "Garantiza la consistencia entre los entornos de desarrollo, QA y producción, evitando fallos de compatibilidad local."),
        ("Angular CLI", "Compilador del Dashboard Frontend.", "Optimiza el peso final de los entregables mediante Ahead-of-Time (AOT) y Tree Shaking para mayor rapidez en la carga."),
        ("Vercel", "Hosting del Dashboard Frontend Angular.", "Provee despliegues rápidos en la periferia de la red (Edge), certificados de seguridad SSL automáticos y previsualizaciones dinámicas."),
        ("Render", "Hosting de Backend API FastAPI y base de datos.", "Alojamiento seguro en Python que soporta el uso aislado de variables de entorno, conexión forzada SSL y auto-escalado funcional.")
    ]
    
    for t_name, t_func, t_just in tools_data:
        row_cells = table.add_row().cells
        row_cells[0].text = t_name
        row_cells[1].text = t_func
        row_cells[2].text = t_just
        
        set_cell_shading(row_cells[0], "F9FAFB")  # light gray
        for idx, cell in enumerate(row_cells):
            set_cell_shading(cell, "F9FAFB" if idx == 0 else "FFFFFF")
            set_cell_margins(cell)
            for p in cell.paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                for r in p.runs:
                    r.font.name = 'Segoe UI'
                    r.font.size = Pt(9)
                    r.font.color.rgb = RGBColor(55, 65, 81)
                    if idx == 0:
                        r.bold = True

    # Set widths
    col_w = [Inches(1.5), Inches(2.2), Inches(2.8)]
    for row in table.rows:
        for idx, width in enumerate(col_w):
            row.cells[idx].width = width

def main():
    doc = Document()
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Segoe UI'
    font.size = Pt(11)

    # Margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Cover Page (UTCV Premium)
    p_univ = doc.add_paragraph()
    p_univ.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_univ.paragraph_format.space_before = Pt(80)
    run_univ = p_univ.add_run("UNIVERSIDAD TECNOLÓGICA DEL CENTRO DE VERACRUZ")
    run_univ.bold = True
    run_univ.font.size = Pt(16)
    run_univ.font.color.rgb = RGBColor(15, 118, 110) # UTCV Green/Teal

    p_carrera = doc.add_paragraph()
    p_carrera.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_carrera.paragraph_format.space_after = Pt(40)
    run_carrera = p_carrera.add_run("TI Desarrollo de Software Multiplataforma")
    run_carrera.font.size = Pt(11)
    run_carrera.font.color.rgb = RGBColor(107, 114, 128)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(30)
    p_title.paragraph_format.space_after = Pt(40)
    run_title = p_title.add_run("Plan de Liberación de Software — AsmaSync\nProyecto Integrador: Sistema de Monitoreo del Asma")
    run_title.bold = True
    run_title.font.size = Pt(22)
    run_title.font.color.rgb = RGBColor(30, 58, 138)

    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_before = Pt(100)
    p_meta.paragraph_format.line_spacing = 1.3
    run_meta = p_meta.add_run(
        "Entregable: Plan de Liberación (Actividad 8) — Segundo Parcial\n"
        "Materia: Proyecto Integrador\n"
        "Fecha: Julio de 2026\n"
        "Cuitláhuac, Veracruz, México"
    )
    run_meta.font.size = Pt(10.5)
    run_meta.font.color.rgb = RGBColor(75, 85, 99)

    doc.add_page_break()

    # Executive Summary
    add_heading(doc, "Resumen Ejecutivo")
    add_justified_indented_paragraph(doc, "Este documento define el Plan de Liberación de Software para el ecosistema AsmaSync, desarrollado en la Universidad Tecnológica del Centro de Veracruz (UTCV). El plan tiene como finalidad estructurar y regular los procesos de integración, pruebas, empaquetado y despliegue del Dashboard Web (Angular) y el Backend API (FastAPI) junto con sus bases de datos y algoritmos de Machine Learning. El objetivo principal es proveer entregas de alta confiabilidad orientadas al sector médico, garantizando la seguridad en la manipulación de datos clínicos y minimizando la tasa de fallos tras cada publicación.")

    # Section 1: Policies
    add_heading(doc, "1. Políticas Comunes que Respaldan el Plan")
    add_justified_indented_paragraph(doc, "Con el fin de asegurar la estabilidad del entorno productivo y la calidad de la información clínica, la liberación de software se respalda en cuatro políticas fundamentales reguladas por el equipo de desarrollo:")
    
    add_bullet_point(doc, "Política de Control de Cambios (Branching Policy)", "Todo desarrollo de nueva funcionalidad o corrección debe ser implementado de manera aislada en ramas 'feature/*' o 'bugfix/*'. La integración hacia ramas compartidas ('develop' o 'main') se realizará exclusivamente mediante Pull Requests con aprobación obligatoria por pares.")
    add_bullet_point(doc, "Política de Calidad y Pruebas", "No se liberará ninguna versión de software si presenta fallos de compilación o lints pendientes. Se exige una cobertura mínima de pruebas unitarias del 80% en frontend y 85% en backend. El modelo predictivo de IA debe verificar una exactitud superior al 90%.")
    add_bullet_point(doc, "Política de Seguridad Médica", "Los datos clínicos e historiales de los pacientes asmáticos (SpO2, PEF) son considerados altamente sensibles. El plan exige que toda liberación cumpla con análisis de vulnerabilidades automatizado en el código y el cifrado de datos (TLS 1.3 y AES-256).")
    add_bullet_point(doc, "Política de Reversión (Rollback)", "Si se detecta una degradación de la estabilidad o una vulnerabilidad crítica dentro de los primeros 60 minutos tras el lanzamiento en producción, el pipeline de CI/CD ejecutará una reversión automática al último contenedor Docker estable.")

    # Section 2: Standards and Regulations
    add_heading(doc, "2. Normativas y Estándares de Regulación")
    add_justified_indented_paragraph(doc, "El desarrollo, la validación y la entrega final del sistema AsmaSync se rige rigurosamente bajo estándares internacionales de ingeniería de software y regulaciones legales del sector salud:")
    
    add_bullet_point(doc, "ISO/IEC 12207 (Procesos del Ciclo de Vida del Software)", "Provee el marco metodológico para guiar todas las actividades de ingeniería, desde el análisis de requisitos médicos hasta el mantenimiento operativo del sistema.")
    add_bullet_point(doc, "ISO/IEC 25010 (Calidad del Producto de Software)", "Se enfoca en evaluar y asegurar factores indispensables como la confidencialidad de la información, la facilidad de uso de la app móvil y la alta disponibilidad del Dashboard.")
    add_bullet_point(doc, "SemVer 2.0.0 (Versionamiento Semántico)", "Establece la estructura de versiones MAJOR.MINOR.PATCH (ej. v2.1.4) para denotar cambios significativos en el código de forma coherente.")
    add_bullet_point(doc, "Regulaciones de Salud y Privacidad (NOM-004 e HIPAA)", "Se cumple con la norma NOM-004-SSA3-2012 de expediente clínico electrónico en México, y los estándares HIPAA y GDPR a nivel internacional para garantizar los derechos de privacidad y portabilidad de los pacientes.")

    # Section 3: Tools
    add_heading(doc, "3. Herramientas de Liberación de Software y Justificación")
    add_justified_indented_paragraph(doc, "A continuación, se listan y justifican técnicamente las herramientas de software empleadas para dar soporte a todo el pipeline de publicación y versionado:")
    
    add_tools_table(doc)
    doc.add_paragraph()  # spacing after table

    # Section 4: Timeline and Bug Fixing
    add_heading(doc, "4. Cronograma de Etapas de Publicación y Corrección de Errores")
    add_justified_indented_paragraph(doc, "El cronograma de liberación del proyecto AsmaSync se divide en cuatro etapas principales para asegurar una transición progresiva y segura hacia producción. Cada etapa incluye una ventana de tiempo predefinida y obligatoria para la corrección de errores:")
    
    add_bullet_point(doc, "Etapa 1: Fase Alpha (Entorno Local y Pruebas Unitarias)", "Objetivo: Validar los componentes web y la lógica del API. Duración: 15 días totales. Ventana de corrección: 5 días específicos integrados para resolver fallos de lógica previos al merge en 'develop'.")
    add_bullet_point(doc, "Etapa 2: Fase Beta (Entorno de Integración y Pruebas de Sistema)", "Objetivo: Probar la integración real con bases de datos y la cola de eventos de biosensores. Duración: 17 días totales. Ventana de corrección: 7 días asignados para resolver incidencias de integración en staging.")
    add_bullet_point(doc, "Etapa 3: Candidato de Liberación (Release Candidate - RC)", "Objetivo: Validar el sistema en condiciones idénticas a producción con usuarios finales de control (médicos y pacientes piloto). Duración: 11 días totales. Ventana de corrección: 4 días dedicados únicamente a bugs críticos antes del lanzamiento.")
    add_bullet_point(doc, "Etapa 4: Producción y Lanzamiento (Go-Live)", "Objetivo: Despliegue oficial en producción. Duración: 10 días totales (incluye estabilización). Ventana de corrección (Hotfixes): 3 días dedicados a monitorizar telemetría y aplicar parches inmediatos ante incidentes post-lanzamiento.")

    # Save document
    out_path = r"c:\asmasync-dashboard\ProyInt\Plan_Liberacion_Software.docx"
    doc.save(out_path)
    print(f"Document saved successfully at: {out_path}")

if __name__ == '__main__':
    main()
