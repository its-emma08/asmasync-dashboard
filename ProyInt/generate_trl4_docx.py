import os
import re
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_shading(cell, color_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def apply_run_formatting(run, text, font_name="Montserrat", font_size=11, color_rgb=(51, 65, 85), bold=False, italic=False):
    run.text = text
    run.font.name = font_name
    run.font.size = Pt(font_size)
    run.font.color.rgb = RGBColor(*color_rgb)
    run.bold = bold
    run.italic = italic

def add_formatted_paragraph(doc, text, style='Normal', space_after=6, align=WD_ALIGN_PARAGRAPH.LEFT):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15

    # Simple inline parser for **bold** and *italic* and `code`
    parts = re.split(r'(\*\*.*?\*\*|\*.*?\*|`.*?`)', text)
    for part in parts:
        if not part:
            continue
        if part.startswith('**') and part.endswith('**'):
            run = p.add_run()
            apply_run_formatting(run, part[2:-2], font_size=11, color_rgb=(15, 23, 42), bold=True)
        elif part.startswith('*') and part.endswith('*'):
            run = p.add_run()
            apply_run_formatting(run, part[1:-1], font_size=11, color_rgb=(51, 65, 85), italic=True)
        elif part.startswith('`') and part.endswith('`'):
            run = p.add_run()
            apply_run_formatting(run, part[1:-1], font_name="Consolas", font_size=10, color_rgb=(30, 41, 59))
        else:
            run = p.add_run()
            apply_run_formatting(run, part, font_size=11, color_rgb=(51, 65, 85))
    return p

def add_heading_styled(doc, text, level=1):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    
    if level == 1:
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(8)
        run = p.add_run()
        apply_run_formatting(run, text, font_name="Montserrat", font_size=16, color_rgb=(15, 23, 42), bold=True)
    elif level == 2:
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        run = p.add_run()
        apply_run_formatting(run, text, font_name="Montserrat", font_size=13, color_rgb=(2, 132, 199), bold=True)
    elif level == 3:
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run()
        apply_run_formatting(run, text, font_name="Montserrat", font_size=11.5, color_rgb=(51, 65, 85), bold=True)
    return p

def build_docx():
    doc = Document()

    # Set 1 inch margins
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # PORTADA
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(36)
    p_title.paragraph_format.space_after = Pt(12)
    r = p_title.add_run("UNIVERSIDAD TECNOLÓGICA DEL CENTRO DE VERACRUZ\nINGENIERÍA EN DESARROLLO Y GESTIÓN DE SOFTWARE")
    apply_run_formatting(r, r.text, font_size=14, color_rgb=(15, 23, 42), bold=True)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(24)
    p_sub.paragraph_format.space_after = Pt(36)
    r2 = p_sub.add_run("TRL 4: DESARROLLO A PEQUEÑA ESCALA EN LABORATORIO\nASMASYNC - SISTEMA INTELIGENTE DE MONITOREO Y PREDICCIÓN DE CRISIS ASMÁTICAS")
    apply_run_formatting(r2, r2.text, font_size=16, color_rgb=(2, 132, 199), bold=True)

    # Tabla de integrantes en Portada
    p_int = doc.add_paragraph()
    p_int.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_int.paragraph_format.space_after = Pt(18)
    r_int = p_int.add_run("INTEGRANTES:")
    apply_run_formatting(r_int, r_int.text, font_size=12, color_rgb=(15, 23, 42), bold=True)

    names = [
        "Cerecedo Florencia Eliezer Isaí",
        "González Cuevas Juan Pablo",
        "Peña Ruiz Emmanuel",
        "Serrano Montaño Jocelyn"
    ]
    for name in names:
        p_n = doc.add_paragraph()
        p_n.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_n.paragraph_format.space_after = Pt(3)
        r_n = p_n.add_run(name)
        apply_run_formatting(r_n, r_n.text, font_size=11, color_rgb=(51, 65, 85))

    p_date = doc.add_paragraph()
    p_date.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_date.paragraph_format.space_before = Pt(48)
    r_d = p_date.add_run("FECHA DE ELABORACIÓN: Agosto del 2026")
    apply_run_formatting(r_d, r_d.text, font_size=11, color_rgb=(100, 116, 139), italic=True)

    doc.add_page_break()

    # LEER EL MARKDOWN Y COMPILAR SECCIONES
    md_path = r"c:\asmasync-dashboard\ProyInt\Plantilla_TRL4_Completado.md"
    with open(md_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    proy_dir = r"c:\asmasync-dashboard\ProyInt"
    
    in_code_block = False
    code_buffer = []

    for line in lines:
        line_str = line.rstrip("\n")
        
        if line_str.startswith("```"):
            if in_code_block:
                # Flush code block
                in_code_block = False
                p_code = doc.add_paragraph()
                p_code.paragraph_format.space_after = Pt(8)
                p_code.paragraph_format.left_indent = Inches(0.2)
                r_code = p_code.add_run("\n".join(code_buffer))
                apply_run_formatting(r_code, r_code.text, font_name="Consolas", font_size=9.5, color_rgb=(30, 41, 59))
                code_buffer = []
            else:
                in_code_block = True
                code_buffer = []
            continue

        if in_code_block:
            code_buffer.append(line_str)
            continue

        if not line_str.strip():
            continue

        # Headers
        if line_str.startswith("# "):
            if "TRL 4:" in line_str or "UNIVERSIDAD" in line_str or "INTEGRANTES" in line_str:
                continue # Ya agregados en portada
            add_heading_styled(doc, line_str[2:].strip(), level=1)
        elif line_str.startswith("## "):
            add_heading_styled(doc, line_str[3:].strip(), level=2)
        elif line_str.startswith("### "):
            add_heading_styled(doc, line_str[4:].strip(), level=3)
        elif line_str.startswith("#### "):
            add_heading_styled(doc, line_str[5:].strip(), level=3)
        elif line_str.startswith("|"):
            # Omit table markdown string, we format tables specially if needed or convert line
            continue
        elif line_str.startswith("- ") or line_str.startswith("* "):
            p_bullet = add_formatted_paragraph(doc, line_str[2:].strip(), space_after=4)
            p_bullet.paragraph_format.left_indent = Inches(0.25)
        else:
            add_formatted_paragraph(doc, line_str.strip(), space_after=6)

    # INSERTAR TABLAS Y IMÁGENES CLAVE
    doc.add_page_break()
    add_heading_styled(doc, "ANEXO DE EVIDENCIAS Y MOCKUPS DE LABORATORIO", level=1)

    images = [
        ("security_architecture.png", "Figura 1. Arquitectura de Seguridad y Flujo de Comunicación Cliente-Servidor"),
        ("evidence_dashboard.png", "Figura 2. Dashboard Clínico Web en Tiempo Real (Semaforización de Riesgo)"),
        ("evidence_patient_detail_red.png", "Figura 3. Expediente del Paciente con Alerta Roja de Riesgo Elevado"),
        ("evidence_intervention_form.png", "Figura 4. Registro de Intervención Médica Preventiva"),
        ("evidence_intervention_success.png", "Figura 5. Confirmación de Intervención Clí́nica Registrada"),
        ("evidence_pdf_report.png", "Figura 6. Generación del Expediente Clí́nico Consolidad en PDF"),
        ("postman_api_key_auth.png", "Figura 7. Validación de Inferencia de IA en Laboratorio (Postman REST API)")
    ]

    for img_name, caption in images:
        img_path = os.path.join(proy_dir, img_name)
        if os.path.exists(img_path):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(12)
            p_img.paragraph_format.space_after = Pt(4)
            run_img = p_img.add_run()
            run_img.add_picture(img_path, width=Inches(5.8))
            
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_after = Pt(16)
            r_cap = p_cap.add_run(caption)
            apply_run_formatting(r_cap, caption, font_size=9.5, color_rgb=(100, 116, 139), italic=True)

    output_path = r"c:\asmasync-dashboard\ProyInt\Plantilla_TRL4_Completado.docx"
    doc.save(output_path)
    print(f"Document saved successfully at: {output_path}")

if __name__ == "__main__":
    build_docx()
