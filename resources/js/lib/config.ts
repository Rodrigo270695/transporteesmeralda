// Configuraciones globales para la aplicación
export const config = {
    /**
     * Obtiene el CSRF token desde múltiples fuentes
     */
    getCsrfToken(): string {
        // Prioridad: meta tag > window.Laravel > error
        const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        const windowToken = (window as any).Laravel?.csrfToken;

        if (metaToken) return metaToken;
        if (windowToken) return windowToken;

        throw new Error('CSRF token no encontrado. Verifica que el meta tag csrf-token esté presente.');
    },

    /**
     * Configuración para peticiones API
     */
    apiHeaders: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
    },

    /**
     * URLs de API
     */
    apiUrls: {
        conductor: {
            location: '/api/conductor/location',
            locationBulk: '/api/conductor/location/bulk',
            deliveryUpdate: '/api/conductor/delivery',
            uploadImage: '/api/conductor/upload-image',
            sync: '/api/conductor/sync',
            pushSubscription: '/api/conductor/push-subscription',
        },
        mobile: {
            login: '/api/mobile/auth/login',
            logout: '/api/mobile/auth/logout',
            me: '/api/mobile/auth/me',
            updateLocation: '/api/mobile/auth/update-location',
            deliveryPoints: '/api/mobile/delivery-points/today',
        }
    },

    /**
     * Configuración de GPS
     */
    gps: {
        trackingInterval: 10000, // 10 segundos
        highAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        batteryOptimization: true,
    },

    /**
     * Configuración de sincronización
     */
    sync: {
        interval: 30000, // 30 segundos
        maxRetries: 3,
        retryDelay: 5000,
        enableAutoSync: true,
    }
};

/**
 * Función auxiliar para hacer peticiones API con CSRF token
 */
export async function apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const defaultOptions: RequestInit = {
        headers: {
            ...config.apiHeaders,
            'X-CSRF-TOKEN': config.getCsrfToken(),
        },
        credentials: 'same-origin',
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, mergedOptions);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error ${response.status}:`, errorText);
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        return response;
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

/**
 * Función auxiliar para subir archivos con CSRF token
 */
export async function uploadFile(url: string, formData: FormData): Promise<Response> {
    const headers = {
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': config.getCsrfToken(),
        'Accept': 'application/json',
    };

    return apiRequest(url, {
        method: 'POST',
        headers,
        body: formData,
    });
}

export default config;
