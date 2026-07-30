import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer, switchMap, shareReplay, map, catchError, of, tap, forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WeatherData {
  temp: number;
  weather_code: number;
  wind: number;
  humidity: number;
  condition: string;
  icon: string;
  city: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  // Environmental extras from Render API
  aqi?: number;
  aqiLabel?: string;
  pollenLevel?: string;
  uvIndex?: number;
}

const WMO_CODES: Record<number, { description: string; icon: string }> = {
  0:  { description: 'Despejado',         icon: 'sunny' },
  1:  { description: 'Principalmente despejado', icon: 'wb_sunny' },
  2:  { description: 'Parcialmente nublado', icon: 'cloud_queue' },
  3:  { description: 'Nublado',           icon: 'cloud' },
  45: { description: 'Niebla',            icon: 'foggy' },
  48: { description: 'Niebla con escarcha', icon: 'foggy' },
  51: { description: 'Llovizna ligera',   icon: 'grain' },
  53: { description: 'Llovizna moderada', icon: 'grain' },
  55: { description: 'Llovizna intensa',  icon: 'grain' },
  61: { description: 'Lluvia ligera',     icon: 'water_drop' },
  63: { description: 'Lluvia moderada',   icon: 'water_drop' },
  65: { description: 'Lluvia intensa',    icon: 'water_drop' },
  71: { description: 'Nieve ligera',      icon: 'ac_unit' },
  73: { description: 'Nieve moderada',    icon: 'ac_unit' },
  75: { description: 'Nieve intensa',     icon: 'ac_unit' },
  80: { description: 'Chubascos ligeros', icon: 'shower' },
  81: { description: 'Chubascos moderados', icon: 'shower' },
  82: { description: 'Chubascos intensos', icon: 'thunderstorm' },
  95: { description: 'Tormenta',          icon: 'thunderstorm' },
  96: { description: 'Tormenta con granizo', icon: 'thunderstorm' },
  99: { description: 'Tormenta severa',   icon: 'thunderstorm' },
};

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly API_URL = 'https://api.open-meteo.com/v1/forecast';
  // Default: Córdoba, Veracruz
  private readonly DEFAULT_LAT = 18.8889;
  private readonly DEFAULT_LON = -96.9289;
  private readonly DEFAULT_CITY = 'Córdoba, Ver.';

  private activeLat = this.DEFAULT_LAT;
  private activeLon = this.DEFAULT_LON;
  private activeCity = this.DEFAULT_CITY;

  // Signal for the UI to consume directly
  public currentWeather = signal<WeatherData | null>(null);

  // Observable for background updates
  public weather$: Observable<WeatherData | null>;

  constructor(private http: HttpClient) {
    this.weather$ = timer(0, 10 * 60 * 1000).pipe(
      switchMap(() => this.fetchWeather(this.activeLat, this.activeLon)),
      tap(data => this.currentWeather.set(data)),
      shareReplay(1)
    );

    // Subscribe to start the timer with default coords
    this.weather$.subscribe();

    // Then try to get real location (updates will refresh on next tick)
    this.requestGeolocation();
  }

  private requestGeolocation(): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.activeLat = position.coords.latitude;
        this.activeLon = position.coords.longitude;
        this.activeCity = 'Tu Ubicación';
        
        // Fetch weather and Nominatim reverse geocoding in a flat RxJS pipeline
        this.fetchWeather(this.activeLat, this.activeLon).pipe(
          switchMap(weatherData => {
            if (!weatherData) return of(null);
            this.currentWeather.set(weatherData);

            // Fetch city name from Nominatim
            return this.http.get<any>(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${this.activeLat}&lon=${this.activeLon}&zoom=10`).pipe(
              map(res => {
                if (res && res.address) {
                  const address = res.address;
                  const city = address.city || address.town || address.village || address.suburb || address.county || 'Tu Ubicación';
                  this.activeCity = city;
                  this.currentWeather.set({ ...weatherData, city });
                }
                return weatherData;
              }),
              catchError(() => of(weatherData))
            );
          })
        ).subscribe();
      },
      () => { /* Permission denied — keep Córdoba default */ }
    );
  }

  private fetchWeather(lat = this.DEFAULT_LAT, lon = this.DEFAULT_LON): Observable<WeatherData | null> {
    const meteoParams = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      current: 'temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m',
      timezone: 'auto',
      wind_speed_unit: 'kmh'
    });

    const meteo$ = this.http.get<any>(`${this.API_URL}?${meteoParams}`);
    const env$ = this.http.get<any>(
      `${environment.apiUrl}/environmental/info?lat=${lat}&lng=${lon}`
    ).pipe(catchError(() => of(null)));

    return forkJoin({ meteo: meteo$, env: env$ }).pipe(
      map(({ meteo, env }) => {
        const current = meteo.current;
        const code = current.weather_code ?? 0;
        const wmo = WMO_CODES[code] ?? { description: 'Variable', icon: 'thermostat' };

        const humidity = Math.round(current.relative_humidity_2m);
        const temperature = Math.round(current.temperature_2m);

        let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
        if (humidity > 80 || temperature < 10 || code >= 95) {
          riskLevel = 'High';
        } else if (humidity > 65 || temperature < 15) {
          riskLevel = 'Medium';
        }

        // Enrich with Render API environmental data if available
        const aqi: number | undefined = env?.aqi ?? env?.air_quality_index ?? undefined;
        const aqiLabel: string | undefined = env?.aqi_label ?? env?.air_quality ?? undefined;
        const pollenLevel: string | undefined = env?.pollen_level ?? env?.pollen ?? undefined;
        const uvIndex: number | undefined = env?.uv_index ?? undefined;

        return {
          temp: temperature,
          weather_code: code,
          wind: Math.round(current.wind_speed_10m),
          humidity,
          condition: wmo.description,
          icon: wmo.icon,
          city: this.activeCity,
          riskLevel,
          aqi,
          aqiLabel,
          pollenLevel,
          uvIndex
        } as WeatherData;
      }),
      catchError(() => of(null))
    );
  }

  getWeatherForLocation(lat: number, lon: number): Observable<WeatherData | null> {
    return this.fetchWeather(lat, lon).pipe(
      tap(data => this.currentWeather.set(data))
    );
  }
}
