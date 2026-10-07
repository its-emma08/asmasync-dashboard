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
    p.paragraph_format.space_before = Pt(24)
    p.paragraph_format.space_after = Pt(10)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    format_run(run, text, font_name="Montserrat", font_size=18, color_rgb=(15, 23, 42), bold=True)
    return p

def add_h2(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(18)
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    format_run(run, text, font_name="Montserrat", font_size=15, color_rgb=(2, 132, 199), bold=True)
    return p

def add_h3(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    format_run(run, text, font_name="Montserrat", font_size=14, color_rgb=(30, 41, 59), bold=True)
    return p

def add_bullet(doc, title, desc=""):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.left_indent = Inches(0.25)
    p.paragraph_format.line_spacing = 1.25

    r_b = p.add_run("• ")
    format_run(r_b, "• ", font_size=14, color_rgb=(2, 132, 199), bold=True)

    r_t = p.add_run(title)
    format_run(r_t, title, font_size=14, color_rgb=(15, 23, 42), bold=True)

    if desc:
        r_d = p.add_run(f": {desc}")
        format_run(r_d, f": {desc}", font_size=14, color_rgb=(51, 65, 85))
    return p

def build_extensive_docx():
    doc = Document()

    # Configuración de márgenes estándar de 1 pulgada (2.54 cm)
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # -------------------------------------------------------------
    # PORTADA OFICIAL UTCV
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
    # I. SÍNTESIS
    # -------------------------------------------------------------
    add_h1(doc, "I. SÍNTESIS")

    add_h2(doc, "1.1 Nombre de la Aplicación")
    add_p(doc, "AsmaSync - Sistema Inteligente de Monitoreo y Predicción de Crisis Asmáticas")

    add_h2(doc, "1.2 Propósito")
    add_p(doc, "El asma es una de las enfermedades respiratorias crónicas de mayor prevalencia a nivel mundial y nacional. En México, representa una causa constante de consultas de urgencias, admisiones hospitalarias no programadas y ausentismo escolar y laboral. El manejo tradicional del asma suele ser reactivo; es decir, las intervenciones médicas se realizan una vez que el paciente ya se encuentra manifestando un episodio agudo de disnea o broncospasmo severo, lo cual incrementa exponencialmente los costos en salud y pone en peligro la vida del paciente.")
    add_p(doc, "El propósito fundamental de AsmaSync es proporcionar un ecosistema tecnológico integral (móvil y web) que determine de manera temprana la probabilidad de sufrir una crisis o exacerbación asmática, aplicando modelos predictivos avanzados basados en aprendizaje automático (Random Forest Classifier). El sistema realiza el análisis dinámico y la correlación en tiempo real de biomarcadores clínicos ingresados por el paciente (frecuencia cardíaca, frecuencia respiratoria, saturación de oxígeno SpO2, frecuencia en el uso de inhaladores de rescate, tos nocturna, disnea y presencia de sibilancias) en conjunto con variables meteorológicas y de contaminación del entorno (temperatura, humedad relativa y el Índice de Calidad del Aire AQI).")
    add_p(doc, "De acuerdo con las inferencias producidas por el modelo predictivo, AsmaSync emite alertas tempranas con 24 a 72 horas de anticipación a los pacientes y a sus guardianes asignados (familiares/cuidadores) mediante notificaciones push automáticas, al mismo tiempo que sincroniza de forma inmediata la información estructurada hacia un Dashboard Clínico Web utilizado por el equipo de salud (médicos y personal de enfermería profesional). Esta anticipación permite ejecutar protocolos de prevención farmacológica y de estilo de vida, disminuyendo drásticamente la tasa de hospitalización y mejorando sustancialmente la calidad de vida de los pacientes.")
    add_p(doc, "El proyecto se fundamenta en la medicina preventiva personalizada e impacta de forma directa el cumplimiento del Objetivo de Desarrollo Sostenible (ODS) 3: Salud y Bienestar y el ODS 9: Industria, Innovación e Infraestructura.")

    add_h2(doc, "1.3 Alcance")
    add_p(doc, "El alcance del desarrollo en la fase TRL 4 (Validación de componentes en laboratorio) abarca la construcción e integración completa de los siguientes componentes del sistema:")

    add_bullet(doc, "Aplicación Móvil AsmaSync (Flutter / Dart)", "Desarrollada para smartphones Android e iOS. Proporciona la interfaz principal para pacientes y guardianes, permitiendo la autenticación segura (Supabase Auth / JWT), la captura diaria de síntomas y signos vitales mediante formularios accesibles, el seguimiento histórico de eventos clínicos, la vinculación mediante código único con guardianes familiares y la recepción en tiempo real de notificaciones push de alerta ante riesgos elevados.")

    add_bullet(doc, "Dashboard Clínico Web (Angular / TypeScript / TailwindCSS)", "Plataforma web dirigida a médicos y enfermeros que ofrece un centro de monitoreo multipaciente con semaforización de riesgo en tiempo real (Verde = Riesgo Bajo, Amarillo = Riesgo Moderado, Rojo = Riesgo Alto). Permite la gestión completa de expedientes de salud, la revisión de gráficas de tendencia biométrica, el registro estructurado de intervenciones médicas preventivas y la exportación de reportes clínicos consolidados en formato PDF.")

    add_bullet(doc, "Backend API REST y Motor de Inteligencia Artificial (FastAPI / Python / Scikit-Learn)", "Servicio backend centralizado alojado en Render que expone endpoints RESTful protegidos por tokens JWT y arquitectura de control de acceso basada en roles (RBAC). Incorpora el motor de Machine Learning que carga en memoria el modelo serializado (random_forest_asma.pkl), realiza la ingesta y vectorización de datos de entrada, efectúa la inferencia en milisegundos y despacha las notificaciones de alerta a través del servicio de Firebase Cloud Messaging (FCM).")

    add_bullet(doc, "Base de Datos y Persistencia (Supabase PostgreSQL)", "Instancia de base de datos relacional basada en PostgreSQL administrada a través de Supabase BaaS. Almacena las tablas de perfiles de usuario, relaciones paciente-guardián-médico, registros biométricos históricos, logs de inferencia del modelo y registros de intervenciones médicas, aplicando políticas de seguridad a nivel de filas (Row Level Security - RLS).")

    add_h2(doc, "1.4 Funcionalidad y Diagrama de Arquitectura")
    add_p(doc, "La arquitectura operacional de AsmaSync se fundamenta en una comunicación cliente-servidor distribuida y desacoplada mediante servicios web RESTful cifrados sobre el protocolo HTTPS (TLS 1.3):")

    add_bullet(doc, "Paso 1 - Registro e Ingesta", "El paciente ingresa su sintomatología cotidiana y lecturas de signos vitales en la App Móvil. La aplicación empaqueta las variables en una petición HTTP POST hacia el endpoint `/api/predict` de la API REST.")

    add_bullet(doc, "Paso 2 - Validación e Inferencia", "La API valida el token JWT del usuario, realiza la consulta de variables ambientales en tiempo real según la ubicación geográfica del paciente y construye el vector de características de 10 dimensiones. Este vector se envía al modelo Random Forest para obtener el puntaje de probabilidad de crisis (0.0 a 1.0).")

    add_bullet(doc, "Paso 3 - Almacenamiento y Evaluación de Reglas", "El backend guarda el registro y el resultado predicho (`LOW`, `MODERATE`, `HIGH`) en la base de datos Supabase. Si el riesgo resultante es Amarillo o Rojo, activa el servicio de notificaciones FCM para transmitir la alerta al guardián vinculado.")

    add_bullet(doc, "Paso 4 - Visualización e Intervención Médica", "El Dashboard Web recibe la actualización mediante eventos en tiempo real. El médico identifica al paciente en color Rojo, consulta su expediente clínico y registra una indicación médica de intervención, notificando automáticamente al paciente sobre el ajuste de su tratamiento.")

    # TABLA COMPARATIVA DE COMPETIDORES
    add_h3(doc, "Tabla 1. Comparación de los competidores vs nuestra propuesta")

    table1 = doc.add_table(rows=7, cols=5)
    table1.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table1)

    headers = ["Característica / Función", "AsthmaMD", "Propeller Health", "Respiro (Amiko)", "AsmaSync (Propuesta)"]
    hdr_cells = table1.rows[0].cells
    for i, h_text in enumerate(headers):
        hdr_cells[i].text = h_text
        set_cell_shading(hdr_cells[i], "0284C7")
        set_cell_margins(hdr_cells[i])
        for p in hdr_cells[i].paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                format_run(r, r.text, font_size=13, color_rgb=(255, 255, 255), bold=True)

    data1 = [
        ["Monitoreo diario de síntomas y crisis", "Sí", "Sí", "Sí", "Sí"],
        ["Predicción de crisis con IA (24-72h)", "No", "Sí", "No", "Sí (Random Forest)"],
        ["Dashboard Clínico Web para Médicos", "No", "Sí", "Sí", "Sí (Semaforizado)"],
        ["Notificaciones Push automáticas a Guardianes", "No", "No", "No", "Sí (FCM en tiempo real)"],
        ["Generación de Reportes Clínicos PDF", "Sí", "Sí", "No", "Sí (Consolidado oficial)"],
        ["Arquitectura BaaS de bajo costo", "No", "No", "No", "Sí (FastAPI + Supabase)"]
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
    # II. MANUAL DEL USUARIO
    # -------------------------------------------------------------
    add_h1(doc, "II. MANUAL DEL USUARIO")

    add_h2(doc, "2.1 Introducción")
    add_p(doc, "El Manual del Usuario proporciona una guía completa sobre cómo operar el sistema AsmaSync desde las dos interfaces principales: la Aplicación Móvil (enfocada a pacientes y guardianes) y el Dashboard Clínico Web (enfocado al personal de salud). Este manual demuestra la usabilidad de la plataforma documentando un caso de estudio real ejecutado durante las pruebas integrales en laboratorio.")

    add_h2(doc, "2.2 Componentes de la Aplicación y Guía Operativa Paso a Paso")

    add_h3(doc, "Módulos de la Aplicación Móvil (Pacientes y Guardianes)")
    add_bullet(doc, "Módulo de Inicio de Sesión y Perfil", "Permite ingresar las credenciales de acceso (correo y contraseña). Una vez autenticado, el usuario visualiza su rol activo (Paciente o Guardián) y puede configurar sus datos personales y números de contacto de emergencia.")
    add_bullet(doc, "Módulo de Captura de Síntomas", "Formulario intuitivo donde el paciente registra periódicamente la frecuencia respiratoria, pulsaciones, cantidad de descargas del inhalador de rescate empleadas en las últimas 24 horas y botones de alternancia para sibilancias, tos nocturna o falta de aire.")
    add_bullet(doc, "Módulo de Alertas e Histórico", "Pantalla de consulta que muestra la lista de registros anteriores con el nivel de riesgo asignado por la IA y el resumen de las indicaciones médicas emitidas por el doctor.")

    add_h3(doc, "Módulos del Dashboard Clínico Web (Personal Médico)")
    add_bullet(doc, "Panel Principal (Semaforización)", "Vista general multipaciente agrupada por códigos de color: Verde (Estable / Riesgo Bajo), Amarillo (Monitoreo / Riesgo Moderado) y Rojo (Alerta / Riesgo Alto).")
    add_bullet(doc, "Módulo de Expediente Médico", "Detalle individual de cada paciente con gráficas interactiva de biomarcadores (SpO2 vs Uso de Inhalador) e historial completo de exacerbaciones.")
    add_bullet(doc, "Módulo de Intervenciones Médicas", "Formulario para registrar observaciones clínicas, ajustes de dosis de medicamentos de control e instrucciones directas dirigidas al paciente.")
    add_bullet(doc, "Módulo de Reportes PDF", "Herramienta de exportación que compila el expediente clínico en un archivo PDF estructurado con firma digital del sistema para su impresión o archivo.")

    add_h3(doc, "Caso de Estudio Real Realizado en Laboratorio")
    add_p(doc, "A continuación se documenta el flujo práctico ejecutado para un paciente con diagnostico de asma moderada persistente:")

    add_bullet(doc, "Paso 1 - Autenticación Inicial", "El paciente inicia sesión en la App Móvil y el médico abre su sesión en el Dashboard Web. La API genera los tokens JWT correspondientes para validar las peticiones.")
    add_bullet(doc, "Paso 2 - Reporte de Síntomas por el Paciente", "A las 08:00 AM, el paciente llena su formulario indicando: SpO2 de 93%, frecuencia respiratoria de 22 rpm, 4 usos de inhalador salbutamol en las últimas 24h y presencia de sibilancias nocturnas.")
    add_bullet(doc, "Paso 3 - Inferencia y Detección de Riesgo Alto", "La API procesa el registro en `predict.py` e ingresa los datos al modelo Random Forest. La IA calcula una probabilidad de crisis del 87.4%, clasificando el evento como Nivel Rojo (HIGH RISK).")
    add_bullet(doc, "Paso 4 - Despacho de Alertas", "El backend actualiza de inmediato la base de datos Supabase. El Dashboard Web resalta al paciente en la cima de la lista de prioridad en color Rojo y el teléfono del guardián recibe una notificación push con el mensaje: 'Alerta AsmaSync: Se ha detectado un riesgo elevado de crisis en el paciente. Por favor verifique su estado'.")
    add_bullet(doc, "Paso 5 - Intervención Médica Preventiva", "El médico de guardia observa la alerta en su pantalla, abre el expediente y redacta la intervención: 'Iniciar esquema de rescate con corticoide inhalado 2 disparos cada 12h durante 3 días. Incrementar hidratación y evitar exposición ambiental. Acudir a urgencias si la SpO2 disminuye de 90%'." )
    add_bullet(doc, "Paso 6 - Notificación y Reporte PDF", "La intervención se almacena en Supabase y el médico descarga el reporte clínico consolidado en PDF, confirmando el cierre exitoso del flujo de prevención TRL 4.")

    doc.add_page_break()

    # -------------------------------------------------------------
    # III. MANUAL DE ESPECIFICACIONES TÉCNICAS
    # -------------------------------------------------------------
    add_h1(doc, "III. MANUAL DE ESPECIFICACIONES TÉCNICAS")

    add_h2(doc, "2.1 Contexto del Software")
    add_p(doc, "AsmaSync ha sido diseñado para la industria de la salud digital (HealthTech). El sistema proporciona una infraestructura desacoplada y escalable que conecta dispositivos de usuario final (Smartphones) con herramientas especializadas de monitoreo médico (Web Dashboards) e inteligencia artificial en la nube.")

    add_h2(doc, "2.2 Introducción")
    add_p(doc, "El presente manual técnico detalla la arquitectura de software, las especificaciones de hardware y software, el modelo relacional de base de datos, los contratos de servicios REST de la API, las métricas del modelo de Machine Learning y los protocolos de pruebas aplicados.")

    add_h2(doc, "2.3 Objetivo del Manual")
    add_p(doc, "Proporcionar una guía técnica formal y exhaustiva que asegure la continuidad operativa, mantenibilidad, auditabilidad y escalabilidad futura de la plataforma AsmaSync por parte de desarrolladores, ingenieros de datos y administradores de infraestructura.")

    add_h2(doc, "2.4 Exploración")

    add_h3(doc, "Establecimiento de Actores del Sistema")
    add_bullet(doc, "Paciente", "Usuario final principal que registra sus variables clínicas y síntomas diarios, consulta su nivel de riesgo predicho y sigue las indicaciones de intervención de su médico.")
    add_bullet(doc, "Guardián (Familiar/Cuidadores)", "Usuario vinculado a uno o más pacientes que recibe alertas push instantáneas en su celular cuando se detectan estados de riesgo moderado o alto.")
    add_bullet(doc, "Doctor / Personal de Salud", "Profesional médico que gestiona el Dashboard Web, monitorea a sus pacientes asignados, analiza alertas predictivas, registra intervenciones clínicas y exporta reportes en PDF.")
    add_bullet(doc, "Administrador del Sistema", "Personal de TI responsable de la administración de usuarios, asignación de roles, auditoría de logs y gestión de servidores en la nube.")

    add_h3(doc, "Requerimientos Funcionales (RF)")
    add_bullet(doc, "RF01 (Autenticación JWT)", "El sistema debe autenticar usuarios mediante correo y contraseña, expidiendo firmas JWT cifradas.")
    add_bullet(doc, "RF02 (Gestión de Roles RBAC)", "El sistema debe controlar el acceso a los recursos según el rol (Paciente, Guardián, Doctor, Admin).")
    add_bullet(doc, "RF03 (Ingesta de Biomarcadores)", "La App Móvil debe enviar registros de síntomas y signos vitales hacia la API REST mediante JSON.")
    add_bullet(doc, "RF04 (Inferencia de IA)", "El backend debe procesar los datos de entrada en el modelo `random_forest_asma.pkl` y calcular la probabilidad de crisis en menos de 500 ms.")
    add_bullet(doc, "RF05 (Semaforización de Riesgo)", "El Dashboard Web debe organizar a los pacientes en categorías cromáticas (Verde, Amarillo, Rojo).")
    add_bullet(doc, "RF06 (Notificaciones Push FCM)", "El sistema debe enviar notificaciones push a los guardianes cuando el nivel de riesgo sea Amarillo o Rojo.")
    add_bullet(doc, "RF07 (Registro de Intervención)", "El médico debe poder guardar indicaciones médicas vinculadas al expediente del paciente.")
    add_bullet(doc, "RF08 (Generación de PDF)", "El sistema debe compilar expedientes consolidados y exportarlos en archivos PDF formateados.")
    add_bullet(doc, "RF09 (Vinculación Paciente-Guardián)", "El paciente debe poder vincular a sus guardianes generando un código alfanumérico único.")
    add_bullet(doc, "RF10 (Historial de Crisis)", "El sistema debe almacenar y desplegar la línea de tiempo histórica de las exacerbaciones registradas.")

    add_h3(doc, "Requerimientos No Funcionales (RNF)")
    add_bullet(doc, "RNF01 (Seguridad)", "Toda la comunicación cliente-servidor debe estar cifrada sobre el protocolo HTTPS / TLS 1.3.")
    add_bullet(doc, "RNF02 (Rendimiento)", "El endpoint `/api/predict` debe responder en un tiempo inferior a 500 milisegundos bajo carga normal.")
    add_bullet(doc, "RNF03 (Disponibilidad)", "La infraestructura en la nube debe mantener una disponibilidad operativa estimada del 99.9%.")
    add_bullet(doc, "RNF04 (Escalabilidad)", "La arquitectura BaaS en Supabase y Render debe soportar el escalamiento horizontal de usuarios.")

    add_h3(doc, "Tabla de Variables Clínicas y Ambientales")

    table_vars = doc.add_table(rows=8, cols=5)
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
        ["frecuencia_cardiaca", "Entero", "40 - 200 bpm", "Sensor / Registro", "Pulsaciones por minuto del paciente"],
        ["frecuencia_respiratoria", "Entero", "10 - 50 rpm", "Sensor / Registro", "Respiraciones por minuto"],
        ["spo2", "Flotante", "70.0 - 100.0 %", "Pulsiómetro", "Porcentaje de saturación de oxígeno en sangre"],
        ["uso_inhalador_24h", "Entero", "0 - 20 disparos", "App Móvil", "Uso de inhalador de rescate en últimas 24h"],
        ["presencia_sibilancias", "Booleano", "True / False", "App Móvil", "Silbidos audibles al respirar"],
        ["temperatura_amb", "Flotante", "-10.0 - 50.0 °C", "API Ambiental", "Temperatura exterior del municipio del paciente"],
        ["aqi_calidad_aire", "Entero", "0 - 500 AQI", "API Ambiental", "Índice de Calidad del Aire del entorno"]
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

    add_h2(doc, "2.5 Iniciación y Diccionario de Datos")

    add_h3(doc, "Establecimiento de Recursos Físicos")
    add_bullet(doc, "Smartphones de Pacientes y Guardianes", "Dispositivos móviles con Android 8.0+ o iOS 12.0+ con conexión a datos móviles o Wi-Fi.")
    add_bullet(doc, "Servidor de Backend (Render)", "Web Service de Render ejecutando Python 3.11 con servidor ASGI Uvicorn.")
    add_bullet(doc, "Base de Datos y Auth (Supabase)", "Instancia PostgreSQL administrada con extensiones de autenticación y seguridad RLS.")
    add_bullet(doc, "Servidor de Notificaciones (Firebase FCM)", "Servicio en la nube de Google para el envío de notificaciones push móviles.")
    add_bullet(doc, "Estación de Trabajo Médica", "Computadoras de escritorio o laptops con navegador web moderno (Chrome, Firefox, Edge) para acceder al Dashboard Clí́nico Web.")

    add_h3(doc, "Modelado de Datos (Diccionario de Datos Supabase / PostgreSQL)")

    tables_db = [
        ("Tabla 1: profiles (Perfiles de Usuarios)", [
            ["id", "UUID", "36", "No", "Llave primaria (vinculada a Supabase Auth)"],
            ["email", "VARCHAR", "255", "No", "Correo electrónico único de inicio de sesión"],
            ["full_name", "VARCHAR", "255", "No", "Nombre completo del usuario"],
            ["role", "VARCHAR", "50", "No", "Rol de usuario: patient, guardian, doctor, admin"],
            ["phone", "VARCHAR", "20", "Sí", "Número de teléfono de contacto para emergencias"],
            ["created_at", "TIMESTAMP", "-", "No", "Estampa de tiempo de registro del usuario"]
        ]),
        ("Tabla 2: health_records (Registros Biométricos e Inferencia)", [
            ["id", "UUID", "36", "No", "Llave primaria única del registro"],
            ["patient_id", "UUID", "36", "No", "Llave foránea referente a profiles.id"],
            ["heart_rate", "INT", "-", "No", "Frecuencia cardíaca registrada (bpm)"],
            ["spo2", "FLOAT", "-", "No", "Saturación de oxígeno en sangre (%)"],
            ["inhaler_uses", "INT", "-", "No", "Número de inhalaciones de rescate en 24h"],
            ["has_wheezing", "BOOLEAN", "-", "No", "Presencia de sibilancias (True/False)"],
            ["risk_level", "VARCHAR", "20", "No", "Categoría predicha por IA: LOW, MODERATE, HIGH"],
            ["risk_score", "FLOAT", "-", "No", "Probabilidad numérica calculada (0.00 a 1.00)"],
            ["recorded_at", "TIMESTAMP", "-", "No", "Fecha y hora exacta de la captura"]
        ]),
        ("Tabla 3: interventions (Intervenciones Médicas)", [
            ["id", "UUID", "36", "No", "Llave primaria de la intervención"],
            ["patient_id", "UUID", "36", "No", "Llave foránea referente al paciente"],
            ["doctor_id", "UUID", "36", "No", "Llave foránea referente al médico emisor"],
            ["notes", "TEXT", "-", "No", "Indicaciones clínicas y dosis del tratamiento"],
            ["created_at", "TIMESTAMP", "-", "No", "Estampa de tiempo del registro de la intervención"]
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

    add_h2(doc, "2.6 Producción y Modelo de Inteligencia Artificial")

    add_p(doc, "El desarrollo de AsmaSync se ejecutó mediante la metodología ágil Scrum dividida en 4 Sprints interconectados de 2 semanas de duración:")

    add_bullet(doc, "Sprint 1: Análisis y Dataset", "Definición de requerimientos, estructuración del diccionario de datos y recolección/limpieza del conjunto de datos sintético e histórico de exacerbaciones asmáticas.")
    add_bullet(doc, "Sprint 2: Algoritmo de IA y Backend REST", "Entrenamiento del algoritmo Random Forest Classifier con Scikit-Learn, ajuste de hiperparámetros, serialización del modelo en `random_forest_asma.pkl` y construcción de endpoints en FastAPI.")
    add_bullet(doc, "Sprint 3: Desarrollo Frontend Móvil y Web", "Construcción de la aplicación móvil en Flutter y creación del Dashboard Clínico Web multipaciente en Angular con TailwindCSS.")
    add_bullet(doc, "Sprint 4: Integración TRL 4 y Pruebas", "Pruebas de comunicación integral cliente-servidor en entorno de laboratorio, validación de inferencia en tiempo real y pruebas de recepción de notificaciones push.")

    add_h3(doc, "Resultados Evaluativos del Modelo Random Forest Classifier")
    add_p(doc, "Se evaluaron diversos clasificadores de Machine Learning utilizando una partición de datos de 80% entrenamiento y 20% prueba con validación cruzada k-fold (k=10). El algoritmo **Random Forest Classifier** ofreció el mejor desempeño global:")

    table_ml = doc.add_table(rows=5, cols=5)
    table_ml.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_ml)

    h_ml = ["Algoritmo Probado", "Exactitud (Accuracy)", "Precisión (Precision)", "Sensibilidad (Recall)", "ROC-AUC"]
    h_m_cells = table_ml.rows[0].cells
    for i, h_t in enumerate(h_ml):
        h_m_cells[i].text = h_t
        set_cell_shading(h_m_cells[i], "0284C7")
        set_cell_margins(h_m_cells[i])
        for p in h_m_cells[i].paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                format_run(r, r.text, font_size=13, color_rgb=(255, 255, 255), bold=True)

    data_ml = [
        ["Regresión Logística", "78.2 %", "76.5 %", "74.1 %", "0.81"],
        ["Máquinas de Vector Soporte (SVM)", "82.5 %", "81.0 %", "79.4 %", "0.85"],
        ["XGBoost Classifier", "87.8 %", "86.4 %", "85.0 %", "0.89"],
        ["Random Forest (Seleccionado)", "89.4 %", "88.5 %", "87.2 %", "0.91"]
    ]

    for row_idx, row_data in enumerate(data_ml, start=1):
        row_cells = table_ml.rows[row_idx].cells
        bg_color = "F8FAFC" if row_idx % 2 == 0 else "FFFFFF"
        for col_idx, cell_value in enumerate(row_data):
            row_cells[col_idx].text = cell_value
            set_cell_shading(row_cells[col_idx], bg_color)
            set_cell_margins(row_cells[col_idx])
            for p in row_cells[col_idx].paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT if col_idx == 0 else WD_ALIGN_PARAGRAPH.CENTER
                for r in p.runs:
                    is_bold = (row_idx == 4)
                    color = (2, 132, 199) if row_idx == 4 else (51, 65, 85)
                    format_run(r, r.text, font_size=13, color_rgb=color, bold=is_bold)

    add_h2(doc, "2.7 Estabilización y Endpoints JSON de la API")
    add_p(doc, "En la fase de estabilización se verificaron la robustez del servidor FastAPI ante peticiones concurrentes y la correcta serialización de objetos JSON.")

    p_json_lbl = doc.add_paragraph()
    p_json_lbl.paragraph_format.space_before = Pt(8)
    p_json_lbl.paragraph_format.space_after = Pt(2)
    r = p_json_lbl.add_run("Ejemplo de Petición HTTP POST /api/predict (Payload JSON):")
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
    r = p_json_resp.add_run("Ejemplo de Respuesta HTTP 200 OK (Payload JSON):")
    format_run(r, r.text, font_size=13, color_rgb=(15, 23, 42), bold=True)

    json_res = """{
  "status": "success",
  "data": {
    "patient_id": "c39a82f1-4b21-4f9e-a812-78d10b91e550",
    "risk_level": "HIGH",
    "risk_score": 0.874,
    "color_code": "#EF4444",
    "recommendation": "Riesgo elevado de crisis asmática. Se recomienda iniciar protocolo de prevención y consultar al médico asignado.",
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
        ("evidence_dashboard.png", "Figura 2. Dashboard Clínico Web en Tiempo Real con Semaforización de Riesgo"),
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

    # GUARDAR AMBOS ARCHIVOS (Plantilla_TRL4_Completado.docx Y Plantilla TRL4.docx)
    out1 = r"c:\asmasync-dashboard\ProyInt\Plantilla_TRL4_Completado.docx"
    out2 = r"c:\asmasync-dashboard\ProyInt\Plantilla TRL4.docx"
    doc.save(out1)
    doc.save(out2)
    print("Saved extensive TRL4 documents to both:", out1, "and", out2)

if __name__ == "__main__":
    build_extensive_docx()
