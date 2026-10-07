"""
Generador de documento Word: Plan de Implementación de Web Services — AsmaSync
Datos extraídos directamente del OpenAPI JSON en producción:
https://asthma-predictor-api.onrender.com/openapi.json
"""

from docx import Document
from docx.shared import Inches, Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

# ─────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────

def cell_bg(cell, hex_color):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    tcPr.append(shd)

def table_borders(table, color="CBD5E1", sz=4):
    for row in table.rows:
        for cell in row.cells:
            tcPr = cell._tc.get_or_add_tcPr()
            tcb = OxmlElement('w:tcBorders')
            for side in ['top','left','bottom','right']:
                b = OxmlElement(f'w:{side}')
                b.set(qn('w:val'), 'single')
                b.set(qn('w:sz'), str(sz))
                b.set(qn('w:space'), '0')
                b.set(qn('w:color'), color)
                tcb.append(b)
            tcPr.append(tcb)

def para(doc, text, size=11, bold=False, italic=False, color=(31,41,55),
         align=WD_ALIGN_PARAGRAPH.JUSTIFY, sb=0, sa=6, ls=1.15, indent=0):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_before = Pt(sb)
    p.paragraph_format.space_after  = Pt(sa)
    p.paragraph_format.line_spacing = ls
    if indent:
        p.paragraph_format.left_indent = Cm(indent)
    r = p.add_run(text)
    r.font.name = 'Calibri'; r.font.size = Pt(size)
    r.bold = bold; r.italic = italic
    r.font.color.rgb = RGBColor(*color)
    return p

