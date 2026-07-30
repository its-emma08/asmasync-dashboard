import { HttpContextToken } from '@angular/common/http';

export const SKIP_RESILIENCE = new HttpContextToken<boolean>(() => false);
