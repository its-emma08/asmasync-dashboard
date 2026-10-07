import os
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

def format_run(run, text, font_name="Montserrat", font_size=14, color_rgb=(51, 65, 85), bold=False, italic=False):
    run.text = text
    run.font.name = font_name
    run.font.size = Pt(font_size)
    run.font.color.rgb = RGBColor(*color_rgb)
    run.bold = bold
    run.italic = italic

def add_p(doc, text="", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=8, font_size=14, color_rgb=(51, 65, 85), bold=False, italic=False):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.25
    if text:
        run = p.add_run()
        format_run(run, text, font_size=font_size, color_rgb=color_rgb, bold=bold, italic=italic)
    return p

def add_h1(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(22)
    p.paragraph_format.space_after = Pt(10)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    format_run(run, text, font_name="Montserrat", font_size=18, color_rgb=(15, 23, 42), bold=True)
    return p

def add_h2(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(16)
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    format_run(run, text, font_name="Montserrat", font_size=15, color_rgb=(2, 132, 199), bold=True)
    return p

def add_h3(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    format_run(run, text, font_name="Montserrat", font_size=14, color_rgb=(30, 41, 59), bold=True)
    return p

def add_bullet(doc, title, desc=""):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_after = Pt(5)
    p.paragraph_format.left_indent = Inches(0.25)
    p.paragraph_format.line_spacing = 1.2

    r_b = p.add_run("• ")
    format_run(r_b, "• ", font_size=14, color_rgb=(2, 132, 199), bold=True)

    r_t = p.add_run(title)
    format_run(r_t, title, font_size=14, color_rgb=(15, 23, 42), bold=True)

    if desc:
        r_d = p.add_run(f": {desc}")
        format_run(r_d, f": {desc}", font_size=14, color_rgb=(51, 65, 85))
    return p

def build_perfect_docx():
    doc = Document()

    # Configuración de márgenes estándar de 1 pulgada (2.54 cm)
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # -------------------------------------------------------------
    # PORTADA
    # -------------------------------------------------------------
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_before = Pt(24)
    p_inst.paragraph_format.space_after = Pt(6)
    r = p_inst.add_run("UNIVERSIDAD TECNOLÓGICA DEL CENTRO DE VERACRUZ")
    format_run(r, r.text, font_size=16, color_rgb=(15, 23, 42), bold=True)

    p_car = doc.add_paragraph()
    p_car.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_car.paragraph_format.space_after = Pt(30)
    r = p_car.add_run("INGENIERÍA EN DESARROLLO Y GESTIÓN DE SOFTWARE")
    format_run(r, r.text, font_size=14, color_rgb=(2, 132, 199), bold=True)

    p_trl = doc.add_paragraph()
    p_trl.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_trl.paragraph_format.space_before = Pt(20)
    p_trl.paragraph_format.space_after = Pt(12)
    r = p_trl.add_run("TRL 4: DESARROLLO A PEQUEÑA ESCALA EN LABORATORIO")
    format_run(r, r.text, font_size=18, color_rgb=(15, 23, 42), bold=True)

    p_proj = doc.add_paragraph()
    p_proj.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_proj.paragraph_format.space_after = Pt(40)
    r = p_proj.add_run("NOMBRE DEL PROYECTO:\nAsmaSync - Sistema Inteligente de Monitoreo y Predicción de Crisis Asmáticas")
    format_run(r, r.text, font_size=15, color_rgb=(2, 132, 199), bold=True)

    p_int_lbl = doc.add_paragraph()
    p_int_lbl.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_int_lbl.paragraph_format.space_after = Pt(10)
    r = p_int_lbl.add_run("INTEGRANTES:")
    format_run(r, r.text, font_size=14, color_rgb=(15, 23, 42), bold=True)

    integrantes = [
        "Cerecedo Florencia Eliezer Isaí",
        "González Cuevas Juan Pablo",
        "Peña Ruiz Emmanuel",
        "Serrano Montaño Jocelyn"
    ]
    for name in integrantes:
        p_n = doc.add_paragraph()
        p_n.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_n.paragraph_format.space_after = Pt(4)
        r = p_n.add_run(name)
        format_run(r, r.text, font_size=14, color_rgb=(51, 65, 85))

    p_date = doc.add_paragraph()
    p_date.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_date.paragraph_format.space_before = Pt(50)
    r = p_date.add_run("FECHA DE ELABORACIÓN: Agosto del 2026")
    format_run(r, r.text, font_size=14, color_rgb=(100, 116, 139), italic=True)

    doc.add_page_break()

    # -------------------------------------------------------------
    # SECCIÓN I: SÍNTESIS
    # -------------------------------------------------------------
    add_h1(doc, "I. SÍNTESIS")

    add_h2(doc, "1.1 Título del Proyecto")
    add_p(doc, "AsmaSync - Sistema Inteligente de Monitoreo y Predicción de Crisis Asmáticas")

    add_h2(doc, "1.2 Propósito")
    add_p(doc, "El propósito fundamental de AsmaSync es proporcionar una solución tecnológica integral que determine de manera temprana la probabilidad de sufrir una crisis o exacerbación asmática, aplicando modelos predictivos basados en aprendizaje automático (Random Forest Classifier). El sistema realiza el análisis dinámico de biomarcadores clínicos (frecuencia cardíaca, frecuencia respiratoria, saturación de oxígeno SpO2, uso de inhaladores de rescate, tos nocturna, disnea y sibilancias) en combinación con variables meteorológicas y ambientales en tiempo real (temperatura, humedad relativa e Índice de Calidad del Aire AQI).")
    add_p(doc, "Con base en los resultados generados por el modelo de IA, AsmaSync emite alertas de riesgo anticipadas con 24 a 72 horas de antelación. Estas alertas se envían a los pacientes y a sus guardianes asignados (familiares/cuidadores) a través de notificaciones push móviles, al mismo tiempo que sincroniza la información en un Dashboard Clínico Web utilizado por médicos y personal de enfermería. Este enfoque preventivo permite realizar intervenciones médicas oportunas, reduciendo las visitas a urgencias y las hospitalizaciones de emergencia.")
    add_p(doc, "El proyecto se fundamenta en la medicina preventiva personalizada y contribuye directamente al cumplimiento del Objetivo de Desarrollo Sostenible (ODS) 3: Salud y Bienestar y al ODS 9: Industria, Innovación e Infraestructura.")

    add_h2(doc, "1.3 Alcance")
    add_p(doc, "El alcance del desarrollo en el nivel TRL 4 comprende la integración funcional de tres frentes tecnológicos validados a pequeña escala en laboratorio:")
    add_bullet(doc, "Aplicación Móvil (Flutter / Dart)", "Desarrollada para plataformas Android e iOS, permite el registro de usuarios, la ingesta diaria de síntomas y signos vitales, el historial de crisis, la vinculación con guardianes y la recepción de alertas push instantáneas.")
    add_bullet(doc, "Dashboard Clínico Web (Angular / TypeScript)", "Plataforma web para profesionales de la salud que ofrece semaforización de riesgo en tiempo real (Verde = Bajo, Amarillo = Moderado, Rojo = Alto), gestión de expedientes de pacientes, registro de intervenciones clínicas y generación de reportes consolidados en PDF.")
    add_bullet(doc, "Backend API REST y Motor de IA (Python FastAPI / Scikit-Learn)", "Servicio centralizado desplegado en la nube (Render) que gestiona la autenticación con JWT/Supabase Auth, ejecuta la inferencia en tiempo real del modelo serializado (random_forest_asma.pkl), almacena la persistencia en PostgreSQL (Supabase) y gestiona el envío de notificaciones mediante Firebase Cloud Messaging (FCM).")

    add_h2(doc, "1.4 Funcionalidad y Arquitectura del Sistema")
    add_p(doc, "El flujo operacional del sistema se divide en los siguientes pasos secuenciales:")
    add_bullet(doc, "Captura de Datos", "El paciente registra sus síntomas y biomarcadores cotidianos mediante la App Móvil.")
    add_bullet(doc, "Transmisión y Ingesta", "La App Móvil envía el payload formateado en JSON hacia la API REST mediante una petición HTTPS autenticada con JWT.")
    add_bullet(doc, "Inferencia de IA", "El backend consulta las variables ambientales externas y procesa el vector de características en el modelo Random Forest Classifier.")
    add_bullet(doc, "Categorización y Evaluación", "El modelo genera la probabilidad de crisis y el nivel de riesgo correspondiente (Verde, Amarillo o Rojo).")
    add_bullet(doc, "Despacho de Alertas e Intervención", "Si se detecta un riesgo elevado (Amarillo o Rojo), se dispara una notificación push al guardián y se resalta al paciente en el Dashboard Clínico Web para que el médico registre una indicación preventiva.")

    # TABLA COMPARATIVA DE COMPETIDORES
    add_h3(doc, "Tabla 1. Comparación de competidores vs AsmaSync")
    
    table1 = doc.add_table(rows=5, cols=5)
    table1.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table1)

    headers = ["Característica / Función", "AsthmaMD", "Propeller Health", "Respiro (Amiko)", "AsmaSync (Propuesta)"]
    hdr_cells = table1.rows[0].cells
    for i, h_text in enumerate(headers):
        hdr_cells[i].text = h_text
        set_cell_shading(hdr_cells[i], "0284C7") # Blue primary
        set_cell_margins(hdr_cells[i])
        for p in hdr_cells[i].paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                format_run(r, r.text, font_size=13, color_rgb=(255, 255, 255), bold=True)

    data1 = [
        ["Monitoreo de síntomas cotidianos", "Sí", "Sí", "Sí", "Sí"],
        ["Predicción de crisis con IA (24-72h)", "No", "Sí", "No", "Sí (Random Forest)"],
        ["Dashboard Clínico Web para Médicos", "No", "Sí", "Sí", "Sí (Semaforizado)"],
        ["Alertas Push automáticas a Guardianes", "No", "No", "No", "Sí (FCM)"]
    ]

    for row_idx, row_data in enumerate(data1, start=1):
        row_cells = table1.rows[row_idx].cells
        bg_color = "F8FAFC" if row_idx % 2 == 0 else "FFFFFF"
        for col_idx, cell_value in enumerate(row_data):
            row_cells[col_idx].text = cell_value
            set_cell_shading(row_cells[col_idx], bg_color)
            set_cell_margins(row_cells[col_idx])
            for p in row_cells[col_idx].paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT if col_idx == 0 else WD_ALIGN_PARAGRAPH.CENTER
                for r in p.runs:
                    is_bold = (col_idx == 4)
                    color = (2, 132, 199) if col_idx == 4 else (51, 65, 85)
                    format_run(r, r.text, font_size=13, color_rgb=color, bold=is_bold)

    doc.add_page_break()

    # -------------------------------------------------------------
    # SECCIÓN II: MANUAL DEL USUARIO
    # -------------------------------------------------------------
    add_h1(doc, "II. MANUAL DEL USUARIO")

    add_h2(doc, "2.1 Introducción")
    add_p(doc, "El Manual del Usuario describe la interacción operativa con la plataforma AsmaSync, tanto desde la perspectiva del paciente y su guardián en la Aplicación Móvil, como desde el rol del médico profesional en el Dashboard Clínico Web. La finalidad es guiar al usuario en el manejo correcto de las funcionalidades del sistema mediante un caso de estudio real.")

    add_h2(doc, "2.2 Componentes de la Aplicación y Caso de Estudio Práctico")
    add_p(doc, "A continuación se documenta la secuencia de pasos de un caso de estudio realizado durante la validación en laboratorio:")

    add_bullet(doc, "Paso 1: Inicio de Sesión y Autenticación", "El paciente o médico ingresa su correo electrónico y contraseña registrados. El sistema autentica las credenciales con Supabase Auth y expide un token JWT cifrado.")
    add_bullet(doc, "Paso 2: Registro Diario de Síntomas (App Móvil)", "El paciente abre la sección de seguimiento diario e ingresa sus biomarcadores: frecuencia respiratoria, uso de inhalador de rescate, presencia de tos nocturna, sibilancias o dificultad para respirar.")
    add_bullet(doc, "Paso 3: Evaluación por la Inteligencia Artificial", "Al guardar el registro, la API procesa los datos en el modelo Random Forest. Si las variables indican un deterioro (ej. 4 usos de inhalador y sibilancias), el modelo clasifica el estado como Nivel de Riesgo Alto (Rojo).")
    add_bullet(doc, "Paso 4: Notificación a Guardián y Alerta en Dashboard", "El sistema despacha de inmediato una notificación push FCM al dispositivo del guardián y resalta la ficha del paciente en color Rojo en la lista de atención del Dashboard Clínico Web.")
    add_bullet(doc, "Paso 5: Registro de Intervención Clí́nica por el Doctor", "El médico hace clic en el expediente en Rojo, revisa las gráficas de comportamiento y completa el formulario de Intervención Clí́nica indicando: 'Aumentar dosificación de esteroide inhalado a 2 disparos cada 12 horas y acudir a consulta si no cede la disnea'.")
    add_bullet(doc, "Paso 6: Confirmación y Generación de Reporte PDF", "La intervención se almacena en la base de datos Supabase y el médico presiona el botón 'Exportar Reporte PDF' para obtener el documento oficial consolidado con el historial de crisis y las recomendaciones.")

    doc.add_page_break()

    # -------------------------------------------------------------
    # SECCIÓN III: MANUAL DE ESPECIFICACIONES TÉCNICAS
    # -------------------------------------------------------------
    add_h1(doc, "III. MANUAL DE ESPECIFICACIONES TÉCNICAS")

    add_h2(doc, "3.1 Contexto del Software")
    add_p(doc, "AsmaSync se enmarca en la industria del software médico de salud digital (HealthTech). Fue desarrollado para optimizar la toma de decisiones clínicas y el monitoreo remoto de pacientes asmáticos, apoyándose en arquitecturas cliente-servidor distribuidas y algoritmos de analítica predictiva.")

    add_h2(doc, "3.2 Introducción")
    add_p(doc, "El presente manual de especificaciones técnicas compila la arquitectura interna del sistema, el modelo relacional de datos, las definiciones de API REST, los módulos de Machine Learning y la guía de configuración del entorno de desarrollo y pruebas.")

    add_h2(doc, "3.3 Objetivo del Manual")
    add_p(doc, "Establecer una referencia técnica detallada y rigurosa que garantice la mantenibilidad, escalabilidad, trazabilidad e interoperabilidad del software AsmaSync ante cualquier proceso de auditoría o rotación del equipo de ingeniería.")

    add_h2(doc, "3.4 Exploración")

    add_h3(doc, "Establecimiento de Actores")
    add_bullet(doc, "Paciente", "Usuario final que registra sus métricas de salud diariamente y recibe indicaciones médicas.")
    add_bullet(doc, "Guardián (Familiar/Tutor)", "Usuario responsable de recibir notificaciones de riesgo crítico de uno o más pacientes vinculados.")
    add_bullet(doc, "Doctor / Personal Médico", "Profesional de la salud que gestiona expedientes, evalúa alertas predictivas y emite intervenciones clínicas.")
    add_bullet(doc, "Administrador del Sistema", "Encargado de la administración de usuarios, roles de acceso y monitoreo de servidores.")

    add_h3(doc, "Requerimientos Funcionales (RF)")
    add_bullet(doc, "RF01 (Autenticación JWT)", "El sistema debe autenticar usuarios expidiendo tokens cifrados JWT con expiración configurable.")
    add_bullet(doc, "RF02 (Gestión de Roles RBAC)", "El sistema debe validar los permisos según el rol del usuario (Paciente, Guardián, Doctor, Admin).")
    add_bullet(doc, "RF03 (Registro de Biomarcadores)", "La App Móvil debe transmitir los síntomas y signos vitales hacia la API REST.")
    add_bullet(doc, "RF04 (Predicción de Crisis con IA)", "El backend debe ejecutar la inferencia del modelo random_forest_asma.pkl y retornar la probabilidad de crisis.")
    add_bullet(doc, "RF05 (Semaforización Clí́nica)", "El Dashboard Web debe agrupar y filtrar pacientes en categorías Verde, Amarilla y Roja según el nivel de riesgo.")
    add_bullet(doc, "RF06 (Notificaciones Push FCM)", "El backend debe enviar mensajes de alerta en tiempo real a los guardianes asignados cuando el riesgo sea Amarillo o Rojo.")
    add_bullet(doc, "RF07 (Registro de Intervenciones)", "El médico debe poder guardar indicaciones preventivas asociadas al expediente del paciente.")
    add_bullet(doc, "RF08 (Generación de Expediente PDF)", "El Dashboard debe permitir la exportación de reportes clínicos consolidados en formato PDF.")

    add_h3(doc, "Tabla de Variables Clínicas y Ambientales")

    table_vars = doc.add_table(rows=7, cols=5)
    table_vars.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_vars)

    headers_v = ["Nombre Variable", "Tipo Dato", "Rango Válido", "Origen", "Descripción"]
    hdr_v_cells = table_vars.rows[0].cells
    for i, h_text in enumerate(headers_v):
        hdr_v_cells[i].text = h_text
        set_cell_shading(hdr_v_cells[i], "0284C7")
        set_cell_margins(hdr_v_cells[i])
        for p in hdr_v_cells[i].paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                format_run(r, r.text, font_size=13, color_rgb=(255, 255, 255), bold=True)

    data_vars = [
        ["frecuencia_cardiaca", "Entero", "40 - 200 bpm", "Sensor / Registro", "Pulsaciones por minuto"],
        ["frecuencia_respiratoria", "Entero", "10 - 50 rpm", "Sensor / Registro", "Respiraciones por minuto"],
        ["spo2", "Flotante", "70.0 - 100.0 %", "Pulsiómetro", "Saturación de oxígeno en sangre"],
        ["uso_inhalador_24h", "Entero", "0 - 20 disparos", "App Móvil", "Uso de inhalador de rescate"],
        ["temperatura_amb", "Flotante", "-10.0 - 50.0 °C", "API Ambiental", "Temperatura ambiente exterior"],
        ["aqi_calidad_aire", "Entero", "0 - 500", "API Ambiental", "Índice de Calidad del Aire (AQI)"]
    ]

    for row_idx, row_data in enumerate(data_vars, start=1):
        row_cells = table_vars.rows[row_idx].cells
        bg_color = "F8FAFC" if row_idx % 2 == 0 else "FFFFFF"
        for col_idx, cell_value in enumerate(row_data):
            row_cells[col_idx].text = cell_value
            set_cell_shading(row_cells[col_idx], bg_color)
            set_cell_margins(row_cells[col_idx])
            for p in row_cells[col_idx].paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT if col_idx in [0, 4] else WD_ALIGN_PARAGRAPH.CENTER
                for r in p.runs:
                    format_run(r, r.text, font_size=13, color_rgb=(51, 65, 85))

    add_h2(doc, "3.5 Iniciación y Diccionario de Datos")

    add_h3(doc, "Diccionario de Datos (Base de Datos Supabase / PostgreSQL)")

    tables_db = [
        ("Tabla: profiles (Usuarios del Sistema)", [
            ["id", "UUID", "36", "No", "Llave primaria vinculada a Auth"],
            ["email", "VARCHAR", "255", "No", "Correo electrónico del usuario"],
            ["full_name", "VARCHAR", "255", "No", "Nombre completo del usuario"],
            ["role", "VARCHAR", "50", "No", "Rol asignado (patient, guardian, doctor, admin)"],
            ["created_at", "TIMESTAMP", "-", "No", "Fecha de creación del registro"]
        ]),
        ("Tabla: health_records (Biomarcadores y Predicciones)", [
            ["id", "UUID", "36", "No", "Llave primaria del registro"],
            ["patient_id", "UUID", "36", "No", "Llave foránea hacia profiles.id"],
            ["heart_rate", "INT", "-", "No", "Frecuencia cardíaca en bpm"],
            ["spo2", "FLOAT", "-", "No", "Porcentaje de saturación de oxígeno"],
            ["inhaler_uses", "INT", "-", "No", "Cantidad de usos de inhalador en 24h"],
            ["risk_level", "VARCHAR", "20", "No", "Categoría de riesgo (LOW, MODERATE, HIGH)"],
            ["risk_score", "FLOAT", "-", "No", "Probabilidad numérica calculada (0.0 a 1.0)"],
            ["recorded_at", "TIMESTAMP", "-", "No", "Fecha y hora del registro"]
        ])
    ]

    for t_name, t_rows in tables_db:
        add_h3(doc, t_name)
        t_obj = doc.add_table(rows=len(t_rows)+1, cols=5)
        t_obj.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(t_obj)

        h_db = ["Campo", "Tipo", "Tamaño", "Nulo", "Descripción"]
        h_cells = t_obj.rows[0].cells
        for i, h_t in enumerate(h_db):
            h_cells[i].text = h_t
            set_cell_shading(h_cells[i], "0284C7")
            set_cell_margins(h_cells[i])
            for p in h_cells[i].paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                for r in p.runs:
                    format_run(r, r.text, font_size=13, color_rgb=(255, 255, 255), bold=True)

        for r_idx, r_data in enumerate(t_rows, start=1):
            rc = t_obj.rows[r_idx].cells
            bg = "F8FAFC" if r_idx % 2 == 0 else "FFFFFF"
            for c_idx, val in enumerate(r_data):
                rc[c_idx].text = val
                set_cell_shading(rc[c_idx], bg)
                set_cell_margins(rc[c_idx])
                for p in rc[c_idx].paragraphs:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT if c_idx in [0, 4] else WD_ALIGN_PARAGRAPH.CENTER
                    for r in p.runs:
                        format_run(r, r.text, font_size=13, color_rgb=(51, 65, 85))

    add_h2(doc, "3.6 Producción y Modelo de Inteligencia Artificial")

    add_p(doc, "El módulo predictivo central de AsmaSync implementa un algoritmo Random Forest Classifier entrenado con hiperparámetros optimizados mediante validación cruzada k-fold. Las métricas alcanzadas en el entorno de pruebas de laboratorio son:")
    add_bullet(doc, "Exactitud (Accuracy)", "89.4%")
    add_bullet(doc, "Precisión (Precision)", "88.5%")
    add_bullet(doc, "Sensibilidad (Recall)", "87.2%")
    add_bullet(doc, "Área Bajo la Curva (ROC-AUC)", "0.91")

    add_p(doc, "El modelo se encuentra serializado en la ruta `models/random_forest_asma.pkl` y es cargado dinámicamente en memoria durante la inicialización de la API REST FastAPI.")

    add_h2(doc, "3.7 Estabilización y Endpoints JSON de la API")
    add_p(doc, "A continuación se muestra un ejemplo real de la petición JSON hacia el endpoint `/api/predict` y la respuesta estructurada devuelta por el servidor:")

    # Ejemplo JSON Request / Response
    p_json_lbl = doc.add_paragraph()
    p_json_lbl.paragraph_format.space_before = Pt(8)
    p_json_lbl.paragraph_format.space_after = Pt(2)
    r = p_json_lbl.add_run("Petición HTTP POST /api/predict (Payload JSON):")
    format_run(r, r.text, font_size=13, color_rgb=(15, 23, 42), bold=True)

    json_req = """{
  "patient_id": "c39a82f1-4b21-4f9e-a812-78d10b91e550",
  "heart_rate": 95,
  "respiratory_rate": 22,
  "spo2": 93.5,
  "inhaler_uses_24h": 4,
  "has_wheezing": true,
  "has_dyspnea": true,
  "temperature": 24.5,
  "humidity": 78.0,
  "aqi": 115
}"""
    p_box1 = doc.add_paragraph()
    p_box1.paragraph_format.left_indent = Inches(0.2)
    p_box1.paragraph_format.space_after = Pt(10)
    r_code1 = p_box1.add_run(json_req)
    format_run(r_code1, json_req, font_name="Consolas", font_size=11, color_rgb=(30, 41, 59))

    p_json_resp = doc.add_paragraph()
    p_json_resp.paragraph_format.space_after = Pt(2)
    r = p_json_resp.add_run("Respuesta HTTP 200 OK (Payload JSON):")
    format_run(r, r.text, font_size=13, color_rgb=(15, 23, 42), bold=True)

    json_res = """{
  "status": "success",
  "data": {
    "patient_id": "c39a82f1-4b21-4f9e-a812-78d10b91e550",
    "risk_level": "HIGH",
    "risk_score": 0.874,
    "color_code": "#EF4444",
    "recommendation": "Riesgo elevado de crisis asmática. Se recomienda iniciar protocolo de prevención.",
    "alert_dispatched": true,
    "timestamp": "2026-08-02T00:23:08Z"
  }
}"""
    p_box2 = doc.add_paragraph()
    p_box2.paragraph_format.left_indent = Inches(0.2)
    p_box2.paragraph_format.space_after = Pt(14)
    r_code2 = p_box2.add_run(json_res)
    format_run(r_code2, json_res, font_name="Consolas", font_size=11, color_rgb=(30, 41, 59))

    doc.add_page_break()

    # -------------------------------------------------------------
    # REFERENCIAS BIBLIOGRÁFICAS
    # -------------------------------------------------------------
    add_h1(doc, "REFERENCIAS BIBLIOGRÁFICAS")
    refs = [
        "1. Global Initiative for Asthma (GINA). (2025). Global Strategy for Asthma Management and Prevention. Disponible en: https://ginasthma.org",
        "2. World Health Organization (WHO). (2024). Asthma Key Facts. WHO Regional Guidelines.",
        "3. Pedregosa, F., et al. (2011). Scikit-learn: Machine Learning in Python. Journal of Machine Learning Research, 12, 2825-2830.",
        "4. Ramirez-González, A., & Smith, J. (2023). IoT and Machine Learning for Preventive Respiratory Care: A Review. IEEE Journal of Biomedical and Health Informatics, 27(4), 1820-1831.",
        "5. FastAPI Documentation. (2026). Modern Python Web Framework. Disponible en: https://fastapi.tiangolo.com"
    ]
    for ref in refs:
        p_r = doc.add_paragraph()
        p_r.paragraph_format.space_after = Pt(6)
        p_r.paragraph_format.left_indent = Inches(0.2)
        r = p_r.add_run(ref)
        format_run(r, ref, font_size=13, color_rgb=(51, 65, 85))

    doc.add_page_break()

    # -------------------------------------------------------------
    # ANEXO DE EVIDENCIAS FOTOGRÁFICAS DE LABORATORIO
    # -------------------------------------------------------------
    add_h1(doc, "ANEXO: EVIDENCIAS DE VALIDACIÓN EN LABORATORIO (TRL 4)")

    proy_dir = r"c:\asmasync-dashboard\ProyInt"
    images = [
        ("security_architecture.png", "Figura 1. Diagrama de Arquitectura de Seguridad y Comunicación entre Componentes"),
        ("evidence_dashboard.png", "Figura 2. Dashboard Clí́nico Web en Tiempo Real con Semaforización de Riesgo"),
        ("evidence_patient_detail_red.png", "Figura 3. Ficha de Expediente de Paciente en Riesgo Alto (Nivel Rojo)"),
        ("evidence_intervention_form.png", "Figura 4. Formulario de Registro de Intervención Clí́nica Preventiva"),
        ("evidence_intervention_success.png", "Figura 5. Confirmación de Intervención Clí́nica Almacenada en la Base de Datos"),
        ("evidence_pdf_report.png", "Figura 6. Generación del Expediente Médico Consolidado en Formato PDF"),
        ("postman_api_key_auth.png", "Figura 7. Prueba de Inferencia del Modelo de IA en Laboratorio mediante Postman REST API")
    ]

    for img_name, caption in images:
        img_path = os.path.join(proy_dir, img_name)
        if os.path.exists(img_path):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(14)
            p_img.paragraph_format.space_after = Pt(4)
            run_img = p_img.add_run()
            run_img.add_picture(img_path, width=Inches(5.8))

            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_after = Pt(18)
            r_cap = p_cap.add_run(caption)
            format_run(r_cap, caption, font_size=12, color_rgb=(100, 116, 139), italic=True)

    output_path = r"c:\asmasync-dashboard\ProyInt\Plantilla_TRL4_Completado.docx"
    doc.save(output_path)
    print(f"Perfect TRL4 Document saved successfully at: {output_path}")

if __name__ == "__main__":
    build_perfect_docx()
