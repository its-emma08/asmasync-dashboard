// frontend/src/app/shared/utils/health-math.util.ts
import { HealthValidator } from './health-validator.util';

export type AsthmaZone = 'Green' | 'Yellow' | 'Red' | 'Unknown';

export class HealthMath {
  /**
   * Calculates the asthma zone based on the personal best PEF.
   * Green: > 80%
   * Yellow: 50% - 80%
   * Red: < 50%
   */
  static calculateAsthmaZone(currentPEF: number, personalBest: number): AsthmaZone {
    // Bug fix: Impedir cálculos con datos corruptos o cero (Outliers)
    if (currentPEF <= 10 || personalBest <= 0) return 'Unknown';
    
    // Safety check for impossible values (Max physiological range)
    if (currentPEF > 900) return 'Unknown'; 
    
    const percentage = (currentPEF / personalBest) * 100;

    if (percentage >= 80) return 'Green';
    if (percentage >= 50) return 'Yellow';
    return 'Red';
  }

  /**
   * Validates SpO2 values to ensure they are within clinical range (50-100)
   */
  static validateSpO2(value: number): boolean {
    return HealthValidator.isSpO2Valid(value);
  }
}
