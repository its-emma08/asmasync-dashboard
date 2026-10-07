import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

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

def build_docx_sections_2_and_3():
    doc = Document()

    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # PORTADA DE SECCIONES II Y III
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(36)
    p_title.paragraph_format.space_after = Pt(12)
    r = p_title.add_run("UNIVERSIDAD TECNOLÓGICA DEL CENTRO DE VERACRUZ\nINGENIERÍA EN DESARROLLO Y GESTIÓN DE SOFTWARE")
    format_run(r, r.text, font_size=14, color_rgb=(15, 23, 42), bold=True)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(24)
    p_sub.paragraph_format.space_after = Pt(36)
    r2 = p_sub.add_run("SECCIÓN II: MANUAL DEL USUARIO\nSECCIÓN III: MANUAL DE ESPECIFICACIONES TÉCNICAS\n\nASMASYNC - SISTEMA INTELIGENTE DE MONITOREO Y PREDICCIÓN DE CRISIS ASMÁTICAS")
    format_run(r2, r2.text, font_size=16, color_rgb=(2, 132, 199), bold=True)

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
    p_date.paragraph_format.space_before = Pt(40)
    r = p_date.add_run("FECHA DE ELABORACIÓN: Agosto del 2026")
    format_run(r, r.text, font_size=14, color_rgb=(100, 116, 139), italic=True)

    doc.add_page_break()

    # =============================================================
    # II. MANUAL DEL USUARIO
    # =============================================================
    add_h1(doc, "II. MANUAL DEL USUARIO")

    add_h2(doc, "2.1 Introducción")
    add_p(doc, "El presente Manual del Usuario constituye la guía oficial de operación y aprovechamiento de la plataforma AsmaSync. Su objetivo es proporcionar instrucciones claras, sistemáticas e ilustradas para los tres roles principales que interactúan con el sistema: pacientes diagnosticados con asma bronquial, sus guardianes asignados (familiares o cuidadores primarios) y el personal médico (médicos especialistas y personal de enfermería).")
    add_p(doc, "La arquitectura de la información de AsmaSync se diseñó bajo los principios internacionales de usabilidad en salud (eHealth Usability Standards) e interfaces accesibles. El manual guía a los usuarios en la navegación por la Aplicación Móvil (Android/iOS) y el Dashboard Clínico Web, explicando la captura correcta de signos vitales, la interpretación de la semaforización de riesgo y la respuesta oportuna ante alertas predictivas generadas por Inteligencia Artificial.")

    add_h2(doc, "2.2 Componentes de la Aplicación")

    add_h3(doc, "Características Principales del Diseño de Interfaz para Salud")
    add_p(doc, "Conforme a los estándares de desarrollo de software médico y salud digital, las pantallas de AsmaSync fueron construidas cumpliendo con los siguientes criterios de diseño:")
    add_bullet(doc, "Semaforización Cromática Universal", "Utilización del código de colores Verde (#10B981) para riesgo bajo/estable, Amarillo (#F59E0B) para riesgo moderado/atención, y Rojo (#EF4444) para riesgo alto/alerta médica, garantizando la comprensión inmediata del estado del paciente sin ambigüedades.")
    add_bullet(doc, "Minimización de Carga Cognitiva", "Formularios simplificados con botones de selección directa de un toque y deslizadores numéricos accesibles, previniendo errores de entrada cuando el paciente presenta dificultad respiratoria o fatiga.")
    add_bullet(doc, "Priorización de Información Crítica", "Jerarquización visual que destaca los valores de saturación de oxígeno (SpO2), frecuencia respiratoria e inhalaciones de rescate en la parte superior de las vistas.")
    add_bullet(doc, "Confirmación y Seguridad Visual", "Retroalimentación táctil y gráfica inmediata tras cada registro guardado, asegurando al usuario que su reporte fue transmitido a la nube correctamente.")

    add_h3(doc, "Documentación de Componentes de la Aplicación Móvil (Pacientes y Guardianes)")
    add_bullet(doc, "Módulo de Inicio de Sesión y Gestión de Sesión", "Permite ingresar las credenciales de usuario (correo y contraseña) mediante Supabase Auth. Garantiza el almacenamiento seguro del token JWT y la persistencia de sesión cifrada.")
    add_bullet(doc, "Módulo de Captura Diaria de Biomarcadores y Síntomas", "Pantalla interactiva con campos numéricos para registrar saturación de oxígeno (SpO2), frecuencia respiratoria, frecuencia cardíaca, usos de inhalador de rescate en 24h y conmutadores booleanos para sibilancias, tos nocturna y disnea.")
    add_bullet(doc, "Módulo de Indicador de Riesgo Predicho (Home del Paciente)", "Despliega una tarjeta prominente con el nivel de riesgo predicho por el modelo de IA (Verde, Amarillo o Rojo), el porcentaje numérico de probabilidad de crisis y recomendaciones preventivas personalizadas.")
    add_bullet(doc, "Módulo de Vinculación de Guardianes", "Sección donde el paciente genera un código alfanumérico único para enlazar la cuenta de sus familiares o tutores, autorizando la recepción de alertas push.")
    add_bullet(doc, "Módulo de Notificaciones Push de Alerta (FCM)", "Servicio en segundo plano que despacha mensajes de alta prioridad a la pantalla de bloqueo del guardián cuando la IA detecta riesgo Moderado o Alto.")

    add_h3(doc, "Documentación de Componentes del Dashboard Clínico Web (Personal Médico)")
    add_bullet(doc, "Panel Principal de Monitoreo Multipaciente", "Grilla interactiva desarrollada en Angular que ordena automáticamente a los pacientes atendidos según su nivel de riesgo, posicionando a los casos en estado Rojo en la cima de la lista.")
    add_bullet(doc, "Módulo de Expediente Clínico Digital", "Vista detallada individual que muestra la información demográfica del paciente, su historial completo de registros biométricos y gráficas de tendencia temporal (SpO2 vs Usos de Inhalador).")
    add_bullet(doc, "Módulo de Registro de Intervención Médica Preventiva", "Formulario modal donde el médico registra indicaciones terapéuticas, ajustes en la dosificación de esteroides inhalados o citas de urgencia.")
    add_bullet(doc, "Módulo de Exportación de Reportes Clínicos en PDF", "Servicio de compilación que genera documentos PDF consolidados con encabezado institucional, gráficas e historial de intervenciones para archivo impreso o digital.")

    add_h3(doc, "Caso de Estudio Realizado en Laboratorio (Paso a Paso)")
    add_p(doc, "Para validar la usabilidad e integración de los componentes en el nivel TRL 4, se ejecutó un caso de prueba integral con el paciente P-104 (Femenino, 14 años, diagnóstico de asma moderada persistente):")

    add_bullet(doc, "Paso 1 - Autenticación de Usuarios", "A las 08:00 AM, la paciente inicia sesión en la App Móvil Flutter y el médico de guardia accede al Dashboard Web Angular. La API REST autentica ambas peticiones expidiendo firmas JWT.")
    add_bullet(doc, "Paso 2 - Reporte de Síntomas Cotidianos", "La paciente ingresa a la App e indica los siguientes valores: SpO2 = 93%, Frecuencia respiratoria = 22 rpm, 4 descargas de salbutamol en las últimas 24h, tos nocturna y sibilancias audibles.")
    add_bullet(doc, "Paso 3 - Inferencia del Modelo de Inteligencia Artificial", "La App transmite el payload JSON al endpoint /api/predict. El servidor ejecuta el modelo Random Forest, obteniendo una probabilidad de crisis del 87.4%, clasificando el caso como Nivel Alto (Rojo - HIGH RISK).")
    add_bullet(doc, "Paso 4 - Despacho de Alerta Push a Guardián y Dashboard", "El backend actualiza Supabase DB. De inmediato, el teléfono de la madre (Guardián) recibe una notificación push FCM con sonido distintivo: 'Alerta AsmaSync: Se ha detectado riesgo alto de crisis en la paciente. Verifique su estado'. Simultáneamente, la tarjeta de la paciente parpadea en color Rojo en el Dashboard del médico.")
    add_bullet(doc, "Paso 5 - Registro de Intervención Médica Preventiva", "El médico abre la ficha en el Dashboard, observa la disminución en la SpO2 y completa el formulario de intervención: 'Iniciar esquema de rescate: 2 disparos de budesonida/formoterol cada 12 horas por 3 días. Incrementar hidratación y acudir a valoración presencial si la SpO2 cae por debajo de 90%'." )
    add_bullet(doc, "Paso 6 - Notificación al Paciente y Exportación PDF", "La indicación médica se guarda en la base de datos y se refleja al instante en la App Móvil de la paciente. El médico presiona 'Exportar PDF' obteniendo el expediente consolidado con el registro del evento.")

    doc.add_page_break()

    # =============================================================
    # III. MANUAL DE ESPECIFICACIONES TÉCNICAS
    # =============================================================
    add_h1(doc, "III. MANUAL DE ESPECIFICACIONES TÉCNICAS")

    add_h2(doc, "2.1 Contexto del Software")
    add_p(doc, "AsmaSync se enmarca en la industria de la salud digital (HealthTech) y la telemedicina preventiva. El software proporciona una infraestructura cliente-servidor distribuida en la nube que conecta dispositivos móviles de usuario final con motores de inteligencia artificial y paneles de control médico en tiempo real.")
    add_p(doc, "El stack tecnológico utilizado en el proyecto comprende:")
    add_bullet(doc, "Backend API REST", "Python 3.11, FastAPI 0.109, servidor ASGI Uvicorn, Pydantic v2.")
    add_bullet(doc, "Motor de Inteligencia Artificial", "Scikit-Learn 1.4, modelo Random Forest Classifier serializado (.pkl), NumPy, Pandas.")
    add_bullet(doc, "Frontend Móvil", "Flutter 3.19 (Dart), arquitectura BLoC/Provider, notificaciones Firebase Cloud Messaging (FCM).")
    add_bullet(doc, "Frontend Web (Dashboard)", "Angular 17, TypeScript, TailwindCSS, Chart.js para visualización médica.")
    add_bullet(doc, "Base de Datos y Persistencia", "Supabase BaaS (PostgreSQL 15), autenticación JWT y Row Level Security (RLS).")
    add_bullet(doc, "Infraestructura Cloud", "Render Web Services para hosting de la API REST y Supabase Cloud para datos.")

    add_h2(doc, "2.2 Introducción")
    add_p(doc, "El presente manual de especificaciones técnicas compila la documentación arquitectónica, los diagramas de secuencia, el diccionario de datos relacional, los contratos formales de la API REST, el análisis comparativo de algoritmos de Machine Learning y los procedimientos de despliegue y estabilización del sistema AsmaSync.")

    add_h2(doc, "2.3 Objetivo del Manual")
    add_p(doc, "Establecer una referencia técnica formal, rigurosa y exhaustiva que asegure la auditabilidad, mantenibilidad, escalabilidad e interoperabilidad futura del software AsmaSync ante cualquier proceso de revisión de código, auditoría de seguridad o rotación de personal técnico.")

    add_h2(doc, "2.4 Exploración")

    add_h3(doc, "a) Establecimiento de Actores")

    table_act = doc.add_table(rows=5, cols=4)
    table_act.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_act)

    h_act = ["Actor", "Rol en el Sistema", "Interfaz Utilizada", "Permisos Principales (RBAC)"]
    for i, ht in enumerate(h_act):
        table_act.rows[0].cells[i].text = ht
        set_cell_shading(table_act.rows[0].cells[i], "0284C7")
        set_cell_margins(table_act.rows[0].cells[i])
        for p in table_act.rows[0].cells[i].paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r_run in p.runs:
                format_run(r_run, r_run.text, font_size=13, color_rgb=(255, 255, 255), bold=True)

    d_act = [
        ["Paciente", "Usuario final asmático", "App Móvil Flutter", "Registrar síntomas, ver historial propio, gestionar guardianes."],
        ["Guardián", "Familiar / Cuidador", "App Móvil Flutter", "Ver estado de salud del paciente vinculado, recibir alertas push FCM."],
        ["Doctor", "Personal médico / Enfermero", "Dashboard Web Angular", "Ver todos los pacientes, filtrar alertas rojas, registrar intervenciones, exportar PDF."],
        ["Admin", "Administrador de TI", "Panel Supabase / API", "Gestión global de usuarios, asignación de roles, auditoría de logs."]
    ]

    for r_i, r_d in enumerate(d_act, start=1):
        rc = table_act.rows[r_i].cells
        bg = "F8FAFC" if r_i % 2 == 0 else "FFFFFF"
        for c_i, val in enumerate(r_d):
            rc[c_i].text = val
            set_cell_shading(rc[c_i], bg)
            set_cell_margins(rc[c_i])
            for p in rc[c_i].paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT if c_i in [0, 3] else WD_ALIGN_PARAGRAPH.CENTER
                for r_run in p.runs:
                    format_run(r_run, r_run.text, font_size=13, color_rgb=(51, 65, 85))

    add_h3(doc, "b) Definición del Alcance Técnico")
    add_p(doc, "El alcance abarca la ingesta de biomarcadores mediante peticiones JSON HTTPS, inferencia en tiempo real con el modelo Random Forest, despacho de alertas push en menos de 1 segundo, persistencia en Supabase PostgreSQL con RLS y exportación de expediente médico en PDF.")

    add_h3(doc, "c) Requerimientos Funcionales (RF) y No Funcionales (RNF)")

    table_req = doc.add_table(rows=11, cols=4)
    table_req.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_req)

    h_req = ["Código", "Tipo", "Nombre del Requerimiento", "Descripción Técnica"]
    for i, ht in enumerate(h_req):
        table_req.rows[0].cells[i].text = ht
        set_cell_shading(table_req.rows[0].cells[i], "0284C7")
        set_cell_margins(table_req.rows[0].cells[i])
        for p in table_req.rows[0].cells[i].paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r_run in p.runs:
                format_run(r_run, r_run.text, font_size=13, color_rgb=(255, 255, 255), bold=True)

    d_req = [
        ["RF01", "Funcional", "Autenticación JWT", "El sistema autentica usuarios y expide tokens cifrados JWT."],
        ["RF02", "Funcional", "Gestión RBAC", "Control de acceso a endpoints según el rol del token (patient, doctor, etc.)."],
        ["RF03", "Funcional", "Ingesta de Biomarcadores", "Recepción de registros diarios de SpO2, FC, FR e inhaladores mediante JSON."],
        ["RF04", "Funcional", "Inferencia de IA", "Ejecución del modelo random_forest_asma.pkl y retorno del puntaje de riesgo."],
        ["RF05", "Funcional", "Semaforización Web", "Organización cromática de pacientes en Verde, Amarillo y Rojo."],
        ["RF06", "Funcional", "Alertas Push FCM", "Envío de notificaciones push a los dispositivos de los guardianes."],
        ["RF07", "Funcional", "Intervención Médica", "Registro de observaciones y cambios de dosis farmacológica."],
        ["RF08", "Funcional", "Exportación PDF", "Generación de documento PDF consolidado con historial médico."],
        ["RNF01", "No Funcional", "Cifrado TLS 1.3", "Toda la comunicación debe transportarse sobre HTTPS cifrado."],
        ["RNF02", "No Funcional", "Latencia Inferencia", "El endpoint /api/predict debe responder en menos de 500 ms."]
    ]

    for r_i, r_d in enumerate(d_req, start=1):
        rc = table_req.rows[r_i].cells
        bg = "F8FAFC" if r_i % 2 == 0 else "FFFFFF"
        for c_i, val in enumerate(r_d):
            rc[c_i].text = val
            set_cell_shading(rc[c_i], bg)
            set_cell_margins(rc[c_i])
            for p in rc[c_i].paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT if c_i in [2, 3] else WD_ALIGN_PARAGRAPH.CENTER
                for r_run in p.runs:
                    format_run(r_run, r_run.text, font_size=13, color_rgb=(51, 65, 85))

    add_h3(doc, "e) Tabla de Datos con las Principales Variables a Trabajar")

    table_v = doc.add_table(rows=8, cols=5)
    table_v.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_v)

    h_v = ["Nombre Variable", "Tipo Dato", "Rango Válido", "Origen", "Descripción"]
    for i, ht in enumerate(h_v):
        table_v.rows[0].cells[i].text = ht
        set_cell_shading(table_v.rows[0].cells[i], "0284C7")
        set_cell_margins(table_v.rows[0].cells[i])
        for p in table_v.rows[0].cells[i].paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r_run in p.runs:
                format_run(r_run, r_run.text, font_size=13, color_rgb=(255, 255, 255), bold=True)

    d_v = [
        ["frecuencia_cardiaca", "Entero", "40 - 200 bpm", "Sensor / Registro", "Pulsaciones por minuto del paciente."],
        ["frecuencia_respiratoria", "Entero", "10 - 50 rpm", "Sensor / Registro", "Respiraciones por minuto."],
        ["spo2", "Flotante", "70.0 - 100.0 %", "Pulsiómetro", "Porcentaje de saturación de oxígeno en sangre."],
        ["uso_inhalador_24h", "Entero", "0 - 20 disparos", "App Móvil", "Descargas de inhalador de rescate utilizadas."],
        ["presencia_sibilancias", "Booleano", "True / False", "App Móvil", "Presencia de silbidos audibles al respirar."],
        ["temperatura_amb", "Flotante", "-10.0 - 50.0 °C", "API Ambiental", "Temperatura exterior del municipio."],
        ["aqi_calidad_aire", "Entero", "0 - 500 AQI", "API Ambiental", "Índice de Calidad del Aire del entorno."]
    ]

    for r_i, r_d in enumerate(d_v, start=1):
        rc = table_v.rows[r_i].cells
        bg = "F8FAFC" if r_i % 2 == 0 else "FFFFFF"
        for c_i, val in enumerate(r_d):
            rc[c_i].text = val
            set_cell_shading(rc[c_i], bg)
            set_cell_margins(rc[c_i])
            for p in rc[c_i].paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT if c_i in [0, 4] else WD_ALIGN_PARAGRAPH.CENTER
                for r_run in p.runs:
                    format_run(r_run, r_run.text, font_size=13, color_rgb=(51, 65, 85))

    add_h2(doc, "2.5 Iniciación y Diccionario de Datos")

    add_h3(doc, "c) Modelado de Datos (Diccionario de Datos Supabase / PostgreSQL)")

    tables_db = [
        ("Tabla 1: profiles (Perfiles de Usuarios)", [
            ["id", "UUID", "36", "No", "Llave primaria (vinculada a Supabase Auth)"],
            ["email", "VARCHAR", "255", "No", "Correo electrónico de inicio de sesión"],
            ["full_name", "VARCHAR", "255", "No", "Nombre completo del usuario"],
            ["role", "VARCHAR", "50", "No", "Rol de usuario: patient, guardian, doctor, admin"],
            ["phone", "VARCHAR", "20", "Sí", "Teléfono de contacto de emergencia"],
            ["created_at", "TIMESTAMP", "-", "No", "Estampa de tiempo del registro"]
        ]),
        ("Tabla 2: health_records (Biomarcadores e Inferencia de IA)", [
            ["id", "UUID", "36", "No", "Llave primaria única del registro"],
            ["patient_id", "UUID", "36", "No", "Llave foránea referente a profiles.id"],
            ["heart_rate", "INT", "-", "No", "Frecuencia cardíaca (bpm)"],
            ["spo2", "FLOAT", "-", "No", "Saturación de oxígeno en sangre (%)"],
            ["inhaler_uses", "INT", "-", "No", "Número de usos de inhalador en 24h"],
            ["has_wheezing", "BOOLEAN", "-", "No", "Presencia de sibilancias (True/False)"],
            ["risk_level", "VARCHAR", "20", "No", "Categoría predicha: LOW, MODERATE, HIGH"],
            ["risk_score", "FLOAT", "-", "No", "Probabilidad numérica calculada (0.00 a 1.00)"],
            ["recorded_at", "TIMESTAMP", "-", "No", "Fecha y hora exacta del registro"]
        ]),
        ("Tabla 3: interventions (Intervenciones Médicas)", [
            ["id", "UUID", "36", "No", "Llave primaria de la intervención"],
            ["patient_id", "UUID", "36", "No", "Llave foránea referente al paciente"],
            ["doctor_id", "UUID", "36", "No", "Llave foránea referente al médico emisor"],
            ["notes", "TEXT", "-", "No", "Indicaciones clínicas y ajuste farmacológico"],
            ["created_at", "TIMESTAMP", "-", "No", "Estampa de tiempo de la intervención"]
        ])
    ]

    for t_name, t_rows in tables_db:
        add_h3(doc, t_name)
        t_obj = doc.add_table(rows=len(t_rows)+1, cols=5)
        t_obj.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(t_obj)

        h_db = ["Campo", "Tipo", "Tamaño", "Nulo", "Descripción"]
        for i, h_t in enumerate(h_db):
            t_obj.rows[0].cells[i].text = h_t
            set_cell_shading(t_obj.rows[0].cells[i], "0284C7")
            set_cell_margins(t_obj.rows[0].cells[i])
            for p in t_obj.rows[0].cells[i].paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                for r_run in p.runs:
                    format_run(r_run, r_run.text, font_size=13, color_rgb=(255, 255, 255), bold=True)

        for r_idx, r_data in enumerate(t_rows, start=1):
            rc = t_obj.rows[r_idx].cells
            bg = "F8FAFC" if r_idx % 2 == 0 else "FFFFFF"
            for c_idx, val in enumerate(r_data):
                rc[c_idx].text = val
                set_cell_shading(rc[c_idx], bg)
                set_cell_margins(rc[c_idx])
                for p in rc[c_idx].paragraphs:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT if c_idx in [0, 4] else WD_ALIGN_PARAGRAPH.CENTER
                    for r_run in p.runs:
                        format_run(r_run, r_run.text, font_size=13, color_rgb=(51, 65, 85))

    add_h2(doc, "2.6 Producción")

    add_h3(doc, "b) Análisis y Comparativa de Algoritmos de Machine Learning")
    add_p(doc, "Se evaluaron cuatro clasificadores de Machine Learning con un esquema de validación cruzada k-fold (k=10) sobre el conjunto de datos de entrenamiento:")

    table_ml = doc.add_table(rows=5, cols=5)
    table_ml.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_ml)

    h_ml = ["Algoritmo Probado", "Exactitud (Accuracy)", "Precisión (Precision)", "Sensibilidad (Recall)", "ROC-AUC"]
    for i, h_t in enumerate(h_ml):
        table_ml.rows[0].cells[i].text = h_t
        set_cell_shading(table_ml.rows[0].cells[i], "0284C7")
        set_cell_margins(table_ml.rows[0].cells[i])
        for p in table_ml.rows[0].cells[i].paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r_run in p.runs:
                format_run(r_run, r_run.text, font_size=13, color_rgb=(255, 255, 255), bold=True)

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
                for r_run in p.runs:
                    is_bold = (row_idx == 4)
                    color = (2, 132, 199) if row_idx == 4 else (51, 65, 85)
                    format_run(r_run, r_run.text, font_size=13, color_rgb=color, bold=is_bold)

    add_h2(doc, "2.7 Estabilización")

    add_h3(doc, "f) URLs y Formatos de Datos JSON (Contratos de la API REST)")

    p_j1 = doc.add_paragraph()
    p_j1.paragraph_format.space_before = Pt(8)
    p_j1.paragraph_format.space_after = Pt(2)
    r = p_j1.add_run("1. Petición HTTP POST /api/predict (Payload JSON):")
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
    p_b1 = doc.add_paragraph()
    p_b1.paragraph_format.left_indent = Inches(0.2)
    p_b1.paragraph_format.space_after = Pt(10)
    r_c1 = p_b1.add_run(json_req)
    format_run(r_c1, json_req, font_name="Consolas", font_size=11, color_rgb=(30, 41, 59))

    p_j2 = doc.add_paragraph()
    p_j2.paragraph_format.space_after = Pt(2)
    r = p_j2.add_run("2. Respuesta HTTP 200 OK (Payload JSON):")
    format_run(r, r.text, font_size=13, color_rgb=(15, 23, 42), bold=True)

    json_res = """{
  "status": "success",
  "data": {
    "patient_id": "c39a82f1-4b21-4f9e-a812-78d10b91e550",
    "risk_level": "HIGH",
    "risk_score": 0.874,
    "color_code": "#EF4444",
    "recommendation": "Riesgo elevado de crisis asmática. Se recomienda iniciar protocolo de prevención y consultar a su médico asignado.",
    "alert_dispatched": true,
    "timestamp": "2026-08-02T00:23:08Z"
  }
}"""
    p_b2 = doc.add_paragraph()
    p_b2.paragraph_format.left_indent = Inches(0.2)
    p_b2.paragraph_format.space_after = Pt(14)
    r_c2 = p_b2.add_run(json_res)
    format_run(r_c2, json_res, font_name="Consolas", font_size=11, color_rgb=(30, 41, 59))

    doc.add_page_break()

    # REFERENCIAS
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

    # ANEXO
    add_h1(doc, "ANEXO: EVIDENCIAS DE LABORATORIO (SECCIONES II Y III)")

    proy_dir = r"c:\asmasync-dashboard\ProyInt"
    images = [
        ("security_architecture.png", "Figura 1. Arquitectura de Seguridad y Comunicación Cliente-Servidor"),
        ("evidence_dashboard.png", "Figura 2. Dashboard Clínico Web con Semaforización en Tiempo Real"),
        ("evidence_patient_detail_red.png", "Figura 3. Ficha de Expediente de Paciente con Alerta Roja (High Risk)"),
        ("evidence_intervention_form.png", "Figura 4. Formulario de Registro de Intervención Médica Preventiva"),
        ("evidence_intervention_success.png", "Figura 5. Confirmación de Intervención Clí́nica Almacenada"),
        ("evidence_pdf_report.png", "Figura 6. Generación del Expediente Clí́nico Consolidado en Formato PDF"),
        ("postman_api_key_auth.png", "Figura 7. Validación de Inferencia de la API REST mediante Postman")
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

    out1 = r"c:\asmasync-dashboard\ProyInt\Manuales_Usuario_y_Tecnico_AsmaSync.docx"
    out2 = r"c:\asmasync-dashboard\ProyInt\Plantilla_TRL4_Secciones_II_y_III.docx"
    doc.save(out1)
    doc.save(out2)
    print("Saved Sections II and III Word document to:", out1, "and", out2)

if __name__ == "__main__":
    build_docx_sections_2_and_3()
