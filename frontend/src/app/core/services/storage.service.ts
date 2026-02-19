import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
    providedIn: 'root'
})
export class StorageService {

    private readonly SECRET_KEY = 'asmasync-super-secret-key-simulation'; // En prod: Environment var

    constructor() {
        // console.log('🛡️ StorageService Initialized (Encryption Active)');
    }

    private encrypt(data: string): string {
        return CryptoJS.AES.encrypt(data, this.SECRET_KEY).toString();
    }

    private decrypt(data: string): string {
        const bytes = CryptoJS.AES.decrypt(data, this.SECRET_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    }

    setItem(key: string, value: any): void {
        try {
            const json = JSON.stringify(value);
            const encrypted = this.encrypt(json);
            // console.log(`🔒 Encrypting [${key}]:`, encrypted.substring(0, 15) + '...');
            localStorage.setItem(key, encrypted);
        } catch (e) {
            console.error('Error encrypting data', e);
        }
    }

    getItem(key: string): any {
        const data = localStorage.getItem(key);
        if (!data) return null;

        try {
            // Intenta desencriptar
            const decrypted = this.decrypt(data);
            if (!decrypted) {
                throw new Error('Empty decryption');
            }
            return JSON.parse(decrypted);
        } catch (e) {
            // Fallback: Si falla, asumimos que es data vieja (texto plano)
            console.warn(`🔓 Legacy/Plain data detected for [${key}]. Auto-correcting...`);
            try {
                // Si era texto plano válido JSON, lo devolvemos y lo encriptamos para la próxima (lazy migration)
                const plain = JSON.parse(data);
                this.setItem(key, plain); // Re-save encrypted
                return plain;
            } catch (jsonError) {
                // Si no es JSON ni encriptado, devolvemos tal cual o null
                return data;
            }
        }
    }

    removeItem(key: string): void {
        localStorage.removeItem(key);
    }

    clear(): void {
        localStorage.clear();
    }
}
