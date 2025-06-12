import React from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallerOptions {
    autoPrompt?: boolean;
    promptDelay?: number;
    maxPrompts?: number;
    storageKey?: string;
}

class PWAInstaller {
    private deferredPrompt: BeforeInstallPromptEvent | null = null;
    private isInstalled = false;
    private promptCount = 0;
    private options: Required<PWAInstallerOptions>;

    constructor(options: PWAInstallerOptions = {}) {
        this.options = {
            autoPrompt: false,
            promptDelay: 3000,
            maxPrompts: 3,
            storageKey: 'pwa_install_prompts',
            ...options
        };

        this.initialize();
    }

    private initialize(): void {
        // Verificar si ya está instalado
        this.checkIfInstalled();

        // Cargar contador de prompts
        this.loadPromptCount();

        // Escuchar evento de instalación
        window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt.bind(this));

        // Escuchar cuando se instala la app
        window.addEventListener('appinstalled', this.handleAppInstalled.bind(this));

        // Auto-prompt si está habilitado
        if (this.options.autoPrompt) {
            setTimeout(() => {
                this.promptInstall();
            }, this.options.promptDelay);
        }
    }

    private checkIfInstalled(): void {
        // Verificar si está en modo standalone (instalado)
        this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true ||
                          document.referrer.includes('android-app://');

        console.log('[PWA] App installed:', this.isInstalled);
    }

    private loadPromptCount(): void {
        try {
            const stored = localStorage.getItem(this.options.storageKey);
            this.promptCount = stored ? parseInt(stored, 10) : 0;
        } catch (error) {
            console.warn('[PWA] Error loading prompt count:', error);
        }
    }

    private savePromptCount(): void {
        try {
            localStorage.setItem(this.options.storageKey, this.promptCount.toString());
        } catch (error) {
            console.warn('[PWA] Error saving prompt count:', error);
        }
    }

    private handleBeforeInstallPrompt(event: Event): void {
        console.log('[PWA] Before install prompt triggered');

        // Prevenir el prompt automático del browser
        event.preventDefault();

        // Guardar el evento para uso posterior
        this.deferredPrompt = event as BeforeInstallPromptEvent;

        // Disparar evento personalizado
        this.dispatchCustomEvent('pwa-installable', {
            canInstall: true,
            promptCount: this.promptCount
        });
    }

    private handleAppInstalled(): void {
        console.log('[PWA] App installed successfully');
        this.isInstalled = true;
        this.deferredPrompt = null;

        // Disparar evento personalizado
        this.dispatchCustomEvent('pwa-installed', {
            timestamp: new Date().toISOString()
        });
    }

    private dispatchCustomEvent(eventName: string, detail: any): void {
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }

    public async promptInstall(): Promise<boolean> {
        // Verificar si ya está instalado
        if (this.isInstalled) {
            console.log('[PWA] App already installed');
            return false;
        }

        // Verificar si hay prompt disponible
        if (!this.deferredPrompt) {
            console.log('[PWA] No install prompt available');
            return false;
        }

        // Verificar límite de prompts
        if (this.promptCount >= this.options.maxPrompts) {
            console.log('[PWA] Max prompts reached');
            return false;
        }

        try {
            // Incrementar contador
            this.promptCount++;
            this.savePromptCount();

            // Mostrar prompt
            await this.deferredPrompt.prompt();

            // Esperar respuesta del usuario
            const choiceResult = await this.deferredPrompt.userChoice;

            console.log('[PWA] User choice:', choiceResult.outcome);

            // Disparar evento con resultado
            this.dispatchCustomEvent('pwa-prompt-result', {
                outcome: choiceResult.outcome,
                promptCount: this.promptCount
            });

            // Limpiar prompt
            this.deferredPrompt = null;

            return choiceResult.outcome === 'accepted';
        } catch (error) {
            console.error('[PWA] Error showing install prompt:', error);
            return false;
        }
    }

    public canInstall(): boolean {
        return !this.isInstalled && this.deferredPrompt !== null;
    }

    public isAppInstalled(): boolean {
        return this.isInstalled;
    }

    public getPromptCount(): number {
        return this.promptCount;
    }

    public resetPromptCount(): void {
        this.promptCount = 0;
        this.savePromptCount();
    }

    public shouldShowPrompt(): boolean {
        return this.canInstall() &&
               this.promptCount < this.options.maxPrompts &&
               !this.isInstalled;
    }

    // Métodos para diferentes estrategias de instalación
    public createInstallBanner(): HTMLElement {
        const banner = document.createElement('div');
        banner.className = 'pwa-install-banner';
        banner.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #059669 0%, #047857 100%);
                color: white;
                padding: 1rem;
                text-align: center;
                z-index: 1000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <div style="max-width: 600px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span style="font-size: 1.5rem;">📱</span>
                        <div style="text-align: left;">
                            <div style="font-weight: 600; font-size: 0.95rem;">¡Instala Transporte Esmeralda!</div>
                            <div style="font-size: 0.8rem; opacity: 0.9;">Acceso rápido desde tu pantalla de inicio</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button id="pwa-install-btn" style="
                            background: rgba(255,255,255,0.2);
                            border: 1px solid rgba(255,255,255,0.3);
                            color: white;
                            padding: 0.5rem 1rem;
                            border-radius: 0.375rem;
                            font-size: 0.875rem;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">Instalar</button>
                        <button id="pwa-dismiss-btn" style="
                            background: transparent;
                            border: none;
                            color: rgba(255,255,255,0.8);
                            padding: 0.5rem;
                            border-radius: 0.375rem;
                            font-size: 1.25rem;
                            cursor: pointer;
                            line-height: 1;
                        ">×</button>
                    </div>
                </div>
            </div>
        `;

        // Agregar eventos
        const installBtn = banner.querySelector('#pwa-install-btn') as HTMLButtonElement;
        const dismissBtn = banner.querySelector('#pwa-dismiss-btn') as HTMLButtonElement;

        installBtn?.addEventListener('click', () => {
            this.promptInstall();
            banner.remove();
        });

        dismissBtn?.addEventListener('click', () => {
            banner.remove();
        });

        return banner;
    }

    public showInstallBanner(): void {
        if (!this.shouldShowPrompt()) return;

        const banner = this.createInstallBanner();
        document.body.appendChild(banner);

        // Auto-remove después de 10 segundos
        setTimeout(() => {
            if (banner.parentNode) {
                banner.remove();
            }
        }, 10000);
    }

    public createInstallButton(container: HTMLElement, options: {
        text?: string;
        className?: string;
        style?: Partial<CSSStyleDeclaration>;
    } = {}): HTMLButtonElement | null {
        if (!this.shouldShowPrompt()) return null;

        const button = document.createElement('button');
        button.textContent = options.text || 'Instalar App';
        button.className = options.className || 'pwa-install-button';

        // Aplicar estilos
        if (options.style) {
            Object.assign(button.style, options.style);
        }

        button.addEventListener('click', () => {
            this.promptInstall();
        });

        container.appendChild(button);
        return button;
    }
}

// Instancia global
let pwaInstaller: PWAInstaller | null = null;

export function initializePWAInstaller(options?: PWAInstallerOptions): PWAInstaller {
    if (!pwaInstaller) {
        pwaInstaller = new PWAInstaller(options);
    }
    return pwaInstaller;
}

export function getPWAInstaller(): PWAInstaller | null {
    return pwaInstaller;
}

// Hook de React para usar el instalador
export function usePWAInstaller() {
    const [canInstall, setCanInstall] = React.useState(false);
    const [isInstalled, setIsInstalled] = React.useState(false);
    const [promptCount, setPromptCount] = React.useState(0);

    React.useEffect(() => {
        const installer = initializePWAInstaller();

        const handleInstallable = (event: CustomEvent) => {
            setCanInstall(event.detail.canInstall);
            setPromptCount(event.detail.promptCount);
        };

        const handleInstalled = () => {
            setIsInstalled(true);
            setCanInstall(false);
        };

        const handlePromptResult = (event: CustomEvent) => {
            setPromptCount(event.detail.promptCount);
            if (event.detail.outcome === 'accepted') {
                setCanInstall(false);
            }
        };

        window.addEventListener('pwa-installable', handleInstallable as EventListener);
        window.addEventListener('pwa-installed', handleInstalled);
        window.addEventListener('pwa-prompt-result', handlePromptResult as EventListener);

        // Estado inicial
        setCanInstall(installer.canInstall());
        setIsInstalled(installer.isAppInstalled());
        setPromptCount(installer.getPromptCount());

        return () => {
            window.removeEventListener('pwa-installable', handleInstallable as EventListener);
            window.removeEventListener('pwa-installed', handleInstalled);
            window.removeEventListener('pwa-prompt-result', handlePromptResult as EventListener);
        };
    }, []);

    const promptInstall = React.useCallback(() => {
        const installer = getPWAInstaller();
        return installer?.promptInstall() || Promise.resolve(false);
    }, []);

    const showBanner = React.useCallback(() => {
        const installer = getPWAInstaller();
        installer?.showInstallBanner();
    }, []);

    return {
        canInstall,
        isInstalled,
        promptCount,
        promptInstall,
        showBanner,
        shouldShowPrompt: canInstall && promptCount < 3
    };
}

export { PWAInstaller };
