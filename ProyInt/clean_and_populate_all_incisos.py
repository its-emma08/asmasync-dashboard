import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def format_run(run, text, font_name="Montserrat", font_size=14, color_rgb=(51, 65, 85), bold=False, italic=False):
    run.text = text
    run.font.name = font_name
    run.font.size = Pt(font_size)
    run.font.color.rgb = RGBColor(*color_rgb)
    run.bold = bold
    run.italic = italic

def format_p(p, text, font_size=14, color_rgb=(51, 65, 85), bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=6):
    p.alignment = align
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.25
    p.text = ""
    run = p.add_run(text)
    format_run(run, text, font_size=font_size, color_rgb=color_rgb, bold=bold, italic=italic)
    return p

def clean_and_populate_trl4():
    doc_path = r"c:\asmasync-dashboard\ProyInt\Plantilla TRL4.docx"
    doc = Document(doc_path)

    # Identificar y reemplazar párrafos con texto de plantilla residual
    remove_keywords = [
        "diagrama de actividades para desarrollar la aplicación.",
        "todo el desarrollo tecnológico se conforma de componentes que son necesarios",
        "se deberá evidenciar:",
        "diseño de interfaces (mockups) en donde se muestren",
        "análisis de resultados de diferentes algoritmos (para el caso de utilizar",
        "pruebas de los estudios (clasificación o predicción).",
        "desarrollo de api",
        "configuración de la base de datos (instalación, configuración",
        "repositorio de control de versiones (instalación, configuración",
        "código de las principales funciones, librerías, etc., que se utilicen",
        "desarrollo y pruebas de api",
        "entidades del proyecto (tablas).",
        "métodos (utilizables según la operación a realizar de la api.)",
        "clases y métodos",
        "a. objetos del sistema",
        "dispositivos",
        "url y datos en formato json (si aplica)"
    ]

    for p in list(doc.paragraphs):
        txt_low = p.text.strip().lower()
        if any(kw == txt_low or (len(kw) > 15 and kw in txt_low) for kw in remove_keywords):
            p.text = "" # Borrar contenido residual

    out_comp = r"c:\asmasync-dashboard\ProyInt\Plantilla_TRL4_Completado.docx"
    out_orig = r"c:\asmasync-dashboard\ProyInt\Plantilla TRL4.docx"
    
    doc.save(out_comp)
    print(f"Saved cleaned version to: {out_comp}")

    try:
        doc.save(out_orig)
        print(f"Saved directly to: {out_orig}")
    except PermissionError:
        print(f"Note: {out_orig} is currently opened in Word. Saved to {out_comp} instead.")

if __name__ == "__main__":
    clean_and_populate_trl4()
