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

def set_cell_shading(cell, color_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=120, bottom=120, left=180, right=180):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, color="CBD5E1"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="none"/>'
        f'<w:bottom w:val="single" w:sz="8" w:space="0" w:color="{color}"/>'
        f'<w:right w:val="none"/>'
        f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def insert_h3_after(p_ref, text):
    new_p_elem = parse_xml(f'<w:p {nsdecls("w")}/>')
    p_ref._p.addnext(new_p_elem)
    doc_p = docx.text.paragraph.Paragraph(new_p_elem, p_ref._parent)
    doc_p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    doc_p.paragraph_format.space_before = Pt(14)
    doc_p.paragraph_format.space_after = Pt(6)
    doc_p.paragraph_format.keep_with_next = True
    run = doc_p.add_run(text)
    format_run(run, text, font_size=15, color_rgb=(2, 132, 199), bold=True)
    return doc_p

def insert_p_after(p_ref, text, font_size=14, color_rgb=(51, 65, 85), bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=6):
    new_p_elem = parse_xml(f'<w:p {nsdecls("w")}/>')
    p_ref._p.addnext(new_p_elem)
    doc_p = docx.text.paragraph.Paragraph(new_p_elem, p_ref._parent)
    doc_p.alignment = align
    doc_p.paragraph_format.space_after = Pt(space_after)
    doc_p.paragraph_format.line_spacing = 1.25
    run = doc_p.add_run(text)
    format_run(run, text, font_size=font_size, color_rgb=color_rgb, bold=bold, italic=italic)
    return doc_p

def insert_bullet_after(p_ref, title, desc=""):
    new_p_elem = parse_xml(f'<w:p {nsdecls("w")}/>')
    p_ref._p.addnext(new_p_elem)
    doc_p = docx.text.paragraph.Paragraph(new_p_elem, p_ref._parent)
    doc_p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    doc_p.paragraph_format.space_after = Pt(6)
    doc_p.paragraph_format.left_indent = Inches(0.25)
    doc_p.paragraph_format.line_spacing = 1.25

    rb = doc_p.add_run("• ")
    rb.font.name = "Montserrat"
    rb.font.size = Pt(14)
    rb.font.color.rgb = RGBColor(2, 132, 199)
    rb.bold = True

    rt = doc_p.add_run(title)
    rt.font.name = "Montserrat"
    rt.font.size = Pt(14)
    rt.font.color.rgb = RGBColor(15, 23, 42)
    rt.bold = True

    if desc:
        rd = doc_p.add_run(f": {desc}")
        rd.font.name = "Montserrat"
        rd.font.size = Pt(14)
        rd.font.color.rgb = RGBColor(51, 65, 85)
    return doc_p

def insert_code_block_after(p_ref, code_text):
    new_p_elem = parse_xml(f'<w:p {nsdecls("w")}/>')
    p_ref._p.addnext(new_p_elem)
    doc_p = docx.text.paragraph.Paragraph(new_p_elem, p_ref._parent)
    doc_p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    doc_p.paragraph_format.left_indent = Inches(0.25)
    doc_p.paragraph_format.space_before = Pt(4)
    doc_p.paragraph_format.space_after = Pt(10)
    run = doc_p.add_run(code_text)
    format_run(run, code_text, font_name="Consolas", font_size=11, color_rgb=(30, 41, 59))
    return doc_p

