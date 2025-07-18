import { useState, useEffect, useCallback } from 'react';

interface PushNotificationOptions {
    publicKey?: string;
    applicationServerKey?: string;
    autoSubscribe?: boolean;
    enableBadge?: boolean;
    enableSound?: boolean;
    enableVibration?: boolean;
}

interface NotificationData {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    image?: string;
    data?: any;
    actions?: NotificationAction[];
    requireInteraction?: boolean;
    silent?: boolean;
    tag?: string;
    timestamp?: number;
    vibrate?: number[];
}

interface UsePushNotificationsReturn {
    isSupported: boolean;
    permission: NotificationPermission;
    isSubscribed: boolean;
    subscription: PushSubscription | null;
    isLoading: boolean;
    error: string | null;
    requestPermission: () => Promise<NotificationPermission>;
    subscribe: () => Promise<PushSubscription | null>;
    unsubscribe: () => Promise<boolean>;
    showNotification: (data: NotificationData) => Promise<void>;
    sendSubscriptionToServer: (subscription: PushSubscription) => Promise<void>;
    testNotification: () => Promise<void>;
}

export const usePushNotifications = (
    options: PushNotificationOptions = {}
): UsePushNotificationsReturn => {
    const {
        publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '',
        applicationServerKey = publicKey,
        autoSubscribe = false,
        enableBadge = true,
        enableSound = true,
        enableVibration = true
    } = options;

    // Verificar si tenemos una clave válida
    const hasValidKey = applicationServerKey && applicationServerKey.length > 0;

    // Estados
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Verificar soporte
    useEffect(() => {
        const checkSupport = () => {
            const supported =
                'serviceWorker' in navigator &&
                'PushManager' in window &&
                'Notification' in window &&
                hasValidKey; // Solo soportado si tenemos clave válida

            setIsSupported(supported);

            if (supported) {
                setPermission(Notification.permission);
                checkExistingSubscription();
            } else if (!hasValidKey) {
                setError('Configuración de notificaciones push no disponible');
            }
        };

        checkSupport();
    }, [hasValidKey]);

    // Auto-subscribe si está habilitado (temporalmente deshabilitado)
    useEffect(() => {
        // Deshabilitado para evitar errores automáticos
        // if (autoSubscribe && isSupported && permission === 'granted' && !isSubscribed) {
        //     subscribe();
        // }
    }, [autoSubscribe, isSupported, permission, isSubscribed]);

    // Verificar suscripción existente
    const checkExistingSubscription = useCallback(async () => {
        if (!isSupported) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            const existingSubscription = await registration.pushManager.getSubscription();

            if (existingSubscription) {
                setSubscription(existingSubscription);
                setIsSubscribed(true);

                // Verificar si la suscripción sigue siendo válida
                if (existingSubscription.expirationTime &&
                    existingSubscription.expirationTime < Date.now()) {
                    // Suscripción expirada, renovar
                    await unsubscribe();
                    await subscribe();
                }
            }
        } catch (error) {
            console.error('Error verificando suscripción:', error);
        }
    }, [isSupported]);

    // Solicitar permisos
    const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
        if (!isSupported) {
            throw new Error('Notificaciones no soportadas');
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            setIsLoading(false);

            if (result === 'granted') {
                console.log('Permisos de notificación concedidos');
            } else if (result === 'denied') {
                setError('Permisos de notificación denegados');
            }

            return result;
        } catch (error) {
            const errorMsg = 'Error solicitando permisos';
            setError(errorMsg);
            setIsLoading(false);
            throw new Error(errorMsg);
        }
    }, [isSupported]);

    // Suscribirse a push notifications
    const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
        if (!isSupported) {
            throw new Error('Push notifications no soportadas');
        }

        if (!hasValidKey) {
            throw new Error('Clave VAPID no configurada. Contacta al administrador.');
        }

        if (permission !== 'granted') {
            const newPermission = await requestPermission();
            if (newPermission !== 'granted') {
                throw new Error('Permisos necesarios para suscribirse');
            }
        }

        setIsLoading(true);
        setError(null);

        try {
            const registration = await navigator.serviceWorker.ready;

            // Convertir clave pública a Uint8Array
            const applicationServerKeyArray = urlBase64ToUint8Array(applicationServerKey);

            const newSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKeyArray
            });

            setSubscription(newSubscription);
            setIsSubscribed(true);
            setIsLoading(false);

            // Enviar suscripción al servidor
            await sendSubscriptionToServer(newSubscription);

            console.log('Suscrito a push notifications:', newSubscription);
            return newSubscription;
        } catch (error) {
            let errorMsg = 'Error suscribiéndose';

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    errorMsg = 'Suscripción cancelada o servicio push no disponible';
                } else if (error.name === 'NotSupportedError') {
                    errorMsg = 'Push notifications no soportadas en este navegador';
                } else if (error.name === 'InvalidAccessError') {
                    errorMsg = 'Clave VAPID inválida o configuración incorrecta';
                } else {
                    errorMsg = `Error: ${error.message}`;
                }
            } else {
                errorMsg = `Error desconocido: ${error}`;
            }

            setError(errorMsg);
            setIsLoading(false);
            throw new Error(errorMsg);
        }
    }, [isSupported, permission, applicationServerKey, requestPermission, hasValidKey]);

    // Desuscribirse
    const unsubscribe = useCallback(async (): Promise<boolean> => {
        if (!subscription) {
            console.warn('No hay suscripción activa');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            const success = await subscription.unsubscribe();

            if (success) {
                setSubscription(null);
                setIsSubscribed(false);

                // Notificar al servidor
                await removeSubscriptionFromServer(subscription);

                console.log('Desuscrito de push notifications');
            }

            setIsLoading(false);
            return success;
        } catch (error) {
            const errorMsg = `Error desuscribiéndose: ${error}`;
            setError(errorMsg);
            setIsLoading(false);
            throw new Error(errorMsg);
        }
    }, [subscription]);

    // Mostrar notificación local
    const showNotification = useCallback(async (data: NotificationData): Promise<void> => {
        if (!isSupported) {
            throw new Error('Notificaciones no soportadas');
        }

        if (permission !== 'granted') {
            throw new Error('Permisos de notificación no concedidos');
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            const options: NotificationOptions = {
                body: data.body,
                icon: data.icon || '/icons/icon-192x192.png',
                badge: enableBadge ? (data.badge || '/icons/icon-72x72.png') : undefined,
                image: data.image,
                data: data.data || {},
                actions: data.actions || [],
                requireInteraction: data.requireInteraction || false,
                silent: data.silent || false,
                tag: data.tag,
                timestamp: data.timestamp || Date.now(),
                vibrate: enableVibration ? (data.vibrate || [200, 100, 200]) : undefined
            };

            await registration.showNotification(data.title, options);
        } catch (error) {
            console.error('Error mostrando notificación:', error);
            throw error;
        }
    }, [isSupported, permission, enableBadge, enableVibration]);

    // Enviar suscripción al servidor
    const sendSubscriptionToServer = useCallback(async (sub: PushSubscription): Promise<void> => {
        try {
            const response = await fetch('/api/conductor/push-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    subscription: {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: arrayBufferToBase64(sub.getKey('p256dh')),
                            auth: arrayBufferToBase64(sub.getKey('auth'))
                        }
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }

            console.log('Suscripción enviada al servidor');
        } catch (error) {
            console.error('Error enviando suscripción al servidor:', error);
            throw error;
        }
    }, []);

    // Remover suscripción del servidor
    const removeSubscriptionFromServer = useCallback(async (sub: PushSubscription): Promise<void> => {
        try {
            const response = await fetch('/api/conductor/push-subscription', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    endpoint: sub.endpoint
                })
            });

            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }

            console.log('Suscripción removida del servidor');
        } catch (error) {
            console.error('Error removiendo suscripción del servidor:', error);
        }
    }, []);

    // Probar notificación
    const testNotification = useCallback(async (): Promise<void> => {
        await showNotification({
            title: '🚛 Transporte Esmeralda',
            body: 'Notificación de prueba funcionando correctamente',
                            icon: '/icons/icon-192x192.png',
            data: { type: 'test' },
            actions: [
                {
                    action: 'open',
                    title: 'Abrir App'
                },
                {
                    action: 'dismiss',
                    title: 'Cerrar'
                }
            ]
        });
    }, [showNotification]);

    return {
        isSupported,
        permission,
        isSubscribed,
        subscription,
        isLoading,
        error,
        requestPermission,
        subscribe,
        unsubscribe,
        showNotification,
        sendSubscriptionToServer,
        testNotification
    };
};

// Utilidades

// Convertir base64 URL-safe a Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

// Convertir ArrayBuffer a base64
function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    if (!buffer) return '';

    const bytes = new Uint8Array(buffer);
    let binary = '';

    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return window.btoa(binary);
}
