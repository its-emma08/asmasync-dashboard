import { Component, Input, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { PatientService } from '../../../../core/services/patient.service';

@Component({
  selector: 'app-medical-document-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  templateUrl: './medical-document-upload.component.html',
  styleUrls: ['./medical-document-upload.component.scss']
})
export class MedicalDocumentUploadComponent {
  @Input() patientId!: number | string;
  @Output() uploadSuccess = new EventEmitter<any>();

  selectedFile = signal<File | null>(null);
  previewUrl = signal<SafeUrl | null>(null);
  isUploading = signal(false);
  isDragging = signal(false);
  loadError = signal<string | null>(null);

  constructor(
    private patientService: PatientService,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar
  ) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  private handleFile(file: File): void {
    this.loadError.set(null);

    // Limit to PDF and Images
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      this.snackBar.open('Formato no permitido. Use PDF, JPG o PNG.', 'Cerrar', { duration: 3000 });
      return;
    }

    this.selectedFile.set(file);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);

      // ✓ Validar que sea un blob URL seguro (blob:) o data URL
      if (!this.isValidDocumentUrl(url)) {
        this.loadError.set('URL de documento inválida');
        this.snackBar.open('Error: URL de documento inválida', 'Cerrar', { duration: 3000 });
        return;
      }

      this.previewUrl.set(this.sanitizer.bypassSecurityTrustUrl(url));
    } else {
      this.previewUrl.set(null); // No preview for PDF yet, or show PDF icon
    }
  }

  /** ✓ Valida que la URL sea segura para mostrar (blob o data URL) */
  private isValidDocumentUrl(url: string): boolean {
    try {
      // Solo permitir: blob:, data:, https:, http: (con restricciones), file:
      const allowedProtocols = ['blob:', 'data:', 'https://', 'http://', 'file:'];
      return allowedProtocols.some(protocol => url.startsWith(protocol));
    } catch {
      return false;
    }
  }

  uploadFile(): void {
    const file = this.selectedFile();
    if (!file || !this.patientId) return;

    this.isUploading.set(true);
    this.patientService.uploadMedicalDocument(this.patientId, file).subscribe({
      next: (res) => {
        this.snackBar.open('Documento subido correctamente', 'Cerrar', { duration: 3000 });
        this.isUploading.set(false);
        this.selectedFile.set(null);
        this.previewUrl.set(null);
        this.uploadSuccess.emit(res);
      },
      error: (err) => {
        console.error('Error uploading document', err);
        this.snackBar.open('Error al subir el archivo', 'Cerrar', { duration: 3000 });
        this.isUploading.set(false);
      }
    });
  }

  removeFile(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
  }
}
