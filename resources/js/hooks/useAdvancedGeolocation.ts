import { useState, useEffect, useRef, useCallback } from 'react';
import { useBackgroundSync } from './useBackgroundSync';
import { DriverLocation } from '@/types/driver';

interface AdvancedGeolocationOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
    trackingInterval?: number;
    autoSync?: boolean;
    syncInterval?: number;
    batteryOptimization?: boolean;
    geofenceRadius?: number; // metros
}

interface GeofenceZone {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius: number; // metros
    type: 'delivery' | 'depot' | 'restricted';
}

interface UseAdvancedGeolocationReturn {
    location: DriverLocation | null;
    error: string | null;
    isLoading: boolean;
    isTracking: boolean;
    accuracy: number | null;
    speed: number | null;
    heading: number | null;
    battery: BatteryManager | null;
    isInGeofence: boolean;
    currentGeofence: GeofenceZone | null;
    startTracking: () => void;
    stopTracking: () => void;
    getCurrentLocation: () => Promise<DriverLocation>;
    requestLocationPermission: () => Promise<boolean>;
    addGeofence: (zone: GeofenceZone) => void;
    removeGeofence: (zoneId: string) => void;
    getDistanceToPoint: (lat: number, lng: number) => number | null;
    isSupported: boolean;
    syncStatus: {
        isOnline: boolean;
        isSyncing: boolean;
        pendingLocations: number;
    };
}

