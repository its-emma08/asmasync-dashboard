import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { PatientService } from '../../../core/services/patient.service';
import { Patient } from '../../../core/models/patient.model';

import { AgePipe } from '../../../shared/pipes/age-pipe';
import { SafeDatePipe } from '../../../shared/pipes/safe-date.pipe';

import { RouterModule } from '@angular/router';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
    selector: 'app-clinical-history',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatSlideToggleModule,
        AgePipe
    ],
    templateUrl: './clinical-history.component.html',
    styleUrls: ['./clinical-history.component.scss']
})
export class ClinicalHistoryComponent implements OnInit {
    patient: Patient | null = null;
    today = new Date();

    constructor(
        private route: ActivatedRoute,
        private patientService: PatientService
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            if (id.startsWith('P-')) {
                this.patientService.getPatientById(id).subscribe(p => this.patient = p);
            } else {
                this.patientService.getPatientById(Number(id)).subscribe(p => this.patient = p);
            }
        }
    }

    print(): void {
        window.print();
    }
}