def h1(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(20); p.paragraph_format.space_after = Pt(6)
    r = p.add_run(text)
    r.font.name='Calibri'; r.font.size=Pt(15); r.bold=True
    r.font.color.rgb = RGBColor(30,58,138)

def h2(doc, text, color=(37,99,235)):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(14); p.paragraph_format.space_after = Pt(4)
    r = p.add_run(text)
    r.font.name='Calibri'; r.font.size=Pt(12.5); r.bold=True
    r.font.color.rgb = RGBColor(*color)

def hr(doc):
    p = doc.add_paragraph()
    p.paragraph_format.space_before=Pt(4); p.paragraph_format.space_after=Pt(4)
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bot  = OxmlElement('w:bottom')
    bot.set(qn('w:val'),'single'); bot.set(qn('w:sz'),'6')
    bot.set(qn('w:space'),'1');   bot.set(qn('w:color'),'BFDBFE')
    pBdr.append(bot); pPr.append(pBdr)

def body(doc, text, indent=0.5):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before=Pt(0); p.paragraph_format.space_after=Pt(7)
    p.paragraph_format.line_spacing=1.15
    p.paragraph_format.left_indent=Cm(indent)
    r = p.add_run(text)
    r.font.name='Calibri'; r.font.size=Pt(11)
    r.font.color.rgb=RGBColor(31,41,55)

def bullet(doc, label, desc, indent=1.0):
    p = doc.add_paragraph()
    p.paragraph_format.space_before=Pt(0); p.paragraph_format.space_after=Pt(3)
    p.paragraph_format.line_spacing=1.15
    p.paragraph_format.left_indent=Cm(indent)
    p.paragraph_format.first_line_indent=Cm(-0.5)
    r1 = p.add_run(f"• {label}  ")
    r1.font.name='Calibri'; r1.font.size=Pt(11); r1.bold=True
    r1.font.color.rgb=RGBColor(30,58,138)
    r2 = p.add_run(desc)
    r2.font.name='Calibri'; r2.font.size=Pt(11)
    r2.font.color.rgb=RGBColor(55,65,81)

# ─────────────────────────────────────────────────────────────
# TABLA DE ENDPOINTS — extraída del OpenAPI real en producción
# ─────────────────────────────────────────────────────────────
# Formato: (Operación/descripción, Método, Endpoint, Entradas, Salidas, Tag)

ENDPOINTS = [
    # ── AUTHENTICATION ──────────────────────────────────────────────────────────
    ("Registrar usuario / fusionar identidades", "POST", "/api/auth/register",
     "JSON: {full_name, role} + Bearer Token (header)", "JSON: AuthResponse {message, user}",
     "Authentication"),
    ("Asignar o cambiar rol del usuario", "PATCH", "/api/auth/role",
     "JSON: {role} + Bearer Token (header)", "JSON: AuthResponse {message, user}",
     "Authentication"),
    ("Verificar token JWT y obtener usuario", "POST", "/api/auth/verify",
     "Bearer Token (header)", "JSON: UserResponse",
     "Authentication"),
    ("Crear perfil médico del usuario", "POST", "/api/auth/profile",
     "JSON: UserProfileRequest + Bearer Token (header)", "JSON: {message, profile_id}",
     "Authentication"),
    ("Obtener perfil médico del usuario actual", "GET", "/api/auth/profile",
     "Bearer Token (header)", "JSON: UserProfileResponse",
     "Authentication"),
    ("Actualizar perfil médico del usuario", "PUT", "/api/auth/profile",
     "JSON: UserProfileRequest + Bearer Token (header)", "JSON: UserProfileResponse",
     "Authentication"),
    ("Asignar doctor al paciente (por código)", "POST", "/api/auth/assign-doctor",
     "Query: doctor_code + Bearer Token (header)", "JSON: {message}",
     "Authentication"),
    ("Actualizar avatar del usuario", "PATCH", "/api/auth/update-avatar",
     "JSON: {avatar_seed, avatar_background} + Bearer Token", "JSON: AuthResponse",
     "Authentication"),
    ("Verificar si un correo ya existe", "POST", "/api/auth/check-email",
     "JSON: {email}", "JSON: {exists, patient}",
     "Authentication"),
    ("Actualizar FCM Token (notificaciones push)", "POST", "/api/auth/fcm-token",
     "Query: fcm_token + Bearer Token (header)", "JSON: {message}",
     "Authentication"),

    # ── MEASUREMENTS ────────────────────────────────────────────────────────────
    ("Registrar signos vitales (SpO2, FC, sueño)", "POST", "/api/measurements/vitals",
     "JSON: {spo2, heart_rate, sleep_hours, measured_at} + Bearer Token", "JSON: VitalSignResponse",
     "Measurements"),
    ("Listar historial de signos vitales", "GET", "/api/measurements/vitals",
     "Query: limit=50 + Bearer Token (header)", "JSON: List[VitalSignResponse]",
     "Measurements"),
    ("Registrar lectura espirométrica (PEF/FEV1)", "POST", "/api/measurements/spirometer",
     "JSON: {pef, fev1, symptoms, measured_at, …} + Bearer Token + Query: lat, lng", "JSON: SpirometerResponse",
     "Measurements"),
    ("Registrar síntomas manualmente (sin espirómetro)", "POST", "/api/measurements/manual",
     "JSON: {symptoms, manual_pef, notes, measured_at} + Bearer Token", "JSON: ManualEntryResponse",
     "Measurements"),
    ("Obtener tendencia semanal de PEF (últimos 7 días)", "GET", "/api/measurements/weekly-trend",
     "Bearer Token (header)", "JSON: WeeklyTrendResponse {max_pef, min_pef, avg_pef, daily_data}",
     "Measurements"),
    ("Obtener historial fusionado de mediciones", "GET", "/api/measurements/history",
     "Query: limit=50 + Bearer Token (header)", "JSON: List[MeasurementHistoryItem]",
     "Measurements"),
    ("Actualizar síntomas de lectura espirométrica", "PATCH", "/api/measurements/spirometer/{reading_id}/symptoms",
     "Path: reading_id + JSON: {symptoms, intensity, notes} + Bearer Token", "JSON: SpirometerResponse",
     "Measurements"),

    # ── PREDICTIONS ─────────────────────────────────────────────────────────────
    ("Crear predicción de riesgo de asma (ML)", "POST", "/api/predictions",
     "JSON: PredictionRequest {pef, spo2, heart_rate, …} + Bearer Token", "JSON: PredictionResponse {risk_level, score}",
     "Predictions"),
    ("Listar historial de predicciones", "GET", "/api/predictions",
     "Query: limit=30 + Bearer Token (header)", "JSON: List[PredictionResponse]",
     "Predictions"),
    ("Obtener última predicción del usuario", "GET", "/api/predictions/latest",
     "Bearer Token (header)", "JSON: PredictionResponse {risk_level, score, created_at}",
     "Predictions"),

    # ── PATIENTS ────────────────────────────────────────────────────────────────
    ("Obtener KPIs de pacientes del doctor", "GET", "/api/patients/stats",
     "Bearer Token (header)", "JSON: {total, high_risk, moderate_risk, low_risk}",
     "Patients"),
    ("Listar pacientes paginados del doctor", "GET", "/api/patients",
     "Query: skip, limit, search, risk_level + Bearer Token", "JSON: {patients, total, page}",
     "Patients"),
    ("Crear nuevo paciente e invitarlo por email", "POST", "/api/patients",
     "JSON: PatientFullCreate {email, full_name, …} + Bearer Token + Query: redirect_url", "JSON: {patient, message}",
     "Patients"),
    ("Obtener resumen de un paciente por ID", "GET", "/api/patients/{patient_id}",
     "Path: patient_id + Bearer Token (header)", "JSON: PatientSummary",
     "Patients"),
    ("Actualizar datos parciales de un paciente", "PATCH", "/api/patients/{patient_id}",
     "Path: patient_id + JSON: (campos parciales) + Bearer Token", "JSON: Patient actualizado",
     "Patients"),
    ("Obtener perfil clínico completo de paciente", "GET", "/api/patients/{patient_id}/full",
     "Path: patient_id + Bearer Token (header)", "JSON: PatientFullProfile",
     "Patients"),
    ("Actualizar medicamentos del paciente", "PUT", "/api/patients/{patient_id}/medications",
     "Path: patient_id + JSON: List[MedicationUpdate] + Bearer Token", "JSON: {medications}",
     "Patients"),
    ("Obtener plan de acción del paciente", "GET", "/api/patients/{patient_id}/action-plan",
     "Path: patient_id + Bearer Token (header)", "JSON: ActionPlan {zones, steps}",
     "Patients"),
    ("Actualizar plan de acción del paciente", "PUT", "/api/patients/{patient_id}/action-plan",
     "Path: patient_id + JSON: ActionPlanUpdate + Bearer Token", "JSON: ActionPlan actualizado",
     "Patients"),
    ("Eliminar paciente del sistema", "DELETE", "/api/patients/{patient_id}",
     "Path: patient_id + Bearer Token (header)", "HTTP 204 No Content",
     "Patients"),

    # ── ACTION PLANS ────────────────────────────────────────────────────────────
    ("Crear / reemplazar plan de acción propio", "POST", "/api/action-plans",
     "JSON: ActionPlanRequest {green_zone, yellow_zone, red_zone, emergency_contact} + Bearer Token", "JSON: ActionPlanResponse",
     "Action Plans"),
    ("Obtener plan de acción activo del usuario", "GET", "/api/action-plans",
     "Bearer Token (header)", "JSON: ActionPlanResponse",
     "Action Plans"),
    ("Agregar paso al plan de acción activo", "POST", "/api/action-plans/steps",
     "JSON: ActionStepRequest {step_text, zone, order} + Bearer Token", "JSON: ActionStepResponse",
     "Action Plans"),
    ("Listar pasos del plan (filtrar por zona)", "GET", "/api/action-plans/steps",
     "Query: zone (verde/amarillo/rojo) + Bearer Token", "JSON: List[ActionStepResponse]",
     "Action Plans"),

    # ── DEVICES ─────────────────────────────────────────────────────────────────
    ("Vincular nuevo dispositivo IoT al usuario", "POST", "/api/devices",
     "JSON: DeviceRequest {device_name, device_type, serial_number} + Bearer Token", "JSON: DeviceResponse",
     "Devices"),
    ("Listar dispositivos del usuario autenticado", "GET", "/api/devices",
     "Bearer Token (header)", "JSON: List[DeviceResponse]",
     "Devices"),

    # ── NOTIFICATIONS ───────────────────────────────────────────────────────────
    ("Crear notificación interna", "POST", "/api/notifications",
     "JSON: NotificationRequest {title, message, type} + Bearer Token", "JSON: NotificationResponse",
     "Notifications"),
    ("Listar notificaciones del usuario", "GET", "/api/notifications",
     "Query: unread_only=false + Bearer Token", "JSON: List[NotificationResponse]",
     "Notifications"),
    ("Marcar notificación como leída", "PATCH", "/api/notifications/{notification_id}/read",
     "Path: notification_id + Bearer Token (header)", "JSON: {message}",
     "Notifications"),

    # ── SETTINGS ────────────────────────────────────────────────────────────────
    ("Obtener configuración del usuario", "GET", "/api/settings",
     "Bearer Token (header)", "JSON: SettingsResponse",
     "Settings"),
    ("Actualizar configuración del usuario", "PUT", "/api/settings",
     "JSON: SettingsRequest {theme, notifications, language, …} + Bearer Token", "JSON: SettingsResponse",
     "Settings"),

    # ── MEDICATIONS ─────────────────────────────────────────────────────────────
    ("Listar medicamentos del paciente", "GET", "/api/medications/",
     "Bearer Token (header)", "JSON: List[MedicationResponse]",
     "Medications"),
    ("Registrar nuevo medicamento", "POST", "/api/medications/",
     "JSON: MedicationCreate {name, dose, frequency, …} + Bearer Token", "JSON: MedicationResponse",
     "Medications"),
    ("Actualizar datos de un medicamento", "PATCH", "/api/medications/{medication_id}",
     "Path: medication_id + JSON: MedicationUpdate + Bearer Token", "JSON: MedicationResponse",
     "Medications"),
    ("Eliminar medicamento del paciente", "DELETE", "/api/medications/{medication_id}",
     "Path: medication_id + Bearer Token (header)", "HTTP 204 No Content",
     "Medications"),
    ("Registrar dosis tomada del medicamento", "POST", "/api/medications/{medication_id}/take",
     "Path: medication_id + Bearer Token (header)", "JSON: MedicationResponse actualizado",
     "Medications"),

    # ── EMERGENCY CONTACTS ──────────────────────────────────────────────────────
    ("Listar contactos de emergencia", "GET", "/api/emergency-contacts",
     "Bearer Token (header)", "JSON: List[EmergencyContactResponse]",
     "Emergency Contacts"),
    ("Agregar contacto de emergencia", "POST", "/api/emergency-contacts",
     "JSON: {full_name, phone, relationship} + Bearer Token", "JSON: EmergencyContactResponse",
     "Emergency Contacts"),
    ("Actualizar contacto de emergencia", "PUT", "/api/emergency-contacts/{contact_id}",
     "Path: contact_id + JSON: EmergencyContactUpdate + Bearer Token", "JSON: EmergencyContactResponse",
     "Emergency Contacts"),
    ("Eliminar contacto de emergencia", "DELETE", "/api/emergency-contacts/{contact_id}",
     "Path: contact_id + Bearer Token (header)", "HTTP 204 No Content",
     "Emergency Contacts"),

    # ── GUARDIAN / FAMILY ───────────────────────────────────────────────────────
    ("Obtener código de vinculación familiar", "GET", "/api/guardian/linking-code",
     "Bearer Token (header)", "JSON: LinkingCodeResponse {code, expires_at}",
     "Guardian / Family"),
    ("Vincular guardián a paciente (por código)", "POST", "/api/guardian/link",
     "JSON: LinkPatientRequest {linking_code} + Bearer Token", "JSON: {message}",
     "Guardian / Family"),
    ("Listar pacientes monitoreados por guardián", "GET", "/api/guardian/monitored-patients",
     "Bearer Token (header)", "JSON: List[Patient]",
     "Guardian / Family"),
    ("Listar guardianes que monitorean al paciente", "GET", "/api/guardian/my-guardians",
     "Bearer Token (header)", "JSON: List[Guardian]",
     "Guardian / Family"),
    ("Desvincular guardián del paciente", "DELETE", "/api/guardian/unlink/{guardian_id}",
     "Path: guardian_id + Bearer Token (header)", "JSON: {message}",
     "Guardian / Family"),

    # ── DOCTOR PANEL ────────────────────────────────────────────────────────────
    ("Crear / asegurar perfil del doctor (upsert)", "POST", "/api/doctor/profile",
     "Bearer Token (header)", "JSON: DoctorProfile {doctor_code, specialty, …}",
     "Doctor Panel"),
    ("Obtener perfil completo del doctor logueado", "GET", "/api/doctor/profile",
     "Bearer Token (header)", "JSON: DoctorProfile con doctor_code",
     "Doctor Panel"),
    ("Listar todos los pacientes del doctor", "GET", "/api/doctor/my-patients",
     "Bearer Token (header)", "JSON: List[UserResponse]",
     "Doctor Panel"),
    ("Obtener KPIs de pacientes del doctor", "GET", "/api/doctor/my-patients/stats",
     "Bearer Token (header)", "JSON: {total, high_risk, moderate_risk, last_measurements}",
     "Doctor Panel"),

    # ── DASHBOARD ───────────────────────────────────────────────────────────────
    ("Obtener métricas principales del dashboard", "GET", "/api/dashboard/metrics",
     "Bearer Token (header)", "JSON: {total_patients, critical_alerts, moderate_risk, distribution}",
     "Dashboard"),
    ("Listar pacientes prioritarios (alto/mod. riesgo)", "GET", "/api/dashboard/priority-patients",
     "Query: limit=5 + Bearer Token (header)", "JSON: List[PriorityPatient]",
     "Dashboard"),

    # ── ALERTS ──────────────────────────────────────────────────────────────────
    ("Listar alertas del doctor (con filtros)", "GET", "/api/alerts",
     "Query: skip, limit, is_viewed + Bearer Token", "JSON: List[Alert]",
     "Alerts"),
    ("Obtener conteo de alertas no leídas", "GET", "/api/alerts/unread-count",
     "Bearer Token (header)", "JSON: {count}",
     "Alerts"),
    ("Marcar alerta como vista", "PATCH", "/api/alerts/{alert_id}/mark-read",
     "Path: alert_id + Bearer Token (header)", "JSON: {message}",
     "Alerts"),

    # ── ENVIRONMENTAL ───────────────────────────────────────────────────────────
    ("Obtener datos ambientales (clima, polen, AQI)", "GET", "/api/environmental/info",
     "Query: lat, lng (coordenadas GPS)", "JSON: {weather, aqi, pollen, temperature, humidity}",
     "Environmental"),

    # ── ADMIN PANEL ─────────────────────────────────────────────────────────────
    ("Invitar nuevo doctor al sistema", "POST", "/api/admin/invite-doctor",
     "JSON: InviteDoctorRequest {email, full_name, specialty, …} + API Key / JWT Admin", "JSON: {message, doctor_id}",
     "Admin Panel"),
    ("Listar todos los doctores del sistema", "GET", "/api/admin/doctors",
     "API Key / JWT Admin (header)", "JSON: List[DoctorAdmin]",
     "Admin Panel"),
    ("Desactivar cuenta de un doctor", "PATCH", "/api/admin/doctors/{doctor_id}/deactivate",
     "Path: doctor_id + API Key / JWT Admin", "JSON: {message}",
     "Admin Panel"),
    ("Reactivar cuenta de un doctor", "PATCH", "/api/admin/doctors/{doctor_id}/activate",
     "Path: doctor_id + API Key / JWT Admin", "JSON: {message}",
     "Admin Panel"),
    ("Actualizar perfil profesional de un doctor", "PATCH", "/api/admin/doctors/{doctor_id}",
     "Path: doctor_id + JSON: {specialty, license_number, hospital_name} + API Key", "JSON: {message}",
     "Admin Panel"),
    ("Listar todos los pacientes del sistema", "GET", "/api/admin/patients",
     "API Key / JWT Admin (header)", "JSON: List[PatientAdmin {assigned_doctor}]",
     "Admin Panel"),
    ("Asignar paciente a un doctor (Admin)", "POST", "/api/admin/patients/{patient_id}/assign-doctor",
     "Path: patient_id + JSON: {doctor_id} + API Key / JWT Admin", "JSON: {message, patient_id, doctor_id}",
     "Admin Panel"),
    ("Obtener estadísticas globales del sistema", "GET", "/api/admin/stats",
     "API Key / JWT Admin (header)", "JSON: {total_patients, zones, doctor_performance, hospital_name}",
     "Admin Panel"),

    # ── HEALTH CHECK ────────────────────────────────────────────────────────────
    ("Verificar estado del servidor y BD", "GET", "/health",
     "N/A (sin autenticación)", "JSON: {status, database}",
     "System"),
    ("Endpoint raíz del servicio", "GET", "/",
     "N/A (sin autenticación)", "JSON: {message: 'Asthma API is running!'}",
     "System"),
]


# ─────────────────────────────────────────────────────────────
# COLORES POR TAG (cabeceras de grupo)
# ─────────────────────────────────────────────────────────────

TAG_COLORS = {
    "Authentication":     ("1E3A8A", "DBEAFE"),   # navy / light blue
    "Measurements":       ("064E3B", "D1FAE5"),   # dark green / light green
    "Predictions":        ("5B21B6", "EDE9FE"),   # purple
    "Patients":           ("9A3412", "FEF3C7"),   # amber-dark / light amber
    "Action Plans":       ("0F766E", "CCFBF1"),   # teal
    "Devices":            ("1E40AF", "BFDBFE"),   # blue
    "Notifications":      ("92400E", "FDE68A"),   # orange
    "Settings":           ("374151", "F3F4F6"),   # gray
    "Medications":        ("831843", "FCE7F3"),   # pink
    "Emergency Contacts": ("7C3AED", "EDE9FE"),   # violet
    "Guardian / Family":  ("0369A1", "BAE6FD"),   # sky blue
    "Doctor Panel":       ("065F46", "A7F3D0"),   # emerald
    "Dashboard":          ("1D4ED8", "BFDBFE"),   # indigo
    "Alerts":             ("991B1B", "FEE2E2"),   # red
    "Environmental":      ("166534", "BBF7D0"),   # green
    "Admin Panel":        ("1F2937", "D1D5DB"),   # dark gray
    "System":             ("475569", "F1F5F9"),   # slate
}

METHOD_FG = {
    "GET":    (21,  128, 61),
    "POST":   (29,  78, 216),
    "PUT":    (146, 64,  14),
    "PATCH":  (109, 40, 217),
    "DELETE": (185, 28,  28),
}
METHOD_BG = {
    "GET":    "F0FDF4",
    "POST":   "EFF6FF",
    "PUT":    "FFFBEB",
    "PATCH":  "F5F3FF",
    "DELETE": "FEF2F2",
}


# ─────────────────────────────────────────────────────────────
# CONSTRUCCIÓN DEL DOCUMENTO
# ─────────────────────────────────────────────────────────────

def build():
    doc = Document()

    # Márgenes
    for s in doc.sections:
        s.top_margin=Cm(2.5); s.bottom_margin=Cm(2.5)
        s.left_margin=Cm(2.8); s.right_margin=Cm(2.2)

    # ═══════════════════════ PORTADA ════════════════════════════
    doc.add_paragraph().paragraph_format.space_before = Pt(60)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("Universidad Tecnológica del Centro de Veracruz (UTCV)")
    r.font.name='Calibri'; r.font.size=Pt(13); r.font.color.rgb=RGBColor(55,65,81)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(40)
    r = p.add_run("Proyecto Integrador — AsmaSync")
    r.font.name='Calibri'; r.font.size=Pt(12); r.italic=True
    r.font.color.rgb=RGBColor(107,114,128)

    # Línea
    p = doc.add_paragraph()
    p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_after=Pt(28)
    r = p.add_run("━" * 28); r.font.color.rgb=RGBColor(37,99,235); r.font.size=Pt(10)

    # Título
    p = doc.add_paragraph()
    p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_after=Pt(10)
    r = p.add_run("PLAN DE IMPLEMENTACIÓN DE\nWEB SERVICES EN EL DESARROLLO WEB")
    r.font.name='Calibri'; r.font.size=Pt(24); r.bold=True
    r.font.color.rgb=RGBColor(30,58,138)

    p = doc.add_paragraph()
    p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_after=Pt(50)
    r = p.add_run("Actividad 3")
    r.font.name='Calibri'; r.font.size=Pt(14); r.bold=True
    r.font.color.rgb=RGBColor(37,99,235)

    # Línea 2
    p = doc.add_paragraph()
    p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_after=Pt(36)
    r = p.add_run("━" * 28); r.font.color.rgb=RGBColor(37,99,235); r.font.size=Pt(10)

    # Metadatos
    p = doc.add_paragraph()
    p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(
        "Protocolo REST  ·  Formato JSON  ·  OpenAPI 3.0\n"
        "Backend: FastAPI + PostgreSQL + Supabase Auth\n"
        "Frontend: Angular 17  ·  Servidor: Uvicorn / Render\n"
        "Documentación en línea: https://asthma-predictor-api.onrender.com/docs\n"
        "Fecha: Junio 2026"
    )
    r.font.name='Calibri'; r.font.size=Pt(11); r.italic=True
    r.font.color.rgb=RGBColor(107,114,128)
    p.paragraph_format.line_spacing=1.5

    doc.add_page_break()

    # ═══════════════════ SECCIÓN 1: INTRODUCCIÓN ════════════════
    h1(doc, "Introducción")
    hr(doc)
    body(doc,
        "El presente documento describe el Plan de Implementación de Web Services para el "
        "Proyecto Integrador AsmaSync, una plataforma de monitoreo y predicción de episodios "
        "de asma que integra un dashboard médico web, una API RESTful y una aplicación móvil "
        "Android con conectividad IoT (espirómetro y smartwatch).")
    body(doc,
        "El plan especifica las tecnologías seleccionadas para cada capa de la arquitectura, "
        "y presenta el catálogo completo de las 70 peticiones (endpoints) que expone el Web "
        "Service en producción, documentadas directamente desde el OpenAPI 3.1 publicado en "
        "https://asthma-predictor-api.onrender.com/openapi.json.")

    # ═══════════════════ SECCIÓN 2: TECNOLOGÍAS ═════════════════
    h1(doc, "Descripción de Tecnologías por Apartado")
    hr(doc)

    # a)
    h2(doc, "a)  Comunicación entre cliente y servidor")
    body(doc,
        "La comunicación se realiza mediante HTTP/HTTPS sobre TCP/IP. El cliente web "
        "(Angular 17) y la aplicación móvil (Android) se comunican con el servidor FastAPI "
        "a través de HTTPS con TLS 1.3, garantizando confidencialidad e integridad de cada "
        "mensaje. Para datos en tiempo real (tendencias PEF en vivo) se emplea WebSocket "
        "sobre el endpoint /ws/trend/{user_id}.")
    bullet(doc, "Protocolo de transporte:", "HTTPS (TLS 1.3) sobre HTTP/1.1 y HTTP/2")
    bullet(doc, "Modelo:", "Cliente–Servidor síncrono (REST request/response) + asíncrono (WebSocket)")
    bullet(doc, "Autenticación de canal:", "Certificado SSL/TLS emitido automáticamente por Render (prod.)")
    bullet(doc, "Cliente web:", "Angular HttpClient con interceptor automático de Bearer Token")
    bullet(doc, "Cliente móvil:", "Retrofit 2 (Android) con OkHttp + certificados TLS nativos")

    # b)
    h2(doc, "b)  Intercambio de datos")
    body(doc,
        "El formato primario de intercambio es JSON (application/json), elegido por su "
        "compatibilidad nativa con FastAPI, Angular y Android. Los esquemas se validan "
        "automáticamente con Pydantic v2 en el backend. Para reportes médicos se usa "
        "application/pdf (binario).")
    bullet(doc, "Formato primario:", "JSON (application/json) — todos los endpoints REST")
    bullet(doc, "Formato binario:", "application/pdf — generación de reportes clínicos descargables")
    bullet(doc, "Serialización backend:", "Pydantic v2 con field_validator para rangos fisiológicos (PEF 0–900, SpO2 50–100)")
    bullet(doc, "Serialización frontend:", "Angular HttpClient con interfaces TypeScript tipadas")
    bullet(doc, "Encoding:", "UTF-8 en todos los cuerpos de petición y respuesta")

    # c)
    h2(doc, "c)  Protocolo para Web Services")
    body(doc,
        "AsmaSync adopta REST (Representational State Transfer) como protocolo arquitectónico. "
        "Cada recurso (paciente, medición, cita, predicción) se identifica con una URL "
        "semántica y se opera con métodos HTTP estándar. La API expone su contrato formal "
        "en OpenAPI 3.1, consultable en /docs (Swagger UI) y /redoc.")
    bullet(doc, "Arquitectura:", "RESTful API sin estado (stateless) — cada petición es autónoma")
    bullet(doc, "Especificación:", "OpenAPI 3.1 — generada automáticamente por FastAPI")
    bullet(doc, "Métodos HTTP:", "GET · POST · PUT · PATCH · DELETE")
    bullet(doc, "Códigos de estado:", "200, 201, 204, 400, 401, 403, 404, 422, 500")
    bullet(doc, "Seguridad:", "Bearer JWT (Supabase Auth) + API Key para rutas de administración")

    # d)
    h2(doc, "d)  Tecnología aplicada para el Web Service")
    body(doc,
        "El Web Service está implementado con FastAPI, framework Python de alto rendimiento "
        "basado en estándares abiertos. Utiliza SQLAlchemy como ORM, PostgreSQL como base "
        "de datos relacional y Supabase Auth para la gestión de identidades y tokens JWT.")
    bullet(doc, "Framework:", "FastAPI 0.127+ (Python 3.12)")
    bullet(doc, "ORM:", "SQLAlchemy 2.0 + Alembic (migraciones de esquema)")
    bullet(doc, "Base de datos:", "PostgreSQL 15 alojada en Supabase")
    bullet(doc, "Autenticación:", "Supabase Auth — JWT RS256 verificado en cada request")
    bullet(doc, "ML / IA:", "scikit-learn — modelo de predicción de riesgo de asma")
    bullet(doc, "PDF:", "ReportLab — reportes clínicos descargables")
    bullet(doc, "Notificaciones push:", "Firebase Cloud Messaging (FCM) — endpoint /api/auth/fcm-token")

    # e)
    h2(doc, "e)  Servidor Web")
    body(doc,
        "El servidor de aplicación es Uvicorn, un servidor ASGI de alto rendimiento que ejecuta "
        "la instancia FastAPI. En producción el servicio se despliega en Render con HTTPS "
        "automático, escalado automático y dominio permanente.")
    bullet(doc, "Servidor ASGI:", "Uvicorn 0.27+ (basado en uvloop + httptools)")
    bullet(doc, "Plataforma prod.:", "Render — https://asthma-predictor-api.onrender.com")
    bullet(doc, "Dev local:", "Uvicorn --reload (puerto 8000)")
    bullet(doc, "Contenedorización:", "Docker + docker-compose (PostgreSQL local en desarrollo)")
    bullet(doc, "CORS:", "Configurado en FastAPI para aceptar orígenes del dashboard Angular")
    bullet(doc, "Frontend:", "Angular 17 — compilado como SPA en dist/ · ng serve en dev")

    # f)
    h2(doc, "f)  Prueba de Web Services")
    body(doc,
        "La estrategia de pruebas combina herramientas automáticas e interactivas para validar "
        "la correctitud de cada endpoint antes y después del despliegue.")
    bullet(doc, "Swagger UI:", "Documentación interactiva en /docs — permite probar cada endpoint en el navegador")
    bullet(doc, "ReDoc:", "Documentación de referencia alternativa en /redoc")
    bullet(doc, "pytest + TestClient:", "Pruebas unitarias/integradas automatizadas con BD SQLite en memoria (tests/api/v1/)")
    bullet(doc, "Postman / Thunder Client:", "Colecciones de prueba manuales por módulo (Authentication, Patients, Measurements…)")
    bullet(doc, "Endpoint /health:", "Verifica conectividad con la base de datos en cada despliegue")
    bullet(doc, "Mocking:", "override de get_db y get_current_user en FastAPI para pruebas aisladas")

    # g)
    h2(doc, "g)  IDE (Entorno de Desarrollo Integrado)")
    bullet(doc, "Backend:", "Visual Studio Code + Python, Pylance, Ruff, autoDocstring, Docker")
    bullet(doc, "Frontend:", "Visual Studio Code + Angular Language Service, ESLint, Prettier, Tailwind CSS IntelliSense")
    bullet(doc, "Git:", "GitHub — control de versiones con feature branches y pull requests")
    bullet(doc, "BD:", "DBeaver Community (PostgreSQL local) · Supabase Studio (cloud)")
    bullet(doc, "Entorno Python:", "Virtual Environment (venv) aislado por proyecto")
    bullet(doc, "API Testing:", "Postman Desktop + Swagger UI integrado en el servidor")

    # h)
    h2(doc, "h)  Documentación")
    body(doc,
        "La documentación del Web Service es viva (living documentation), generada "
        "principalmente a partir del código fuente y complementada con artefactos escritos.")
    bullet(doc, "OpenAPI 3.1 / Swagger UI:", "/docs — descripción completa de todos los endpoints, schemas y códigos de respuesta")
    bullet(doc, "ReDoc:", "/redoc — documentación de referencia alternativa")
    bullet(doc, "Docstrings Python:", "Cada función de ruta documentada con descripción, parámetros y posibles errores")
    bullet(doc, "README.md:", "Instalación, variables de entorno y arranque del proyecto")
    bullet(doc, "MANUAL_USUARIO.md:", "Manual técnico de 40+ páginas con flujos del dashboard médico")
    bullet(doc, "Security_Audit_Report.md:", "Análisis STRIDE + plan de remediación de vulnerabilidades")
    bullet(doc, "CHANGELOG_DB_API.md:", "Registro de cambios en esquema BD y versiones de la API")

    # ═══════════════════ TABLA DE PETICIONES ════════════════════
    doc.add_page_break()
    h1(doc, "Catálogo de Peticiones del Web Service")
    hr(doc)
    body(doc,
        "La siguiente tabla documenta los 70 endpoints activos de la API AsmaSync, "
        "extraídos directamente del OpenAPI 3.1 en producción "
        "(https://asthma-predictor-api.onrender.com/openapi.json). "
        "Todos los endpoints retornan JSON (application/json) excepto el reporte PDF "
        "que retorna application/pdf.", indent=0)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # ── Tabla ──
    col_w = [Cm(4.4), Cm(1.8), Cm(5.6), Cm(4.4), Cm(3.2)]
    headers_txt = ["Operación / Descripción", "Método", "Endpoint", "Entradas (formato)", "Salidas (formato)"]

    table = doc.add_table(rows=1, cols=5)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    # Fila de encabezado
    hrow = table.rows[0].cells
    for i, hdr in enumerate(headers_txt):
        cell_bg(hrow[i], "1E3A8A")
        hrow[i].vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        p2 = hrow[i].paragraphs[0]
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p2.paragraph_format.space_before=Pt(3); p2.paragraph_format.space_after=Pt(3)
        r2 = p2.add_run(hdr)
        r2.font.name='Calibri'; r2.font.size=Pt(9); r2.bold=True
        r2.font.color.rgb=RGBColor(255,255,255)

    # Agrupar por tag para insertar separadores de sección
    current_tag = None
    row_idx = 0

    for (op, method, endpoint, inputs, outputs, tag) in ENDPOINTS:
        # ── Fila de grupo (tag) ──────────────────────
        if tag != current_tag:
            current_tag = tag
            tag_bg, tag_light = TAG_COLORS.get(tag, ("374151","F3F4F6"))
            row_group = table.add_row()
            merged = row_group.cells[0].merge(row_group.cells[1]).merge(
                row_group.cells[2]).merge(row_group.cells[3]).merge(row_group.cells[4])
            cell_bg(merged, tag_bg)
            merged.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            pg = merged.paragraphs[0]
            pg.alignment = WD_ALIGN_PARAGRAPH.LEFT
            pg.paragraph_format.space_before=Pt(3); pg.paragraph_format.space_after=Pt(3)
            pg.paragraph_format.left_indent=Cm(0.2)
            rg = pg.add_run(f"  ▸  {tag}")
            rg.font.name='Calibri'; rg.font.size=Pt(9.5); rg.bold=True
            rg.font.color.rgb=RGBColor(255,255,255)

        # ── Fila de datos ────────────────────────────
        drow = table.add_row()
        row_bg = "FFFFFF" if row_idx % 2 == 0 else "F8FAFC"
        row_idx += 1

        cells_d = drow.cells

        def fill(cell, text, fname='Calibri', fsize=8.5, bold=False,
                  fg=(55,65,81), bg=row_bg, align=WD_ALIGN_PARAGRAPH.LEFT):
            cell_bg(cell, bg)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p3 = cell.paragraphs[0]
            p3.alignment = align
            p3.paragraph_format.space_before=Pt(1); p3.paragraph_format.space_after=Pt(1)
            p3.paragraph_format.left_indent=Cm(0.1)
            r3 = p3.add_run(text)
            r3.font.name=fname; r3.font.size=Pt(fsize); r3.bold=bold
            r3.font.color.rgb=RGBColor(*fg)

        fill(cells_d[0], op)
        fill(cells_d[1], method, bold=True,
             fg=METHOD_FG.get(method,(55,65,81)),
             bg=METHOD_BG.get(method, row_bg),
             align=WD_ALIGN_PARAGRAPH.CENTER)
        fill(cells_d[2], endpoint, fname='Consolas', fsize=7.8, fg=(75,85,99))
        fill(cells_d[3], inputs, fsize=8)
        fill(cells_d[4], outputs, fsize=8)

    # Anchos de columna
    for row in table.rows:
        for i, cell in enumerate(row.cells):
            cell.width = col_w[i]

    # Bordes
    table_borders(table, color="CBD5E1", sz=4)

    # Leyenda
    doc.add_paragraph().paragraph_format.space_after=Pt(6)
    p_leg = doc.add_paragraph()
    p_leg.paragraph_format.space_after=Pt(4)
    r_l = p_leg.add_run("Leyenda de métodos HTTP:  ")
    r_l.font.name='Calibri'; r_l.font.size=Pt(9); r_l.bold=True
    r_l.font.color.rgb=RGBColor(55,65,81)
    for m, fg in METHOD_FG.items():
        r_m = p_leg.add_run(f" {m} ")
        r_m.font.name='Calibri'; r_m.font.size=Pt(9); r_m.bold=True
        r_m.font.color.rgb=RGBColor(*fg)

    p_note = doc.add_paragraph()
    r_n = p_note.add_run(
        "Todos los endpoints marcados requieren autenticación mediante Bearer Token JWT "
        "(Supabase Auth) en el header Authorization, excepto /health, / y /api/auth/check-email.")
    r_n.font.name='Calibri'; r_n.font.size=Pt(9); r_n.italic=True
    r_n.font.color.rgb=RGBColor(107,114,128)

    # ═══════════════════ PIE ════════════════════════════════════
    hr(doc)
    p_foot = doc.add_paragraph()
    p_foot.alignment=WD_ALIGN_PARAGRAPH.CENTER
    r_f = p_foot.add_run(
        "AsmaSync  ·  Proyecto Integrador  ·  Junio 2026  ·  "
        "Protocolo REST — JSON  ·  OpenAPI 3.1  ·  https://asthma-predictor-api.onrender.com/docs")
    r_f.font.name='Calibri'; r_f.font.size=Pt(8.5); r_f.italic=True
    r_f.font.color.rgb=RGBColor(156,163,175)

    # Guardar
    out = "Plan_WebServices_AsmaSync_v2.docx"
    doc.save(out)
    print(f"[OK] Documento guardado: {out}")
    print(f"     Endpoints documentados: {len(ENDPOINTS)}")


if __name__ == "__main__":
    build()
