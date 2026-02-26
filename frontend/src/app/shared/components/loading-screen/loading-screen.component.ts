import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import * as THREE from 'three';

@Component({
    selector: 'app-loading-screen',
    standalone: true,
    template: `
    <div class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-slate-900 transition-opacity duration-500 ease-in-out"
         [class.opacity-0]="isFadingOut"
         [class.pointer-events-none]="isFadingOut">
      <canvas #rendererCanvas class="w-64 h-64 outline-none"></canvas>
      
      <div class="mt-8 text-center pointer-events-none">
        <h2 class="text-2xl font-bold text-slate-700 dark:text-slate-100 tracking-wider">ASMASYNC</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">Cargando experiencia 3D...</p>
        
        <div class="w-64 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mt-4 overflow-hidden">
          <div class="h-full bg-cyan-500 transition-all duration-300" [style.width.%]="progress"></div>
        </div>
        <p class="text-xs text-cyan-600 dark:text-cyan-400 mt-1 font-mono">{{ progress }}%</p>
      </div>
    </div>
  `
})
export class LoadingScreenComponent implements AfterViewInit, OnDestroy {
    @ViewChild('rendererCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
    @Input() progress: number = 0;
    @Input() isFadingOut: boolean = false;

    private renderer!: THREE.WebGLRenderer;
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private logoMesh!: THREE.Mesh;
    private animationId: number = 0;

    ngAfterViewInit(): void {
        this.initThreeJS();
    }

    private initThreeJS(): void {
        const canvas = this.canvasRef.nativeElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        // 1. ESCENA Y CÁMARA
        this.scene = new THREE.Scene();
        // Fondo transparente para que se funda con el div
        this.scene.background = null;

        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.z = 5;

        // 2. RENDERER (Con Alpha para transparencia)
        this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // 3. LA TEXTURA (Tu Logo)
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('/assets/logo-lung.png', (texture) => {
            // Cuando cargue, creamos el objeto
            const geometry = new THREE.PlaneGeometry(4, 4); // Tamaño del plano
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                side: THREE.DoubleSide
            });

            this.logoMesh = new THREE.Mesh(geometry, material);
            this.scene.add(this.logoMesh);

            // Iniciar animación solo si cargó
            this.animate();
        }, undefined, (err) => {
            // Fallback RED CUBE if texture fails
            console.error('Texture load failed, using fallback cube', err);
            const geometry = new THREE.BoxGeometry(2, 2, 2);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
            this.logoMesh = new THREE.Mesh(geometry, material);
            this.scene.add(this.logoMesh);
            this.animate();
        });

        // 4. LUZ (Opcional, pero ayuda si usas MeshStandardMaterial)
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambientLight);
    }

    private animate(): void {
        this.animationId = requestAnimationFrame(() => this.animate());

        if (this.logoMesh) {
            // ROTACIÓN SUAVE (Eje Y)
            this.logoMesh.rotation.y += 0.01;

            // RESPIRACIÓN (Escala pulsante con Seno)
            const time = Date.now() * 0.002;
            const scale = 1 + Math.sin(time) * 0.1; // Respira entre 0.9 y 1.1
            this.logoMesh.scale.set(scale, scale, 1);
        }

        this.renderer.render(this.scene, this.camera);
    }

    ngOnDestroy(): void {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.renderer) this.renderer.dispose();
    }
}