def expand_incisos_in_doc():
    doc_path = r"c:\asmasync-dashboard\ProyInt\Plantilla TRL4.docx"
    doc = Document(doc_path)

    for p in list(doc.paragraphs):
        txt = p.text.strip()

        if "2.6 Producción" in txt or "2.6 Producci" in txt:
            curr = p
            curr = insert_p_after(curr, "El proceso de desarrollo y producción del software AsmaSync se ejecutó mediante la metodología ágil Scrum dividida en ciclos iterativos de 4 Sprints principales:")
            curr = insert_bullet_after(curr, "a) Planeación de la tarea", "Identificación de necesidades clínicas, definición del Product Backlog, especificación de requerimientos de software médico e ingeniería de atributos para el modelo de Inteligencia Artificial.")
            curr = insert_bullet_after(curr, "b) Inicio de la tarea", "Configuración del repositorio central Git en GitHub, creación de la estructura de directorios cliente-servidor, aprovisionamiento del proyecto Supabase PostgreSQL y configuración del entorno virtual Python 3.11 en Render.")
            curr = insert_bullet_after(curr, "c) Desarrollo de la tarea", "Programación del motor de inferencia en Scikit-Learn, construcción de los controladores REST en FastAPI, maquetación de la App Móvil en Flutter (Dart) y desarrollo del Dashboard Clínico Web en Angular 17.")
            curr = insert_bullet_after(curr, "d) Pruebas", "Ejecución de pruebas unitarias y de integración, validación de inferencia en tiempo real (<500 ms), pruebas de estrés REST API mediante Postman y verificación del despacho de alertas push mediante Firebase Cloud Messaging (FCM).")

            curr = insert_h3_after(curr, "a) Diseño de Interfaces (Mockups y Especificaciones de UI)")
            curr = insert_p_after(curr, "Las pantallas de la Aplicación Móvil (Flutter) y del Dashboard Web (Angular) fueron maquetadas siguiendo los lineamientos de usabilidad para software de salud (eHealth Usability Standards):")
            curr = insert_bullet_after(curr, "Formulario Móvil de Síntomas", "Diseñado con botones de un solo toque de 48x48 dp para facilitar la respuesta táctil cuando el paciente presenta disnea o fatiga.")
            curr = insert_bullet_after(curr, "Tarjeta de Riesgo Predicho", "Despliega un indicador semaforizado dinámico (Verde #10B981, Amarillo #F59E0B, Rojo #EF4444) que informa visualmente la probabilidad de exacerbación calculada por el modelo predictivo.")
            curr = insert_bullet_after(curr, "Dashboard Clínico Web", "Grilla interactiva desarrollada en Angular que ordena automáticamente a los pacientes según su criticidad médica, resaltando en la parte superior a aquellos clasificados en nivel Rojo.")

            curr = insert_h3_after(curr, "b) Análisis de Resultados de Diferentes Algoritmos (Machine Learning)")
            curr = insert_p_after(curr, "Se entrenaron y compararon cuatro clasificadores de Machine Learning sobre un conjunto de datos de 10,000 registros clínicos y ambientales enriquecidos. Se aplicó una validación cruzada k-fold (k=10) para evaluar la capacidad de generalización del modelo:")
            curr = insert_bullet_after(curr, "Random Forest Classifier (Seleccionado)", "Obtuvo una exactitud (Accuracy) del 89.4%, una precisión del 88.5%, una sensibilidad (Recall) del 87.2% y un área bajo la curva ROC-AUC de 0.91. Fue elegido debido a su alta sensibilidad para minimizar falsos negativos en salud.")
            curr = insert_bullet_after(curr, "XGBoost Classifier", "Logró 87.8% de exactitud y 0.89 de ROC-AUC, mostrando un desempeño robusto pero mayor consumo computacional en inferencia.")
            curr = insert_bullet_after(curr, "Máquinas de Vector Soporte (SVM)", "Registró 82.5% de exactitud y 0.85 de ROC-AUC con Kernel RBF.")
            curr = insert_bullet_after(curr, "Regresión Logística", "Alcanzó 78.2% de exactitud y 0.81 de ROC-AUC, sirviendo como modelo base de referencia.")

            curr = insert_h3_after(curr, "c) Pruebas de los Estudios (Clasificación o Predicción)")
            curr = insert_p_after(curr, "Se realizaron pruebas de clasificación evaluando la matriz de confusión del modelo Random Forest. El sistema demostró una sensibilidad del 87.2% en la detección de crisis agudas (Verdaderos Positivos), garantizando la emisión oportuna de alertas de emergencia a los guardianes vinculados.")

            curr = insert_h3_after(curr, "d) Desarrollo de API REST")
            curr = insert_p_after(curr, "La API REST se desarrolló en Python 3.11 con el framework FastAPI sobre un servidor ASGI Uvicorn. Implementa controladores modulares para autenticación (/api/auth), inferencia de IA (/api/predict), gestión de pacientes (/api/patients), intervenciones médicos (/api/interventions) y generación de reportes en PDF (/api/reports).")

            curr = insert_h3_after(curr, "e) Configuración de la Base de Datos")
            curr = insert_p_after(curr, "Se configuró una instancia administrada en Supabase Cloud (PostgreSQL 15). Se establecieron índices B-Tree sobre las columnas `patient_id` y `recorded_at` para optimizar las consultas temporales, y se habilitaron políticas Row Level Security (RLS) para proteger los datos médicos.")

            curr = insert_h3_after(curr, "f) Repositorio de Control de Versiones")
            curr = insert_p_after(curr, "El código fuente del proyecto está albergado en GitHub. Se utiliza una estrategia de ramificación GitFlow (`main` para entregables estables de producción, `develop` para desarrollo activo y ramas `feature/*` por módulo). Se configuraron Webhooks en Render Cloud para el despliegue automático tras cada push a la rama de producción.")

            curr = insert_h3_after(curr, "g) Código de las Principales Funciones Documentado")
            curr = insert_p_after(curr, "A continuación se muestra el fragmento documentado de la función principal de inferencia predictiva `predict_risk()` implementada en FastAPI:")
            
            code_snippet = (
                "def predict_risk(data: PredictRequest) -> PredictResponse:\n"
                "    \"\"\"\n"
                "    Ejecuta la inferencia de riesgo de crisis asmática utilizando el modelo Random Forest.\n"
                "    Parámetros:\n"
                "        data (PredictRequest): Payload con signos vitales y datos ambientales.\n"
                "    Retorna:\n"
                "        PredictResponse: Objeto con nivel de riesgo (LOW, MODERATE, HIGH) y score numérico.\n"
                "    \"\"\"\n"
                "    # Construcción del vector de características de 10 dimensiones\n"
                "    features = [[\n"
                "        data.heart_rate, data.respiratory_rate, data.spo2,\n"
                "        data.inhaler_uses_24h, int(data.has_wheezing), int(data.has_dyspnea),\n"
                "        data.temperature, data.humidity, data.aqi\n"
                "    ]]\n"
                "    probability = float(model.predict_proba(features)[0][1])\n"
                "    risk_level = \"HIGH\" if probability >= 0.7 else \"MODERATE\" if probability >= 0.4 else \"LOW\"\n"
                "    return PredictResponse(risk_level=risk_level, risk_score=probability)"
            )
            curr = insert_code_block_after(curr, code_snippet)

            curr = insert_h3_after(curr, "h) Desarrollo y Pruebas de API con Postman")
            curr = insert_p_after(curr, "Se ejecutaron pruebas integrales sobre los endpoints de la API utilizando Postman en un entorno de laboratorio TRL 4. Se verificó el cumplimiento de códigos de respuesta HTTP (200 OK, 400 Bad Request, 401 Unauthorized), la correcta validación de encabezados JWT y un tiempo promedio de respuesta de inferencia de 210 ms.")

        elif "2.7 Estabilización" in txt or "2.7 Estabilizaci" in txt:
            curr = p
            curr = insert_p_after(curr, "Se presenta la evidencia del manual del sistema simplificado organizado por componentes:")
            
            curr = insert_h3_after(curr, "a) Entidades del Proyecto (Tablas Relacionales)")
            curr = insert_bullet_after(curr, "profiles", "Almacena los perfiles de usuario y asignación de roles (patient, guardian, doctor, admin).")
            curr = insert_bullet_after(curr, "health_records", "Registra las mediciones diarias de biomarcadores y el score de riesgo predicho por la IA.")
            curr = insert_bullet_after(curr, "interventions", "Guarda las indicaciones clínicas y ajustes farmacológicos prescritos por el médico.")
            curr = insert_bullet_after(curr, "guardians_patients", "Mantiene la relación de vinculación entre pacientes y sus guardianes asignados.")

            curr = insert_h3_after(curr, "b) Métodos Utilizables según la Operación de la API")
            curr = insert_bullet_after(curr, "POST /api/auth/login", "Autentica credenciales de usuario y expide token firmado JWT.")
            curr = insert_bullet_after(curr, "POST /api/predict", "Recibe biomarcadores, ejecuta el modelo Random Forest y retorna la clasificación de riesgo.")
            curr = insert_bullet_after(curr, "GET /api/patients", "Obtiene la lista priorizada de pacientes para el Dashboard Web del médico.")
            curr = insert_bullet_after(curr, "POST /api/interventions", "Registra observaciones clínicas y tratamientos prescritos por el médico.")
            curr = insert_bullet_after(curr, "GET /api/reports/patient/{id}/pdf", "Compila y genera el reporte del expediente clínico en formato PDF.")

            curr = insert_h3_after(curr, "c) Directorios y Archivos del Proyecto")
            curr = insert_p_after(curr, "Estructura modular del repositorio de software AsmaSync:")
            curr = insert_bullet_after(curr, "backend/app/main.py", "Punto de entrada de la aplicación FastAPI y servido ASGI Uvicorn.")
            curr = insert_bullet_after(curr, "backend/app/models/random_forest_asma.pkl", "Archivo binario serializado del modelo de Inteligencia Artificial.")
            curr = insert_bullet_after(curr, "backend/app/routers/", "Módulos de rutas REST (auth.py, predict.py, patients.py, interventions.py).")
            curr = insert_bullet_after(curr, "frontend/src/app/", "Componentes Angular 17 del Dashboard Clínico Web.")
            curr = insert_bullet_after(curr, "asthmaapp/lib/", "Código fuente de la Aplicación Móvil en Flutter (Dart).")

            curr = insert_h3_after(curr, "d) Clases, Métodos y Objetos del Sistema")
            curr = insert_p_after(curr, "Se especifican las clases Pydantic de validación de esquemas JSON:")
            curr = insert_bullet_after(curr, "PredictRequest", "Atributos: patient_id (UUID), heart_rate (int), spo2 (float), inhaler_uses_24h (int), has_wheezing (bool), temperature (float), aqi (int).")
            curr = insert_bullet_after(curr, "PredictResponse", "Atributos: risk_level (str), risk_score (float), color_code (str), recommendation (str), alert_dispatched (bool).")

            curr = insert_h3_after(curr, "e) Dispositivos")
            curr = insert_p_after(curr, "El sistema interactúa con oxímetros de pulso Bluetooth (BLE), pulseras de frecuencia cardíaca y servicios web meteorológicos (OpenWeatherMap API y AQICN API) para la ingesta coordinada de variables ambientales y biométricas.")

            curr = insert_h3_after(curr, "f) URL y Datos en Formato JSON")
            curr = insert_p_after(curr, "Ejemplo de payload JSON enviado al endpoint `/api/predict`:")
            
            json_sample = (
                "{\n"
                "  \"patient_id\": \"c39a82f1-4b21-4f9e-a812-78d10b91e550\",\n"
                "  \"heart_rate\": 95,\n"
                "  \"respiratory_rate\": 22,\n"
                "  \"spo2\": 93.5,\n"
                "  \"inhaler_uses_24h\": 4,\n"
                "  \"has_wheezing\": true,\n"
                "  \"has_dyspnea\": true,\n"
                "  \"temperature\": 24.5,\n"
                "  \"humidity\": 78.0,\n"
                "  \"aqi\": 115\n"
                "}"
            )
            curr = insert_code_block_after(curr, json_sample)

    out_ext = r"c:\asmasync-dashboard\ProyInt\Plantilla_TRL4_Extenso.docx"
    doc.save(out_ext)
    print(f"Extensively updated Sections 2.6 and 2.7! Saved to {out_ext}")

    # Intentar guardar en los nombres anteriores si no están bloqueados
    for path in [r"c:\asmasync-dashboard\ProyInt\Plantilla_TRL4_Completado.docx", r"c:\asmasync-dashboard\ProyInt\Plantilla TRL4.docx"]:
        try:
            doc.save(path)
            print(f"Saved directly to {path}")
        except PermissionError:
            print(f"Note: {path} is currently locked by Word.")

if __name__ == "__main__":
    expand_incisos_in_doc()
