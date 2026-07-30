import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'age',
  standalone: true
})
export class AgePipe implements PipeTransform {

  transform(value: any): number | string {
    if (value === undefined || value === null || value === '') return '';

    // Handle patient object if passed directly
    if (typeof value === 'object' && !(value instanceof Date)) {
      const candidate = value.date_of_birth ?? value.dob ?? value.birth_date ?? value.birthdate ?? value.fecha_nacimiento ?? value.age ?? value.edad;
      return this.transform(candidate);
    }

    // Direct number
    if (typeof value === 'number') {
      return value > 0 && value < 130 ? Math.floor(value) : '';
    }

    const str = String(value).trim();
    if (!str) return '';

    // Direct numeric string e.g. "30" or "30 años"
    const pureNum = Number(str.replace(/\D+/g, ''));
    if (/^\d{1,3}\s*(años|anios|years)?$/i.test(str) && pureNum > 0 && pureNum < 130) {
      return pureNum;
    }

    let birthDate: Date | null = null;

    // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}/.test(str)) {
      const parts = str.split(/[\/\-\.T ]/);
      const d = Number(parts[0]);
      const m = Number(parts[1]) - 1;
      const y = Number(parts[2]);
      if (y > 1900) {
        birthDate = new Date(y, m, d);
      }
    }
    // YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD or ISO
    else if (/^\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/.test(str)) {
      const parts = str.split(/[\/\-\.T ]/);
      const y = Number(parts[0]);
      const m = Number(parts[1]) - 1;
      const d = Number(parts[2]);
      if (y > 1900) {
        birthDate = new Date(y, m, d);
      }
    }
    else {
      const parsed = new Date(str);
      if (!isNaN(parsed.getTime())) {
        birthDate = parsed;
      }
    }

    if (!birthDate || isNaN(birthDate.getTime())) return '';

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age >= 0 && age < 130 ? age : '';
  }

}
