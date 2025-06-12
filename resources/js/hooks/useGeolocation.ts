import { useState, useEffect, useRef } from 'react';
import { DriverLocation } from '@/types/driver';

interface GeolocationOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
    trackLocation?: boolean;
    updateInterval?: number;
}

interface UseGeolocationReturn {
    location: DriverLocation | null;
    error: string | null;
    isLoading: boolean;
    isSupported: boolean;
    getCurrentLocation: () => void;
    startTracking: () => void;
    stopTracking: () => void;
    isTracking: boolean;
}

export const useGeolocation = (options: GeolocationOptions = {}): UseGeolocationReturn => {
    const {
        enableHighAccuracy = true,
        timeout = 10000,
        maximumAge = 30000,
        trackLocation = false,
        updateInterval = 5000
    } = options;

    const [location, setLocation] = useState<DriverLocation | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isTracking, setIsTracking] = useState(false);

    const watchIdRef = useRef<number | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const isSupported = 'geolocation' in navigator;

    const handleSuccess = (position: GeolocationPosition) => {
        const newLocation: DriverLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date(),
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined
        };

        setLocation(newLocation);
        setError(null);
        setIsLoading(false);
    };

    const handleError = (error: GeolocationPositionError) => {
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
        console.error('Error de geolocalización:', errorMessage);
    };

    const getCurrentLocation = () => {
        if (!isSupported) {
            setError('Geolocalización no soportada');
            return;
        }

        setIsLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            handleSuccess,
            handleError,
            {
                enableHighAccuracy,
                timeout,
                maximumAge
            }
        );
    };

    const startTracking = () => {
        if (!isSupported) {
            setError('Geolocalización no soportada');
            return;
        }

        if (isTracking) return;

        setIsTracking(true);
        setError(null);

        // Usar watchPosition para seguimiento continuo
        watchIdRef.current = navigator.geolocation.watchPosition(
            handleSuccess,
            handleError,
            {
                enableHighAccuracy,
                timeout,
                maximumAge
            }
        );

        // Actualización adicional con intervalo (backup)
        intervalRef.current = setInterval(() => {
            if (isSupported) {
                navigator.geolocation.getCurrentPosition(
                    handleSuccess,
                    (error) => {
                        // Solo actualizar error si no tenemos ubicación previa
                        if (!location) {
                            handleError(error);
                        }
                    },
                    {
                        enableHighAccuracy,
                        timeout: timeout / 2, // Timeout más corto para actualizaciones
                        maximumAge
                    }
                );
            }
        }, updateInterval);
    };

    const stopTracking = () => {
        setIsTracking(false);

        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    // Iniciar seguimiento automático si está habilitado
    useEffect(() => {
        if (trackLocation) {
            startTracking();
        }

        return () => {
            stopTracking();
        };
    }, [trackLocation]);

    // Cleanup al desmontar
    useEffect(() => {
        return () => {
            stopTracking();
        };
    }, []);

    return {
        location,
        error,
        isLoading,
        isSupported,
        getCurrentLocation,
        startTracking,
        stopTracking,
        isTracking
    };
};