export const useAdvancedGeolocation = (
    options: AdvancedGeolocationOptions = {}
): UseAdvancedGeolocationReturn => {
    const {
        enableHighAccuracy = true,
        timeout = 15000,
        maximumAge = 10000,
        trackingInterval = 10000, // 10 segundos
        autoSync = true,
        syncInterval = 30000, // 30 segundos
        batteryOptimization = true,
        geofenceRadius = 100 // 100 metros
    } = options;

    // Estados
    const [location, setLocation] = useState<DriverLocation | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [accuracy, setAccuracy] = useState<number | null>(null);
    const [speed, setSpeed] = useState<number | null>(null);
    const [heading, setHeading] = useState<number | null>(null);
    const [battery, setBattery] = useState<BatteryManager | null>(null);
    const [isInGeofence, setIsInGeofence] = useState(false);
    const [currentGeofence, setCurrentGeofence] = useState<GeofenceZone | null>(null);

    // Referencias
    const watchIdRef = useRef<number | null>(null);
    const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const geofencesRef = useRef<GeofenceZone[]>([]);
    const lastLocationRef = useRef<DriverLocation | null>(null);
    const batteryLevelRef = useRef<number>(1);

    // Background sync
    const {
        isOnline,
        isSyncing,
        pendingItems,
        addToQueue
    } = useBackgroundSync({
        syncInterval,
        enableAutoSync: autoSync
    });

    const isSupported = 'geolocation' in navigator;

    // Inicializar batería
    useEffect(() => {
        const initBattery = async () => {
            if ('getBattery' in navigator) {
                try {
                    const batteryManager = await (navigator as any).getBattery();
                    setBattery(batteryManager);
                    batteryLevelRef.current = batteryManager.level;

                    // Escuchar cambios de batería
                    batteryManager.addEventListener('levelchange', () => {
                        batteryLevelRef.current = batteryManager.level;
                        optimizeTrackingForBattery();
                    });
                } catch (error) {
                    console.warn('Battery API no disponible');
                }
            }
        };

        initBattery();
    }, []);

    // Optimizar tracking según batería
    const optimizeTrackingForBattery = useCallback(() => {
        if (!batteryOptimization || !isTracking) return;

        const batteryLevel = batteryLevelRef.current;

        // Ajustar frecuencia según nivel de batería
        let newInterval = trackingInterval;

        if (batteryLevel < 0.2) { // < 20%
            newInterval = trackingInterval * 3; // Reducir frecuencia 3x
        } else if (batteryLevel < 0.5) { // < 50%
            newInterval = trackingInterval * 2; // Reducir frecuencia 2x
        }

        // Reiniciar tracking con nueva frecuencia
        if (trackingIntervalRef.current) {
            clearInterval(trackingIntervalRef.current);
            startPeriodicTracking(newInterval);
        }
    }, [batteryOptimization, isTracking, trackingInterval]);

    // Obtener ubicación actual
    const getCurrentLocation = useCallback((): Promise<DriverLocation> => {
        return new Promise((resolve, reject) => {
            if (!isSupported) {
                reject(new Error('Geolocalización no soportada'));
                return;
            }

            setIsLoading(true);
            setError(null);

            const options: PositionOptions = {
                enableHighAccuracy,
                timeout,
                maximumAge
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const newLocation: DriverLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        timestamp: new Date(),
                        accuracy: position.coords.accuracy,
                        speed: position.coords.speed || undefined,
                        heading: position.coords.heading || undefined
                    };

                    setLocation(newLocation);
                    setAccuracy(position.coords.accuracy);
                    setSpeed(position.coords.speed || null);
                    setHeading(position.coords.heading || null);
                    setIsLoading(false);

                    lastLocationRef.current = newLocation;

                    // Verificar geofences
                    checkGeofences(newLocation);

                    // Agregar a cola de sincronización si autoSync está habilitado
                    if (autoSync) {
                        addToQueue({
                            type: 'location',
                            data: {
                                latitude: newLocation.latitude,
                                longitude: newLocation.longitude,
                                accuracy: newLocation.accuracy,
                                speed: newLocation.speed,
                                heading: newLocation.heading,
                                timestamp: newLocation.timestamp.toISOString()
                            }
                        });
                    }

                    resolve(newLocation);
                },
                (error) => {
                    let errorMessage = 'Error desconocido';

                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Permiso de ubicación denegado';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Ubicación no disponible';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Tiempo de espera agotado';
                            break;
                    }

                    setError(errorMessage);
                    setIsLoading(false);
                    reject(new Error(errorMessage));
                },
                options
            );
        });
    }, [isSupported, enableHighAccuracy, timeout, maximumAge, autoSync, addToQueue]);

    // Iniciar tracking periódico
    const startPeriodicTracking = useCallback((interval: number = trackingInterval) => {
        trackingIntervalRef.current = setInterval(() => {
            getCurrentLocation().catch(console.error);
        }, interval);
    }, [getCurrentLocation, trackingInterval]);

    // Solicitar permisos de geolocalización
    const requestLocationPermission = useCallback(async (): Promise<boolean> => {
        if (!isSupported) {
            setError('Geolocalización no soportada en este dispositivo');
            return false;
        }

        try {
            // Verificar permisos usando Permissions API si está disponible
            if ('permissions' in navigator) {
                const permission = await navigator.permissions.query({ name: 'geolocation' });

                if (permission.state === 'denied') {
                    setError('Los permisos de ubicación han sido denegados. Por favor, habilítalos en la configuración del navegador.');
                    return false;
                }

                if (permission.state === 'granted') {
                    return true;
                }
            }

            // Intentar obtener ubicación para solicitar permisos
            return new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    () => {
                        setError(null);
                        resolve(true);
                    },
                    (error) => {
                        let errorMessage = 'Error al solicitar permisos de ubicación';

                        switch (error.code) {
                            case error.PERMISSION_DENIED:
                                errorMessage = 'Permisos de ubicación denegados. Para usar el seguimiento GPS, por favor:\n\n1. Haz clic en el ícono de ubicación en la barra de direcciones\n2. Selecciona "Permitir" para este sitio\n3. Recarga la página e intenta nuevamente';
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMessage = 'Ubicación no disponible. Verifica que el GPS esté activado.';
                                break;
                            case error.TIMEOUT:
                                errorMessage = 'Tiempo de espera agotado. Intenta nuevamente.';
                                break;
                        }

                        setError(errorMessage);
                        resolve(false);
                    },
                    {
                        enableHighAccuracy: false,
                        timeout: 10000,
                        maximumAge: 60000
                    }
                );
            });
        } catch (error) {
            setError('Error al verificar permisos de ubicación');
            return false;
        }
    }, [isSupported]);

    // Iniciar tracking
    const startTracking = useCallback(async () => {
        if (!isSupported || isTracking) return;

        // Solicitar permisos primero
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) return;

        setIsTracking(true);
        setError(null);

        // Obtener ubicación inicial
        getCurrentLocation();

        // Usar watchPosition para tracking continuo
        const watchOptions: PositionOptions = {
            enableHighAccuracy,
            timeout: timeout / 2, // Timeout más corto para watch
            maximumAge: maximumAge / 2
        };

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const newLocation: DriverLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    timestamp: new Date(),
                    accuracy: position.coords.accuracy,
                    speed: position.coords.speed || undefined,
                    heading: position.coords.heading || undefined
                };

                // Solo actualizar si hay cambio significativo
                if (shouldUpdateLocation(newLocation)) {
                    setLocation(newLocation);
                    setAccuracy(position.coords.accuracy);
                    setSpeed(position.coords.speed || null);
                    setHeading(position.coords.heading || null);

                    lastLocationRef.current = newLocation;
                    checkGeofences(newLocation);

                    if (autoSync) {
                        addToQueue({
                            type: 'location',
                            data: {
                                latitude: newLocation.latitude,
                                longitude: newLocation.longitude,
                                accuracy: newLocation.accuracy,
                                speed: newLocation.speed,
                                heading: newLocation.heading,
                                timestamp: newLocation.timestamp.toISOString()
                            }
                        });
                    }
                }
            },
            (error) => {
                console.error('Error en watchPosition:', error);
                // No detener el tracking por errores esporádicos
            },
            watchOptions
        );

        // Backup con tracking periódico
        startPeriodicTracking();
    }, [
        isSupported,
        isTracking,
        getCurrentLocation,
        enableHighAccuracy,
        timeout,
        maximumAge,
        autoSync,
        addToQueue,
        startPeriodicTracking
    ]);

    // Detener tracking
    const stopTracking = useCallback(() => {
        setIsTracking(false);

        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        if (trackingIntervalRef.current !== null) {
            clearInterval(trackingIntervalRef.current);
            trackingIntervalRef.current = null;
        }
    }, []);

    // Verificar si debe actualizar ubicación
    const shouldUpdateLocation = (newLocation: DriverLocation): boolean => {
        if (!lastLocationRef.current) return true;

        const lastLoc = lastLocationRef.current;
        const distance = calculateDistance(
            lastLoc.latitude,
            lastLoc.longitude,
            newLocation.latitude,
            newLocation.longitude
        );

        // Actualizar si:
        // - Ha pasado más de 30 segundos
        // - Se movió más de 10 metros
        // - Cambió significativamente la precisión
        const timeDiff = newLocation.timestamp.getTime() - lastLoc.timestamp.getTime();
        const accuracyImproved = (newLocation.accuracy || 0) < (lastLoc.accuracy || 0) * 0.8;

        return timeDiff > 30000 || distance > 10 || accuracyImproved;
    };

    // Verificar geofences
    const checkGeofences = useCallback((currentLocation: DriverLocation) => {
        let insideGeofence = false;
        let activeGeofence: GeofenceZone | null = null;

        for (const geofence of geofencesRef.current) {
            const distance = calculateDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                geofence.latitude,
                geofence.longitude
            );

            if (distance <= geofence.radius) {
                insideGeofence = true;
                activeGeofence = geofence;
                break;
            }
        }

        // Disparar eventos si cambió el estado
        if (insideGeofence !== isInGeofence) {
            setIsInGeofence(insideGeofence);
            setCurrentGeofence(activeGeofence);

            // Enviar evento personalizado
            window.dispatchEvent(new CustomEvent('geofenceChange', {
                detail: {
                    isInside: insideGeofence,
                    geofence: activeGeofence,
                    location: currentLocation
                }
            }));
        }
    }, [isInGeofence]);

    // Agregar geofence
    const addGeofence = useCallback((zone: GeofenceZone) => {
        geofencesRef.current.push(zone);
    }, []);

    // Remover geofence
    const removeGeofence = useCallback((zoneId: string) => {
        geofencesRef.current = geofencesRef.current.filter(zone => zone.id !== zoneId);
    }, []);

    // Calcular distancia a un punto
    const getDistanceToPoint = useCallback((lat: number, lng: number): number | null => {
        if (!location) return null;

        return calculateDistance(location.latitude, location.longitude, lat, lng);
    }, [location]);

    // Cleanup al desmontar
    useEffect(() => {
        return () => {
            stopTracking();
        };
    }, [stopTracking]);

    return {
        location,
        error,
        isLoading,
        isTracking,
        accuracy,
        speed,
        heading,
        battery,
        isInGeofence,
        currentGeofence,
        startTracking,
        stopTracking,
        getCurrentLocation,
        requestLocationPermission,
        addGeofence,
        removeGeofence,
        getDistanceToPoint,
        isSupported,
        syncStatus: {
            isOnline,
            isSyncing,
            pendingLocations: pendingItems
        }
    };
};

// Calcular distancia entre dos puntos (fórmula de Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distancia en metros
}
