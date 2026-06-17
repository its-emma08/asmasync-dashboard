// frontend/src/app/shared/utils/health-validator.util.ts

export class HealthValidator {
  /**
   * Validates SpO2 values. Clinical range is typically 50-100% for alert monitoring.
   * Values < 50 are usually sensor errors or extreme emergencies requiring manual verification.
   */
  static isSpO2Valid(value: number): boolean {
    return value >= 50 && value <= 100;
  }

  /**
   * Validates Peak Expiratory Flow (PEF). 
   * The maximum physiological range for a human is around 850 L/min.
   * Anything > 900 is considered a sensor outlier.
   */
  static isPEFValid(value: number): boolean {
    return value >= 0 && value <= 900;
  }

  /**
   * Formats a clinical error message for logs.
   */
  static getErrorMessage(type: 'SpO2' | 'PEF', value: number): string {
    return `[HealthValidator] Outlier rejected: ${type} = ${value}. Value outside safe clinical range.`;
  }
}
