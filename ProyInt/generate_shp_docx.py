import os
import docx
from docx import Document
from docx.shared import Pt, Inches, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_shading(cell, color):
    shading_elm = parse_xml(r'<w:shd {} w:fill="{}"/>'.format(nsdecls('w'), color))
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(r'<w:tcMar {}><w:top w:w="{}" w:type="dxa"/><w:bottom w:w="{}" w:type="dxa"/><w:left w:w="{}" w:type="dxa"/><w:right w:w="{}" w:type="dxa"/></w:tcMar>'.format(nsdecls('w'), top, bottom, left, right))
    tcPr.append(tcMar)

def set_cell_borders_code(cell, color="1E3A8A"):
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        r'<w:tcBorders {}><w:top w:val="none"/><w:left w:val="single" w:sz="24" w:space="0" w:color="{}"/><w:bottom w:val="none"/><w:right w:val="none"/></w:tcBorders>'
        .format(nsdecls('w'), color)
    )
    tcPr.append(borders)

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

def add_code_block(doc, code_text):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.columns[0].width = Inches(6.5)
    cell = table.cell(0, 0)
    set_cell_shading(cell, "F8FAFC") # Premium background
    set_cell_borders_code(cell, "3B82F6") # Light Blue left border
    set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
    
    p = cell.paragraphs[0]
    p.paragraph_format.left_indent = Inches(0.1)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.space_before = Pt(0)
    run = p.add_run(code_text)
    run.font.name = 'Consolas'
    run.font.size = Pt(8.5)
    run.font.color.rgb = RGBColor(30, 41, 59)
    
    # Empty paragraph after table
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_after = Pt(6)
    p_after.paragraph_format.space_before = Pt(0)

def add_image(doc, img_name, caption):
    img_path = img_name
    if not os.path.exists(img_path):
        img_path = os.path.join("ProyInt", img_name)
    if not os.path.exists(img_path):
        img_path = os.path.join(r"c:\asmasync-dashboard\ProyInt", img_name)
        
    if os.path.exists(img_path):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(2)
        p.add_run().add_picture(img_path, width=Inches(5.2))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(0)
        p_cap.paragraph_format.space_after = Pt(10)
        r = p_cap.add_run(f"Figura: {caption}")
        r.font.name = 'Segoe UI'
        r.font.size = Pt(9)
        r.font.italic = True
        r.font.color.rgb = RGBColor(107, 114, 128)
    else:
        p = doc.add_paragraph()
        r = p.add_run(f"[Imagen no encontrada: {img_name}]")
        r.font.color.rgb = RGBColor(220, 38, 38)
        r.font.italic = True

