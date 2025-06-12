import { useState, useEffect, useCallback, useRef } from 'react';

interface BackgroundSyncOptions {
    syncInterval?: number;
    maxRetries?: number;
    retryDelay?: number;
    enableAutoSync?: boolean;
}

interface SyncData {
    id: string;
    type: 'location' | 'delivery' | 'photo';
    data: any;
    timestamp: Date;
    retries?: number;
}

interface UseBackgroundSyncReturn {
    isOnline: boolean;
    isSyncing: boolean;
    pendingItems: number;
    lastSyncTime: Date | null;
    addToQueue: (data: Omit<SyncData, 'id' | 'timestamp'>) => void;
    forcSync: () => Promise<void>;
    clearQueue: () => void;
    isSupported: boolean;
}

export const useBackgroundSync = (options: BackgroundSyncOptions = {}): UseBackgroundSyncReturn => {
    const {
        syncInterval = 30000, // 30 segundos
        maxRetries = 3,
        retryDelay = 5000,
        enableAutoSync = true
    } = options;

    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingItems, setPendingItems] = useState(0);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

    const syncQueueRef = useRef<SyncData[]>([]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

    const isSupported = 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;

    // Inicializar Service Worker
    useEffect(() => {
        if (!isSupported) return;

        const initializeServiceWorker = async () => {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                registrationRef.current = registration;
                console.log('[BackgroundSync] Service Worker registrado');

                // Manejar actualizaciones del SW
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('[BackgroundSync] Nueva versión del SW disponible, actualizando...');
                                // Forzar activación del nuevo SW
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                                window.location.reload();
                            }
                        });
                    }
                });

                // Escuchar mensajes del SW
                navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

                // Cargar datos pendientes del localStorage
                loadPendingData();
            } catch (error) {
                console.error('[BackgroundSync] Error registrando SW:', error);
            }
        };

        initializeServiceWorker();

        return () => {
            navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
        };
    }, [isSupported]);

    // Manejar cambios de conectividad
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            if (enableAutoSync && syncQueueRef.current.length > 0) {
                forcSync();
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [enableAutoSync]);

    // Auto-sync periódico
    useEffect(() => {
        if (!enableAutoSync) return;

        intervalRef.current = setInterval(() => {
            if (isOnline && syncQueueRef.current.length > 0) {
                forcSync();
            }
        }, syncInterval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [enableAutoSync, isOnline, syncInterval]);

    // Manejar mensajes del Service Worker
    const handleServiceWorkerMessage = (event: MessageEvent) => {
        const { type, payload } = event.data;

        switch (type) {
            case 'sync-completed':
                handleSyncCompleted(payload);
                break;
            case 'sync-failed':
                handleSyncFailed(payload);
                break;
            case 'sync-progress':
                updateSyncProgress(payload);
                break;
        }
    };

    // Cargar datos pendientes del localStorage
    const loadPendingData = useCallback(() => {
        try {
            const stored = localStorage.getItem('backgroundSync_queue');
            if (stored) {
                const queue = JSON.parse(stored);
                syncQueueRef.current = queue;
                setPendingItems(queue.length);
            }
        } catch (error) {
            console.error('[BackgroundSync] Error cargando datos:', error);
        }
    }, []);

    // Guardar cola en localStorage
    const saveQueueToStorage = useCallback(() => {
        try {
            localStorage.setItem('backgroundSync_queue', JSON.stringify(syncQueueRef.current));
            setPendingItems(syncQueueRef.current.length);
        } catch (error) {
            console.error('[BackgroundSync] Error guardando cola:', error);
        }
    }, []);

    // Agregar elemento a la cola
    const addToQueue = useCallback((data: Omit<SyncData, 'id' | 'timestamp'>) => {
        const syncData: SyncData = {
            ...data,
            id: generateId(),
            timestamp: new Date(),
            retries: 0
        };

        syncQueueRef.current.push(syncData);
        saveQueueToStorage();

        // Intentar sincronizar inmediatamente si hay conexión
        if (isOnline && !isSyncing) {
            forcSync();
        }

        // Registrar background sync si está soportado
        if (isSupported && registrationRef.current) {
            registrationRef.current.sync.register(`${data.type}-sync`);
        }
    }, [isOnline, isSyncing, isSupported, saveQueueToStorage]);

    // Forzar sincronización
    const forcSync = useCallback(async () => {
        if (isSyncing || syncQueueRef.current.length === 0) return;

        setIsSyncing(true);

        try {
            const itemsToSync = [...syncQueueRef.current];
            const results = await Promise.allSettled(
                itemsToSync.map(item => syncItem(item))
            );

            // Procesar resultados
            results.forEach((result, index) => {
                const item = itemsToSync[index];

                if (result.status === 'fulfilled') {
                    // Remover item exitoso de la cola
                    syncQueueRef.current = syncQueueRef.current.filter(i => i.id !== item.id);
                } else {
                    // Incrementar reintentos para items fallidos
                    const failedItem = syncQueueRef.current.find(i => i.id === item.id);
                    if (failedItem) {
                        failedItem.retries = (failedItem.retries || 0) + 1;

                        // Remover si excede max reintentos
                        if (failedItem.retries >= maxRetries) {
                            syncQueueRef.current = syncQueueRef.current.filter(i => i.id !== item.id);
                            console.warn(`[BackgroundSync] Item ${item.id} excedió max reintentos`);
                        }
                    }
                }
            });

            saveQueueToStorage();
            setLastSyncTime(new Date());
        } catch (error) {
            console.error('[BackgroundSync] Error en sincronización:', error);
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, maxRetries, saveQueueToStorage]);

    // Sincronizar un elemento individual
    const syncItem = async (item: SyncData): Promise<void> => {
        switch (item.type) {
            case 'location':
                return syncLocationData(item);
            case 'delivery':
                return syncDeliveryData(item);
            case 'photo':
                return syncPhotoData(item);
            default:
                throw new Error(`Tipo de sync no soportado: ${item.type}`);
        }
    };

    // Sincronizar datos de ubicación
    const syncLocationData = async (item: SyncData): Promise<void> => {
        const response = await fetch('/api/conductor/location', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(item.data)
        });

        if (!response.ok) {
            throw new Error(`Error sincronizando ubicación: ${response.status}`);
        }
    };

    // Sincronizar datos de entrega
    const syncDeliveryData = async (item: SyncData): Promise<void> => {
        const { deliveryId, ...updateData } = item.data;

        const response = await fetch(`/api/conductor/delivery/${deliveryId}/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            throw new Error(`Error sincronizando entrega: ${response.status}`);
        }
    };

    // Sincronizar fotos
    const syncPhotoData = async (item: SyncData): Promise<void> => {
        const formData = new FormData();

        // Convertir base64 a blob si es necesario
        if (typeof item.data.image === 'string' && item.data.image.startsWith('data:')) {
            const blob = dataURItoBlob(item.data.image);
            formData.append('image', blob);
        } else {
            formData.append('image', item.data.image);
        }

        formData.append('type', item.data.type);
        formData.append('delivery_id', item.data.deliveryId);

        const response = await fetch('/api/conductor/upload-image', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Error sincronizando foto: ${response.status}`);
        }
    };

    // Limpiar cola
    const clearQueue = useCallback(() => {
        syncQueueRef.current = [];
        localStorage.removeItem('backgroundSync_queue');
        setPendingItems(0);
    }, []);

    // Manejar finalización de sync
    const handleSyncCompleted = (payload: any) => {
        console.log('[BackgroundSync] Sync completado:', payload);
        setLastSyncTime(new Date());
    };

    // Manejar fallo de sync
    const handleSyncFailed = (payload: any) => {
        console.warn('[BackgroundSync] Sync falló:', payload);
    };

    // Actualizar progreso de sync
    const updateSyncProgress = (payload: any) => {
        console.log('[BackgroundSync] Progreso:', payload);
    };

    return {
        isOnline,
        isSyncing,
        pendingItems,
        lastSyncTime,
        addToQueue,
        forcSync,
        clearQueue,
        isSupported
    };
};

// Utilidades
function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function dataURItoBlob(dataURI: string): Blob {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
}
