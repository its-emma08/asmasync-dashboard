import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, merge, map, Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ConnectivityService {
  private onlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  public isOnline$ = this.onlineSubject.asObservable();

  constructor(private snackBar: MatSnackBar) {
    this.initMonitoring();
  }

  private initMonitoring(): void {
    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).subscribe(isOnline => {
      this.onlineSubject.next(isOnline);
      this.notify(isOnline);
    });
  }

  private notify(isOnline: boolean): void {
    const message = isOnline 
      ? 'Conexión restaurada. Sincronizando datos...' 
      : 'Sin conexión a internet. Trabajando en modo local.';
    
    const panelClass = isOnline ? 'success-snackbar' : 'warning-snackbar';

    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: [panelClass]
    });
  }

  public get isOnline(): boolean {
    return this.onlineSubject.value;
  }
}