def main():
    doc = Document()
    
    # Page setup
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Base style
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Segoe UI'
    font.size = Pt(11)

    # --- PORTADA PREMIUM UTCV ---
    p_univ_space = doc.add_paragraph()
    p_univ_space.paragraph_format.space_before = Pt(80)
    
    p_univ = doc.add_paragraph()
    p_univ.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_univ = p_univ.add_run("UNIVERSIDAD TECNOLÓGICA DEL CENTRO DE VERACRUZ")
    run_univ.bold = True
    run_univ.font.size = Pt(16)
    run_univ.font.color.rgb = RGBColor(15, 118, 110) # Teal color typical for green universities
    
    p_carrera = doc.add_paragraph()
    p_carrera.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_carrera.paragraph_format.space_after = Pt(40)
    run_carrera = p_carrera.add_run("Programación de Aplicaciones — TI Desarrollo de Software Multiplataforma")
    run_carrera.font.size = Pt(11)
    run_carrera.font.color.rgb = RGBColor(107, 114, 128)
    
    p_line = doc.add_paragraph()
    p_line.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_line = p_line.add_run("━" * 32)
    r_line.font.color.rgb = RGBColor(13, 148, 136)
    r_line.bold = True
    p_line.paragraph_format.space_after = Pt(30)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_title = p_title.add_run("Plan de Desarrollo e Integración de Componentes de Software\nAsmaSync")
    run_title.bold = True
    run_title.font.size = Pt(22)
    run_title.font.color.rgb = RGBColor(30, 58, 138)
    p_title.paragraph_format.space_after = Pt(40)

    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_before = Pt(80)
    p_meta.paragraph_format.line_spacing = 1.3
    run_meta = p_meta.add_run(
        "Entregable: Saber Hacer Producto (SHP) — Segundo Parcial\n"
        "Materia: Integración de Aplicaciones\n"
        "Fecha: Julio de 2026\n"
        "Cuitláhuac, Veracruz, México"
    )
    run_meta.font.size = Pt(10.5)
    run_meta.font.color.rgb = RGBColor(75, 85, 99)

    doc.add_page_break()

    # Section 1: Intro
    add_heading(doc, "Introducción y Arquitectura de Integración en la UTCV", level=1)
    add_justified_indented_paragraph(doc, 
        "Este plan de desarrollo e integración define formalmente la arquitectura, protocolos y directrices de seguridad para el ecosistema AsmaSync, "
        "un sistema médico inteligente diseñado en la Universidad Tecnológica del Centro de Veracruz (UTCV). La plataforma tiene como propósito la recopilación "
        "automatizada de signos vitales (oximetría de pulso SpO2 y Flujo Espiratorio Máximo PEF) mediante sensores IoT y simuladores de hardware, permitiendo que "
        "un algoritmo de Machine Learning (Scikit-Learn) clasifique el nivel de riesgo de crisis del paciente y notifique de inmediato a los médicos y tutores a "
        "través de una aplicación web (Angular 17) y móvil (Flutter).")

    add_image(doc, "security_architecture.png", "Diagrama de la Arquitectura de Seguridad de AsmaSync")

    # Section 2: Security
    add_heading(doc, "1. Mecanismos de Seguridad que se Integrarán", level=1)
    add_justified_indented_paragraph(doc, 
        "El aseguramiento de datos de salud confidenciales (PHI) exige la adopción de controles alineados con la NOM-004-SSA3-2012 (Expediente Clínico Electrónico en México) "
        "y estándares internacionales como HIPAA. Los componentes de AsmaSync se integran siguiendo los 7 principios fundamentales de la codificación segura:")
    
    add_bullet_point(doc, "Validación de Entradas (Input Validation)", 
        "Validación reactiva en formularios contra inyecciones SQL (SQLi) y Cross-Site Scripting (XSS) en todos los campos de formularios reactivos del médico y paciente.")
    add_code_block(doc, "const sqlPattern = /(')|(--)|(;)|(\\/*)|(xp_)/i;\nconst xssPattern = /<script|onerror\\s*=|javascript:|<iframe|onload\\s*=/i;\nconst hasInjection = sqlPattern.test(control.value) || xssPattern.test(control.value);")

    add_bullet_point(doc, "Autenticación y Autorización", 
        "El login se delega a Supabase Auth. El usuario recibe un token JWT firmado criptográficamente con algoritmo RS256/HS256. El backend de FastAPI intercepta e inspecciona el token en cada llamada.")
    
    add_bullet_point(doc, "Manejo Seguro de Contraseñas", 
        "El backend de Supabase almacena las contraseñas aplicando hashing adaptativo Bcrypt con salt dinámico, y el frontend Angular cifra los datos del LocalStorage con AES-256 (CryptoJS).")
    add_code_block(doc, "setItem(key: string, value: any): void {\n    const json = JSON.stringify(value);\n    const encrypted = CryptoJS.AES.encrypt(json, this.SECRET_KEY).toString();\n    localStorage.setItem(key, encrypted);\n}")

    add_bullet_point(doc, "Mínimo Privilegio (Least Privilege)", 
        "La conexión a PostgreSQL utiliza un rol restringido con permisos exclusivos de CRUD, inhabilitando operaciones administrativas globales sobre el motor de base de datos.")
    
    add_bullet_point(doc, "Manejo de Errores y Excepciones", 
        "El backend FastAPI implementa un middleware de captura global de excepciones. De este modo, los fallos internos o de conexión de base de datos no exponen trazas de pila (stack traces), nombres de columnas o dependencias.")
    add_code_block(doc, "@app.exception_handler(SQLAlchemyError)\nasync def database_exception_handler(request: Request, exc: SQLAlchemyError):\n    logger.error(f\"Error de base de datos detectado: {str(exc)}\")\n    return JSONResponse(status_code=400, content={\"detail\": \"La transacción no pudo ser procesada.\"})")

    add_bullet_point(doc, "Actualización Constante", 
        "Registro estricto de librerías críticas en requirements.txt y congelación de paquetes en package-lock.json en el cliente web, reduciendo la exposición ante vulnerabilidades de la cadena de suministro.")
    
    add_bullet_point(doc, "Uso de Conexiones Seguras (TLS/Certificados)", 
        "Cifrado forzado por HTTPS con soporte exclusivo de TLS 1.3 en Render y Supabase. El interceptor de Angular inyecta la cabecera Authorization: Bearer únicamente en peticiones destinadas a la API oficial de AsmaSync.")

    # Section 3: JSON Payloads and Catalogue
    add_heading(doc, "2. Catálogo de Web Services, Protocolos y Formatos de Datos", level=1)
    add_justified_indented_paragraph(doc, 
        "La comunicación entre el cliente (Angular / Flutter) y el servidor (FastAPI) se efectúa de manera síncrona mediante el protocolo REST sobre HTTPS y de manera asíncrona mediante WebSockets sobre HTTPS para telemetría en vivo. El formato de intercambio estandarizado es JSON (application/json) y application/pdf para reportes descargables. A continuación se presentan las estructuras de datos JSON principales de las peticiones:")

    add_heading(doc, "Ejemplo 1: POST /api/auth/register (Entrada/Salida)", level=2)
    add_code_block(doc, "Entrada JSON:\n{\n  \"email\": \"paciente.ejemplo@utcv.edu.mx\",\n  \"password\": \"PasswordSegura99!\",\n  \"role\": \"patient\",\n  \"full_name\": \"Juan Pérez Gómez\"\n}\n\nSalida Exitosa (HTTP 201):\n{\n  \"id\": 14,\n  \"email\": \"paciente.ejemplo@utcv.edu.mx\",\n  \"role\": \"patient\",\n  \"created_at\": \"2026-07-16T12:00:00Z\"\n}")

    add_heading(doc, "Ejemplo 2: POST /api/predictor/risk (Entrada/Salida)", level=2)
    add_code_block(doc, "Entrada JSON:\n{\n  \"pef\": 310,\n  \"spo2\": 88,\n  \"symptoms_severity\": \"severe\"\n}\n\nSalida Exitosa (HTTP 200):\n{\n  \"predicted_risk\": \"red\",\n  \"accuracy_validated\": 0.924,\n  \"clinical_recommendation\": \"Alerta crítica de asma. Administre inhalador de rescate y consulte urgencias.\"\n}")

    add_heading(doc, "Catálogo General de Endpoints RESTful y WebSockets", level=2)
    
    # Table of endpoints
    col_w = [Inches(1.2), Inches(0.8), Inches(2.2), Inches(1.5), Inches(1.3)]
    headers = ["Recurso / Módulo", "Método", "Endpoint", "Parámetros / Cargas", "Salidas (Éxito)"]
    
    endpoints_data = [
        ("Autenticación", "GET", "/api/auth/check-email", "Query: email (string)", "JSON: available status (HTTP 200)"),
        ("Autenticación", "POST", "/api/auth/register", "JSON: email, password, role", "JSON: user profile (HTTP 201)"),
        ("Autenticación", "POST", "/api/auth/login", "JSON: email, password", "JSON: access_token JWT (HTTP 200)"),
        ("Mediciones IoT", "POST", "/api/measurements", "JSON: patient_id, spo2, pef", "JSON: measurement data (HTTP 201)"),
        ("Mediciones IoT", "GET", "/api/measurements/patient/{id}", "URL Param: id (int)", "JSON: array of readings (HTTP 200)"),
        ("Mediciones IoT", "POST", "/api/measurements/spirometer/simulate", "x-api-key + JSON: email, pef", "JSON: success status (HTTP 201)"),
        ("IA / Predicción", "POST", "/api/predictor/risk", "JSON: pef, spo2, symptoms", "JSON: predicted_risk (HTTP 200)"),
        ("Pacientes", "POST", "/api/patients", "JSON: first_name, birth_date", "JSON: patient_id (HTTP 201)"),
        ("Pacientes", "GET", "/api/patients/{id}", "URL Param: id (int)", "JSON: patient data (HTTP 200)"),
        ("Pacientes", "PUT", "/api/patients/{id}", "JSON: first_name, phone", "JSON: update status (HTTP 200)"),
        ("Pacientes", "DELETE", "/api/patients/{id}", "URL Param: id (int)", "HTTP 204 No Content"),
        ("Reportes PDF", "GET", "/api/reports/patient/{id}/pdf", "URL Param: id (int)", "Binary: application/pdf (HTTP 200)"),
        ("Alertas en Vivo", "GET", "/api/alerts", "Query: is_viewed, limit", "JSON: array of alerts (HTTP 200)")
    ]

    table = doc.add_table(rows=1, cols=5)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    # Headers formatting
    hdr_cells = table.rows[0].cells
    for i, h_text in enumerate(headers):
        hdr_cells[i].text = h_text
        set_cell_shading(hdr_cells[i], "1F2937") # UTCV Gray/Dark header
        set_cell_margins(hdr_cells[i])
        for p in hdr_cells[i].paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run in p.runs:
                run.bold = True
                run.font.color.rgb = RGBColor(255, 255, 255)
                run.font.name = "Segoe UI"
                run.font.size = Pt(9.5)

    # Data rows formatting
    for row_idx, data in enumerate(endpoints_data):
        row_cells = table.add_row().cells
        bg_color = "F9FAFB" if row_idx % 2 == 0 else "FFFFFF"
        for col_idx, cell_value in enumerate(data):
            row_cells[col_idx].text = cell_value
            set_cell_shading(row_cells[col_idx], bg_color)
            set_cell_margins(row_cells[col_idx])
            for p in row_cells[col_idx].paragraphs:
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.space_before = Pt(2)
                for run in p.runs:
                    run.font.name = "Segoe UI"
                    run.font.size = Pt(8.5)
                    if col_idx == 1: # HTTP Method bolding
                        run.bold = True
                        if cell_value == "POST":
                            run.font.color.rgb = RGBColor(16, 185, 129)
                        elif cell_value == "GET":
                            run.font.color.rgb = RGBColor(59, 130, 246)
                        elif cell_value == "PUT":
                            run.font.color.rgb = RGBColor(245, 158, 11)
                        elif cell_value == "DELETE":
                            run.font.color.rgb = RGBColor(239, 68, 68)

    # Set column widths
    for row in table.rows:
        for idx, width in enumerate(col_w):
            row.cells[idx].width = width

    p_space_table = doc.add_paragraph()
    p_space_table.paragraph_format.space_before = Pt(10)

    # Section 4: Auth
    add_heading(doc, "3. Esquemas de Autenticación Remota de Web Services", level=1)
    add_justified_indented_paragraph(doc, 
        "Para dar cobertura a los distintos clientes y nodos de hardware del ecosistema de salud, se implementan de forma paralela tres esquemas de autenticación remota:")
    
    add_bullet_point(doc, "Tokens JWT Criptográficos (Supabase Auth)", 
        "Utilizado para el Dashboard web Angular y la App móvil Flutter. El usuario obtiene un token firmado con HS256/RS256 al autenticarse, el cual viaja en las cabeceras HTTPS de cada llamada como Bearer Token.")
    add_code_block(doc, "def verify_supabase_token(token: str = Depends(oauth2_scheme)) -> dict:\n    user_response = supabase.auth.get_user(token)\n    return {\"supabase_uid\": user_response.user.id, \"email\": user_response.user.email}")

    add_bullet_point(doc, "Cabecera Estática Personalizada (Dashboard API Key)", 
        "Sincronización de servidor a servidor (Machine-to-Machine) entre el Dashboard Hospitalario y la API de AsmaSync sin requerir sesión interactiva, validando la cabecera x-dashboard-api-key.")
    add_code_block(doc, "if x_dashboard_api_key and x_dashboard_api_key == settings.dashboard_api_key:\n    return {\"auth_method\": \"api_key\", \"is_admin\": True}")

    add_bullet_point(doc, "Clave de Ingesta IoT (Pre-Shared Key)", 
        "Ingesta rápida de telemetría de soplido para hardware embebido mediante clave pre-compartida x-api-key, reduciendo el consumo computacional del firmware del dispositivo.")
    add_code_block(doc, "if x_api_key != \"ClaveSecretaParaMaestros\":\n    raise HTTPException(status_code=403, detail=\"Sensor no autorizado\")")

    # Save document
    out_path = r"c:\asmasync-dashboard\ProyInt\Plan_Desarrollo_Integracion_SHP.docx"
    doc.save(out_path)
    print(f"SHP Word document saved at: {out_path}")

if __name__ == "__main__":
    main()
