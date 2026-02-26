from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Response
import traceback
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api import deps
from app.core.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.medical import ClinicalHistory, PhysicalExam
from app.services.pdf_service import PDFService

router = APIRouter()

@router.get("/patients/{patient_id}/clinical-history/pdf")
async def get_clinical_history_pdf(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Response:
    """
    Generates and returns the PDF of the Clinical History for a patient.
    Compliant with NOM-004-SSA3-2012.
    """
    # 1. Fetch Patient
    result = await db.execute(select(Patient).filter(Patient.id == patient_id))
    patient = result.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # 2. Fetch Clinical History
    result = await db.execute(select(ClinicalHistory).filter(ClinicalHistory.patient_id == patient_id))
    history = result.scalars().first() # Can be None

    # 3. Fetch Physical Exams (Recent)
    result = await db.execute(
        select(PhysicalExam)
        .filter(PhysicalExam.patient_id == patient_id)
        .order_by(PhysicalExam.encounter_date.desc())
        .limit(10)
    )
    exams = result.scalars().all()

    # 4. Generate PDF
    try:
        pdf_bytes = PDFService.generate_clinical_history_pdf(patient, history, exams)
    except Exception as e:
        # print(f"Error generating PDF: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error generating PDF report")

    # 5. Return Response
    filename = f"Historia_Clinica_{patient.full_name}_{patient_id}.pdf".replace(" ", "_")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
